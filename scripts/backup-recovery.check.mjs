import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, chmodSync, rmSync, readdirSync, existsSync, symlinkSync } from 'node:fs'
import { spawnSync, spawn } from 'node:child_process'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { reconcileFixture } from './reconcile-fixture.mjs'

const root=process.cwd()
function run(cmd,args,opts={}) { return spawnSync(cmd,args,{cwd:opts.cwd ?? root,encoding:'utf8',env:{PATH:process.env.PATH,...opts.env},input:opts.input}) }
function ok(cmd,args,opts) {const r=run(cmd,args,opts);assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
function put(file,value,mode) {mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,value);if(mode)chmodSync(file,mode)}
function fixture() {
 const dir=mkdtempSync(path.join(root,'.nxg0009-fixture-')), repo=path.join(dir,'repo'), backups=path.join(dir,'backups'), bin=path.join(dir,'bin'), data=path.join(dir,'data'), tags=path.join(dir,'tags')
 mkdirSync(path.join(repo,'.git'),{recursive:true});mkdirSync(backups);mkdirSync(bin);mkdirSync(path.join(data,'uploads'),{recursive:true});mkdirSync(tags)
 put(path.join(repo,'.env'),'PG_USER=test\nPG_DB=test\nPG_PASSWORD="synthetic-secret-marker"\nMAIL_FROM_NAME=NX Gest\n')
 const docker=`#!/usr/bin/env node
const fs=require('fs'), cp=require('child_process'), a=process.argv.slice(2), fail=process.env.MOCK_FAIL||''
if(process.env.NXG_DOCKER_DOUBLE!=='yes'||!process.env.MOCK_DIR) process.exit(98)
fs.appendFileSync(process.env.MOCK_DIR+'/docker-events',a[0]+' '+(a[1]||'')+'\\n')
if(a[0]==='inspect') { if(fail==='inspect')process.exit(31); if(a.includes('{{.Image}}'))console.log('sha256:'+'a'.repeat(64));else if(fail==='mounts')console.log('');else if(a.some(x=>x.includes('{{.Source}}')))console.log('/fixture/synthetic-secret-marker');else if(a.some(x=>x.includes('{{.Type}}')))console.log('volume|test-volume|/data|true');else console.log('image|/work|user|network|restart');process.exit(0) }
if(a[0]==='image'&&a[1]==='inspect') {if(fail==='image'||(fail==='tagmissing'&&a.includes('--format')))process.exit(32);if(a.includes('--format'))console.log('sha256:'+(fail==='mismatch'?'b':'a').repeat(64));process.exit(0)}
if(a[0]==='image'&&a[1]==='tag') {if(fail==='tag')process.exit(33);fs.writeFileSync(process.env.MOCK_DIR+'/tagged','yes');process.exit(0)}
if(a[0]==='exec'&&a.includes('pg_dump')) {if(fail==='dump')process.exit(34);process.stdout.write('DUMP:fixture-record-42');process.exit(0)}
if(a[0]==='exec'&&a.includes('pg_restore')) {const input=fs.readFileSync(0,'utf8');if(fail==='verify'||input!=='DUMP:fixture-record-42')process.exit(35);if(a.includes('--mock-restore'))fs.writeFileSync(process.env.MOCK_DIR+'/restored-db',JSON.stringify([{caminho:'prova.txt',tamanho:Buffer.byteLength('fixture-attachment')}]));process.exit(0)}
if(a[0]==='exec'&&a.includes('sh')) {if(fail==='access')process.exit(36);process.exit(0)}
if(['network','run','compose'].includes(a[0]))process.exit(0)
if(a[0]==='exec'&&a.includes('tar')) {if(fail==='tar')process.exit(37);const r=cp.spawnSync('tar',['-C',process.env.MOCK_DIR+'/data','-czf','-','uploads'],{encoding:null});if(r.status!==0)process.exit(38);process.stdout.write(r.stdout);process.exit(0)}
process.stderr.write('Comando inesperado no dublê\\n');process.exit(99)
`
 put(path.join(bin,'curl'), `#!/bin/sh
[ "$1" = __guard_probe__ ] && exit 99
case "$MOCK_HEALTH" in fail) exit 22;; timeout) exit 28;; missing) printf '{}';; *) printf '{"status":"ok","db":"connected"}';; esac
`,0o700)
 put(path.join(bin,'mv'), `#!/bin/sh
if [ "$MOCK_FAIL" = publish ]; then exit 41; fi
if [ "$MOCK_FAIL" = interrupt ] && printf '%s' "$*" | grep -q '\.complete-tmp'; then exit 42; fi
exec /usr/bin/mv "$@"
`,0o700)
 put(path.join(bin,'docker.cjs'),docker,0o700)
 put(path.join(bin,'docker'),`#!/bin/sh\nexec '${process.execPath}' '${path.join(bin,'docker.cjs')}' "$@"\n`,0o700)
 const source=readFileSync('scripts/backup-nxgest.sh','utf8').replaceAll('/opt/nxgestao/.env',path.join(repo,'.env')).replaceAll('/opt/nxgestao',repo).replaceAll('/opt/backups',backups).replace(/\bdocker(?=\s)/g, `'${path.join(bin,'docker')}'`)
 assert.doesNotMatch(source,/\/opt\/(?:nxgestao|backups)/);put(path.join(dir,'backup.sh'),source,0o700)
 return {dir,repo,backups,bin,data,tags,env:{PATH:`${bin}:${process.env.PATH}`,DOCKER_HOST:'unix:///nxg0009-inexistente',DOCKER_CONTEXT:'nxg0009-inexistente',NXG_DOCKER_DOUBLE:'yes',MOCK_DIR:dir}}
}
function assertIntercept(f) {
 const location=ok('sh',['-c','command -v docker'],{env:f.env});assert.equal(location,path.join(f.bin,'docker'))
 const r=run('docker',['__guard_probe__'],{env:f.env});assert.equal(r.status,99);assert.match(r.stderr,/dublê/)
 assert.equal(ok('sh',['-c','command -v curl'],{env:f.env}),path.join(f.bin,'curl')); assert.equal(run('curl',['__guard_probe__'],{env:f.env}).status,99)
}
function backup(f,extra={}) {assertIntercept(f);return run('bash',[path.join(f.dir,'backup.sh')],{env:{...f.env,...extra}})}
function complete(f) {return readdirSync(f.backups).filter(x=>!x.startsWith('.')&&existsSync(path.join(f.backups,x,'COMPLETE'))).map(x=>path.join(f.backups,x))}
function cleanup(f) {rmSync(f.dir,{recursive:true,force:true})}

