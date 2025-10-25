import { test, expect } from '@playwright/test'

// This test uses SUPABASE_SERVICE_ROLE_KEY to seed data via PostgREST
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const FUNCTIONS_URL = process.env.VITE_FUNCTIONS_URL || ''

test.describe('full e2e', () => {
  test('seed profile and post, verify feed, create order via function', async ({ page }) => {
    test.skip(!SUPABASE_URL || !SERVICE_ROLE_KEY, 'Service role/URL not provided')

    // 1) Create a test profile (insert into profiles)
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify([{ auth_id: 'e2e:test', email: 'e2e@example.com', full_name: 'E2E Tester' }])
    })
    expect(profileRes.ok).toBeTruthy()

    // 2) Insert a post
    const postResp = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify([{ author_id: (await profileRes.json())[0].id, content: 'E2E test post' }])
    })
    expect(postResp.ok).toBeTruthy()

    // 3) Visit the app feed and confirm the post appears
    await page.goto('/')
    await page.click('text=Feed')
    await expect(page.locator('text=E2E test post')).toHaveCount(1)

    // 4) Call orders_handler function to create an order
    const orderPayload = { user_id: null, items: [], total: 1 }
    const funcResp = await fetch(`${FUNCTIONS_URL}/orders_handler`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) })
    const body = await funcResp.json()
    expect(funcResp.ok).toBeTruthy()
    expect(body.order_id).toBeTruthy()

    // 5) Verify the order exists using service role
    const orderId = body.order_id
    const verify = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
    })
    expect(verify.ok).toBeTruthy()
    const orders = await verify.json()
    expect(Array.isArray(orders)).toBeTruthy()
    expect(orders.length).toBeGreaterThan(0)
  })
})
