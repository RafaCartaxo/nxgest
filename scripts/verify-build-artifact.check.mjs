import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash,randomBytes} from 'node:crypto'
import {mkdirSync,writeFileSync,readFileSync,unlinkSync,rmdirSync,rmSync,lstatSync,chmodSync} from 'node:fs'
import path from 'node:path'
import {zip as makeZip} from './build-zip-fixture.mjs'
import {downloadBuildZip,inspectBuildRun} from './build-provider.mjs'
import {verifyBuildArtifact} from './verify-build-artifact.mjs'
const sha=b=>'sha256:'+createHash('sha256').update(b).digest('hex'),root=process.cwd(),dir=path.join(root,'.maestro/coord-qa/build-policies')
const image=Buffer.from('imagem-sintetica'),zip=Buffer.from('zip-sintetico'),policy={version:'nxg-build-v1',decision:'QA/approved',repo:'RafaCartaxo/nxgest',runId:'12',attempt:1,artifactId:'34',sourceSha:'a'.repeat(40),signerSha:'b'.repeat(40),workflowId:'56',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)}
const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:'12',attempt:1,sourceSha:policy.sourceSha,platform:'linux/amd64',imageSize:image.length,imageSha256:sha(image)}))
function adapters(change={}){return {inspect:async()=>({digestZip:sha(zip)}),download:async()=>zip,extract:()=>({image,receipt}),attest:()=>({attestationValid:true}),...change}}
async function withPolicy(fn){let created=false;try{mkdirSync(dir,{mode:0o700});created=true}catch(e){if(e.code!=='EEXIST')throw e}const file=path.join(dir,`fixture-${randomBytes(12).toString('hex')}.json`),data=Buffer.from(JSON.stringify(policy));writeFileSync(file,data,{flag:'wx',mode:0o600});const st=lstatSync(file);try{return await fn({policyPath:file,policyHash:sha(data),decision:policy.decision,token:'synthetic-token'})}finally{const now=lstatSync(file);if(st.ino!==now.ino||st.dev!==now.dev)throw Error('fixture substituída');unlinkSync(file);if(created)rmdirSync(dir)}}
test('integra política externa, seleção, ZIP, recibo e duas atestações em fixture identificada',async()=>withPolicy(async options=>{const paths=[];const result=await verifyBuildArtifact(options,adapters({attest:(file)=>{paths.push(file);return {attestationValid:true}}}));try{assert.equal(result.verified,true);assert.equal(result.fixture,true);assert.equal(paths.length,2);assert.deepEqual(readFileSync(result.imagePath),image);assert.equal(result.imageSha256,sha(image))}finally{rmSync(path.dirname(result.imagePath),{recursive:true})}}))
test('recusa política/hash, ZIP e recibo divergentes e falha de qualquer atestação',async()=>withPolicy(async options=>{await assert.rejects(verifyBuildArtifact({...options,policyHash:sha(Buffer.from('other'))},adapters()));await assert.rejects(verifyBuildArtifact({...options,policyPath:path.join(root,'bundle.json')},adapters()));await assert.rejects(verifyBuildArtifact(options,adapters({download:async()=>Buffer.from('alterado')})));await assert.rejects(verifyBuildArtifact(options,adapters({extract:()=>({image,receipt:Buffer.from('{}')})})));let n=0;await assert.rejects(verifyBuildArtifact(options,adapters({attest:()=>({attestationValid:++n===1})})));assert.equal(n,2)}))

