#!/usr/bin/env node
import {createHash} from 'node:crypto'
import {mkdtempSync,writeFileSync,rmSync,lstatSync,realpathSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {readPolicy} from './verify-build-artifact.mjs'
import {inspectStagingRun,downloadBuildZip} from './build-provider.mjs'
import {extractBuildZip} from './build-zip.mjs'
import {verifyBuildAttestation} from './build-attestation.mjs'
const root=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')),hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
export async function verifyStagingReceipt(options,deps={}) {
 const fixture=Object.keys(deps).length>0,{policyPath,policyHash,decision,runId,token}=options||{}
 if(!/^\d{1,20}$/.test(runId||'')||typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('seleção inválida')
 const p=(deps.readPolicy||readPolicy)(policyPath,policyHash,decision)
 if(!p||Object.keys(p).sort().join(',')!=='candidateSha,decision,ghPath,ghSha256,signerSha,sourceSha,version,workflowId'||p.version!=='nxg-staging-policy-v1'||p.decision!==decision||!/^\d{1,20}$/.test(p.workflowId||'')||![p.candidateSha,p.signerSha,p.sourceSha].every(x=>/^[a-f0-9]{40}$/.test(x||''))||!path.isAbsolute(p.ghPath||'')||!/^sha256:[a-f0-9]{64}$/.test(p.ghSha256||''))throw Error('política staging inválida')
 const meta=await (deps.inspect||inspectStagingRun)({runId,workflowId:p.workflowId,sourceSha:p.sourceSha},token),zip=await (deps.download||downloadBuildZip)(meta.artifactId,token)
 if(!Buffer.isBuffer(zip)||hash(zip)!==meta.digestZip)throw Error('ZIP staging divergente')
 const {receipt}=(deps.extract||extractBuildZip)(zip,['staging-receipt.json']);if(!Buffer.isBuffer(receipt)||receipt.length>8192)throw Error('recibo staging inválido')
 const work=mkdtempSync(path.join(root,'.nxg-stage-receipt-')),st=lstatSync(work)
 try{
  const file=path.join(work,'staging-receipt.json');writeFileSync(file,receipt,{flag:'wx',mode:0o600})
  const policy={repo:'RafaCartaxo/nxgest',signerWorkflow:'RafaCartaxo/nxgest/.github/workflows/staging.yml',issuer:'https://token.actions.githubusercontent.com',sourceRef:'refs/heads/main',sourceSha:p.sourceSha,signerSha:p.signerSha,runId,attempt:1,ghPath:p.ghPath,ghSha256:p.ghSha256}
  if(!(deps.attest||verifyBuildAttestation)(file,policy).attestationValid)throw Error('atestação staging inválida')
  let r;try{r=JSON.parse(receipt.toString('utf8'))}catch{throw Error('recibo inválido')}
  if(!r||Object.keys(r).sort().join(',')!=='artifact,ciAttempt,ciRun,db,health,image,sha,stagingAttempt,stagingRun,tar,version,zip'||r.version!=='nxg-staging-v1'||r.sha!==p.candidateSha||r.stagingRun!==runId||r.stagingAttempt!==1||r.ciAttempt!==1||!/^\d{1,20}$/.test(r.ciRun||'')||!/^\d{1,20}$/.test(r.artifact||'')||![r.image,r.tar,r.zip].every(x=>/^sha256:[a-f0-9]{64}$/.test(x||''))||r.health!=='ok'||r.db!=='connected')throw Error('recibo staging divergente')
  return Object.freeze({verified:true,fixture,...r})
 }finally{const now=lstatSync(work);if(!now.isDirectory()||now.isSymbolicLink()||now.dev!==st.dev||now.ino!==st.ino)throw Error('limpeza recusada');rmSync(work,{recursive:true})}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2);if(a.length!==5||a[0]!=='verify'){console.error('Uso: verify POLITICA SHA256 DECISAO RUN_ID');process.exitCode=2}else verifyStagingReceipt({policyPath:a[1],policyHash:a[2],decision:a[3],runId:a[4],token:process.env.GH_TOKEN}).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('Verificação staging falhou');process.exitCode=1})
}
