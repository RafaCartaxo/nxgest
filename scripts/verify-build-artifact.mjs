#!/usr/bin/env node
// Política e aprovação são fornecidas fora do artifact; CLI nunca aceita dependências injetadas.
import {createHash} from 'node:crypto'
import {lstatSync,openSync,closeSync,fstatSync,readFileSync,writeFileSync,mkdtempSync,rmSync,realpathSync,constants} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {inspectBuildRun,downloadBuildZip,resolveBuildSelection} from './build-provider.mjs'
import {verifyBuildAttestation} from './build-attestation.mjs'
import {extractBuildZip} from './build-zip.mjs'
const root=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'))
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
export function readPolicy(file,approvedHash,decision) {
 if(!path.isAbsolute(file||'')||path.normalize(file)!==file||path.dirname(file)!==path.join(root,'.maestro','coord-qa','build-policies')||!/^[-A-Za-z0-9_]+\.json$/.test(path.basename(file))||!/^sha256:[a-f0-9]{64}$/.test(approvedHash||'')||!/^[-A-Za-z0-9_./:]{1,160}$/.test(decision||''))throw Error('política inválida')
 let current='/',fileStat;const uid=process.geteuid()
 for(const part of file.slice(1).split('/')){current=path.join(current,part);const st=lstatSync(current),inside=current===root||current.startsWith(root+'/');if(st.isSymbolicLink()||(inside?st.uid!==uid:st.uid!==0&&st.uid!==uid)||(st.mode&0o022)||(current===file?!st.isFile():!st.isDirectory()))throw Error('custódia inválida');if(current===file)fileStat=st}
 if(fileStat.mode&0o077)throw Error('permissão inválida')
 const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{const st=fstatSync(fd);if(!st.isFile()||st.uid!==uid||(st.mode&0o077)||st.dev!==fileStat.dev||st.ino!==fileStat.ino||st.size>8192)throw Error('política insegura');const data=readFileSync(fd);if(hash(data)!==approvedHash)throw Error('hash da política divergente');const p=JSON.parse(data);if(p.decision!==decision)throw Error('decisão divergente');return p}finally{closeSync(fd)}
}
export async function verifyBuildArtifact(options,deps={}) {
 const fixture=Object.keys(deps).length!==0
 const {policyPath,policyHash,decision,token,eventRunId,eventSha}=options||{}
 if(typeof token!=='string'||!token||/[\r\n]/.test(token))throw Error('credencial ausente')
 const policy=(deps.readPolicy||readPolicy)(policyPath,policyHash,decision)
 const {sourceSha,signerSha,workflowId,ghPath,ghSha256}=policy
 if(policy.decision!==decision||policy.repo!=='RafaCartaxo/nxgest'||!/^\d{1,20}$/.test(workflowId||'')||!/^([a-f0-9]{40})$/.test(sourceSha||'')||!/^([a-f0-9]{40})$/.test(signerSha||'')||!path.isAbsolute(ghPath||'')||!/^sha256:[a-f0-9]{64}$/.test(ghSha256||''))throw Error('política recusada')
 let selection
 if(policy.version==='nxg-build-base-v1') {
  if(Object.keys(policy).sort().join(',')!=='decision,expiresAt,ghPath,ghSha256,repo,signerSha,sourceSha,version,workflowId'||typeof policy.expiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(policy.expiresAt)||!Number.isFinite(Date.parse(policy.expiresAt))||new Date(policy.expiresAt).toISOString()!==policy.expiresAt||Date.parse(policy.expiresAt)<=Date.now()||eventSha!==sourceSha||!/^\d{1,20}$/.test(eventRunId||''))throw Error('evento não autorizado')
  selection=await (deps.resolve||resolveBuildSelection)({runId:eventRunId,sha:sourceSha,workflowId},token)
 } else if(policy.version==='nxg-build-v1') {
  if(eventRunId!==undefined||eventSha!==undefined)throw Error('evento exige política-base')
  const {runId,attempt,artifactId}=policy
  if(!/^\d{1,20}$/.test(runId||'')||attempt!==1||!/^\d{1,20}$/.test(artifactId||''))throw Error('política recusada')
  selection={runId,attempt,artifactId,sha:sourceSha,workflowId}
 } else throw Error('política recusada')
 const {runId,attempt,artifactId}=selection
 if((policy.version==='nxg-build-base-v1'&&selection.runId!==eventRunId)||selection.sha!==sourceSha||selection.workflowId!==workflowId||selection.attempt!==1||!/^\d{1,20}$/.test(selection.runId||'')||!/^\d{1,20}$/.test(selection.artifactId||''))throw Error('seleção divergente')
 const metadata=await (deps.inspect||inspectBuildRun)(selection,token),zip=await (deps.download||downloadBuildZip)(artifactId,token)
 if(!Buffer.isBuffer(zip)||hash(zip)!==metadata.digestZip)throw Error('digest ZIP divergente')
 const {image,receipt}=(deps.extract||extractBuildZip)(zip)
 if(!Buffer.isBuffer(image)||!Buffer.isBuffer(receipt)||receipt.length>8192)throw Error('artifact inválido')
 let info;try{info=JSON.parse(receipt.toString('utf8'))}catch{throw Error('recibo inválido')}
 if(!info||Object.keys(info).sort().join(',')!=='attempt,imageSha256,imageSize,platform,runId,sourceSha,version'||info.version!=='nxg-build-receipt-v1'||info.runId!==runId||info.attempt!==attempt||info.sourceSha!==sourceSha||info.platform!=='linux/amd64'||info.imageSize!==image.length||info.imageSha256!==hash(image))throw Error('recibo divergente')
 const work=mkdtempSync(path.join(root,'.nxg-build-verified-')),identity=lstatSync(work)
 let success=false
 try {
  const imagePath=path.join(work,'image.tar'),receiptPath=path.join(work,'receipt.json');writeFileSync(imagePath,image,{flag:'wx',mode:0o600});writeFileSync(receiptPath,receipt,{flag:'wx',mode:0o600})
  const attestPolicy={repo:policy.repo,signerWorkflow:'RafaCartaxo/nxgest/.github/workflows/ci.yml',issuer:'https://token.actions.githubusercontent.com',sourceRef:'refs/heads/main',sourceSha,signerSha,runId,attempt,ghPath,ghSha256}
  for(const file of [imagePath,receiptPath])if(!(deps.attest||verifyBuildAttestation)(file,attestPolicy).attestationValid)throw Error('atestação inválida')
  if(hash(readFileSync(imagePath))!==info.imageSha256||hash(readFileSync(receiptPath))!==hash(receipt))throw Error('arquivos alterados')
  success=true;return Object.freeze({verified:true,fixture,runId,attempt,artifactId,sourceSha,zipSha256:metadata.digestZip,imageSha256:info.imageSha256,imagePath,receiptPath})
 } finally {if(!success){const st=lstatSync(work);if(!st.isDirectory()||st.isSymbolicLink()||st.dev!==identity.dev||st.ino!==identity.ino)throw Error('limpeza recusada');rmSync(work,{recursive:true})}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2)
 if(!((a.length===4&&a[0]==='verify')||(a.length===6&&a[0]==='verify-event'))){console.error('Uso: verify POLITICA SHA256 DECISAO | verify-event POLITICA SHA256 DECISAO RUN_ID SHA');process.exitCode=2}
 else verifyBuildArtifact({policyPath:a[1],policyHash:a[2],decision:a[3],eventRunId:a[4],eventSha:a[5],token:process.env.GH_TOKEN}).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('Verificação de artifact falhou');process.exitCode=1})
}
