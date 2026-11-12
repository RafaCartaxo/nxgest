import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,chmodSync,existsSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {compareEvidence} from './rollback-evidence-fixture.mjs'
const run=(c,a,o={})=>spawnSync(c,a,{encoding:'utf8',...o})
function put(p,s){mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,s)}
function hash(p){return createHash('sha256').update(readFileSync(p)).digest('hex')}
test('vínculo de evidência sintética coerente e divergente nunca libera produção',()=>{
 const e={reviewer:'qa-fixture',schemaStatus:'compatible',previousSha:'a'.repeat(40),image:'sha256:'+ 'a'.repeat(64),mounts:'m',config:'c',bundle:'b'}
 assert.deepEqual(compareEvidence(e,e),{syntheticOnly:true,readyForProduction:false})
 for(const key of ['schemaStatus','previousSha','image','mounts','config','bundle']) assert.throws(()=>compareEvidence(e,{...e,[key]:'different'}))
 assert.throws(()=>compareEvidence({...e,reviewer:''},e))
})
test('cópia sintética completa exige transferência, integridade e preserva colisões',()=>{
 const dir=mkdtempSync(path.join(process.cwd(),'.nxg034-')), id='20261111T000000Z-123-5', remote=path.join(dir,'remote'),src=path.join(remote,id),dest=path.join(dir,'dest com espaço'),bin=path.join(dir,'bin'), key=path.join(dir,'chave sintética')
 try {
  mkdirSync(src,{recursive:true});mkdirSync(dest);mkdirSync(bin);put(key,'fixture')
  put(path.join(src,'database.dump'),'dump-ficticio');put(path.join(src,'mounts.txt'),'volume|v|/data|true\n');put(path.join(src,'mount-sources.sha256'),'a'.repeat(64)+'\n');put(path.join(src,'runtime-config.txt'),'i|w|u|n|r\n');put(path.join(src,'metadata.txt'),`id=${id}\nimage=fixture\ntag=fixture\ntarget_sha=unknown\n`);put(path.join(src,'COMPLETE'),id+'\n')
  const uploads=path.join(dir,'uploads');mkdirSync(uploads);put(path.join(uploads,'ficheiro'),'fixture')
  assert.equal(run('tar',['-czf',path.join(src,'uploads.tar.gz'),'-C',dir,'uploads']).status,0)
  const files=['database.dump','uploads.tar.gz','mounts.txt','mount-sources.sha256','runtime-config.txt','metadata.txt'];put(path.join(src,'SHA256SUMS'),files.map(f=>`${hash(path.join(src,f))}  ${f}\n`).join(''))
  put(path.join(bin,'ssh'),'#!/bin/sh\n[ "$1" = __probe__ ] && exit 97\nexit 0\n');put(path.join(bin,'scp'),'#!/bin/sh\n[ "$1" = __probe__ ] && exit 97\n[ "$MOCK_FAIL" = yes ] && exit 9\n[ "$MOCK_FAIL" = write ] && { printf x > /dev/full; exit 9; }\nfor last do :; done\ncp -R "$MOCK_SOURCE" "$last"\n[ "$MOCK_FAIL" = partial ] && exit 9\nexit 0\n');chmodSync(path.join(bin,'ssh'),0o700);chmodSync(path.join(bin,'scp'),0o700)
  const env={...process.env,PATH:`${bin}:${process.env.PATH}`,MOCK_SOURCE:src};for(const cmd of ['ssh','scp']){assert.equal(run(path.join(bin,cmd),['__probe__'],{env}).status,97);assert.equal(run('sh',['-c',`command -v ${cmd}`],{env}).stdout.trim(),path.join(bin,cmd))}const exec=(extra={},target=id)=>run('bash',['scripts/pull-backup.sh',target,dest,'fixture@invalid',key],{env:{...env,...extra}})
  let r=exec({MOCK_FAIL:'yes'});assert.notEqual(r.status,0);assert.equal(existsSync(path.join(dest,id)),false)
  r=exec({MOCK_FAIL:'partial'});assert.notEqual(r.status,0);assert.equal(existsSync(path.join(dest,id)),false)
  r=exec({MOCK_FAIL:'write'});assert.notEqual(r.status,0);assert.equal(existsSync(path.join(dest,id)),false)
  r=exec({MOCK_SOURCE:path.join(dir,'origem-ausente')});assert.notEqual(r.status,0);assert.equal(existsSync(path.join(dest,id)),false)
  r=run('bash',['scripts/pull-backup.sh',id,path.join(dir,'destino-ausente'),'fixture@invalid',key],{env});assert.notEqual(r.status,0)
  r=exec({},'bad-id');assert.notEqual(r.status,0)
  r=exec();assert.equal(r.status,0,r.stderr);assert.equal(readFileSync(path.join(dest,id,'database.dump'),'utf8'),'dump-ficticio')
  r=exec();assert.notEqual(r.status,0);assert.equal(readFileSync(path.join(dest,id,'database.dump'),'utf8'),'dump-ficticio')
  const emptyDest=path.join(dir,'outro destino');mkdirSync(emptyDest)
  const attempt=()=>run('bash',['scripts/pull-backup.sh',id,emptyDest,'fixture@invalid',key],{env})
  put(path.join(src,'database.dump'),'corrompido');r=attempt();assert.notEqual(r.status,0);assert.equal(existsSync(path.join(emptyDest,id)),false)
  rmSync(path.join(src,'database.dump'));r=attempt();assert.notEqual(r.status,0);assert.equal(existsSync(path.join(emptyDest,id)),false)
  assert.equal(readFileSync(path.join(dest,id,'database.dump'),'utf8'),'dump-ficticio')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
