import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { verifyBuildArtifact } from './verify-build-artifact.mjs'
import { verifyStagingReceipt } from './verify-staging-receipt.mjs'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, chmodSync, rmSync, existsSync, statSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {fixtureJq} from './host-jq-fixture.mjs'

const root = process.cwd()
const env = { PATH: process.env.PATH, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' }
function run(cmd, args, opts = {}) { return spawnSync(cmd, args, { encoding: 'utf8', env: { ...env, ...opts.env }, cwd: opts.cwd ?? root, input: opts.input }) }
function ok(cmd, args, opts) { const r = run(cmd, args, opts); assert.equal(r.status, 0, `${cmd}: ${r.stderr}`); return r.stdout.trim() }
function put(file, content, mode) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, content); if (mode) chmodSync(file, mode) }
function workflow(name) {
  if(name==='cd') return 'set -euo pipefail; cd "$TEST_CHECKOUT"; exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"; flock -n 9; git fetch --no-tags origin "$TEST_SHA"; git show "$TEST_SHA:scripts/deploy-bootstrap.sh" | bash -s -- production "$TEST_SHA"'
  if(name==='ci') return 'set -euo pipefail; cd "$TEST_CHECKOUT"; exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"; flock -n 9 || { echo "outro deploy" >&2; exit 1; }; git fetch --no-tags origin "$TEST_SHA"; git show "$TEST_SHA:scripts/deploy-bootstrap.sh" | bash -s -- staging "$TEST_SHA" "$TEST_TAR" "$TEST_DIGEST" "${TEST_ZIP_DIGEST:-$TEST_DIGEST}" "${TEST_RUN_ID:-12}" 1 "${TEST_ARTIFACT_ID:-34}"'
  const text = readFileSync(path.join(root, `.github/workflows/${name}.yml`), 'utf8')
  const start = text.lastIndexOf('          script: |\n')
  assert.notEqual(start, -1)
  let body = text.slice(start + '          script: |\n'.length).split('\n').filter(line => line.startsWith('            ')).map(line => line.slice(12)).join('\n')
  body = body.replace(/^cd \/opt\/nxgestao.*$/m, 'cd "$TEST_CHECKOUT"').replaceAll('${{ github.sha }}', '${TEST_SHA}').replaceAll('${{ needs.validate.outputs.sha }}', '${TEST_SHA}')
  return body
}
function recoveryInstructions() {
  const doc = readFileSync(path.join(root, 'docs/engineering/06-PRODUCAO.md'), 'utf8')
  const body = doc.split('### Recuperação do checkout legado após a primeira transição')[1].split('```bash')[1].split('```')[0]
  return body.replace('CONTROLADOR=COLE_O_SHA_CONTROLADOR_DE_40_CARACTERES', 'CONTROLADOR="$TEST_SHA"').replace('LEGADO=COLE_O_SHA_LEGADO_DE_40_CARACTERES', 'LEGADO="$OLD_SHA"').replace('cd /opt/nxgestao', 'cd "$TEST_CHECKOUT"')
}
function fixture() {
  const dir = mkdtempSync(path.join(root, '.nxg031-fixture-'))
  const bare = path.join(dir, 'origin.git'), author = path.join(dir, 'author'), target = path.join(dir, 'checkout'), bin = path.join(dir, 'bin'), log = path.join(dir, 'docker.log'), backup = path.join(dir, 'backup.sh'), legacyMarker = path.join(dir, 'legacy-executed')
  ok('git', ['init', '--bare', bare]); ok('git', ['init', author]); ok('git', ['-C', author, 'config', 'user.name', 'Fixture']); ok('git', ['-C', author, 'config', 'user.email', 'fixture@example.invalid'])
  put(path.join(author, '.gitignore'), '.env\n.env.staging\nnode_modules/\n')
  // Fixture autocontida do contrato legado: Compose na raiz e sentinela para
  // detectar qualquer execução do script carregado antes da troca de SHA.
  const old = '#!/bin/bash\nprintf executed > "$TEST_LEGACY_MARKER"\nCOMPOSE="-f docker-compose.staging.yml"\ndocker compose $COMPOSE up -d\nexit 90\n'
  put(path.join(author, 'scripts/deploy-staging.sh'), old+'\n'); for (const file of ['docker-compose.yml','docker-compose.prod.yml','docker-compose.staging.yml','Caddyfile']) put(path.join(author, file), 'legacy\n')
  ok('git', ['-C', author, 'add', '.']); ok('git', ['-C', author, 'commit', '-m', 'legacy']); const oldSha = ok('git', ['-C', author, 'rev-parse', 'HEAD']); ok('git', ['-C', author, 'remote', 'add', 'origin', bare]); ok('git', ['-C', author, 'push', 'origin', 'HEAD:refs/heads/main'])
  ok('git', ['clone', '--no-checkout', bare, target]); ok('git', ['-C', target, 'checkout', '--detach', oldSha])
  for (const file of ['scripts/host-jq.sh','scripts/deploy-bootstrap.sh','scripts/deploy-staging.sh','scripts/load-verified-image.sh','scripts/container-health.sh','scripts/initial-baseline.sh','scripts/staging-env.sh','infra/docker-compose.staging.yml','infra/docker-compose.prod.yml','infra/Caddyfile']) { mkdirSync(path.dirname(path.join(author,file)), { recursive:true }); copyFileSync(path.join(root,file),path.join(author,file)) }
  fixtureJq(author, target)
  // Os backups absolutos são substituídos por executável exclusivamente da fixture.
  put(path.join(author, 'scripts/deploy-recover-legacy.sh'), readFileSync(path.join(root,'scripts/deploy-recover-legacy.sh'),'utf8').replaceAll('/opt/scripts/backup-nxgest.sh', backup))
  put(path.join(author, 'scripts/deploy.sh'), readFileSync(path.join(root,'scripts/deploy.sh'),'utf8').replaceAll('/opt/scripts/backup-nxgest.sh', backup).replaceAll('scripts/backup-nxgest.sh', backup))
  // As verificações MEL-0009 têm sua própria suíte; aqui são dubladas.
  put(path.join(author, 'scripts/rollback-preflight.sh'), '#!/bin/sh\nexit 0\n')
  for (const file of ['docker-compose.yml','docker-compose.prod.yml','docker-compose.staging.yml','Caddyfile']) rmSync(path.join(author,file)); ok('git', ['-C', author, 'add', '-A']); ok('git', ['-C', author, 'commit', '-m', 'target']); const sha = ok('git', ['-C', author, 'rev-parse', 'HEAD']); ok('git', ['-C', author, 'push', 'origin', 'HEAD:refs/heads/main'])
  const archive=path.join(dir,'image.tar'),archiveDir=path.join(dir,'image-dir');mkdirSync(archiveDir);put(path.join(archiveDir,'manifest.json'),JSON.stringify([{Config:'config.json',RepoTags:[`nxgest-build:${sha}`],Layers:['a/layer.tar']}]));ok('tar',['-cf',archive,'-C',archiveDir,'manifest.json']);const archiveDigest='sha256:'+createHash('sha256').update(readFileSync(archive)).digest('hex')
  put(path.join(target,'.env.staging'), 'PG_DB=test\nPG_USER=test\nPG_PASSWORD=test\nMAIL_FROM_NAME="NX Gest"\nMAIL_PROVIDER=console\nAPP_URL=http://example.invalid\n')
  put(path.join(target,'.env'), 'fixture=value with spaces\n')
  put(path.join(bin,'docker'), `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "$TEST_LOG"\nif [ "$TEST_FAIL" = 1 ] && [ "$1" = compose ]; then exit 33; fi\nif [ "$1" = compose ] && [[ " $* " == *" ps -q app "* ]]; then echo fixture-container; exit 0; fi\nif [ "$1" = compose ]; then\n  case " $* " in *" -f infra/docker-compose.staging.yml "*) [ -f infra/docker-compose.staging.yml ] && [ "$MAIL_FROM_NAME" = 'NX Gest' ] || exit 31;; *" -f infra/docker-compose.prod.yml "*) [ -f infra/docker-compose.prod.yml ] && [ -f infra/Caddyfile ] || exit 32;; esac\nfi\nif [ "$1" = ps ] && [ "\${TEST_EXISTING_CONTAINER:-0}" = 1 ]; then echo existing-container; exit 0; fi\nif [ "$1" = image ] && [ "$2" = load ]; then touch "$TEST_LOG.loaded"; fi\nif [ "$1" = image ] && [ "$2" = rm ]; then rm -f "$TEST_LOG.loaded"; exit 0; fi\nif [ "$1" = image ] && [ "$2" = inspect ] && [[ "$*" == *nxgest-build:* ]] && [ ! -f "$TEST_LOG.loaded" ]; then exit 1; fi\nif [ "$1" = inspect ] && [[ "$*" == *'{{.Id}}'* ]]; then if [ "\${TEST_SWAP_ID:-0}" = 1 ] && [[ "$*" == *staging-app* ]]; then if [ -f "$TEST_LOG.idseen" ]; then printf '%064d\n' 2; exit 0; else touch "$TEST_LOG.idseen"; fi; fi; printf '%064d\n' 1; exit 0; fi\nif [ "$1" = exec ] && [ "$3" = node ]; then [ "\${TEST_INTERNAL_HEALTH:-ok}" = ok ]; exit $?; fi\nif [ "$1" = inspect ] && [ "\${TEST_WRONG_IMAGE:-0}" = 1 ]; then printf 'sha256:%064d\n' 1; exit 0; fi\nif [ "$1" = inspect ] || { [ "$1" = image ] && [ "$2" = inspect ]; }; then printf 'sha256:%064d\n' 0; fi\nif [ "$1" = exec ] && [[ "$*" == *psql* ]]; then echo 1; fi\nexit 0\n`, 0o700)
  put(path.join(bin,'curl'), '#!/bin/sh\nif [ "${TEST_HEALTH_FAIL:-0}" = 1 ]; then printf \'{"status":"error","db":"disconnected"}\'; else printf \'{"status":"ok","db":"connected"}\'; fi\nexit 0\n', 0o700)
  put(path.join(bin,'sleep'), '#!/bin/sh\nexit 0\n', 0o700)
  put(path.join(bin,'mv'), '#!/bin/bash\nif [ "${TEST_FAIL_STATE:-0}" = 1 ] && [[ "$*" == *nxgest-staging-selection ]]; then exit 88; fi\nif [ "${TEST_FAIL_MARKER:-0}" = 1 ] && [[ "$*" == *nxgest-staging-sha ]]; then exit 89; fi\nexec /usr/bin/mv "$@"\n', 0o700)
  const testEnv = { TEST_LEGACY_MARKER: legacyMarker, PATH: `${bin}:${process.env.PATH}`, TEST_CHECKOUT: target, TEST_SHA: sha, TEST_LOG: log, TEST_TAR: archive, TEST_DIGEST: archiveDigest, HOME: dir, DOCKER_HOST: 'unix:///nxg0009-inexistente', DOCKER_CONTEXT: 'nxg0009-inexistente' }
  // Antes de cada fixture, comprovar que Docker e rede são interceptados.
  assert.equal(ok('sh',['-c','command -v docker'],{env:testEnv}),path.join(bin,'docker'))
  assert.equal(ok('sh',['-c','command -v curl'],{env:testEnv}),path.join(bin,'curl'))
  const probeLog=path.join(dir,'interception-probe')
  const probe=run('docker',['__guard_probe__'],{env:{...testEnv,TEST_LOG:probeLog}})
  assert.equal(probe.status,0);assert.match(readFileSync(probeLog,'utf8'),/__guard_probe__/)
  return { dir, bare, author, target, bin, log, backup, legacyMarker, oldSha, sha, env:testEnv }
}
function entry(f, mode='ci', extra={}) { return run('bash', ['-c', workflow(mode)], { cwd: f.target, env: { ...f.env, ...extra } }) }
function snapshot(f) { return { head: ok('git',['-C',f.target,'rev-parse','HEAD']), stage: readFileSync(path.join(f.target,'.env.staging'),'utf8'), prod: readFileSync(path.join(f.target,'.env'),'utf8') } }
function cleanup(f) { rmSync(f.dir,{recursive:true,force:true}) }