test('conjunto e anexos sintéticos íntegros são verificados sem expor env',()=>{
 const f=fixture();try {put(path.join(f.data,'uploads/prova.txt'),'fixture-attachment');const r=backup(f);assert.equal(r.status,0,r.stderr);assert.doesNotMatch(r.stdout+r.stderr,/synthetic-secret-marker/);const [bundle]=complete(f);assert.ok(bundle);const verify=run('bash',['scripts/verify-backup.sh',bundle],{env:f.env});assert.equal(verify.status,0,verify.stderr);assert.equal(existsSync(path.join(f.dir,'tagged')),true);for(const n of ['metadata.txt','mounts.txt','mount-sources.sha256','runtime-config.txt','SHA256SUMS'])assert.doesNotMatch(readFileSync(path.join(bundle,n),'utf8'),/synthetic-secret-marker/)
 const restore=path.join(f.dir,'restore');mkdirSync(restore);ok('tar',['-xzf',path.join(bundle,'uploads.tar.gz'),'-C',restore]);assert.equal(readFileSync(path.join(restore,'uploads/prova.txt'),'utf8'),'fixture-attachment');assertIntercept(f);ok(path.join(f.bin,'docker'),['exec','-i','fixture-db','pg_restore','--mock-restore'],{env:f.env,input:readFileSync(path.join(bundle,'database.dump'),'utf8')});assert.deepEqual(reconcileFixture(JSON.parse(readFileSync(path.join(f.dir,'restored-db'),'utf8')),path.join(restore,'uploads')),{references:1,orphans:[]})
 }finally{cleanup(f)}
})

test('diretório de anexos vazio é aceito; erro de acesso é recusado',()=>{
 const f=fixture();try {let r=backup(f);assert.equal(r.status,0,r.stderr);const [bundle]=complete(f);const listing=ok('tar',['-tzf',path.join(bundle,'uploads.tar.gz')]);assert.equal(listing,'uploads/');r=backup(f,{MOCK_FAIL:'access'});assert.notEqual(r.status,0);assert.equal(complete(f).length,1)}finally{cleanup(f)}
})

