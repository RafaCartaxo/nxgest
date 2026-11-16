// Isolated fixture: calls both production source verifiers with injected providers.
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {verifyProductionSource} from './production-post-baseline-source.mjs'
const [sha,file,image,out,run='7',artifact='8',stagingRun='9']=process.argv.slice(2)
if(!/^[a-f0-9]{40}$/.test(sha||'')||!/^sha256:[a-f0-9]{64}$/.test(image||'')||!file||!out)throw Error('fixture inválida')
const hash=x=>'sha256:'+createHash('sha256').update(x).digest('hex')
const bytes=readFileSync(file),zip=Buffer.from('synthetic zip'),stageZip=Buffer.from('staging zip sintético'),signer='b'.repeat(40),gh='sha256:'+'c'.repeat(64)
const buildPolicy={version:'nxg-build-base-v1',expiresAt:'2099-01-01T00:00:00.000Z',decision:'fixture',repo:'RafaCartaxo/nxgest',sourceSha:sha,signerSha:signer,workflowId:'56',ghPath:'/guard/gh',ghSha256:gh}
const stagingPolicy={version:'nxg-staging-policy-v1',decision:'fixture',workflowId:'88',candidateSha:sha,signerSha:signer,sourceSha:sha,ghPath:'/guard/gh',ghSha256:gh}
const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:run,attempt:1,sourceSha:sha,platform:'linux/amd64',imageSize:bytes.length,imageSha256:hash(bytes)}))
const stage=Buffer.from(JSON.stringify({version:'nxg-staging-v1',sha,ciRun:run,ciAttempt:1,artifact,zip:hash(zip),tar:hash(bytes),image,stagingRun,stagingAttempt:1,health:'ok',db:'connected'}))
const selected=await verifyProductionSource({stage:{decision:'fixture',runId:stagingRun,token:'fixture'},build:{decision:'fixture',token:'fixture'}},{stageDeps:{readPolicy:()=>stagingPolicy,inspect:async()=>({artifactId:'99',digestZip:hash(stageZip)}),download:async()=>stageZip,extract:()=>({receipt:stage}),attest:()=>({attestationValid:true})},buildDeps:{readPolicy:()=>buildPolicy,resolve:async()=>({runId:run,attempt:1,artifactId:artifact,sha,workflowId:'56'}),inspect:async()=>({digestZip:hash(zip)}),download:async()=>zip,extract:()=>({image:bytes,receipt}),attest:()=>({attestationValid:true})}})
if(!selected.verified||!selected.fixture||selected.operationalReady||selected.tar===selected.image)throw Error('seleção fixture divergente')
writeFileSync(out,JSON.stringify(selected),{mode:0o600})