test('sentinela da fixture detecta execução do script legado', () => {
 const f=fixture(); try {
  const r=run('bash',['scripts/deploy-staging.sh'],{cwd:f.target,env:f.env})
  assert.equal(r.status,90); assert.equal(readFileSync(f.legacyMarker,'utf8'),'executed')
  assert.match(readFileSync(f.log,'utf8'),/docker-compose\.staging\.yml/)
 } finally {cleanup(f)}
})

test('primeira transição, repetição e entrada manual usam SHA e helper novos com env intacto', () => {
 const f=fixture(); try { const before=snapshot(f); let r=entry(f); assert.equal(r.status,0,r.stderr); assert.equal(snapshot(f).head,f.sha); assert.equal(snapshot(f).stage,before.stage); assert.equal(snapshot(f).prod,before.prod); assert.match(readFileSync(f.log,'utf8'),/infra\/docker-compose\.staging\.yml/); const mutations=()=>readFileSync(f.log,'utf8').split('\n').filter(x=>/^(image load|image rm|compose .* up|exec .*seed)/.test(x)); const initialMutations=mutations(); r=entry(f); assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/STAGING_RETRY/); assert.deepEqual(mutations(),initialMutations)
 const manual='set -euo pipefail; cd "$TEST_CHECKOUT"; exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"; flock -n 9; git fetch --no-tags origin "$TEST_SHA"; git show "$TEST_SHA:scripts/deploy-bootstrap.sh" | bash -s -- staging "$TEST_SHA" "$TEST_TAR" "$TEST_DIGEST" "$TEST_DIGEST" 12 1 34'; r=run('bash',['-c',manual],{env:f.env}); assert.equal(r.status,0,r.stderr); assert.equal(snapshot(f).stage,before.stage); assert.deepEqual(mutations(),initialMutations); assert.equal(existsSync(f.legacyMarker),false)
 } finally { cleanup(f) }
})