test('falhas não publicam conjunto completo nem alteram o anterior',()=>{
 const f=fixture();try {assert.equal(backup(f).status,0);const [prior]=complete(f);const before=readFileSync(path.join(prior,'SHA256SUMS'),'utf8');for(const name of ['inspect','image','mounts','dump','verify','access','tar','tag','tagmissing','mismatch','publish','interrupt']){const r=backup(f,{MOCK_FAIL:name});assert.notEqual(r.status,0,name);assert.equal(complete(f).length,1);assert.equal(readFileSync(path.join(prior,'SHA256SUMS'),'utf8'),before);assert.doesNotMatch(r.stdout+r.stderr,/synthetic-secret-marker/)} }finally{cleanup(f)}
})

test('corrupção ou mistura de conjuntos é recusada',()=>{
 const f=fixture();try {assert.equal(backup(f).status,0);let [one]=complete(f);assert.equal(backup(f).status,0);const two=complete(f).find(x=>x!==one);copyFileSync(path.join(two,'metadata.txt'),path.join(one,'metadata.txt'));let r=run('bash',['scripts/verify-backup.sh',one],{env:f.env});assert.notEqual(r.status,0);writeFileSync(path.join(two,'database.dump'),'corrompido');r=run('bash',['scripts/verify-backup.sh',two],{env:f.env});assert.notEqual(r.status,0)}finally{cleanup(f)}
})

test('concorrência de backup recusa antes de ação Docker',async()=>{
 const f=fixture();try {const lock=path.join(f.repo,'.git/nxgest-deploy.lock');const holder=spawn('flock',['-x',lock,'sh','-c','printf READY; read line'],{stdio:['pipe','pipe','pipe']});await new Promise((resolve,reject)=>{holder.stdout.once('data',resolve);holder.once('error',reject)});try{const r=backup(f);assert.notEqual(r.status,0);assert.equal(complete(f).length,0);assert.equal(existsSync(path.join(f.dir,'tagged')),false)}finally{holder.stdin.end('\n');await new Promise(resolve=>holder.once('exit',resolve))}}finally{cleanup(f)}
})

