import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {verifyStagingReceipt} from './verify-staging-receipt.mjs'
import {zip} from './build-zip-fixture.mjs'
const sha=b=>'sha256:'+createHash('sha256').update(b).digest('hex'),p={version:'nxg-staging-policy-v1',decision:'QA/fixture',workflowId:'88',candidateSha:'a'.repeat(40),signerSha:'b'.repeat(40),sourceSha:'c'.repeat(40),ghPath:'/guard/gh',ghSha256:'sha256:'+'d'.repeat(64)},opts={decision:p.decision,runId:'77',token:'fixture'},base={version:'nxg-staging-v1',sha:p.candidateSha,ciRun:'12',ciAttempt:1,artifact:'34',zip:'sha256:'+'e'.repeat(64),tar:'sha256:'+'f'.repeat(64),image:'sha256:'+'0'.repeat(64),stagingRun:'77',stagingAttempt:1,health:'ok',db:'connected'}
function deps(r=base,extra={}){const data=Buffer.from(JSON.stringify(r)),z=zip(['staging-receipt.json'],[0o100600],[data]);return {readPolicy:()=>p,inspect:async()=>({artifactId:'99',digestZip:sha(z)}),download:async()=>z,attest:()=>({attestationValid:true}),...extra}}
test('recibo atestado e seleção staging são verificados em fixture',async()=>{const out=await verifyStagingReceipt(opts,deps());assert.equal(out.fixture,true);assert.equal(out.verified,true);assert.equal(out.ciRun,'12')})
test('replay, health, imagem e atestação divergentes bloqueiam',async()=>{for(const change of [{sha:'1'.repeat(40)},{stagingRun:'78'},{health:'bad'},{db:'bad'},{tar:'other'}])await assert.rejects(verifyStagingReceipt(opts,deps({...base,...change})));await assert.rejects(verifyStagingReceipt(opts,deps(base,{attest:()=>({attestationValid:false})})))})
