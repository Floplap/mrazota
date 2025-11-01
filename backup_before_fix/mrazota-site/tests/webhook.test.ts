import { describe, it, expect, vi } from 'vitest'
import { prisma } from '../lib/prisma'
import handler from '../pages/api/paysera/webhook'
import { signPayload } from '../lib/paysera'

function makeReq(body: any, headers: Record<string,string> = {}) {
  return {
    method: 'POST',
    headers,
    body,
    // Next.js uses json body already parsed when content-type application/json
  } as any
}

function makeRes() {
  const res: any = {}
  res.status = (code: number) => { res._status = code; return res }
  res.json = (d: any) => { res._json = d; return res }
  res.send = (d: any) => { res._send = d; return res }
  res.end = () => { return res }
  return res
}

describe('paysera webhook API', () => {
  const payload = { orderId: '42', result: 'ok' }
  const secret = 'test-secret'

  it('returns 200 for valid signature', async () => {
    const sig = signPayload(JSON.stringify(payload), secret, 'hmac-sha256')
    process.env.PAYSERA_SIGN_PASSWORD = secret
    process.env.PAYSERA_SIGN_ALGO = 'hmac-sha256'

    // mock prisma update to avoid DB calls
  vi.spyOn(prisma.product as any, 'update' as any).mockResolvedValue({ id: String(payload.orderId) } as any)

    const req = makeReq(payload, { 'x-paysera-signature': sig })
    const res = makeRes()
    await handler(req, res)
    expect(res._status === 200 || res._send === 'OK').toBeTruthy()
  })

  it('returns 400 for invalid signature', async () => {
    process.env.PAYSERA_SIGN_PASSWORD = secret
    process.env.PAYSERA_SIGN_ALGO = 'hmac-sha256'
    const req = makeReq(payload, { 'x-paysera-signature': 'bad' })
    const res = makeRes()
    await handler(req, res)
    expect(res._status).toBe(400)
  })
})
