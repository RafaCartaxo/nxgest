import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {verifyStagingReceipt} from './verify-staging-receipt.mjs'
import {inspectStagingRun,inspectBuildRun,resolveBuildSelection} from './build-provider.mjs'
import {verifyBuildAttestation} from './build-attestation.mjs'
import {verifyProductionSource} from './production-post-baseline-source.mjs'
import {rmSync} from 'node:fs'
import path from 'node:path'
const h=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
const fixed=Object.freeze({version:'nxg-staging-recurring-v1',repo:'RafaCartaxo/nxgest',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',workflowId:'88',signerSha:'b'.repeat(40),ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)})
const z=Buffer.from('staging fixture'),dig='sha256:'+'d'.repeat(64)
function fixture(run,source,over={}){
 const receipt=Buffer.from(JSON.stringify({version:'nxg-staging-v1',sha:source,ciRun:run,ciAttempt:1,artifact:'34',zip:dig,tar:dig,image:dig,stagingRun:run,stagingAttempt:1,health:'ok',db:'connected',...over}))
 const artifact={id:99,name:`nxgest-staging-${run}-1`,workflow_run:{id:Number(run),head_sha:source},expired:false,expires_at:'2099-01-01T00:00:00.000Z',digest:h(z),size_in_bytes:z.length}
 const stagingRun={id:Number(run),workflow_id:88,run_attempt:1,status:'completed',conclusion:'success',event:'workflow_run',head_branch:'main',head_sha:source}
 const fetcher=async url=>new Response(JSON.stringify(url.endsWith('/repositories/1304448439')?{id:1304448439,full_name:'RafaCartaxo/nxgest'}:url.includes('/artifacts?')?{total_count:1,artifacts:[artifact]}:url.includes('/runs/')?stagingRun:url.includes('/workflows/')?{id:88,path:'.github/workflows/staging.yml'}:artifact))
 return {readPolicy:()=>fixed,inspect:(s,t)=>inspectStagingRun(s,t,{fetcher}),download:async()=>z,extract:()=>({receipt}),attest:(_file,p)=>{assert.equal(p.sourceSha,source);assert.equal(p.signerSha,fixed.signerSha);assert.equal(p.runId,run);return {attestationValid:true}}}
}
test('staging recorrente usa mesma política e SHA derivado da API para duas execuções',async()=>{
 const snapshot=JSON.stringify(fixed)
 for(const [run,source] of [['11','a'.repeat(40)],['12','e'.repeat(40)]]){
  const out=await verifyStagingReceipt({runId:run,decision:'fixture',token:'fixture'},fixture(run,source))
  assert.equal(out.fixture,true);assert.equal(out.sha,source);assert.equal(JSON.stringify(fixed),snapshot)
 }
})
test('staging recorrente recusa receipt divergente, atestação inválida e política expirada',async()=>{
 const source='a'.repeat(40),options={runId:'11',decision:'fixture',token:'fixture'},deps=fixture('11',source)
 await assert.rejects(verifyStagingReceipt(options,fixture('11',source,{sha:'f'.repeat(40)})))
 await assert.rejects(verifyStagingReceipt(options,{...deps,attest:()=>({attestationValid:false})}))
 await assert.rejects(verifyStagingReceipt(options,{...deps,readPolicy:()=>({...fixed,expiresAt:'2000-01-01T00:00:00.000Z'})}))
})
test('regra de signer recorrente usa SHA autenticado do run e rejeita regra não autorizada',async()=>{
 const {signerSha,...base}=fixed
 const policy=Object.freeze({...base,version:'nxg-staging-recurring-v2',signerRule:'staging-run-source'})
 for(const [run,source] of [['11','a'.repeat(40)],['12','e'.repeat(40)]]){
  const deps=fixture(run,source)
  const out=await verifyStagingReceipt({runId:run,decision:'fixture',token:'fixture'},{...deps,readPolicy:()=>policy,attest:(_f,p)=>{assert.equal(p.signerSha,source);assert.equal(p.sourceSha,source);return {attestationValid:true}}})
  assert.equal(out.fixture,true);assert.equal(out.sha,source)
 }
 const deps=fixture('11','a'.repeat(40))
 await assert.rejects(verifyStagingReceipt({runId:'11',decision:'fixture',token:'fixture'},{...deps,readPolicy:()=>({...policy,signerRule:'receipt'})}))
})
test('verificadores compostos correlacionam duas versões com políticas estáveis',async()=>{
 const buildPolicy=Object.freeze({version:'nxg-build-recurring-v1',repo:'RafaCartaxo/nxgest',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',workflowId:'56',signerRule:'ci-push-source',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)})
 const image=Buffer.from('imagem sintética'),zip=Buffer.from('build zip'),imageHash=h(image),zipHash=h(zip)
 for(const [run,source] of [['11','a'.repeat(40)],['12','e'.repeat(40)]]){
  const {signerSha,...stageBase}=fixed
  const stagePolicy=Object.freeze({...stageBase,version:'nxg-staging-recurring-v2',signerRule:'staging-run-source'})
  const stage={...fixture(run,source,{zip:zipHash,tar:imageHash}),readPolicy:()=>stagePolicy,attest:(_f,p)=>({attestationValid:p.sourceSha===source&&p.signerSha===source&&p.runId===run})}
  const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:run,attempt:1,sourceSha:source,platform:'linux/amd64',imageSize:image.length,imageSha256:imageHash}))
  const build={readPolicy:()=>buildPolicy,resolve:async e=>({runId:e.runId,attempt:1,artifactId:'34',sha:e.sha,workflowId:e.workflowId}),inspect:async()=>({digestZip:zipHash}),download:async()=>zip,extract:()=>({image,receipt}),attest:(_f,p)=>({attestationValid:p.sourceSha===source&&p.signerSha===source&&p.runId===run})}
  const out=await verifyProductionSource({stage:{runId:run,decision:'fixture',token:'fixture'},build:{decision:'fixture',token:'fixture'}},{stageDeps:stage,buildDeps:build})
  try{assert.equal(out.fixture,true);assert.equal(out.operationalReady,false);assert.equal(out.sha,source);assert.equal(out.ciRun,run)}finally{rmSync(path.dirname(out.imagePath),{recursive:true})}
 }
})
test('workflow de staging pode ter source diferente do candidato, cuja origem CI é verificada',async()=>{
 const stageSource='a'.repeat(40),candidate='e'.repeat(40),run='11',image=Buffer.from('imagem fixture'),zip=Buffer.from('zip fixture')
 const {signerSha,...stageBase}=fixed
 const stagePolicy={...stageBase,version:'nxg-staging-recurring-v2',signerRule:'staging-run-source'}
 const stage={...fixture(run,stageSource,{sha:candidate,zip:h(zip),tar:h(image)}),readPolicy:()=>stagePolicy,attest:(_f,p)=>({attestationValid:p.sourceSha===stageSource&&p.signerSha===stageSource})}
 const buildPolicy={version:'nxg-build-recurring-v1',repo:'RafaCartaxo/nxgest',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',workflowId:'56',signerRule:'ci-push-source',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)}
 const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:run,attempt:1,sourceSha:candidate,platform:'linux/amd64',imageSize:image.length,imageSha256:h(image)}))
 const build={readPolicy:()=>buildPolicy,resolve:async e=>({runId:e.runId,attempt:1,artifactId:'34',sha:e.sha,workflowId:e.workflowId}),inspect:async()=>({digestZip:h(zip)}),download:async()=>zip,extract:()=>({image,receipt}),attest:(_f,p)=>({attestationValid:p.sourceSha===candidate&&p.signerSha===candidate})}
 const options={stage:{runId:run,decision:'fixture',token:'fixture'},build:{decision:'fixture',token:'fixture'}}
 const out=await verifyProductionSource(options,{stageDeps:stage,buildDeps:build})
 try{assert.equal(out.fixture,true);assert.equal(out.sha,candidate)}finally{rmSync(path.dirname(out.imagePath),{recursive:true})}
 await assert.rejects(verifyProductionSource(options,{stageDeps:stage,buildDeps:{...build,resolve:async e=>({runId:e.runId,attempt:1,artifactId:'34',sha:stageSource,workflowId:e.workflowId})}}))
})
test('duas seleções recorrentes passam por provedores e verificador de certificados reais com GH dublado',async()=>{
 const gh=Buffer.from('binário GH sintético'),ghHash=h(gh),stageSource='c'.repeat(40)
 const stagePolicy={version:'nxg-staging-recurring-v2',repo:'RafaCartaxo/nxgest',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',workflowId:'88',signerRule:'staging-run-source',ghPath:'/guard/gh',ghSha256:ghHash}
 const buildPolicy={version:'nxg-build-recurring-v1',repo:'RafaCartaxo/nxgest',decision:'fixture',expiresAt:'2099-01-01T00:00:00.000Z',workflowId:'56',signerRule:'ci-push-source',ghPath:'/guard/gh',ghSha256:ghHash}
 for(const [stageRun,ciRun,id,candidate] of [['21','11','34','a'.repeat(40)],['22','12','35','e'.repeat(40)]]){
  const image=Buffer.from(`imagem ${candidate}`),zip=Buffer.from(`zip ${candidate}`),stage=fixture(stageRun,stageSource,{sha:candidate,ciRun,artifact:id,zip:h(zip),tar:h(image)})
  const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:ciRun,attempt:1,sourceSha:candidate,platform:'linux/amd64',imageSize:image.length,imageSha256:h(image)}))
  const run={id:Number(ciRun),workflow_id:56,run_attempt:1,status:'completed',conclusion:'success',event:'push',head_branch:'main',head_sha:candidate}
  const artifact={id:Number(id),workflow_run:{id:Number(ciRun),head_sha:candidate},expired:false,expires_at:'2099-01-01T00:00:00Z',digest:h(zip),size_in_bytes:zip.length,name:`nxgest-build-${ciRun}-1`}
  const fetcher=async url=>new Response(JSON.stringify(url.endsWith('/repositories/1304448439')?{id:1304448439,full_name:'RafaCartaxo/nxgest'}:url.includes('/artifacts?')?{total_count:1,artifacts:[artifact]}:url.includes('/runs/')?run:url.includes('/workflows/')?{id:56,path:'.github/workflows/ci.yml'}:artifact))
  let subjects=0
  const attest=(file,p)=>verifyBuildAttestation(file,p,{stat:()=>({isFile:()=>true,isSymbolicLink:()=>false}),canonical:()=>'/guard/gh',read:()=>gh,spawn:()=>{subjects++;const certificate={issuer:p.issuer,sourceRepositoryURI:'https://github.com/RafaCartaxo/nxgest',sourceRepositoryIdentifier:'1304448439',sourceRepositoryDigest:p.sourceSha,sourceRepositoryRef:p.sourceRef,buildSignerURI:`https://github.com/${p.signerWorkflow}@${p.sourceRef}`,buildSignerDigest:p.signerSha,runnerEnvironment:'github-hosted',buildTrigger:p.signerWorkflow.endsWith('/staging.yml')?'workflow_run':'push',runInvocationURI:`https://github.com/RafaCartaxo/nxgest/actions/runs/${p.runId}/attempts/${p.attempt}`};return {status:0,stdout:JSON.stringify([{verificationResult:{signature:{certificate},verifiedTimestamps:[{}]}}])}}})
  const stageDeps={...stage,readPolicy:()=>stagePolicy,attest}
  const buildDeps={readPolicy:()=>buildPolicy,resolve:(s,t)=>resolveBuildSelection(s,t,{fetcher}),inspect:(s,t)=>inspectBuildRun(s,t,{fetcher}),download:async()=>zip,extract:()=>({image,receipt}),attest}
  const result=await verifyProductionSource({stage:{runId:stageRun,decision:'fixture',token:'fixture'},build:{decision:'fixture',token:'fixture'}},{stageDeps,buildDeps})
  try{assert.equal(result.sha,candidate);assert.equal(result.ciRun,ciRun);assert.equal(result.artifact,id);assert.equal(subjects,3);assert.equal(result.fixture,true)}finally{rmSync(path.dirname(result.imagePath),{recursive:true})}
 }
})
