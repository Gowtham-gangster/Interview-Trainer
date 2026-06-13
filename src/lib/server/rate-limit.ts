import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

export type RateLimitPreset =
  | 'auth'
  | 'authEmailCheck'
  | 'authReset'
  | 'contact'
  | 'chat'
  | 'voice'
  | 'apiProxy'
  | 'upload'

interface RateLimitConfig {
  limit: number
  windowMs: number
  upstashWindow: `${number} s` | `${number} m` | `${number} h` | `${number} d`
}

/** Documented production limits (before RATE_LIMIT_RELAXED / dev multipliers). */
export const RATE_LIMIT_PRESETS: Record<RateLimitPreset, RateLimitConfig> = {
  auth: { limit: 5, windowMs: 60 * 60 * 1000, upstashWindow: '1 h' },
  authEmailCheck: { limit: 30, windowMs: 60 * 60 * 1000, upstashWindow: '1 h' },
  authReset: { limit: 10, windowMs: 60 * 60 * 1000, upstashWindow: '1 h' },
  contact: { limit: 5, windowMs: 60 * 60 * 1000, upstashWindow: '1 h' },
  chat: { limit: 30, windowMs: 60 * 1000, upstashWindow: '1 m' },
  voice: { limit: 20, windowMs: 60 * 1000, upstashWindow: '1 m' },
  apiProxy: { limit: 60, windowMs: 60 * 1000, upstashWindow: '1 m' },
  upload: { limit: 10, windowMs: 60 * 60 * 1000, upstashWindow: '1 h' },
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

class MemoryRateLimiter {
  private readonly store = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs
      this.store.set(identifier, { count: 1, resetAt })
      this.prune(now)
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetAt,
      }
    }

    if (entry.count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: entry.resetAt,
      }
    }

    entry.count += 1
    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - entry.count,
      reset: entry.resetAt,
    }
  }

  private prune(now: number) {
    if (this.store.size < 5000) return
    for (const [key, value] of this.store) {
      if (now >= value.resetAt) this.store.delete(key)
    }
  }
}

type Limiter = {
  check: (identifier: string) => Promise<RateLimitResult>
}

const limiterCache = new Map<RateLimitPreset, Limiter>()
let redisClient: Redis | null = null
let productionRedisWarningLogged = false

/** Skip all rate limits (testing / staging only). */
export function isRateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === 'true'
}

/** Looser limits for local dev and staging (`RATE_LIMIT_RELAXED=true` on Vercel). */
export function isRateLimitRelaxed(): boolean {
  return (
    process.env.RATE_LIMIT_RELAXED === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

function getPresetConfig(preset: RateLimitPreset): RateLimitConfig {
  const base = RATE_LIMIT_PRESETS[preset]
  if (!isRateLimitRelaxed()) return base

  return {
    ...base,
    limit: base.limit * 10,
  }
}

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  redisClient = new Redis({ url, token })
  return redisClient
}

function warnIfProductionWithoutRedis() {
  if (productionRedisWarningLogged) return
  if (process.env.NODE_ENV !== 'production') return
  if (isRateLimitDisabled()) return
  if (isRateLimitRedisConfigured()) return

  productionRedisWarningLogged = true
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. ' +
      'Using in-memory limits — effective only per server instance, not across Vercel lambdas.'
  )
}

function getLimiter(preset: RateLimitPreset): Limiter {
  const cached = limiterCache.get(preset)
  if (cached) return cached

  const config = getPresetConfig(preset)
  const redis = getRedis()

  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.upstashWindow),
      prefix: `ait:${preset}`,
      analytics: true,
    })

    const limiter: Limiter = {
      check: async (identifier) => {
        const result = await ratelimit.limit(identifier)
        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        }
      },
    }
    limiterCache.set(preset, limiter)
    return limiter
  }

  const memory = new MemoryRateLimiter(config.limit, config.windowMs)
  const limiter: Limiter = {
    check: (identifier) => memory.check(identifier),
  }
  limiterCache.set(preset, limiter)
  return limiter
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function formatRateLimitMessage(retryAfterSeconds: number): string {
  if (retryAfterSeconds >= 120) {
    const minutes = Math.ceil(retryAfterSeconds / 60)
    return `Too many attempts. Please try again in about ${minutes} minutes.`
  }

  return `Too many attempts. Please try again in about ${retryAfterSeconds} seconds.`
}

export async function checkRateLimit(
  preset: RateLimitPreset,
  identifier: string
): Promise<RateLimitResult> {
  warnIfProductionWithoutRedis()
  return getLimiter(preset).check(identifier)
}

export async function enforceRateLimit(
  request: Request,
  preset: RateLimitPreset,
  identifier?: string
): Promise<NextResponse | null> {
  if (isRateLimitDisabled()) return null

  const id = identifier ?? getClientIp(request)
  const result = await checkRateLimit(preset, id)

  if (result.success) return null

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

  return NextResponse.json(
    {
      success: false,
      message: formatRateLimitMessage(retryAfter),
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  )
}

export function isRateLimitRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

export function getRateLimitBackend(): 'redis' | 'memory' | 'disabled' {
  if (isRateLimitDisabled()) return 'disabled'
  return isRateLimitRedisConfigured() ? 'redis' : 'memory'
}
