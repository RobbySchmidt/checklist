// tests/unit/rateLimit.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../../server/utils/rateLimit.ts'

test('erlaubt limit Anfragen im Fenster, danach nicht, nach Ablauf wieder', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
  assert.equal(rl.check('a', 0), true)
  assert.equal(rl.check('a', 10), true)
  assert.equal(rl.check('a', 20), false)
  assert.equal(rl.check('b', 20), true)
  assert.equal(rl.check('a', 1001), true)
})
