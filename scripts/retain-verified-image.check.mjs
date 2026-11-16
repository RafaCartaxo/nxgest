import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,copyFileSync,rmSync} from 'node:fs'
import path from 'node:path'
const sha='a'.repeat(40), image='sha256:'+'b'.repeat(64), foreign='sha256:'+'c'.repeat(64)
function fixture(pin='') {
 const d=mkdtempSync(path.join(process.cwd(),'.retention-fixture-'));mkdirSync(path.join(d,'bin'))
 copyFileSync('scripts/retain-verified-image.sh',path.join(d,'retain.sh'))
 writeFileSync(path.join(d,'state'),JSON.stringify({temp:image,pin,running:true}))
 writeFileSync(path.join(d,'bin/docker'),`#!${process.execPath}\nconst fs=require('fs');const a=process.argv.slice(2),p=process.env.STATE,s=JSON.parse(fs.readFileSync(p)),save=()=>fs.writeFileSync(p,JSON.stringify(s));fs.appendFileSync(process.env.LOG,a.join(' ')+'\\n');const tag='nxgest-build:'+process.env.SHA,pin='nxgest-retained:'+process.env.SHA;if(a[0]!=='image')process.exit(1);if(process.env.FAIL===a[1])process.exit(71);if(a[1]==='ls'){if(s.temp)console.log(tag+'|'+s.temp);if(s.pin)console.log(pin+'|'+s.pin);process.exit(0)}if(a[1]==='inspect'){const ref=a.at(-1),id=ref===tag?s.temp:ref===pin?s.pin:ref===process.env.IMAGE?process.env.IMAGE:'';if(!id)process.exit(1);console.log(id);process.exit(0)}if(a[1]==='tag'){if(a[2]!==process.env.IMAGE||a[3]!==pin)process.exit(1);s.pin=a[2];save();if(process.env.HANG==='tag')Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000);if(process.env.AFTER==='tag')process.exit(71);process.exit(0)}if(a[1]==='rm'){if(a[2]!==tag||!s.temp||(s.running&&!s.pin))process.exit(1);s.temp='';save();if(process.env.HANG==='rm')Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000);if(process.env.AFTER==='rm')process.exit(71);process.exit(0)}process.exit(1)`,{mode:0o700})
 writeFileSync(path.join(d,'bin/timeout'),'#!/bin/sh\nshift\nexec /usr/bin/timeout 0.8s "$@"\n',{mode:0o700})
 const env={...process.env,PATH:`${d}/bin:${process.env.PATH}`,STATE:path.join(d,'state'),LOG:path.join(d,'log'),SHA:sha,IMAGE:image}
 return {d,env,state:()=>JSON.parse(readFileSync(path.join(d,'state'))),run:()=>spawnSync('/bin/bash',['-c','exec 9>lock; flock -n 9; bash retain.sh "$SHA" "$IMAGE"'],{cwd:d,env,encoding:'utf8'})}
}
test('modelo recusa última tag em uso; helper cria pin e remove somente temporária',()=>{const f=fixture();try{const r=spawnSync('docker',['image','rm',`nxgest-build:${sha}`],{cwd:f.d,env:f.env});assert.notEqual(r.status,0);assert.equal(f.state().temp,image);const done=f.run();assert.equal(done.status,0,done.stderr);assert.deepEqual(f.state(),{temp:'',pin:image,running:true})}finally{rmSync(f.d,{recursive:true,force:true})}})
test('pin exato é reutilizado e colisão divergente não remove nem retagia',()=>{for(const pin of [image,foreign]){const f=fixture(pin);try{const r=f.run();assert.equal(r.status,pin===image?0:1,r.stderr);const log=readFileSync(f.env.LOG,'utf8');assert.doesNotMatch(log,/image tag/);if(pin===foreign){assert.equal(f.state().temp,image);assert.doesNotMatch(log,/image rm/)}}finally{rmSync(f.d,{recursive:true,force:true})}}})

test('origem ausente e falhas em listagem, inspeção, tag ou untag não retornam sucesso',()=>{for(const mode of ['missing','ls','inspect','tag','rm']){const f=fixture();try{if(mode==='missing')writeFileSync(path.join(f.d,'state'),JSON.stringify({temp:'',pin:'',running:true}));else f.env.FAIL=mode;const r=f.run();assert.notEqual(r.status,0,mode);const s=f.state();if(mode!=='missing')assert.equal(s.temp,image);if(mode==='rm')assert.equal(s.pin,image)}finally{rmSync(f.d,{recursive:true,force:true})}}})

test('timeout ou erro após efeito em pin e untag falha fechado e mantém evidência',()=>{for(const type of ['HANG','AFTER'])for(const op of ['tag','rm']){const f=fixture();try{f.env[type]=op;const r=f.run();assert.notEqual(r.status,0,`${type}/${op}`);assert.equal(f.state().pin,image);assert.equal(f.state().temp,op==='tag'?image:'');assert.doesNotMatch(r.stdout,/sucesso|receipt/i)}finally{rmSync(f.d,{recursive:true,force:true})}}})

test('sonda de propagação de falha do gate isolado',()=>{if(process.env.NXG_GATE_NEGATIVE_PROBE==='1')assert.fail('NXG036_GATE_FAILURE_INJECTED')})