test('fetch/ref inválido e remoto indisponível falham antes de checkout e Docker', () => {
 const f=fixture(); try { const before=snapshot(f); let r=entry(f,'ci',{TEST_SHA:'f'.repeat(40)}); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before); assert.equal(existsSync(f.log),false); ok('git',['-C',f.target,'remote','set-url','origin',path.join(f.dir,'missing')]); r=entry(f); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before); assert.equal(existsSync(f.log),false) } finally {cleanup(f)}
})

test('mudança rastreada, arquivo novo e ignorado conflitante são preservados', () => {
 for (const variant of ['tracked','untracked','ignored']) { const f=fixture(); try {
  let file, data='conteúdo privado de fixture\n'; if(variant==='tracked') file=path.join(f.target,'docker-compose.staging.yml'); else if(variant==='untracked') file=path.join(f.target,'infra/docker-compose.staging.yml'); else {file=path.join(f.target,'scripts/staging-env.sh'); put(path.join(f.target,'.git/info/exclude'),'scripts/staging-env.sh\n')}
  put(file,data); const before=snapshot(f); const r=entry(f); assert.notEqual(r.status,0,variant); assert.deepEqual(snapshot(f),before); assert.equal(readFileSync(file,'utf8'),data); if(existsSync(f.log))assert.doesNotMatch(readFileSync(f.log,'utf8'),/^(image load|image rm|compose .* up)/m); assert.doesNotMatch(r.stdout+r.stderr,/conteúdo privado/)
 } finally {cleanup(f)} }
})

