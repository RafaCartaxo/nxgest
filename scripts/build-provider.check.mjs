import {test} from 'node:test'
import assert from 'node:assert/strict'
import {inspectBuildRun,resolveBuildSelection} from './build-provider.mjs'
const selection={runId:'12',attempt:1,artifactId:'34',sha:'a'.repeat(40),workflowId:'56'}
const repo={id:1304448439,full_name:'RafaCartaxo/nxgest'},run={id:12,workflow_id:56,run_attempt:1,status:'completed',conclusion:'success',event:'push',head_branch:'main',head_sha:selection.sha},artifact={id:34,workflow_run:{id:12,head_sha:selection.sha},expired:false,digest:'sha256:'+'b'.repeat(64),size_in_bytes:100,name:'nxgest-build-12-1',expires_at:'2099-01-01T00:00:00Z'}
function fake(changes={}){return async (url,opts)=>{assert.equal(opts.redirect,'manual');assert(!url.includes('token-sintetico'));const data=url.endsWith('/repositories/1304448439')?{...repo,...changes.repo}:url.includes('/artifacts?')?(changes.listing||{total_count:1,artifacts:[artifact]}):url.includes('/runs/')?{...run,...changes.run}:url.includes('/workflows/')?{id:56,path:'.github/workflows/ci.yml'}:{...artifact,...changes.artifact};return new Response(JSON.stringify(data),{status:changes.status||200})}}
test('API dublada valida identidade e nunca libera produção',async()=>{const result=await inspectBuildRun(selection,'token-sintetico',{fetcher:fake()});assert.equal(result.operationalReady,false);assert.equal(result.digestZip,artifact.digest)})
test('API recusa rerun, erro, SHA, artifact e identidade divergentes',async()=>{await assert.rejects(inspectBuildRun({...selection,attempt:2},'x',{fetcher:fake()}));for(const c of [{status:302},{run:{conclusion:'failure'}},{run:{head_sha:'b'.repeat(40)}},{repo:{id:1}},{artifact:{expired:true}},{artifact:{workflow_run:{id:13,head_sha:selection.sha}}}])await assert.rejects(inspectBuildRun(selection,'x',{fetcher:fake(c)}))})

test('resolve artifact único somente pela API; duplicatas e ausência são recusadas',async()=>{
 const event={runId:'12',sha:selection.sha,workflowId:'56'}
 assert.deepEqual(await resolveBuildSelection(event,'token-sintetico',{fetcher:fake()}),selection)
 for(const listing of [{total_count:0,artifacts:[]},{total_count:2,artifacts:[artifact,artifact]}])await assert.rejects(resolveBuildSelection(event,'token-sintetico',{fetcher:fake({listing})}))
})
test('API staging dublada confirma workflow e rejeita replay ou recibos duplicados',async()=>{
 const {inspectStagingRun}=await import('./build-provider.mjs'),source='d'.repeat(40),selection={runId:'77',workflowId:'88',sourceSha:source},rec={id:99,name:'nxgest-staging-77-1',workflow_run:{id:77,head_sha:source},expired:false,expires_at:'2099-01-01T00:00:00Z',digest:'sha256:'+'a'.repeat(64),size_in_bytes:100}
 function response(opts={}){return async url=>{const value=url.endsWith('/repositories/1304448439')?{id:1304448439,full_name:'RafaCartaxo/nxgest'}:url.includes('/artifacts?')?{total_count:opts.duplicate?2:1,artifacts:opts.duplicate?[rec,rec]:[rec]}:url.includes('/workflows/')?{id:88,path:'.github/workflows/staging.yml'}:url.includes('/runs/')?{id:77,workflow_id:88,run_attempt:1,status:'completed',conclusion:opts.failure?'failure':'success',event:'workflow_run',head_branch:'main',head_sha:source}:rec;return new Response(JSON.stringify(value))}}
 assert.equal((await inspectStagingRun(selection,'token',{fetcher:response()})).artifactId,'99');for(const o of [{duplicate:true},{failure:true}])await assert.rejects(inspectStagingRun(selection,'token',{fetcher:response(o)}))
})
