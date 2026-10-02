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