test('produção bloqueia staging ausente e backup ausente ou falho antes de Docker', () => {
 const f=fixture(); try { let r=entry(f,'cd'); assert.notEqual(r.status,0); assert.equal(existsSync(f.log),false); assert.equal(snapshot(f).head,f.oldSha)
 r=entry(f); assert.equal(r.status,0,r.stderr); rmSync(f.log); r=entry(f,'cd'); assert.notEqual(r.status,0); assert.equal(existsSync(f.log),false)
 put(f.backup,'#!/bin/sh\nexit 9\n',0o700); r=entry(f,'cd'); assert.notEqual(r.status,0); assert.equal(existsSync(f.log),false)
 put(f.backup,'#!/bin/sh\nprintf \"Backup íntegro criado: 20261110T000000Z-123-1\\n\"\n',0o700); r=entry(f,'cd'); assert.equal(r.status,0,r.stderr); assert.match(readFileSync(f.log,'utf8'),/infra\/docker-compose.prod.yml/)
 } finally {cleanup(f)}
})

test('retry com health ruim falha sem mutação; início interrompido bloqueia retomada',()=>{
 let f=fixture();try{let r=entry(f);assert.equal(r.status,0,r.stderr);const before=readFileSync(f.log,'utf8');r=entry(f,'ci',{TEST_HEALTH_FAIL:'1'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/);assert.equal(readFileSync(path.join(f.target,'.git/nxgest-staging-sha'),'utf8').trim(),f.sha);const after=readFileSync(f.log,'utf8').slice(before.length);assert.doesNotMatch(after,/^(image load|image rm|compose .* up)/m)}finally{cleanup(f)}
 f=fixture();try{let r=entry(f,'ci',{TEST_FAIL:'1'});assert.notEqual(r.status,0);assert(existsSync(path.join(f.target,'.git/nxgest-staging-pending')));const before=readFileSync(f.log,'utf8');r=entry(f);assert.notEqual(r.status,0);assert.equal(readFileSync(f.log,'utf8'),before);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/)}finally{cleanup(f)}
})
test('serviço anterior sem estado controlado bloqueia primeira entrada antes do load',()=>{const f=fixture();try{const r=entry(f,'ci',{TEST_EXISTING_CONTAINER:'1'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/);assert.doesNotMatch(readFileSync(f.log,'utf8'),/^(image load|image rm|compose .* up)/m);assert(!existsSync(path.join(f.target,'.git/nxgest-staging-pending')))}finally{cleanup(f)}})
test('retry de seleção divergente falha antes de novos efeitos',()=>{
 for(const extra of [{TEST_RUN_ID:'13'},{TEST_ARTIFACT_ID:'35'},{TEST_ZIP_DIGEST:'sha256:'+'f'.repeat(64)}]){const f=fixture();try{let r=entry(f);assert.equal(r.status,0,r.stderr);const before=readFileSync(f.log,'utf8');r=entry(f,'ci',extra);assert.notEqual(r.status,0);assert.equal(readFileSync(f.log,'utf8'),before);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/)}finally{cleanup(f)}}
})
test('estado ausente, corrompido ou imagem divergente não autoriza retry',()=>{
 for(const variant of ['marker','corrupt','environment','image']){const f=fixture();try{let r=entry(f);assert.equal(r.status,0,r.stderr);const state=path.join(f.target,'.git/nxgest-staging-selection'),marker=path.join(f.target,'.git/nxgest-staging-sha');if(variant==='marker')rmSync(marker);if(variant==='corrupt')put(state,'incompleto\n',0o600);if(variant==='environment')put(state,readFileSync(state,'utf8').replace('environment=staging','environment=production'),0o600);const before=readFileSync(f.log,'utf8');r=entry(f,'ci',variant==='image'?{TEST_WRONG_IMAGE:'1'}:{});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/);assert.doesNotMatch(readFileSync(f.log,'utf8').slice(before.length),/^(image load|image rm|compose .* up)/m)}finally{cleanup(f)}}
})
test('falha atômica de estado ou marker preserva pendência e impede retry',()=>{
 for(const key of ['TEST_FAIL_STATE','TEST_FAIL_MARKER']){const f=fixture();try{let r=entry(f,'ci',{[key]:'1'});assert.notEqual(r.status,0);assert(existsSync(path.join(f.target,'.git/nxgest-staging-pending')));const before=readFileSync(f.log,'utf8');r=entry(f);assert.notEqual(r.status,0);assert.equal(readFileSync(f.log,'utf8'),before);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/)}finally{cleanup(f)}}
})
test('seleção antiga não rebaixa implantação posterior',()=>{
 const f=fixture();try{let r=entry(f);assert.equal(r.status,0,r.stderr);put(path.join(f.author,'novo.txt'),'segunda versão\n');ok('git',['-C',f.author,'add','novo.txt']);ok('git',['-C',f.author,'commit','-m','novo']);const newer=ok('git',['-C',f.author,'rev-parse','HEAD']);ok('git',['-C',f.author,'push','origin','HEAD:refs/heads/main']);const dir=path.join(f.dir,'newimage');mkdirSync(dir);put(path.join(dir,'manifest.json'),JSON.stringify([{Config:'config.json',RepoTags:[`nxgest-build:${newer}`],Layers:['a/layer.tar']}]));const tar=path.join(f.dir,'new.tar');ok('tar',['-cf',tar,'-C',dir,'manifest.json']);const dig='sha256:'+createHash('sha256').update(readFileSync(tar)).digest('hex');r=entry(f,'ci',{TEST_SHA:newer,TEST_TAR:tar,TEST_DIGEST:dig,TEST_RUN_ID:'13',TEST_ARTIFACT_ID:'35'});assert.equal(r.status,0,r.stderr);const before=readFileSync(f.log,'utf8');r=entry(f);assert.notEqual(r.status,0);assert.equal(readFileSync(f.log,'utf8'),before);assert.equal(snapshot(f).head,newer);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/)}finally{cleanup(f)}
})
test('tar adulterado falha antes de Docker e health ou imagem divergentes não geram recibo',()=>{
 for(const variant of ['hash','image','health']){const f=fixture();try{if(variant==='hash')writeFileSync(f.env.TEST_TAR,'corrupt');const r=entry(f,'ci',variant==='image'?{TEST_WRONG_IMAGE:'1'}:variant==='health'?{TEST_HEALTH_FAIL:'1'}:{});assert.notEqual(r.status,0,variant);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/);if(variant==='hash')assert.equal(existsSync(f.log),false);assert(!existsSync(path.join(f.target,'.git/nxgest-staging-sha'))||readFileSync(path.join(f.target,'.git/nxgest-staging-sha'),'utf8')==='')}finally{cleanup(f)}}
})
test('verificação e transporte dublados integram staging e recusam fingerprint incorreta',async()=>{
 const f=fixture();try{
  const key=path.join(f.dir,'synthetic-key'),known=path.join(f.dir,'known'),log=path.join(f.dir,'ssh-log');put(key,'fixture');put(known,'nxgest-staging ssh-ed25519 FAKE\n')
  put(path.join(f.bin,'ssh-keygen'),'#!/bin/sh\nif [ "${BAD_FP:-0}" = 1 ]; then echo "256 SHA256:WRONG key"; else echo "256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc key"; fi\n',0o700)
  put(path.join(f.bin,'ssh'),'#!/bin/bash\nprintf called > "$TEST_SSH_LOG"\nfor command; do :; done\ncommand=$(printf %s "$command" | sed "s|/opt/nxgestao|$TEST_CHECKOUT|g")\nexec /bin/bash -c "$command"\n',0o700)
  const args=['scripts/staging-transport.sh',f.env.TEST_TAR,f.sha,f.env.TEST_DIGEST,f.env.TEST_DIGEST,'12','1','34','example.invalid','fixture',key,known]
  let r=run('bash',args,{env:{...f.env,TEST_SSH_LOG:log,BAD_FP:'1'}});assert.notEqual(r.status,0);assert.equal(existsSync(log),false)
  const img=readFileSync(f.env.TEST_TAR),z=Buffer.from('zip fixture'),zd='sha256:'+createHash('sha256').update(z).digest('hex'),policy={version:'nxg-build-v1',decision:'QA/staging',repo:'RafaCartaxo/nxgest',runId:'12',attempt:1,artifactId:'34',sourceSha:f.sha,signerSha:f.sha,workflowId:'330080640',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)}
  const rec=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:'12',attempt:1,sourceSha:f.sha,platform:'linux/amd64',imageSize:img.length,imageSha256:f.env.TEST_DIGEST}))
  const verified=await verifyBuildArtifact({token:'fixture-token',decision:'QA/staging'},{readPolicy:()=>policy,inspect:async()=>({digestZip:zd}),download:async()=>z,extract:()=>({image:img,receipt:rec}),attest:()=>({attestationValid:true})})
  try{assert.equal(verified.fixture,true);const verifiedArgs=[...args];verifiedArgs[1]=verified.imagePath;verifiedArgs[4]=zd;r=run('bash',verifiedArgs,{env:{...f.env,TEST_SSH_LOG:log}});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/STAGING_RECEIPT sha=/);assert.equal(snapshot(f).head,f.sha);assert.equal(existsSync(log),true)}finally{rmSync(path.dirname(verified.imagePath),{recursive:true,force:true})}
 }finally{cleanup(f)}
})
test('CI e recibo staging dublados materializam primeira baseline e impedem replay',async()=>{
 const f=fixture();let verified
 try{
  const buildZip=Buffer.from('build-zip'),zipDigest='sha256:'+createHash('sha256').update(buildZip).digest('hex')
  let r=entry(f,'ci',{TEST_ZIP_DIGEST:zipDigest});assert.equal(r.status,0,r.stderr)
  const imageId='sha256:'+'0'.repeat(64);assert(r.stdout.includes(`STAGING_RECEIPT sha=${f.sha} run=12 attempt=1 artifact=34 zip=${zipDigest} tar=${f.env.TEST_DIGEST} image=${imageId}`))
  const stagePolicy={version:'nxg-staging-policy-v1',decision:'QA/staging',workflowId:'88',candidateSha:f.sha,signerSha:f.sha,sourceSha:f.sha,ghPath:'/guard/gh',ghSha256:'sha256:'+'d'.repeat(64)}
  const receipt={version:'nxg-staging-v1',sha:f.sha,ciRun:'12',ciAttempt:1,artifact:'34',zip:zipDigest,tar:f.env.TEST_DIGEST,image:imageId,stagingRun:'77',stagingAttempt:1,health:'ok',db:'connected'},raw=Buffer.from(JSON.stringify(receipt)),z=Buffer.from('stage-zip'),zd='sha256:'+createHash('sha256').update(z).digest('hex')
  const stage=await verifyStagingReceipt({decision:'QA/staging',runId:'77',token:'fixture'},{readPolicy:()=>stagePolicy,inspect:async()=>({artifactId:'99',digestZip:zd}),download:async()=>z,extract:()=>({receipt:raw}),attest:()=>({attestationValid:true})});assert.equal(stage.fixture,true)
  const img=readFileSync(f.env.TEST_TAR),buildPolicy={version:'nxg-build-v1',decision:'QA/build',repo:'RafaCartaxo/nxgest',runId:'12',attempt:1,artifactId:'34',sourceSha:f.sha,signerSha:f.sha,workflowId:'330080640',ghPath:'/guard/gh',ghSha256:'sha256:'+'d'.repeat(64)},buildReceipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:'12',attempt:1,sourceSha:f.sha,platform:'linux/amd64',imageSize:img.length,imageSha256:f.env.TEST_DIGEST}))
  verified=await verifyBuildArtifact({decision:'QA/build',token:'fixture'},{readPolicy:()=>buildPolicy,inspect:async()=>({digestZip:'sha256:'+'c'.repeat(64)}),download:async()=>buildZip,extract:()=>({image:img,receipt:buildReceipt}),attest:()=>({attestationValid:true})}).catch(e=>{if(!/ZIP/.test(e.message))throw e;return null})
  // A seleção deve conferir o digest ZIP, mesmo no caminho dublado.
  assert.equal(verified,null)
  const actualZip=stage.zip
  verified=await verifyBuildArtifact({decision:'QA/build',token:'fixture'},{readPolicy:()=>buildPolicy,inspect:async()=>({digestZip:actualZip}),download:async()=>buildZip,extract:()=>({image:img,receipt:buildReceipt}),attest:()=>({attestationValid:true})});assert.equal(verified.fixture,true);assert.equal(verified.imageSha256,stage.tar);assert.equal(verified.zipSha256,stage.zip);assert.equal(verified.artifactId,stage.artifact);assert.equal(verified.sourceSha,stage.sha);assert.equal(verified.runId,stage.ciRun)
  const policy=`mode=first-baseline-v1\nenvironment=production\nsha=${f.sha}\ntar=${f.env.TEST_DIGEST}\nzip=${actualZip}\nci_run=12\nartifact=34\nstaging_run=77\ndecision=QA/fixture\n`,pf=path.join(f.target,'.git/nxgest-first-baseline-policy');put(pf,policy,0o600);const ph='sha256:'+createHash('sha256').update(policy).digest('hex')
  const key=path.join(f.dir,'key'),known=path.join(f.dir,'known'),log=path.join(f.dir,'ssh-log');put(key,'fixture');put(known,'nxgest-staging ssh-ed25519 FAKE\n')
  put(path.join(f.bin,'ssh-keygen'),'#!/bin/sh\necho "256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc key"\n',0o700)
  put(path.join(f.bin,'ssh'),'#!/bin/bash\nprintf called > "$TEST_SSH_LOG"\nfor command; do :; done\ncommand=$(printf %s "$command" | sed "s|/opt/nxgestao|$TEST_CHECKOUT|g")\nexec /bin/bash -c "$command"\n',0o700)
  const args=['scripts/staging-transport.sh',verified.imagePath,f.sha,f.env.TEST_DIGEST,actualZip,'12','1','34','example.invalid','fixture',key,known,'production-initial','77',imageId,ph],before=snapshot(f)
  r=run('bash',args,{env:{...f.env,TEST_SSH_LOG:log}});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/PRODUCTION_BASELINE/);assert.equal(snapshot(f).prod,before.prod);assert(existsSync(path.join(f.target,'.git/nxgest-baseline-established')))
  const beforeLog=readFileSync(f.log,'utf8');r=run('bash',args,{env:{...f.env,TEST_SSH_LOG:log}});assert.notEqual(r.status,0);assert.equal(readFileSync(f.log,'utf8'),beforeLog)
 }finally{if(verified)rmSync(path.dirname(verified.imagePath),{recursive:true,force:true});cleanup(f)}
})
test('ref legado sem bootstrap é recusada sem chamar script antigo', () => {
 const f=fixture(); try { const before=snapshot(f); const r=entry(f,'ci',{TEST_SHA:f.oldSha}); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before); assert.equal(existsSync(f.log),false); assert.equal(existsSync(f.legacyMarker),false) } finally {cleanup(f)}
})

