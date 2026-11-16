// Apenas fixture: dependências injetadas e identidade sintética, sem rede ou credenciais reais.
import {createHash} from 'node:crypto'
import {verifyProductionSource} from './production-post-baseline-source.mjs'
const sha=process.argv[2];if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('fixture inválida')
const h=b=>'sha256:'+createHash('sha256').update(b).digest('hex'),signer='b'.repeat(40),gh='sha256:'+'c'.repeat(64),image=Buffer.from('imagem sintética'),zip=Buffer.from('zip fixture'),szip=Buffer.from('stage fixture')
const p={version:'nxg-build-base-v1',expiresAt:'2099-01-01T00:00:00.000Z',decision:'fixture',repo:'RafaCartaxo/nxgest',sourceSha:sha,signerSha:signer,workflowId:'56',ghPath:'/guard/gh',ghSha256:gh}
const sp={version:'nxg-staging-policy-v1',decision:'fixture',workflowId:'88',candidateSha:sha,signerSha:signer,sourceSha:sha,ghPath:'/guard/gh',ghSha256:gh}
const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:'7',attempt:1,sourceSha:sha,platform:'linux/amd64',imageSize:image.length,imageSha256:h(image)}))
const stage=Buffer.from(JSON.stringify({version:'nxg-staging-v1',sha,ciRun:'7',ciAttempt:1,artifact:'8',zip:h(zip),tar:h(image),image:'sha256:'+'a'.repeat(64),stagingRun:'9',stagingAttempt:1,health:'ok',db:'connected'}))
const deps={stageDeps:{readPolicy:()=>sp,inspect:async()=>({artifactId:'99',digestZip:h(szip)}),download:async()=>szip,extract:()=>({receipt:stage}),attest:()=>({attestationValid:true})},buildDeps:{readPolicy:()=>p,resolve:async()=>({runId:'7',attempt:1,artifactId:'8',sha,workflowId:'56'}),inspect:async()=>({digestZip:h(zip)}),download:async()=>zip,extract:()=>({image,receipt}),attest:()=>({attestationValid:true})}}
const out=await verifyProductionSource({stage:{decision:'fixture',runId:'9',token:'token-falso'},build:{decision:'fixture',token:'token-falso'}},deps)
if(!out.fixture||out.operationalReady!==false)throw Error('fixture inválida')
console.log(JSON.stringify(out))
