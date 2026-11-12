// Consulta de metadados do provedor: não autoriza deploy nem interpreta JSON do artefato como prova.
const api='https://api.github.com'
async function jsonGet(url,token,fetcher) {
 const r=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'manual',signal:AbortSignal.timeout(15000)})
 if(!r.ok||r.status>=300)throw Error('consulta do provedor falhou')
 const len=Number(r.headers.get('content-length')||0);if(len>1024*1024)throw Error('resposta excede limite')
 const reader=r.body?.getReader();if(!reader)throw Error('corpo indisponível')
 let size=0;const chunks=[]
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024)throw Error('resposta excede limite');chunks.push(value)}} finally {reader.releaseLock()}
 return JSON.parse(Buffer.concat(chunks.map(x=>Buffer.from(x))).toString('utf8'))
}
export async function inspectBuildRun(selection,token,{fetcher=fetch}={}) {
 const {runId,attempt,artifactId,sha,workflowId}=selection||{}
 if(!/^\d{1,20}$/.test(runId||'')||!/^\d{1,20}$/.test(artifactId||'')||!/^\d{1,20}$/.test(workflowId||'')||attempt!==1||!/^([a-f0-9]{40})$/.test(sha||'')||typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('seleção inválida')
 const [repo,run,latest,artifact,workflow,listing]=await Promise.all([jsonGet(`${api}/repositories/1304448439`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}/attempts/${attempt}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/artifacts/${artifactId}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/workflows/${workflowId}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}/artifacts?per_page=100`,token,fetcher)])
 if(!Array.isArray(listing.artifacts)||listing.total_count!==listing.artifacts.length||listing.total_count>100||listing.artifacts.filter(x=>x.name===`nxgest-build-${runId}-${attempt}`).length!==1||String(listing.artifacts.find(x=>x.name===`nxgest-build-${runId}-${attempt}`)?.id)!==artifactId||workflow.path!=='.github/workflows/ci.yml'||String(workflow.id)!==workflowId||repo.id!==1304448439||repo.full_name?.toLowerCase()!=='rafacartaxo/nxgest'||String(run.id)!==runId||String(latest.id)!==runId||latest.run_attempt!==1||latest.status!=='completed'||latest.conclusion!=='success'||String(run.workflow_id)!==workflowId||run.run_attempt!==attempt||run.status!=='completed'||run.conclusion!=='success'||run.event!=='push'||run.head_branch!=='main'||run.head_sha!==sha||String(artifact.id)!==artifactId||String(artifact.workflow_run?.id)!==runId||artifact.workflow_run?.head_sha!==sha||artifact.expired!==false||typeof artifact.expires_at!=='string'||!Number.isFinite(Date.parse(artifact.expires_at))||Date.parse(artifact.expires_at)<=Date.now()||artifact.name!==`nxgest-build-${runId}-${attempt}`||!/^sha256:[a-f0-9]{64}$/.test(artifact.digest||'')||!Number.isSafeInteger(artifact.size_in_bytes)||artifact.size_in_bytes<=0||artifact.size_in_bytes>1024*1024*1024)throw Error('metadados divergentes')
 return Object.freeze({repoId:repo.id,runId,attempt,artifactId,sha,digestZip:artifact.digest,size:artifact.size_in_bytes,operationalReady:false})
}

export async function downloadBuildZip(artifactId,token,{fetcher=fetch}={}) {
 if(!/^\d{1,20}$/.test(artifactId||'')||typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('download inválido')
 const first=await fetcher(`${api}/repos/RafaCartaxo/nxgest/actions/artifacts/${artifactId}/zip`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'},redirect:'manual',signal:AbortSignal.timeout(15000)})
 if(![301,302,303,307,308].includes(first.status))throw Error('redirect indisponível')
 let target;try{target=new URL(first.headers.get('location'))}catch{throw Error('redirect inválido')}
 if(target.protocol!=='https:'||target.username||target.password||target.port||!target.hostname.endsWith('.blob.core.windows.net'))throw Error('redirect recusado')
 const response=await fetcher(target.href,{redirect:'manual',signal:AbortSignal.timeout(120000)})
 if(!response.ok||response.status>=300||!response.body)throw Error('download falhou')
 const max=512*1024*1024,declared=Number(response.headers.get('content-length')||0);if(declared>max)throw Error('download excede limite')
 const reader=response.body.getReader(),chunks=[];let size=0
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('download excede limite');chunks.push(value)}}finally{reader.releaseLock()}
 if(!size)throw Error('download vazio');return Buffer.concat(chunks.map(x=>Buffer.from(x)))
}

// O artifact é selecionado pela API para o run autorizado, nunca por campos do pacote.
export async function resolveBuildSelection(event,token,{fetcher=fetch}={}) {
 const {runId,sha,workflowId}=event||{}
 if(!/^\d{1,20}$/.test(runId||'')||!/^\d{1,20}$/.test(workflowId||'')||!/^[a-f0-9]{40}$/.test(sha||'')||typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('evento inválido')
 const listing=await jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}/artifacts?per_page=100`,token,fetcher)
 if(!Array.isArray(listing.artifacts)||listing.total_count!==listing.artifacts.length||listing.total_count>100)throw Error('listagem ambígua')
 const matching=listing.artifacts.filter(x=>x.name===`nxgest-build-${runId}-1`)
 if(matching.length!==1||!Number.isSafeInteger(matching[0].id)||matching[0].id<=0)throw Error('artifact ausente ou ambíguo')
 const selection={runId,attempt:1,artifactId:String(matching[0].id),sha,workflowId}
 await inspectBuildRun(selection,token,{fetcher})
 return Object.freeze(selection)
}

export async function inspectStagingRun(selection,token,{fetcher=fetch}={}) {
 const {runId,workflowId,sourceSha}=selection||{}
 if(!/^\d{1,20}$/.test(runId||'')||!/^\d{1,20}$/.test(workflowId||'')||!/^[a-f0-9]{40}$/.test(sourceSha||'')||typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('seleção staging inválida')
 const [repo,run,workflow,listing]=await Promise.all([jsonGet(`${api}/repositories/1304448439`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/workflows/${workflowId}`,token,fetcher),jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/runs/${runId}/artifacts?per_page=100`,token,fetcher)])
 if(repo.id!==1304448439||repo.full_name?.toLowerCase()!=='rafacartaxo/nxgest'||String(run.id)!==runId||String(run.workflow_id)!==workflowId||run.run_attempt!==1||run.status!=='completed'||run.conclusion!=='success'||run.event!=='workflow_run'||run.head_branch!=='main'||run.head_sha!==sourceSha||String(workflow.id)!==workflowId||workflow.path!=='.github/workflows/staging.yml'||!Array.isArray(listing.artifacts)||listing.total_count!==listing.artifacts.length||listing.total_count>100)throw Error('run staging divergente')
 const matching=listing.artifacts.filter(x=>x.name===`nxgest-staging-${runId}-1`)
 if(matching.length!==1||!Number.isSafeInteger(matching[0].id)||matching[0].id<=0)throw Error('recibo staging ambíguo')
 const artifact=await jsonGet(`${api}/repos/RafaCartaxo/nxgest/actions/artifacts/${matching[0].id}`,token,fetcher)
 if(artifact.id!==matching[0].id||artifact.name!==matching[0].name||String(artifact.workflow_run?.id)!==runId||artifact.workflow_run?.head_sha!==sourceSha||artifact.expired!==false||!Number.isFinite(Date.parse(artifact.expires_at))||Date.parse(artifact.expires_at)<=Date.now()||!/^sha256:[a-f0-9]{64}$/.test(artifact.digest||'')||!Number.isSafeInteger(artifact.size_in_bytes)||artifact.size_in_bytes<=0||artifact.size_in_bytes>1024*1024)throw Error('artifact staging divergente')
 return Object.freeze({runId,artifactId:String(artifact.id),digestZip:artifact.digest,sourceSha,operationalReady:false})
}
