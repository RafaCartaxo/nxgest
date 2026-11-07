import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, existsSync, rmSync, chmodSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from './smoke.mjs'

const run = (script, args, env = {}) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } })

test('staging lê espaços e texto de shell sem executar conteúdo', () => {
  const dir = mkdtempSync(path.join(process.cwd(), '.staging-test-'))
  try {
    const file = path.join(dir, 'synthetic.env')
    const marker = path.join(dir, 'executed')
    writeFileSync(file, `MAIL_FROM_NAME=NX Gest\nAPP_URL=$(touch ${marker})\n`)
    const result = run('scripts/read-staging-env.mjs', [file])
    assert.equal(result.status, 0)
    const values = Object.fromEntries(result.stdout.trim().split('\n').map(line => { const i = line.indexOf(':'); return [line.slice(0, i), Buffer.from(line.slice(i + 1), 'base64').toString()] }))
    assert.equal(values.MAIL_FROM_NAME, 'NX Gest')
    assert.equal(values.APP_URL, `$(touch ${marker})`)
    assert.equal(existsSync(marker), false)
    writeFileSync(file, 'NODE_OPTIONS=--require=evil\n')
    assert.notEqual(run('scripts/read-staging-env.mjs', [file]).status, 0)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('smoke falha fechado antes de conectar para alvos e opções inseguros', () => {
  for (const args of [[], ['--no-recreate'], ['up', '--no-recreate'], ['--unknown']]) {
    const result = run('scripts/smoke.mjs', args, { DATABASE_URL: 'postgres://test:test@localhost:5433/nxgest' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /SMOKE_DATABASE_URL|argumentos inválidos/)
  }
  for (const url of ['postgres://u:p@localhost:5433/nxgest', 'postgres://u:p@host.example:5433/nxgest_smoke', 'postgres://u:p@localhost:5433/postgres']) {
    const result = run('scripts/smoke.mjs', ['--no-recreate'], { SMOKE_DATABASE_URL: url })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /alvo recusado/)
  }
})

test('smoke reconhece --no-recreate em qualquer posição e rejeita opções desconhecidas', () => {
  assert.deepEqual(parseArgs(['--no-recreate']), { cmd: 'full', recreate: false })
  assert.deepEqual(parseArgs(['up', '--no-recreate']), { cmd: 'up', recreate: false })
  assert.deepEqual(parseArgs(['--no-recreate', 'up']), { cmd: 'up', recreate: false })
  assert.throws(() => parseArgs(['--oops']))
})

test('no-recreate alcança schema sem conectar para recriar banco', () => {
  const dir = mkdtempSync(path.join(process.cwd(), '.smoke-double-'))
  try {
    const marker = path.join(dir, 'invoked')
    const npx = path.join(dir, 'npx')
    writeFileSync(npx, '#!/bin/sh\nprintf called > "$MARKER"\nexit 42\n')
    chmodSync(npx, 0o700)
    const result = run('scripts/smoke.mjs', ['--no-recreate'], { PATH: dir, MARKER: marker, SMOKE_PORT: '39481', SMOKE_DATABASE_URL: 'postgres://u:p@127.0.0.1:59481/nxgest_smoke_double' })
    assert.equal(existsSync(marker), true)
    assert.match(result.stdout, /create-schema/)
    assert.doesNotMatch(result.stdout, /Recriando banco/)
    assert.notEqual(result.status, 0)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
