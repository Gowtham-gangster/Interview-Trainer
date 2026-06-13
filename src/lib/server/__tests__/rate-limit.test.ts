import {
  checkRateLimit,
  getClientIp,
  getRateLimitBackend,
  RATE_LIMIT_PRESETS,
} from '@/lib/server/rate-limit'

describe('rate-limit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, NODE_ENV: 'test' }
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    process.env.RATE_LIMIT_DISABLED = 'false'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('exposes documented production presets', () => {
    expect(RATE_LIMIT_PRESETS.auth.limit).toBe(5)
    expect(RATE_LIMIT_PRESETS.chat.limit).toBe(30)
    expect(RATE_LIMIT_PRESETS.voice.limit).toBe(20)
  })

  it('uses memory backend when Redis is not configured', () => {
    expect(getRateLimitBackend()).toBe('memory')
  })

  it('blocks after the preset limit is exceeded', async () => {
    const identifier = `test-${Date.now()}`

    for (let i = 0; i < RATE_LIMIT_PRESETS.contact.limit; i += 1) {
      const result = await checkRateLimit('contact', identifier)
      expect(result.success).toBe(true)
    }

    const blocked = await checkRateLimit('contact', identifier)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('parses client IP from forwarded headers', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    })

    expect(getClientIp(request)).toBe('203.0.113.1')
  })

  it('reports disabled backend when RATE_LIMIT_DISABLED is true', async () => {
    jest.resetModules()
    process.env.RATE_LIMIT_DISABLED = 'true'

    const mod = await import('@/lib/server/rate-limit')
    expect(mod.isRateLimitDisabled()).toBe(true)
    expect(mod.getRateLimitBackend()).toBe('disabled')
  })
})
