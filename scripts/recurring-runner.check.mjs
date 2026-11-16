import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync,existsSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {runRecurring} from './recurring-runner.mjs'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
assert.equal(root,'/work','focal fixture requires the guarded isolated namespace')
assert.equal(readFileSync('/work/recurring-diagnostic-guard-confirmed','utf8'),'guarded')
const secret='SYNTHETIC_SECRET_MUST_NEVER_BE_LOGGED'
const digest=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
const sha='a'.repeat(40),controller='b'.repeat(40),image=Buffer.from('fixture image'),zip=Buffer.from('fixture zip')
const policy={version:'nxg-build-recurring-v1',repo:'RafaCartaxo/nxgest',workflowId:'56',signerRule:'ci-push-source',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)}
const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:'11',attempt:1,sourceSha:sha,platform:'linux/amd64',imageSize:image.length,imageSha256:digest(image)}))
const allowed=/^RECURRING_DIAG_V1 phase=(CONTROL|SOURCE|PRE_TRANSPORT|TRANSPORT|RESPONSE|RECEIPT_WRITE|CLEANUP) event=(START|SUCCESS|FAILURE) reason=(NONE|UNKNOWN|ENOENT|EACCES|ETIMEDOUT|ENOSPC|EEXIST|ENOTEMPTY)( exit=(NONE|OTHER|0|1|2|126|127|255) signal=(NONE|OTHER|SIGTERM|SIGKILL|SIGINT|SIGABRT) timeout=(YES|NO))?$/
const err=code=>Object.assign(new Error(secret),{code})
function fixture(mode){
 const dir=mkdtempSync('/tmp/recurring-diagnostic-'),key=path.join(dir,'key'),known=path.join(dir,'known_hosts'),output=path.join(dir,'receipt.json')
 writeFileSync(key,secret,{mode:0o600});writeFileSync(known,'fixture',{mode:0o600})
 if(mode==='receipt')writeFileSync(output,'preserve existing receipt',{mode:0o600})
 let ssh=0,attested=0
 const options={kind:'staging',runId:'21',runAttempt:1,controllerSha:controller,eventRunId:'11',eventSha:sha,key:mode==='key'?path.join(dir,'absent'):key,knownHosts:known,host:'fixture.invalid',user:'fixture',receiptPath:output,build:{policyPath:'/fixture.json',policyHash:digest(Buffer.from('policy')),decision:'fixture',token:secret}}
 const buildDeps={readPolicy:()=>{if(mode==='source')throw err('EACCES');if(mode==='source-unknown')throw err(secret);return policy},resolve:async()=>({runId:'11',attempt:1,artifactId:'34',sha,workflowId:'56'}),inspect:async()=>({digestZip:digest(zip)}),download:async()=>zip,extract:()=>({image,receipt}),attest:(file)=>{attested++;if(mode==='cleanup')writeFileSync(path.join(path.dirname(file),'extra'),secret,{mode:0o600});return {attestationValid:true}}}
 const spawn=(command,args)=>{
  if(command==='/usr/bin/git')return {status:0,stdout:args[0]==='rev-parse'?controller+'\n':'',stderr:secret}
  assert.equal(command,'/bin/bash');assert.equal(attested,2,'both subjects must be verified before transport');ssh++
  if(mode==='spawn')throw err('ENOENT')
  if(mode==='timeout')return {status:null,signal:'SIGTERM',error:err('ETIMEDOUT'),stdout:secret,stderr:secret}
  if(mode==='exit')return {status:23,signal:secret,stdout:secret,stderr:secret}
  if(mode==='signal')return {status:null,signal:'SIGKILL',stdout:secret,stderr:secret}
  return {status:0,signal:null,stdout:mode==='response'?secret:`STAGING_RECEIPT sha=${sha} run=11 attempt=1 artifact=34 zip=${digest(zip)} tar=${digest(image)} image=sha256:${'d'.repeat(64)}\n`,stderr:secret}
 }
 return {options,deps:{spawn,buildDeps},dir,output,calls:()=>ssh}
}
async function observe(mode,expected){
 const f=fixture(mode),logs=[],original=console.error
 console.error=(...args)=>logs.push(args.join(' '))
 try{
  if(expected)await assert.rejects(runRecurring(f.options,f.deps))
  else {const out=await runRecurring(f.options,f.deps);assert.equal(out.fixture,true);assert.equal(JSON.parse(readFileSync(f.output)).sha,sha)}
 }finally{console.error=original}
 try{
  assert.ok(logs.length>0)
  for(const line of logs){assert.match(line,allowed);assert.equal(line.includes(secret),false);assert.equal(line.includes(sha),false);assert.equal(line.includes(f.dir),false)}
  const failures=logs.filter(x=>x.includes('event=FAILURE'))
  if(expected){assert.equal(failures.length,1);assert.equal(failures[0],expected)}else assert.deepEqual(failures,[])
  if(['source','source-unknown','key'].includes(mode)){assert.equal(f.calls(),0);assert.equal(existsSync(f.output),false);assert.equal(logs.some(x=>x.startsWith('RECURRING_DIAG_V1 phase=TRANSPORT ')),false)}
  if(mode==='source'||mode==='source-unknown')assert.equal(logs.some(x=>x==='RECURRING_DIAG_V1 phase=SOURCE event=SUCCESS reason=NONE'),false)
  if(!['source','source-unknown','key'].includes(mode)){
   const start=logs.indexOf('RECURRING_DIAG_V1 phase=TRANSPORT event=START reason=NONE')
   assert.ok(start>logs.indexOf('RECURRING_DIAG_V1 phase=SOURCE event=SUCCESS reason=NONE'))
   assert.ok(start>logs.indexOf('RECURRING_DIAG_V1 phase=PRE_TRANSPORT event=SUCCESS reason=NONE'))
  }
  if(mode==='receipt')assert.equal(readFileSync(f.output,'utf8'),'preserve existing receipt')
  if(mode==='cleanup')assert.equal(existsSync(f.output),true,'existing ordering retains receipt if later cleanup fails')
  if(mode!=='cleanup')assert.equal(readdirSync(root).some(x=>x.startsWith('.nxg-build-verified-')),false)
 }finally{
  rmSync(f.dir,{recursive:true,force:true})
  for(const name of readdirSync(root).filter(x=>x.startsWith('.nxg-build-verified-')))rmSync(path.join(root,name),{recursive:true})
 }
}
for(const [mode,phase,code,extra] of [
 ['source','SOURCE','EACCES',''],['source-unknown','SOURCE','UNKNOWN',''],['key','PRE_TRANSPORT','ENOENT',''],
 ['spawn','TRANSPORT','ENOENT',' exit=NONE signal=NONE timeout=NO'],['exit','TRANSPORT','UNKNOWN',' exit=OTHER signal=OTHER timeout=NO'],
 ['timeout','TRANSPORT','ETIMEDOUT',' exit=NONE signal=SIGTERM timeout=YES'],['signal','TRANSPORT','UNKNOWN',' exit=NONE signal=SIGKILL timeout=NO'],
 ['response','RESPONSE','UNKNOWN',''],['receipt','RECEIPT_WRITE','EEXIST',''],['cleanup','CLEANUP','ENOTEMPTY','']
])test(`static diagnostic: ${mode}; secret/output redacted`,()=>observe(mode,`RECURRING_DIAG_V1 phase=${phase} event=FAILURE reason=${code}${extra}`))
test('success checkpoints follow verification then transport and preserve receipt semantics',()=>observe('success'))
test('global CLI catch retains exit1, emits static control failure, no env/error content',()=>{
 const x=spawnSync(process.execPath,[path.join(root,'scripts/recurring-runner.mjs'),'invalid'],{encoding:'utf8',env:{PATH:'/guard:/runtime:/usr/bin',HOME:'/nonexistent',GH_TOKEN:secret}})
 assert.equal(x.status,1);assert.equal(x.stdout,'')
 assert.equal(x.stderr,['RECURRING_DIAG_V1 phase=CONTROL event=START reason=NONE','RECURRING_DIAG_V1 phase=CONTROL event=FAILURE reason=UNKNOWN','CD recorrente recusado; verificar estado e evidências saneadas',''].join('\n'))
 assert.equal(x.stderr.includes(secret),false)
})
