import {test} from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {gzipSync,gunzipSync} from 'node:zlib'
import {mkdtempSync,readFileSync,rmSync} from 'node:fs'
import path from 'node:path'
import {verifyFixtureEnvelope,fixtureCanonical} from './baseline-evidence-fixture.mjs'
import {extractSynthetic} from './synthetic-safe-extract.mjs'
import {reconcileFixture} from './reconcile-fixture.mjs'
function tar(name,content,type='0') {
 const h=Buffer.alloc(512), b=Buffer.from(content); h.write(name,0,100);h.write('0000600\0',100);h.write('0000000\0',108);h.write('0000000\0',116);h.write(b.length.toString(8).padStart(11,'0')+'\0',124);h.write('00000000000\0',136);h.fill(32,148,156);h[156]=type.charCodeAt(0);h.write('ustar\0',257);h.write('00',263);let sum=0;for(const c of h)sum+=c;h.write(sum.toString(8).padStart(6,'0')+'\0 ',148);return gzipSync(Buffer.concat([h,b,Buffer.alloc((512-b.length%512)%512),Buffer.alloc(1024)]))
}
test('política sintética autentica sujeito e recusa emissor, replay, mistura e assinatura inválida',()=>{
 const pair=generateKeyPairSync('ed25519'), other=generateKeyPairSync('ed25519')
 const payload={issuer:'fixture-ci',verifier:'fixture-verifier',policy:'fixture-only-v1',run:'run-a',bundle:'bundle-a',environment:'fixture',sha:'a'.repeat(40),artifact:'sha256:'+'b'.repeat(64),image:'sha256:'+'c'.repeat(64),schema:'schema-a',config:'config-a',mounts:'mount-a',strategy:'data',integrity:'verified',health:'ok',issued:10,expires:20}
 const signed=p=>({payload:p,signature:sign(null,Buffer.from(fixtureCanonical(p)),pair.privateKey).toString('base64')})
 const env=signed(payload)
 assert.deepEqual(verifyFixtureEnvelope(env,payload,pair.publicKey,15),{fixtureOnly:true,operationalReady:false})
 assert.throws(()=>verifyFixtureEnvelope(env,payload,other.publicKey,15));assert.throws(()=>verifyFixtureEnvelope(env,payload,pair.publicKey,20))
 for(const key of ['run','bundle','environment','artifact','image','sha','schema','config','mounts','strategy']) assert.throws(()=>verifyFixtureEnvelope(env,{...payload,[key]:'different'},pair.publicKey,15))
 for(const change of [{issuer:'untrusted'},{verifier:'untrusted'},{policy:'other'},{health:'error'},{integrity:'missing'}])assert.throws(()=>verifyFixtureEnvelope(signed({...payload,...change}),payload,pair.publicKey,15))
 assert.throws(()=>verifyFixtureEnvelope({...env,payload:{...payload,run:'altered'}},payload,pair.publicKey,15))
})
test('tar sintético extrai e reconcilia; rejeita travessia, links, corrupção e ausências',()=>{
 const root=mkdtempSync(path.join(process.cwd(),'.baseline-fixture-'))
 try {extractSynthetic(tar('client/a','abc'),root);assert.equal(readFileSync(path.join(root,'client/a'),'utf8'),'abc');assert.equal(reconcileFixture([{caminho:'client/a',tamanho:3}],root).references,1);assert.throws(()=>reconcileFixture([{caminho:'client/missing',tamanho:3}],root))}finally{rmSync(root,{recursive:true,force:true})}
 for(const [name,type] of [['../outside','0'],['/absolute','0'],['symlink','2']]) {const d=mkdtempSync(path.join(process.cwd(),'.baseline-fixture-'));try{assert.throws(()=>extractSynthetic(tar(name,'',type),d))}finally{rmSync(d,{recursive:true,force:true})}}
 const d=mkdtempSync(path.join(process.cwd(),'.baseline-fixture-'));try{assert.throws(()=>extractSynthetic(Buffer.from('invalid'),d))}finally{rmSync(d,{recursive:true,force:true})}
})

test('ustar recusa magic ausente ou inválido e versão inválida mesmo com checksum válido',()=>{
 for (const [magic,version] of [[Buffer.alloc(6),Buffer.from('00')],[Buffer.from('xstar\0'),Buffer.from('00')],[Buffer.from('ustar\0'),Buffer.from('01')]]) {
  const data=gunzipSync(tar('fixture','ok'));magic.copy(data,257);version.copy(data,263);data.fill(32,148,156)
  let sum=0;for(const byte of data.subarray(0,512))sum+=byte
  data.write(sum.toString(8).padStart(6,'0')+'\0 ',148)
  const root=mkdtempSync(path.join(process.cwd(),'.baseline-fixture-'))
  try {assert.throws(()=>extractSynthetic(gzipSync(data),root),/formato ustar inválido/)} finally {rmSync(root,{recursive:true,force:true})}
 }
})

test('orquestração dublada exige quiescência e associação do mesmo conjunto',async()=>{
 const {runSyntheticRehearsal}=await import('./synthetic-rehearsal.mjs')
 const run='nxg-ct011-0123456789abcdef', req={run,quiescence:'fixture-controlled'}
 const adapter={kind:'synthetic-double',capture:async c=>({bundle:c.bundle,complete:true}),copy:async(c)=>({bundle:c.bundle,verified:true}),restore:async(c)=>({bundle:c.bundle,database:'fixture-restored',attachments:'fixture-reconciled'})}
 assert.deepEqual(await runSyntheticRehearsal(adapter,req),{fixtureOnly:true,operationalReady:false,bundle:`${run}-bundle`})
 await assert.rejects(()=>runSyntheticRehearsal(adapter,{...req,quiescence:'unknown'}))
 for(const phase of ['capture','copy','restore']) {const fake={...adapter,[phase]:async()=>({bundle:'different',complete:true,verified:true,database:'fixture-restored',attachments:'fixture-reconciled'})};await assert.rejects(()=>runSyntheticRehearsal(fake,req))}
 await assert.rejects(()=>runSyntheticRehearsal({...adapter,kind:'docker'},req))
})