test('recuperação legada exige backup, protege arquivos e restaura somente checkout', () => {
 const f=fixture(); try {
  let r=entry(f); assert.equal(r.status,0,r.stderr)
  const before=snapshot(f); const dockerBefore=readFileSync(f.log,'utf8')
  const recovery=recoveryInstructions()
  const runRecovery=()=>run('bash',['-c',recovery],{env:{...f.env,OLD_SHA:f.oldSha}})
  r=runRecovery(); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before)
  put(f.backup,'#!/bin/sh\nexit 17\n',0o700); r=runRecovery(); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before)
  put(f.backup,'#!/bin/sh\nexit 0\n',0o700)
  put(path.join(f.target,'work-untracked.txt'),'preservar\n'); r=runRecovery(); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before); assert.equal(readFileSync(path.join(f.target,'work-untracked.txt'),'utf8'),'preservar\n'); rmSync(path.join(f.target,'work-untracked.txt'))
  const tracked=path.join(f.target,'infra/Caddyfile'); const trackedBefore=readFileSync(tracked,'utf8'); put(tracked,'alteração local\n'); r=runRecovery(); assert.notEqual(r.status,0); assert.equal(readFileSync(tracked,'utf8'),'alteração local\n'); put(tracked,trackedBefore)
  r=runRecovery(); assert.equal(r.status,0,r.stderr); assert.equal(snapshot(f).head,f.oldSha); assert.equal(snapshot(f).stage,before.stage); assert.equal(snapshot(f).prod,before.prod); assert(!existsSync(path.join(f.target,'.git/nxgest-staging-sha'))||readFileSync(path.join(f.target,'.git/nxgest-staging-sha'),'utf8')===''); assert.equal(readFileSync(f.log,'utf8'),dockerBefore); assert.equal(existsSync(f.legacyMarker),false)
 } finally {cleanup(f)}
})

