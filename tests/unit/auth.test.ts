import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLoginToken, hashToken, isTokenUsable, tokenExpiry } from '../../shared/utils/auth.ts'

test('Token ist base64url mit 43 Zeichen, Hash ist SHA-256 hex und reproduzierbar', () => {
  const { token, hash } = createLoginToken()
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.match(hash, /^[0-9a-f]{64}$/)
  assert.equal(hashToken(token), hash)
  assert.notEqual(createLoginToken().token, token)
})

test('isTokenUsable: nur unbenutzt und nicht abgelaufen', () => {
  const now = new Date('2026-10-02T12:00:00Z')
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T12:10:00Z', used_at: null }, now), true)
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T11:59:59Z', used_at: null }, now), false)
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T12:10:00Z', used_at: '2026-10-02T11:50:00Z' }, now), false)
})

test('tokenExpiry liegt 15 Minuten in der Zukunft', () => {
  const now = new Date('2026-10-02T12:00:00Z')
  assert.equal(tokenExpiry(now), '2026-10-02T12:15:00.000Z')
})
