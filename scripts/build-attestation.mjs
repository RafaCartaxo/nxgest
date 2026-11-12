// Componente de verificação: atestação não equivale a autorização operacional.
import {createHash} from 'node:crypto'
import {readFileSync, lstatSync, realpathSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
const sha=b=>createHash('sha256').update(b).digest('hex')
const fail=()=>{throw Error('atestação ou política não verificável')}
export function verifyBuildAttestation(file,policy,{spawn=spawnSync,read=readFileSync,stat=lstatSync,canonical=realpathSync}={}) {
 if(!policy||policy.repo!=='RafaCartaxo/nxgest'||!['RafaCartaxo/nxgest/.github/workflows/ci.yml','RafaCartaxo/nxgest/.github/workflows/staging.yml'].includes(policy.signerWorkflow)||policy.issuer!=='https://token.actions.githubusercontent.com'||policy.sourceRef!=='refs/heads/main'||!/^([a-f0-9]{40})$/.test(policy.sourceSha||'')||!/^([a-f0-9]{40})$/.test(policy.signerSha||'')||!/^sha256:[a-f0-9]{64}$/.test(policy.ghSha256||'')||!path.isAbsolute(policy.ghPath||'')||!path.isAbsolute(file||'')||!/^\d{1,20}$/.test(policy.runId||'')||!/^\d{1,6}$/.test(String(policy.attempt||'')))fail()
 const st=stat(policy.ghPath),target=canonical(policy.ghPath)
 if(!st.isFile()||st.isSymbolicLink()||target!==policy.ghPath||'sha256:'+sha(read(policy.ghPath))!==policy.ghSha256)fail()
 const args=['attestation','verify',file,'--repo',policy.repo,'--signer-workflow',policy.signerWorkflow,'--signer-digest',policy.signerSha,'--source-digest',policy.sourceSha,'--source-ref',policy.sourceRef,'--deny-self-hosted-runners','--cert-oidc-issuer',policy.issuer,'--format','json']
 const env={PATH:'/usr/bin:/bin',HOME:process.env.HOME||'/nonexistent',GH_PROMPT_DISABLED:'1',GH_NO_UPDATE_NOTIFIER:'1'}
 if(process.env.GH_TOKEN)env.GH_TOKEN=process.env.GH_TOKEN
 const r=spawn(policy.ghPath,args,{env,timeout:30000,maxBuffer:1024*1024,encoding:'utf8'})
 if(r.error||r.status!==0)fail()
 let result;try{result=JSON.parse(r.stdout)}catch{fail()}
 if(!Array.isArray(result)||result.length!==1||!result[0]?.verificationResult?.signature?.certificate||!Array.isArray(result[0]?.verificationResult?.verifiedTimestamps)||!result[0].verificationResult.verifiedTimestamps.length)fail()
 const cert=result[0].verificationResult.signature.certificate
 const expected={issuer:policy.issuer,sourceRepositoryURI:'https://github.com/RafaCartaxo/nxgest',sourceRepositoryIdentifier:'1304448439',sourceRepositoryDigest:policy.sourceSha,sourceRepositoryRef:policy.sourceRef,buildSignerURI:`https://github.com/${policy.signerWorkflow}@${policy.sourceRef}`,buildSignerDigest:policy.signerSha,runnerEnvironment:'github-hosted',buildTrigger:policy.signerWorkflow.endsWith('/staging.yml')?'workflow_run':'push',runInvocationURI:`https://github.com/RafaCartaxo/nxgest/actions/runs/${policy.runId}/attempts/${policy.attempt}`}
 if(Object.entries(expected).some(([k,v])=>cert[k]!==v))fail()
 return Object.freeze({attestationValid:true,operationalReady:false})
}
