import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHost, resolveEmployerByHost } from '../../shared/utils/host.ts'

const a = { slug: 'sonnenhof', domains: ['sonnenhof.pflege-jobs.de', 'jobs.sonnenhof.de'] }
const b = { slug: 'awo-sued', domains: ['awo-sued.pflege-jobs.de'] }
const c = { slug: 'ohne', domains: null }

test('normalizeHost: klein, ohne Port, ohne Leerzeichen', () => {
  assert.equal(normalizeHost('Sonnenhof.Pflege-Jobs.de:3000'), 'sonnenhof.pflege-jobs.de')
  assert.equal(normalizeHost(' localhost:3000 '), 'localhost')
  assert.equal(normalizeHost(undefined), '')
})

test('findet Dienst über jede seiner Domains, unabhängig von Port und Schreibweise', () => {
  assert.equal(resolveEmployerByHost('Jobs.Sonnenhof.de:443', [a, b, c])?.slug, 'sonnenhof')
  assert.equal(resolveEmployerByHost('awo-sued.pflege-jobs.de', [a, b, c])?.slug, 'awo-sued')
})

test('localhost fällt auf fallbackSlug zurück, unbekannter Host ohne Fallback → null', () => {
  assert.equal(resolveEmployerByHost('localhost:3000', [a, b, c], 'awo-sued')?.slug, 'awo-sued')
  assert.equal(resolveEmployerByHost('fremd.example', [a, b, c]), null)
  assert.equal(resolveEmployerByHost('fremd.example', [a, b, c], 'sonnenhof')?.slug, 'sonnenhof')
  assert.equal(resolveEmployerByHost('localhost', [a, b, c], 'gibt-es-nicht'), null)
})