test('recuperação não sobrescreve arquivo ignorado em conflito', () => {
 const f=fixture(); try {
  let r=entry(f); assert.equal(r.status,0,r.stderr); put(f.backup,'#!/bin/sh\nexit 0\n',0o700)
  put(path.join(f.target,'.git/info/exclude'),'docker-compose.yml\n'); put(path.join(f.target,'docker-compose.yml'),'dados ignorados\n')
  const before=snapshot(f); const recovery=recoveryInstructions()
  r=run('bash',['-c',recovery],{env:{...f.env,OLD_SHA:f.oldSha}}); assert.notEqual(r.status,0); assert.deepEqual(snapshot(f),before); assert.equal(readFileSync(path.join(f.target,'docker-compose.yml'),'utf8'),'dados ignorados\n')
 } finally {cleanup(f)}
})

test('disputa pelo checkout falha antes de fetch ou Docker', async () => {
 const f=fixture(); try {const lock=path.join(f.target,'.git/nxgest-deploy.lock'); const holder=spawn('flock',['-x',lock,'sh','-c','printf READY; read line'],{stdio:['pipe','pipe','pipe']}); await new Promise((resolve,reject)=>{holder.stdout.once('data',resolve);holder.once('error',reject)}); try {const before=snapshot(f);const r=entry(f);assert.notEqual(r.status,0);assert.match(r.stderr,/outro deploy/);assert.deepEqual(snapshot(f),before);assert.equal(existsSync(f.log),false)} finally {holder.stdin.end('\n'); await new Promise(resolve=>holder.once('exit',resolve))} } finally {cleanup(f)}
})

