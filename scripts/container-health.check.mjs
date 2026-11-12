import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import path from 'node:path'
const image='sha256:'+'a'.repeat(64)
test('health usa porta do container, valida JSON e detecta troca de ID sem rede',()=>{
 const dir=mkdtempSync(path.join(process.cwd(),'.health-fixture-'))
 try{
  mkdirSync(path.join(dir,'bin'))
  const preload=path.join(dir,'http-fake.cjs')
  writeFileSync(preload,`const http=require('http'),{EventEmitter}=require('events');http.get=(opts,cb)=>{if(opts.port!==Number(process.env.PORT)||opts.host!=='127.0.0.1'||opts.path!=='/api/health')throw Error('unexpected route');const req=new EventEmitter();req.destroy=()=>{};process.nextTick(()=>{if(process.env.FAKE_MODE==='unavailable'||opts.port!==8081){req.emit('error',new Error('fake'));return}const res=new EventEmitter();res.statusCode=200;res.setEncoding=()=>{};cb(res);process.nextTick(()=>{res.emit('data',JSON.stringify(process.env.FAKE_MODE==='negative'?{status:'error',db:'disconnected'}:{status:'ok',db:'connected'}));res.emit('end')})});return req};`)
  writeFileSync(path.join(dir,'bin/docker'),`#!/bin/bash\nif [ "$1" = inspect ]; then\n if [[ "$*" == *'{{.Id}}'* ]]; then if [ "\${FAKE_SWAP:-0}" = 1 ] && [ -f "$FAKE_SEEN" ]; then printf '%064d\\n' 2; else touch "$FAKE_SEEN"; printf '%064d\\n' 1; fi; else printf '%s\\n' '${image}'; fi; exit 0; fi\nif [ "$1" = exec ]; then shift 3; export PORT="\${FAKE_PORT:-8081}" NODE_OPTIONS="--require=$FAKE_PRELOAD"; exec "${process.execPath}" "$@"; fi\nexit 97\n`,{mode:0o700})
  const run=(mode,port='8081',swap='0')=>{const seen=path.join(dir,`seen-${mode}-${port}-${swap}`);return spawnSync('bash',['scripts/container-health.sh','staging-app',image],{encoding:'utf8',env:{PATH:`${dir}/bin:${process.env.PATH}`,FAKE_MODE:mode,FAKE_PORT:port,FAKE_SWAP:swap,FAKE_SEEN:seen,FAKE_PRELOAD:preload}})}
  assert.equal(run('positive').status,0)
  for(const [mode,port,swap] of [['negative','8081','0'],['unavailable','8081','0'],['positive','bad','0'],['positive','9999','0'],['positive','8081','1']]){const r=run(mode,port,swap);assert.notEqual(r.status,0);assert.equal(r.stdout,'');assert.equal(r.stderr,'')}
 }finally{rmSync(dir,{recursive:true,force:true})}
})