test('caminho completo dublado usa download, ZIP real, API e ambas atestações',async()=>withPolicy(async options=>{
 const archive=makeZip(['image.tar','receipt.json'],[0o100600,0o100600],[image,receipt]),digest=sha(archive),calls=[]
 const run={id:12,workflow_id:56,run_attempt:1,status:'completed',conclusion:'success',event:'push',head_branch:'main',head_sha:policy.sourceSha}, artifact={id:34,workflow_run:{id:12,head_sha:policy.sourceSha},expired:false,digest,size_in_bytes:archive.length,name:'nxgest-build-12-1',expires_at:'2099-01-01T00:00:00Z'}
 const fetcher=async(url,opts)=>{calls.push({url,opts});if(url.endsWith('/34/zip'))return new Response(null,{status:302,headers:{location:'https://fixture.blob.core.windows.net/a'}});if(url.startsWith('https://fixture.blob.core.windows.net/')){assert.equal(opts.headers,undefined);return new Response(archive)}const obj=url.endsWith('/repositories/1304448439')?{id:1304448439,full_name:'RafaCartaxo/nxgest'}:url.includes('/artifacts?')?{total_count:1,artifacts:[artifact]}:url.includes('/runs/')?run:url.includes('/workflows/')?{id:56,path:'.github/workflows/ci.yml'}:artifact;return new Response(JSON.stringify(obj))}
 let subjects=0;const deps={inspect:(s,t)=>inspectBuildRun(s,t,{fetcher}),download:(id,t)=>downloadBuildZip(id,t,{fetcher}),attest:()=>{subjects++;return {attestationValid:true}}}
 const result=await verifyBuildArtifact(options,deps);try{assert.equal(result.fixture,true);assert.equal(subjects,2);assert.deepEqual(readFileSync(result.imagePath),image);assert(calls.every(c=>!c.url.includes(options.token)))}finally{rmSync(path.dirname(result.imagePath),{recursive:true})}
}))
test('download recusa redirect estranho e falha sem expor token',async()=>{for(const loc of ['http://fixture.blob.core.windows.net/a','https://evil.example/a','https://user:pass@fixture.blob.core.windows.net/a']){let calls=0;await assert.rejects(downloadBuildZip('34','segredo-falso',{fetcher:async()=>{calls++;return new Response(null,{status:302,headers:{location:loc}})}}));assert.equal(calls,1)}})

test('política ausente ou permissões inseguras falham antes de consultar API',async()=>withPolicy(async options=>{let called=false;const d=adapters({inspect:async()=>{called=true;throw Error('não esperado')}});await assert.rejects(verifyBuildArtifact({...options,policyPath:path.join(dir,'inexistente.json')},d));assert.equal(called,false);chmodSync(options.policyPath,0o666);try{await assert.rejects(verifyBuildArtifact(options,d));assert.equal(called,false)}finally{chmodSync(options.policyPath,0o600)}}))
test('download recusa corpo vazio e tamanho declarado excedido',async()=>{for(const response of [()=>new Response(null,{status:200}),()=>new Response('x',{headers:{'content-length':String(512*1024*1024+1)}})]){let n=0;await assert.rejects(downloadBuildZip('34','token-falso',{fetcher:async()=>++n===1?new Response(null,{status:302,headers:{location:'https://fixture.blob.core.windows.net/a'}}):response()}))}})

test('política-base aprova SHA e obtém IDs da API, rejeitando SHA não aprovado',async()=>{
 const base={version:'nxg-build-base-v1',expiresAt:'2099-01-01T00:00:00.000Z',decision:policy.decision,repo:policy.repo,sourceSha:policy.sourceSha,signerSha:policy.signerSha,workflowId:policy.workflowId,ghPath:policy.ghPath,ghSha256:policy.ghSha256};let calls=0
 const dep=adapters({readPolicy:()=>base,resolve:async e=>{calls++;return {runId:e.runId,attempt:1,artifactId:'34',sha:e.sha,workflowId:e.workflowId}}})
 const opts={decision:base.decision,token:'token-fixture',eventRunId:'12',eventSha:base.sourceSha}
 const v=await verifyBuildArtifact(opts,dep);try{assert.equal(v.fixture,true);assert.equal(v.runId,'12');assert.equal(v.artifactId,'34');assert.equal(calls,1)}finally{rmSync(path.dirname(v.imagePath),{recursive:true})}
 await assert.rejects(verifyBuildArtifact({...opts,eventSha:'d'.repeat(40)},dep));assert.equal(calls,1)
 await assert.rejects(verifyBuildArtifact(opts,{...dep,readPolicy:()=>({...base,expiresAt:'2000-01-01T00:00:00.000Z'})}));assert.equal(calls,1)
 await assert.rejects(verifyBuildArtifact(opts,{...dep,readPolicy:()=>({...base,artifactId:'34'})}));assert.equal(calls,1)
 await assert.rejects(verifyBuildArtifact(opts,{...dep,resolve:async e=>({runId:'99',attempt:1,artifactId:'34',sha:e.sha,workflowId:e.workflowId})}))
 await assert.rejects(verifyBuildArtifact(opts,{...dep,readPolicy:()=>policy}))
})