test('gates de promoção CI e caminhos de produção permanecem explícitos', () => {
 const ci=readFileSync('.github/workflows/ci.yml','utf8'), cd=readFileSync('.github/workflows/cd.yml','utf8'), deploy=readFileSync('scripts/deploy.sh','utf8')
 const staging=readFileSync('.github/workflows/staging.yml','utf8');assert.match(staging,/verify-build-artifact\.mjs verify-event/);assert.doesNotMatch(staging,/VPS_SSH_HOSTKEY/);assert.match(staging,/infra\/staging-known-hosts/);assert.match(staging,/staging-transport\.sh/);assert.match(staging,/workflow_run\.conclusion == 'success'/);assert.match(ci,/needs: \[test, smoke, migracao\]/); assert.match(cd,/workflow_run\.conclusion/); assert.match(cd,/verify-staging-receipt\.mjs/); assert.match(cd,/verify-build-artifact\.mjs verify-event/); assert.match(cd,/production-initial/); assert.match(deploy,/backup-nxgest\.sh/); assert.doesNotMatch(deploy,/NXGEST_SKIP_BACKUP/); assert.match(deploy,/infra\/docker-compose\.prod\.yml/)
})


test('procedimento documentado transporta fixture cifrada entre homes sem sobrescrever', () => {
 const dir=mkdtempSync(path.join(root,'.nxg031-transport-'))
 const source=path.join(dir,'home-antigo'), dest=path.join(dir,'home-novo'), failedDest=path.join(dir,'home-falha'), gpgHome=path.join(dir,'gpg')
 try {
  mkdirSync(source,{recursive:true}); mkdirSync(dest,{recursive:true}); mkdirSync(failedDest,{recursive:true}); mkdirSync(gpgHome,{mode:0o700})
  put(path.join(source,'.config/nxgestao/subdir/fixture.txt'),'fixture privada sem segredo real\n')
  put(path.join(source,'.ssh/id_fixture'),'chave sintética\n')
  const doc=readFileSync('docs/engineering/08-SETUP-NOVA-MAQUINA.md','utf8')
  const part=doc.split('### 5.2 —')[1].split('```bash')[1].split('```')[0]
  const [pack,unpack]=part.split('# Na máquina nova:')
  assert.ok(pack.includes('tar -C "$HOME"')); assert.ok(unpack.includes('-C "$restore_dir"'))
  assert.match(pack, /set -euo pipefail; umask 077/); assert.match(unpack, /set -euo pipefail[\s\S]*umask 077/)
  const tarBin=path.join(dir,'bin'); mkdirSync(tarBin)
  const tarMarker=path.join(dir,'tar-permission-check')
  put(path.join(tarBin,'tar'), '#!/bin/bash\nif [ "$1" = -xzf ]; then for last; do :; done; [ "$(stat -c %a "$last")" = 700 ] || exit 91; echo private > "$TEST_TAR_MARKER"; fi\nexec /usr/bin/tar "$@"\n',0o700)
  const wrapper='gpg() { command /usr/bin/gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 "$@" 3<<<fixture; };\n'
  const common={ GNUPGHOME:gpgHome, PATH:`${tarBin}:${process.env.PATH}`, TEST_TAR_MARKER:tarMarker }
  let r=run('bash',['-c',wrapper+pack],{cwd:dir,env:{...common,HOME:source}}); assert.equal(r.status,0,r.stderr); assert.equal(statSync(path.join(dir,'nxgest-segredos.gpg')).mode & 0o777,0o600)
  r=run('bash',['-c',wrapper+unpack],{cwd:dir,env:{...common,HOME:dest}}); assert.equal(r.status,0,r.stderr)
  assert.equal(readFileSync(tarMarker,'utf8').trim(),'private')
  assert.equal(readFileSync(path.join(dest,'.config/nxgestao/subdir/fixture.txt'),'utf8'),'fixture privada sem segredo real\n')
  assert.equal(readFileSync(path.join(dest,'.ssh/id_fixture'),'utf8'),'chave sintética\n')
  for(const name of ['.config/nxgestao','.config/nxgestao/subdir','.ssh']) assert.equal(statSync(path.join(dest,name)).mode & 0o777,0o700)
  for(const name of ['.config/nxgestao/subdir/fixture.txt','.ssh/id_fixture']) assert.equal(statSync(path.join(dest,name)).mode & 0o777,0o600)
  r=run('bash',['-c',wrapper+unpack],{cwd:dir,env:{...common,HOME:dest}}); assert.notEqual(r.status,0); assert.equal(readFileSync(path.join(dest,'.ssh/id_fixture'),'utf8'),'chave sintética\n')
  writeFileSync(path.join(dir,'nxgest-segredos.gpg'),'arquivo cifrado inválido')
  r=run('bash',['-c',wrapper+unpack],{cwd:dir,env:{...common,HOME:failedDest}}); assert.notEqual(r.status,0)
  assert.equal(existsSync(path.join(failedDest,'.ssh')),false); assert.equal(existsSync(path.join(failedDest,'.config/nxgestao')),false)
  const temporary=readdirSync(failedDest).filter(name=>name.startsWith('.nxgest-restauracao.')); assert.equal(temporary.length,1); assert.equal(statSync(path.join(failedDest,temporary[0])).mode & 0o777,0o700)
 } finally { run('gpgconf',['--homedir',gpgHome,'--kill','gpg-agent']); rmSync(dir,{recursive:true,force:true}) }
})

