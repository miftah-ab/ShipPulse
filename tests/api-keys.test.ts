import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, verifyApiKey } from '../src/lib/api-keys'

describe('API Key Management', () => {
  it('generates a key with sp_live_ prefix', () => {
    const { key, hash } = generateApiKey()
    expect(key.startsWith('sp_live_')).toBe(true)
    expect(hash.length).toBe(64) // SHA-256 hex
  })

  it('hashes consistently', () => {
    const { key, hash } = generateApiKey()
    const computedHash = hashApiKey(key)
    expect(computedHash).toBe(hash)
  })

  it('verifies correctly', () => {
    const { key, hash } = generateApiKey()
    expect(verifyApiKey(key, hash)).toBe(true)
    expect(verifyApiKey('sp_live_invalid', hash)).toBe(false)
  })
})
