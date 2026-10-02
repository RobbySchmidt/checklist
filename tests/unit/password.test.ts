import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, isStrongEnough } from '../../shared/utils/password.ts'

test('Hash verifiziert das richtige Passwort, nicht ein falsches', () => {
  const h = hashPassword('Sonnenhof-2026!')
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
  assert.equal(verifyPassword('Sonnenhof-2026!', h), true)
  assert.equal(verifyPassword('falsch-falsch', h), false)
})

test('Zwei Hashes desselben Passworts unterscheiden sich', () => {
  assert.notEqual(hashPassword('gleiches-Passwort'), hashPassword('gleiches-Passwort'))
})

test('Leerer oder kaputter Hash ergibt false', () => {
  assert.equal(verifyPassword('x', ''), false)
  assert.equal(verifyPassword('x', null), false)
  assert.equal(verifyPassword('x', undefined), false)
  assert.equal(verifyPassword('x', 'scrypt$zz$yy'), false)
  assert.equal(verifyPassword('x', 'bcrypt$abc$def'), false)
})

test('isStrongEnough verlangt mindestens 10 Zeichen', () => {
  assert.equal(isStrongEnough('kurz'), false)
  assert.equal(isStrongEnough('zehnzeichen'), true)
})
