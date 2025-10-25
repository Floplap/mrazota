# Edge Functions

This folder contains two Deno-based Edge Functions for the Supabase project.

Deploy commands (example):

supabase login
supabase functions deploy orders_handler --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy payment_webhook --project-ref $SUPABASE_PROJECT_REF

Environment
- `SUPABASE_URL` - supabase project url
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (use secrets)
- `WEBHOOK_SECRET` - optional secret for webhook signature verification
