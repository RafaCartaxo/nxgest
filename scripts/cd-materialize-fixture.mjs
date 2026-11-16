// Fixture local: chamada com dependências injetadas, sem rede nem GH.
import {createHash} from 'node:crypto'
import {copyFileSync,lstatSync,rmSync,readFileSync} from 'node:fs'
import path from 'node:path'
import {verifyBuildArtifact} from './verify-build-artifact.mjs'
const sha=process.argv[2], run=process.argv[3]||'7', artifact=process.argv[4]||'8'
if(!/^[a-f0-9]{40}$/.test(sha||'')||!/^\d+$/.test(run)||!/^\d+$/.test(artifact))throw Error('sha sintético inválido')
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
const image=process.argv[5] ? readFileSync(process.argv[5]) : Buffer.from('synthetic artifact\n'),zip=Buffer.from('synthetic zip')
const receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:run,attempt:1,sourceSha:sha,platform:'linux/amd64',imageSize:image.length,imageSha256:hash(image)}))
const policy={version:'nxg-build-v1',decision:'fixture',repo:'RafaCartaxo/nxgest',runId:run,attempt:1,artifactId:artifact,sourceSha:sha,signerSha:'b'.repeat(40),workflowId:'9',ghPath:'/guard/gh',ghSha256:'sha256:'+'c'.repeat(64)}
const deps={readPolicy:()=>policy,inspect:async()=>({digestZip:hash(zip)}),download:async()=>zip,extract:()=>({image,receipt}),attest:()=>({attestationValid:true})}
const result=await verifyBuildArtifact({decision:'fixture',token:'fixture'},deps)
if(!result.verified||!result.fixture||result.sourceSha!==sha||result.imageSha256!==hash(image))throw Error('fixture divergente')
const dir=path.dirname(result.imagePath),identity=lstatSync(dir)
try{copyFileSync(result.imagePath,'/work/entry.tar');process.stdout.write(result.zipSha256+'\n')}finally{const now=lstatSync(dir);if(now.ino!==identity.ino||now.dev!==identity.dev)throw Error('fixture substituída');rmSync(dir,{recursive:true})}
