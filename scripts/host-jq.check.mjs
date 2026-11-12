import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,copyFileSync,rmSync,writeFileSync,chmodSync,symlinkSync,existsSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {fixtureJq} from './host-jq-fixture.mjs'

test('jq controlado: ausência, hash, permissões e symlinks falham antes de qualquer Docker',()=>{
 for(const variant of ['ok','missing','hash','file-mode','dir-mode','file-link','dir-link']){
  const root=mkdtempSync(path.join(process.cwd(),'.jq-check-'))
  try {
   assert.equal(spawnSync('git',['init','-q',root]).status,0);mkdirSync(path.join(root,'scripts'))
   for(const f of ['host-jq.sh','load-verified-image.sh'])copyFileSync(path.join(process.cwd(),'scripts',f),path.join(root,'scripts',f))
   fixtureJq(root,root);const dir=path.join(root,'.git/nxgest-tools'), jq=path.join(dir,'jq')
   if(variant==='missing')rmSync(jq)
   if(variant==='hash')writeFileSync(jq,'#!/bin/sh\nexit 0\n')
   if(variant==='file-mode')chmodSync(jq,0o722)
   if(variant==='dir-mode')chmodSync(dir,0o722)
   if(variant==='file-link'){rmSync(jq);symlinkSync('/usr/bin/jq',jq)}
   if(variant==='dir-link'){rmSync(dir,{recursive:true});symlinkSync('/usr/bin',dir)}
   const check=spawnSync('/bin/bash',['-c','source scripts/host-jq.sh; nxgest_use_jq'],{cwd:root,encoding:'utf8'})
   assert.equal(check.status===0,variant==='ok',variant)
   if(variant!=='ok'){
    const log=path.join(root,'calls');mkdirSync(path.join(root,'bin'));writeFileSync(path.join(root,'bin/docker'),'#!/bin/sh\ntouch "$FIXTURE_LOG"\n',{mode:0o700})
    const result=spawnSync('/bin/bash',['scripts/load-verified-image.sh','x','x','x'],{cwd:root,env:{PATH:`${root}/bin:/usr/bin:/bin`,FIXTURE_LOG:log}})
    assert.notEqual(result.status,0);assert.equal(existsSync(log),false,variant)
   }
  }finally{rmSync(root,{recursive:true,force:true})}
 }
})
