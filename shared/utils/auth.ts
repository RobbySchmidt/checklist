// Magic-Link-Tokens: Klartext nur im Link, in der Datenbank nur der Hash.
import { randomBytes, createHash } from 'node:crypto'

export const TOKEN_MINUTES = 15

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function createLoginToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}
export function tokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + TOKEN_MINUTES * 60 * 1000).toISOString()
}
export function isTokenUsable(row: { expires_at: string; used_at: string | null }, now: Date = new Date()): boolean {
  if (row.used_at) return false
  return new Date(row.expires_at).getTime() > now.getTime()
}
