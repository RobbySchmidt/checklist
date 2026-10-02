// Passwort-Hashing für den Portal-Login (scrypt, nur node:crypto).
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PARAMS = { N: 16384, r: 8, p: 1 }
const KEYLEN = 64

export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, KEYLEN, PARAMS)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(pw: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, saltHex, hashHex] = parts
  if (!/^[0-9a-f]{32}$/.test(saltHex!) || !/^[0-9a-f]{128}$/.test(hashHex!)) return false
  const expected = Buffer.from(hashHex!, 'hex')
  const actual = scryptSync(pw, Buffer.from(saltHex!, 'hex'), KEYLEN, PARAMS)
  return timingSafeEqual(actual, expected)
}

export function isStrongEnough(pw: string): boolean {
  return typeof pw === 'string' && pw.length >= 10
}
