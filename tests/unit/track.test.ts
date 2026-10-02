// tests/unit/track.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isBot, trackSource } from '../../shared/utils/track.ts'

test('erkennt Bots an typischen Kennungen, normale Browser nicht', () => {
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true)
  assert.equal(isBot('facebookexternalhit/1.1'), true)
  assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'), false)
  assert.equal(isBot(undefined), true)
})

test('trackSource kennt nur die vier Quellen', () => {
  assert.equal(trackSource('wa'), 'wa')
  assert.equal(trackSource('qr'), 'qr')
  assert.equal(trackSource('google'), 'google')
  assert.equal(trackSource('demo'), 'direct')
  assert.equal(trackSource(undefined), 'direct')
})
