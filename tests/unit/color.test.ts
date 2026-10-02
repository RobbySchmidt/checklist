import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contrastRatio, normalizeHex } from '../../shared/utils/color.ts'

test('Weiß auf Tiefgrün reicht für Text', () => {
  assert.ok(contrastRatio('#ffffff', '#1d6b57') >= 4.5)
})
test('Weiß auf Mint ist zu hell', () => {
  assert.ok(contrastRatio('#ffffff', '#4ac297') < 4.5)
})
test('Schwarz auf Weiß ist 21', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff') * 100) / 100, 21)
})
test('normalizeHex trimmt und ergänzt #', () => {
  assert.equal(normalizeHex('  1D6B57 '), '#1d6b57')
  assert.equal(normalizeHex(''), '')
})

test('readableText: weiß auf dunkel, dunkel auf hell', async () => {
  const { readableText } = await import('../../shared/utils/color.ts')
  assert.equal(readableText('#9f1239'), '#ffffff')
  assert.equal(readableText('#1d6b57'), '#ffffff')
  assert.equal(readableText('#dcefe7'), '#13392d')
  assert.equal(readableText('#4ac297'), '#13392d')
  assert.equal(readableText('kaputt'), '#13392d')
})

test('portalTheme: Fallbacks, Bordeaux, Mint, ungültig', async () => {
  const { portalTheme } = await import('../../shared/utils/color.ts')
  const def = { '--portal-ink': '#13392d', '--portal-white': '#ffffff', '--portal-mint': '#4ac297', '--portal-mint-fg': '#13392d' }
  assert.deepEqual(portalTheme(), def)
  assert.deepEqual(portalTheme(null, null), def)
  assert.deepEqual(portalTheme('kaputt', '12'), def)
  const bx = portalTheme('#9f1239', '#4ac297')
  assert.equal(bx['--portal-ink'], '#9f1239')
  assert.equal(bx['--portal-white'], '#ffffff')
  assert.equal(bx['--portal-mint-fg'], '#13392d')
  assert.equal(portalTheme('#13392d', '#dcefe7')['--portal-mint-fg'], '#13392d')
  assert.equal(portalTheme('#dcefe7', '#9f1239')['--portal-white'], '#13392d')
  assert.equal(portalTheme('#dcefe7', '#9f1239')['--portal-mint-fg'], '#ffffff')
})
