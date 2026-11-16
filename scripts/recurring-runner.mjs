#!/usr/bin/env node
// Pinned runner controller: verifies source itself, then uses the environment's
// exclusive forced-command credential. CLI has no JSON-selection bypass.
import {spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,lstatSync,unlinkSync,rmdirSync,realpathSync} from 'node:fs'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {verifyBuildArtifact} from './verify-build-artifact.mjs'
import {verifyProductionSource} from './production-post-baseline-source.mjs'
const root=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'))
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
// Only static labels and bounded categories cross the diagnostic boundary.
function diagnostic(phase,event,error,response){
 const code=['ENOENT','EACCES','ETIMEDOUT','ENOSPC','EEXIST','ENOTEMPTY'].includes(error?.code)?error.code:'UNKNOWN'
 let line=`RECURRING_DIAG_V2 phase=${phase} event=${event} reason=${event==='FAILURE'?code:'NONE'}`
 if(phase==='TRANSPORT'&&event!=='START'){
  const exit=response?.status===null||response?.status===undefined?'NONE':[0,1,2,126,127,255].includes(response.status)?String(response.status):'OTHER'
  const signal=response?.signal===null||response?.signal===undefined?'NONE':['SIGTERM','SIGKILL','SIGINT','SIGABRT'].includes(response.signal)?response.signal:'OTHER'
  line+=` exit=${exit} signal=${signal} timeout=${response?.error?.code==='ETIMEDOUT'?'YES':'NO'}`
 }
 console.error(line)
}
function privateFile(file){const s=lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.uid!==process.geteuid()||(s.mode&0o077))throw Error('custódia recusada');return s}
function cleanup(result){
 const dir=path.dirname(result.imagePath)
 if(path.dirname(dir)!==root||!/^\.nxg-build-verified-[A-Za-z0-9]+$/.test(path.basename(dir))||path.dirname(result.receiptPath)!==dir||path.basename(result.imagePath)!=='image.tar'||path.basename(result.receiptPath)!=='receipt.json')throw Error('custódia recusada')
 const d=lstatSync(dir);if(!d.isDirectory()||d.isSymbolicLink()||d.uid!==process.geteuid()||(d.mode&0o077))throw Error('custódia recusada')
 privateFile(result.imagePath);privateFile(result.receiptPath)
 unlinkSync(result.imagePath);unlinkSync(result.receiptPath);rmdirSync(dir)
}
export async function runRecurring(options,deps={}){
 let phase='CONTROL',reported=false,response
 diagnostic(phase,'START')
 try{
 const fixture=Object.keys(deps).length>0,kind=options?.kind
 if(!['staging','production','finalize'].includes(kind)||!/^\d{1,20}$/.test(options.runId||'')||options.runAttempt!==1||!/^[a-f0-9]{40}$/.test(options.controllerSha||''))throw Error('controle recusado')
 const spawn=deps.spawn||spawnSync
 const sourceDiagnostic=(phase,event,error)=>{
  if(!['SOURCE_POLICY','SOURCE_SELECTION','SOURCE_METADATA','SOURCE_ZIP','SOURCE_RECEIPT','SOURCE_FILES','SOURCE_GH_EXECUTABLE','SOURCE_ATTESTATION','SOURCE_REHASH','SOURCE_VERIFY_CLEANUP'].includes(phase)||!['START','SUCCESS','FAILURE'].includes(event))throw Error('diagnóstico recusado')
  diagnostic(phase,event,error)
 }
 const git=spawn('/usr/bin/git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:4096,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent'}})
 if(git.status!==0||git.stdout.trim()!==options.controllerSha)throw Error('controlador divergente')
 const controlled=['scripts/recurring-runner.mjs','scripts/staging-transport.sh','scripts/verify-build-artifact.mjs','scripts/verify-staging-receipt.mjs','scripts/production-post-baseline-source.mjs','scripts/build-provider.mjs','scripts/build-attestation.mjs','scripts/build-zip.mjs','infra/staging-known-hosts']
 const tracked=spawn('/usr/bin/git',['ls-files','--error-unmatch','--',...controlled],{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:8192,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent'}})
 const unchanged=spawn('/usr/bin/git',['diff','--quiet',options.controllerSha,'--',...controlled],{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:8192,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent'}})
 if(tracked.status!==0||unchanged.status!==0)throw Error('bytes do controlador divergentes')
 diagnostic('CONTROL','SUCCESS')
 let verified
 try{
  phase='SOURCE';diagnostic(phase,'START')
  if(kind==='staging'){
   verified=await verifyBuildArtifact({...options.build,diagnostic:sourceDiagnostic,requireRecurring:true,eventRunId:options.eventRunId,eventSha:options.eventSha},deps.buildDeps||{})
  }else{
   verified=await verifyProductionSource({stage:{...options.stage,runId:options.stageRun,requireRecurring:true},build:{...options.build,diagnostic:sourceDiagnostic,requireRecurring:true}},{...(deps.stageDeps?{stageDeps:deps.stageDeps}:{}),...(deps.buildDeps?{buildDeps:deps.buildDeps}:{})})
  }
  if(!verified.verified||verified.fixture!==fixture)throw Error('origem recusada')
  diagnostic(phase,'SUCCESS')
  phase='PRE_TRANSPORT';diagnostic(phase,'START')
  const s=kind==='staging'?{sha:verified.sourceSha,ciRun:verified.runId,artifact:verified.artifactId,zip:verified.zipSha256,tar:verified.imageSha256}:verified
  // These files are read only after origin verification; values never enter logs.
  privateFile(options.key);const keyIdentity=lstatSync(options.key)
  if(!path.isAbsolute(options.key)||!path.isAbsolute(options.knownHosts)||!options.host||!options.user)throw Error('transporte recusado')
  let receipt='none'
  if(kind==='finalize'){
   privateFile(options.receiptPath);const data=readFileSync(options.receiptPath);if(data.length>8192)throw Error('recibo recusado')
   const r=JSON.parse(data)
   if(r.version!=='nxg-production-preclients-v1'||r.mode!=='preclients'||r.status!=='applied_pending_finalization'||r.sha!==s.sha||r.ciRun!==s.ciRun||r.ciAttempt!==1||r.artifact!==s.artifact||r.zip!==s.zip||r.tar!==s.tar||r.image!==s.image||r.stagingRun!==s.stagingRun||r.stagingAttempt!==1||r.productionRun!==options.runId||r.productionAttempt!==1||r.health!=='ok'||r.db!=='connected'||!/^[a-f0-9]{64}$/.test(r.container||''))throw Error('recibo divergente')
   receipt=hash(data)
  }
  const mode=kind==='staging'?'staging-recurring-v2':kind==='production'?'production-recurring':'production-recurring-finalize'
  const args=[path.join(root,'scripts/staging-transport.sh'),verified.imagePath,s.sha,s.tar,s.zip,s.ciRun,'1',s.artifact,options.host,options.user,options.key,options.knownHosts,mode]
  if(kind!=='staging')args.push(s.stagingRun,s.image,'','','',options.runId,'1',receipt)
  else args.push('','','','','','','','')
  args.push(options.controllerSha)
  args.push(options.build.policyHash,kind==='staging'?'none':options.stage.policyHash)
  const before=lstatSync(options.key);if(before.ino!==keyIdentity.ino||before.dev!==keyIdentity.dev)throw Error('credencial alterada')
  diagnostic('PRE_TRANSPORT','SUCCESS')
  phase='TRANSPORT';diagnostic(phase,'START')
  response=spawn('/bin/bash',args,{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:65536,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent'}})
  if(response.error||response.status!==0)throw Error('execução remota falhou; revisar estado parcial')
  diagnostic(phase,'SUCCESS',undefined,response)
  phase='RESPONSE';diagnostic(phase,'START')
  const out=response.stdout.trim()
  let result
  if(kind==='staging'){
   const m=/^STAGING_RECEIPT sha=([a-f0-9]{40}) run=(\d+) attempt=1 artifact=(\d+) zip=(sha256:[a-f0-9]{64}) tar=(sha256:[a-f0-9]{64}) image=(sha256:[a-f0-9]{64})$/.exec(out)
   if(!m||m[1]!==s.sha||m[2]!==s.ciRun||m[3]!==s.artifact||m[4]!==s.zip||m[5]!==s.tar)throw Error('resposta staging divergente')
   result={version:'nxg-staging-v1',sha:s.sha,ciRun:s.ciRun,ciAttempt:1,artifact:s.artifact,zip:s.zip,tar:s.tar,image:m[6],stagingRun:options.runId,stagingAttempt:1,health:'ok',db:'connected'}
  }else if(kind==='production'){
   const m=/^PRECLIENTS_APPLIED sha=([a-f0-9]{40}) tar=(sha256:[a-f0-9]{64}) image=(sha256:[a-f0-9]{64}) container=([a-f0-9]{64})$/.exec(out)
   if(!m||m[1]!==s.sha||m[2]!==s.tar||m[3]!==s.image)throw Error('resposta produção divergente')
   result={version:'nxg-production-preclients-v1',mode:'preclients',status:'applied_pending_finalization',sha:s.sha,ciRun:s.ciRun,ciAttempt:1,artifact:s.artifact,zip:s.zip,tar:s.tar,image:s.image,stagingRun:s.stagingRun,stagingAttempt:1,productionRun:options.runId,productionAttempt:1,container:m[4],migrations:'boot_completed',health:'ok',db:'connected'}
  }else{
   if(out!==`PRECLIENTS_FINALIZED sha=${s.sha} image=${s.image}`)throw Error('finalização divergente')
   diagnostic(phase,'SUCCESS')
   return {finalized:true,fixture,operationalReady:false,sha:s.sha,image:s.image}
  }
  diagnostic(phase,'SUCCESS')
  if(options.receiptPath){
   phase='RECEIPT_WRITE';diagnostic(phase,'START')
   writeFileSync(options.receiptPath,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600})
   diagnostic(phase,'SUCCESS')
  }
  return {fixture,operationalReady:false,...result}
 }catch(error){
  diagnostic(phase,'FAILURE',phase==='TRANSPORT'?response?.error||error:error,phase==='TRANSPORT'?response:undefined)
  reported=true;throw error
 }finally{
  if(verified?.imagePath&&verified?.receiptPath){
   phase='CLEANUP';diagnostic(phase,'START')
   try{cleanup(verified)}catch(error){diagnostic(phase,'FAILURE',error);reported=true;throw error}
   diagnostic(phase,'SUCCESS')
  }
 }
 }catch(error){
  if(!reported)diagnostic(phase,'FAILURE',error)
  throw error
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const kind=process.argv[2]
 const env=process.env
 const options={kind,controllerSha:env.CONTROLLER_SHA,runId:env.GITHUB_RUN_ID,runAttempt:Number(env.GITHUB_RUN_ATTEMPT),eventRunId:env.CI_RUN,eventSha:env.CI_SHA,stageRun:env.STAGING_RUN,key:env.RECURRING_KEY_PATH,knownHosts:env.RECURRING_KNOWN_HOSTS,host:env.VPS_HOST,user:env.VPS_USER,receiptPath:path.join(root,kind==='staging'?'staging-receipt.json':'production-receipt.json'),build:{policyPath:env.BUILD_POLICY_PATH,policyHash:env.BUILD_POLICY_HASH,decision:env.BUILD_DECISION,token:env.GH_TOKEN},stage:{policyPath:env.STAGING_POLICY_PATH,policyHash:env.STAGING_POLICY_HASH,decision:env.STAGING_DECISION,token:env.GH_TOKEN}}
 runRecurring(options).then(r=>console.log(JSON.stringify({fixture:r.fixture,operationalReady:false,sha:r.sha,finalized:r.finalized||false}))).catch(()=>{console.error('CD recorrente recusado; verificar estado e evidências saneadas');process.exitCode=1})
}
