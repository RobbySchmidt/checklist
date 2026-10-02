import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fillTemplate, DEFAULT_TEMPLATE_INVITE } from '../../shared/utils/templates.ts'

test('ersetzt alle bekannten Platzhalter, mehrfach, lässt unbekannte stehen', () => {
  assert.equal(fillTemplate('Hallo {name}, {stelle} bei {dienst}. {name}! {unbekannt}', { name: 'Anna', stelle: 'PFK', dienst: 'Sonnenhof' }), 'Hallo Anna, PFK bei Sonnenhof. Anna! {unbekannt}')
})
test('Standardvorlage enthält Name, Stelle, Dienst und Ansprechperson', () => {
  for (const p of ['{name}', '{stelle}', '{dienst}', '{ansprechperson}']) assert.ok(DEFAULT_TEMPLATE_INVITE.includes(p), p)
})