test('chave pública versionada corresponde à fingerprint aceita',()=>{
 const fields=readFileSync('infra/staging-known-hosts','utf8').trim().split(/\s+/);assert.equal(fields[0],'nxgest-staging');assert.equal(fields[1],'ssh-ed25519');const digest=createHash('sha256').update(Buffer.from(fields[2],'base64')).digest('base64').replace(/=+$/,'');assert.equal('SHA256:'+digest,'SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc')
})

test('CI descreve metadados GH limitados ao resumo e sem credenciais',()=>{
 const ci=readFileSync('.github/workflows/ci.yml','utf8'),section=ci.split('      - name: Metadados públicos do GH no runner de build')[1].split('      - name: Cria imagem e recibo')[0]
 assert.match(section,/command -v gh/);assert.match(section,/readlink -f/);assert.match(section,/env -i PATH=\/usr\/bin:\/bin HOME=\/nonexistent/);assert.match(section,/sha256sum/);assert.match(section,/GITHUB_STEP_SUMMARY/);assert.match(section,/SOURCE_SHA/);assert.match(section,/RUN_ID/);assert.doesNotMatch(section,/GH_TOKEN|GITHUB_TOKEN|printenv|set -x|upload-artifact/)
})

test('health interno negativo, indisponível ou porta errada bloqueia staging e retry mesmo com URL pública saudável',()=>{
 for(const variant of ['negative','unavailable','port','swap']){const injected=variant==='swap'?{TEST_SWAP_ID:'1'}:{TEST_INTERNAL_HEALTH:variant};let f=fixture();try{let r=entry(f,'ci',injected);assert.notEqual(r.status,0,variant);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/)}finally{cleanup(f)}
 f=fixture();try{let r=entry(f);assert.equal(r.status,0,r.stderr);const before=readFileSync(f.log,'utf8');r=entry(f,'ci',injected);assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/STAGING_RECEIPT/);assert.doesNotMatch(readFileSync(f.log,'utf8').slice(before.length),/^(image load|image rm|compose .* up)/m)}finally{cleanup(f)}}
})
