import { describe, it, expect } from 'vitest'
import { checkInMemoryRateLimit } from '../src/lib/rate-limit'

describe('Rate Limiter', () => {
  it('allows requests within limit', () => {
    const key = 'test-ip-1'
    const limit = 5
    const windowMs = 60000

    for (let i = 0; i < limit; i++) {
      const result = checkInMemoryRateLimit(key, limit, windowMs)
      expect(result.allowed).toBe(true)
    }

    const blocked = checkInMemoryRateLimit(key, limit, windowMs)
    expect(blocked.allowed).toBe(false)
  })
})
