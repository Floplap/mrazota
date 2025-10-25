-- 003_triggers_and_helpers.sql
-- Helper functions and triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- Optional: notify channel on orders change (Postgres NOTIFY)
CREATE OR REPLACE FUNCTION notify_orders_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('orders_changes', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_orders
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE notify_orders_change();

-- ---------------
-- RPC: create_order
-- ---------------
-- Create a transactional RPC to insert order and order_items atomically
CREATE OR REPLACE FUNCTION create_order(payload jsonb)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  new_order_id uuid;
BEGIN
  -- payload expected: { user_id: <uuid|null>, total: <numeric>, items: [ { product_id: <uuid>, quantity: <int>, price: <numeric> }, ... ] }
  INSERT INTO orders (user_id, total, status)
  VALUES ( (payload->>'user_id')::uuid, (payload->>'total')::numeric, COALESCE((payload->>'status'), 'pending') )
  RETURNING id INTO new_order_id;

  IF payload ? 'items' THEN
    INSERT INTO order_items (order_id, product_id, quantity, price)
    SELECT new_order_id, (elem->>'product_id')::uuid, (COALESCE((elem->>'quantity'), '1'))::int, (elem->>'price')::numeric
    FROM jsonb_array_elements(payload->'items') AS t(elem);
  END IF;

  RETURN new_order_id;
END;
$$;

