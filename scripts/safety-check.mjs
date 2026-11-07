import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, existsSync, rmSync, chmodSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from './smoke.mjs'

const run = (script, args, env = {}) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } })

test('staging gera, reutiliza e lê dados sem executar shell', () => {
  const dir = mkdtempSync(path.join(process.cwd(), '.staging-test-'))
  try {
    const file = path.join(dir, 'synthetic.env')
    const marker = path.join(dir, 'executed')
    const hostNode = path.join(dir, 'node')
    writeFileSync(hostNode, '#!/bin/sh\nexit 93\n')
    chmodSync(hostNode, 0o700)
    const shell = `set -e; source scripts/staging-env.sh; info() { :; }; ok() { :; }; erro() { printf '%s\\n' "$*" >&2; }; prepare_staging_env "$1"; load_staging_env "$1"; printf '%s\\n%s\\n' "$MAIL_FROM_NAME" "\${APP_URL-}"`
    const bash = () => spawnSync('bash', ['-c', shell, 'staging-test', file], { encoding: 'utf8', env: { PATH: `${dir}:/usr/bin:/bin` } })
    let result = bash()
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /^NX Gest\n/)
    const original = readFileSync(file)
    result = bash()
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(readFileSync(file), original)
    writeFileSync(file, `PG_DB=test\nPG_USER=test\nPG_PASSWORD=test\nMAIL_FROM_NAME=NX Gest\nAPP_URL=$(touch ${marker})\n`)
    const legacy = readFileSync(file)
    result = bash()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, `NX Gest\n$(touch ${marker})\n`)
    assert.equal(existsSync(marker), false)
    assert.deepEqual(readFileSync(file), legacy)
    writeFileSync(file, 'PG_DB=test\nPG_USER=test\nPG_PASSWORD=test\nNODE_OPTIONS=evil\n')
    assert.notEqual(bash().status, 0)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('smoke falha fechado antes de conectar para alvos e opções inseguros', () => {
  for (const args of [[], ['--no-recreate'], ['up', '--no-recreate'], ['--unknown']]) {
    const result = run('scripts/smoke.mjs', args, { DATABASE_URL: 'postgres://test:test@localhost:5433/nxgest' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /SMOKE_DATABASE_URL|argumentos inválidos/)
  }
  for (const url of ['postgres://u:p@localhost:5433/nxgest', 'postgres://u:p@host.example:5433/nxgest_smoke', 'postgres://u:p@localhost:5433/postgres', 'postgres://u:p@localhost:55439/nxgest_smoke?host=example.org']) {
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
    const result = run('scripts/smoke.mjs', ['--no-recreate'], { PATH: `${dir}:/usr/bin:/bin`, MARKER: marker, SMOKE_PORT: '39481', SMOKE_DATABASE_URL: 'postgres://u:p@127.0.0.1:59481/nxgest_smoke_double' })
    assert.equal(existsSync(marker), true)
    assert.match(result.stdout, /create-schema/)
    assert.doesNotMatch(result.stdout, /Recriando banco/)
    assert.notEqual(result.status, 0)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('falha de startup encerra o grupo próprio e remove PID', () => {
  const dir = mkdtempSync(path.join(process.cwd(), '.smoke-startup-'))
  try {
    const marker = path.join(dir, 'pid')
    const npx = path.join(dir, 'npx')
    const node = path.join(dir, 'node')
    writeFileSync(npx, '#!/bin/sh\nif [ "$2" = scripts/create-schema.mjs ]; then exit 0; fi\nprintf "%s" "$$" > "$MARKER"\nexec /bin/sleep 60\n')
    writeFileSync(node, '#!/bin/sh\nexit 0\n')
    chmodSync(npx, 0o700); chmodSync(node, 0o700)
    const result = run('scripts/smoke.mjs', ['--no-recreate'], { PATH: `${dir}:/usr/bin:/bin`, MARKER: marker, SMOKE_PORT: '39482', SMOKE_DATABASE_URL: 'postgres://u:p@127.0.0.1:59482/nxgest_smoke_double' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /não respondeu/)
    assert.equal(existsSync(path.join(process.cwd(), '.smoke.pid')), false)
    assert.equal(existsSync(marker), true)
    assert.throws(() => process.kill(Number(requirePid(marker)), 0), { code: 'ESRCH' })
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

function requirePid(file) { return Number(readFileSync(file, 'utf8')) }

test('PID forjado não sinaliza um processo alheio', () => {
  const pidFile = path.join(process.cwd(), '.smoke.pid')
  writeFileSync(pidFile, JSON.stringify({ pid: process.pid, start: 'forjado', nonce: 'a'.repeat(48) }), { flag: 'wx' })
  try {
    const result = run('scripts/smoke.mjs', ['down'])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /identidade do processo não confere/)
    assert.doesNotThrow(() => process.kill(process.pid, 0))
    assert.equal(existsSync(pidFile), true)
  } finally { rmSync(pidFile) }
})

test('PID extinto é limpo sem sinalizar outro processo', () => {
  const pidFile = path.join(process.cwd(), '.smoke.pid')
  writeFileSync(pidFile, JSON.stringify({ pid: 2147483647, start: 'antigo', nonce: 'b'.repeat(48) }), { flag: 'wx' })
  try {
    const result = run('scripts/smoke.mjs', ['down'])
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(pidFile), false)
  } finally { rmSync(pidFile, { force: true }) }
})

test('startup que encerra espontaneamente limpa o PID sem sinalizar outro processo', () => {
  const dir = mkdtempSync(path.join(process.cwd(), '.smoke-exit-'))
  try {
    const npx = path.join(dir, 'npx')
    const node = path.join(dir, 'node')
    writeFileSync(npx, '#!/bin/sh\nif [ "$2" = scripts/create-schema.mjs ]; then exit 0; fi\nexit 17\n')
    writeFileSync(node, '#!/bin/sh\nexit 0\n')
    chmodSync(npx, 0o700); chmodSync(node, 0o700)
    const result = run('scripts/smoke.mjs', ['--no-recreate'], { PATH: `${dir}:/usr/bin:/bin`, SMOKE_PORT: '39483', SMOKE_DATABASE_URL: 'postgres://u:p@127.0.0.1:59483/nxgest_smoke_double' })
    assert.notEqual(result.status, 0)
    assert.match(result.stdout, /Subindo servidor/)
    assert.match(result.stderr, /servidor não respondeu/)
    assert.doesNotMatch(result.stderr, /PID não verificado/)
    assert.equal(existsSync(path.join(process.cwd(), '.smoke.pid')), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('registro de PID malformado não é removido nem sinalizado', () => {
  const pidFile = path.join(process.cwd(), '.smoke.pid')
  writeFileSync(pidFile, JSON.stringify({ pid: 2147483647 }), { flag: 'wx' })
  try {
    const result = run('scripts/smoke.mjs', ['down'])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /PID não verificado/)
    assert.equal(existsSync(pidFile), true)
  } finally { rmSync(pidFile) }
})