function digest(file){return createHash('sha256').update(readFileSync(file)).digest('hex')}
function readiness(f,bundle) {
 const config=path.join(f.dir,'config-proof'),schema=path.join(f.dir,'schema-proof'),evidence=path.join(f.dir,'operator-evidence')
 put(config,'fixture config review');put(schema,`schema_status=compatible\nprevious_sha=${'a'.repeat(40)}\nreviewer=fixture-operator\n`)
 const lines={previous_sha:'a'.repeat(40),target_sha:'b'.repeat(40),image:'sha256:'+'a'.repeat(64),mounts_sha256:digest(path.join(bundle,'mounts.txt')),sources_sha256:readFileSync(path.join(bundle,'mount-sources.sha256'),'utf8').trim(),runtime_sha256:digest(path.join(bundle,'runtime-config.txt')),config_sha256:digest(config),schema_sha256:digest(schema),schema_status:'compatible',strategy:'application',loss_decision:'acknowledged',authorization:'approved',reviewer:'fixture-operator'}
 const write=()=>put(evidence,Object.entries(lines).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');write()
 return {config,schema,evidence,lines,write}
}

test('preflight bloqueia imagem, schema, configuração e decisão ausentes ou divergentes',()=>{
 const f=fixture();try {
  assert.equal(backup(f).status,0);const [bundle]=complete(f);const e=readiness(f,bundle)
  const check=(extra={})=>{assertIntercept(f);return run('bash',['scripts/rollback-preflight.sh',bundle,e.evidence,e.config,e.schema],{env:{...f.env,...extra}})}
  let r=check();assert.notEqual(r.status,0);assert.match(r.stderr,/NO-GO/);assert.doesNotMatch(r.stdout+r.stderr,/synthetic-secret-marker/)
  for(const [key,value] of [['schema_status','unknown'],['strategy','unknown'],['authorization','no'],['image','sha256:'+'b'.repeat(64)],['mounts_sha256','f'.repeat(64)],['runtime_sha256','e'.repeat(64)]]) {const old=e.lines[key];e.lines[key]=value;e.write();r=check();assert.notEqual(r.status,0,key);e.lines[key]=old;e.write()}
  const originalSchema=readFileSync(e.schema,'utf8');put(e.schema,originalSchema.replace('schema_status=compatible','schema_status=incompatible'));e.lines.schema_sha256=digest(e.schema);e.write();r=check();assert.notEqual(r.status,0);assert.match(r.stderr,/contradição de schema/);put(e.schema,originalSchema);e.lines.schema_sha256=digest(e.schema);e.write()
  r=check({MOCK_FAIL:'image'});assert.notEqual(r.status,0)
  r=check({MOCK_FAIL:'tagmissing'});assert.notEqual(r.status,0)
  r=check({MOCK_FAIL:'mismatch'});assert.notEqual(r.status,0)
  r=check({NXGEST_DEPLOY_SHA:'c'.repeat(40)});assert.notEqual(r.status,0)
  e.lines.strategy='data';e.write();r=check();assert.notEqual(r.status,0);assert.match(r.stderr,/NO-GO/)
 }finally{cleanup(f)}
})

test('retorno exige integridade documentada e health não ambíguo',()=>{
 const f=fixture();try {
  assert.equal(backup(f).status,0);const [bundle]=complete(f),sha='c'.repeat(40),integrity=path.join(f.dir,'integrity')
  put(integrity,`sha=${sha} integrity=verified\n`)
  const check=(extra={})=>{assertIntercept(f);return run('bash',['scripts/verify-rollback-return.sh',bundle,sha,'http://fixture.invalid/api/health',integrity],{env:{...f.env,...extra}})}
  let r=check();assert.notEqual(r.status,0);assert.match(r.stderr,/NO-GO/)
  for(const mock of ['fail','timeout','missing']) {r=check({MOCK_HEALTH:mock});assert.notEqual(r.status,0,mock)}
  put(integrity,`sha=${sha} integrity=unknown\n`);r=check();assert.notEqual(r.status,0)
 }finally{cleanup(f)}
})


test('colisão do mesmo identificador não sobrescreve conjunto anterior',()=>{
 const f=fixture();try {
  const script=path.join(f.dir,'backup.sh'),source=readFileSync(script,'utf8').replace('id="$(date -u +%Y%m%dT%H%M%SZ)-$$-$RANDOM"','id="20261110T000000Z-123-1"');put(script,source,0o700)
  let r=backup(f);assert.equal(r.status,0,r.stderr);const [prior]=complete(f),before=readFileSync(path.join(prior,'SHA256SUMS'),'utf8')
  r=backup(f);assert.notEqual(r.status,0);assert.equal(complete(f).length,1);assert.equal(readFileSync(path.join(prior,'SHA256SUMS'),'utf8'),before)
 }finally{cleanup(f)}
})


test('deploy integra backup instalado e bloqueia promoção sem evidências válidas',()=>{
 const f=fixture();try {
  assertIntercept(f)
  const script=readFileSync('scripts/deploy.sh','utf8').replaceAll('/opt/scripts/backup-nxgest.sh',path.join(f.dir,'backup.sh')).replaceAll('/opt/backups',f.backups).replace(/\bdocker(?=\s)/g, `'${path.join(f.bin,'docker')}'`)
  put(path.join(f.repo,'scripts/deploy.sh'),script,0o700);copyFileSync(path.join(f.dir,'backup.sh'),path.join(f.repo,'scripts/backup-nxgest.sh'))
  for(const name of ['rollback-preflight.sh','verify-backup.sh'])copyFileSync(path.join(root,'scripts',name),path.join(f.repo,'scripts',name))
  put(path.join(f.bin,'git'),`#!/bin/sh\nif [ "$1" = rev-parse ] && [ "$2" = HEAD ]; then printf '%s\\n' '${'b'.repeat(40)}'; exit 0; fi\nif [ "$1" = rev-parse ] && [ "$2" = --git-path ]; then printf '.git/%s\\n' "$3"; exit 0; fi\nexit 1\n`,0o700)
  const deploy=()=>{assertIntercept(f);return run('bash',['scripts/deploy.sh'],{cwd:f.repo,env:{...f.env,NXGEST_DEPLOY_MODE:'production',NXGEST_DEPLOY_SHA:'b'.repeat(40)}})}
  let r=deploy();assert.notEqual(r.status,0);assert.doesNotMatch(readFileSync(path.join(f.dir,'docker-events'),'utf8'),/compose|network|run/)
  const bundles=complete(f);assert.equal(bundles.length,1);const e=readiness(f,bundles[0])
  copyFileSync(e.evidence,path.join(f.repo,'.git/nxgest-rollback-evidence'));copyFileSync(e.config,path.join(f.repo,'.git/nxgest-config-evidence'));copyFileSync(e.schema,path.join(f.repo,'.git/nxgest-schema-evidence'))
  r=deploy();assert.notEqual(r.status,0);const events=readFileSync(path.join(f.dir,'docker-events'),'utf8');assert.doesNotMatch(events,/compose|image prune/)
  assert.doesNotMatch(r.stdout+r.stderr,/synthetic-secret-marker/)
 }finally{cleanup(f)}
})

test('backup herda lock de deploy e recusa descritor de lock divergente',()=>{
 const f=fixture();try {
  assertIntercept(f)
  const lock=path.join(f.repo,'.git/nxgest-deploy.lock'),other=path.join(f.dir,'wrong-lock'),script=path.join(f.dir,'backup.sh')
  let r=run('bash',['-c','exec 9>"$OTHER_LOCK"; flock -n 9; bash "$BACKUP_SCRIPT"'],{env:{...f.env,OTHER_LOCK:other,BACKUP_SCRIPT:script}})
  assert.notEqual(r.status,0);assert.equal(complete(f).length,0);assert.equal(existsSync(path.join(f.dir,'tagged')),false)
  assertIntercept(f)
  r=run('bash',['-c','exec 9>"$DEPLOY_LOCK"; flock -n 9; bash "$BACKUP_SCRIPT"'],{env:{...f.env,DEPLOY_LOCK:lock,BACKUP_SCRIPT:script}})
  assert.equal(r.status,0,r.stderr);assert.equal(complete(f).length,1)
 }finally{cleanup(f)}
})


test('reconciliação sintética confronta referências, tamanho, caminhos e relata órfãos',()=>{
 const f=fixture();try {const root=path.join(f.data,'uploads');put(path.join(root,'cliente/a'),'abc');put(path.join(root,'orphan'),'x')
  assert.deepEqual(reconcileFixture([{caminho:'cliente/a',tamanho:3}],root),{references:1,orphans:['orphan']})
  assert.throws(()=>reconcileFixture([{caminho:'cliente/ausente',tamanho:3}],root))
  assert.throws(()=>reconcileFixture([{caminho:'cliente/a',tamanho:4}],root))
  assert.throws(()=>reconcileFixture([{caminho:'../a',tamanho:3}],root))
  assert.throws(()=>reconcileFixture([{caminho:'/absolute',tamanho:3}],root))
  symlinkSync('cliente/a',path.join(root,'link'));assert.throws(()=>reconcileFixture([{caminho:'link',tamanho:3}],root));rmSync(path.join(root,'link'))
  assert.throws(()=>reconcileFixture(null,root))
  assert.equal(reconcileFixture([],root).references,0)
 }finally{cleanup(f)}
})

test('falhas sintéticas de escrita impedem marca completa e preservam conjunto anterior',()=>{
 const f=fixture();try {
  assert.equal(backup(f).status,0);const [prior]=complete(f),before=readFileSync(path.join(prior,'SHA256SUMS'),'utf8')
  const file=path.join(f.dir,'backup.sh'),original=readFileSync(file,'utf8')
  for (const target of ['database.dump','uploads.tar.gz','metadata.txt','SHA256SUMS','.complete-tmp']) {
   const expression=`> "$partial/${target}"`
   const replace=target==='.complete-tmp' ? '> "$final/.complete-tmp"' : target==='SHA256SUMS' ? '> SHA256SUMS' : expression
   assert.ok(original.includes(replace),target)
   put(file,original.replace(replace,'> /dev/full'),0o700)
   const result=backup(f);assert.notEqual(result.status,0,target);assert.equal(complete(f).length,1,target);assert.equal(readFileSync(path.join(prior,'SHA256SUMS'),'utf8'),before)
  }
 }finally{cleanup(f)}
})
