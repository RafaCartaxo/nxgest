import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
const old='sha256:'+'a'.repeat(64),next='sha256:'+'b'.repeat(64),controller='c'.repeat(40)
const expiry=String(Math.floor(Date.now()/1000)+3600),decision='approved-rotation'
function fixture(){
 const dir=mkdtempSync(path.join(process.cwd(),'.policy-transition-test-'))
 const record=path.join(dir,`nxgest-staging-policy-transition-${old.slice(7)}-${next.slice(7)}`)
 const lines=['version=staging-policy-transition-v1','environment=staging',`from=${old}`,`to=${next}`,`controller=${controller}`,`decision=${decision}`,`expires_epoch=${expiry}`]
 const check=(previous=old,extra={})=>spawnSync('/bin/bash',['-c','source "$1"; nxgest_staging_previous_base_allowed "$2"','fixture',path.resolve('scripts/recurring-host-policy.sh'),previous],{env:{...process.env,NXGEST_GITDIR:dir,NXGEST_BASE_HASH:next,NXGEST_APPROVED_CONTROLLER:controller,NXGEST_BASE_DECISION:decision,NXGEST_BASE_EXPIRY:expiry,...extra},encoding:'utf8'})
 const save=(values=lines)=>writeFileSync(record,values.join('\n')+'\n',{mode:0o600})
 return {dir,record,lines,check,save,cleanup:()=>rmSync(dir,{recursive:true,force:true})}
}
test('same base needs no transition, different base fails closed without approval',()=>{
 const f=fixture();try{assert.equal(f.check(next).status,0);assert.notEqual(f.check().status,0)}finally{f.cleanup()}
})
test('approved rotation accepts the exact prior hash without changing prior evidence',()=>{
 const f=fixture();try{f.save();assert.equal(f.check().status,0);assert.notEqual(f.check('sha256:'+'d'.repeat(64)).status,0)}finally{f.cleanup()}
})
for(const field of [0,1,2,3,4,5,6])test(`transition rejects a divergent field ${field}`,()=>{
 const f=fixture();try{const lines=[...f.lines];lines[field]+='wrong';f.save(lines);assert.notEqual(f.check().status,0)}finally{f.cleanup()}
})
test('transition rejects extra lines, writable files, symlinks and expired approval',()=>{
 const f=fixture();try{
  f.save([...f.lines,'extra=unapproved']);assert.notEqual(f.check().status,0)
  f.save();chmodSync(f.record,0o644);assert.notEqual(f.check().status,0)
  rmSync(f.record);const source=path.join(f.dir,'source');writeFileSync(source,f.lines.join('\n')+'\n',{mode:0o600});symlinkSync(source,f.record);assert.notEqual(f.check().status,0)
  rmSync(f.record);const expired=String(Math.floor(Date.now()/1000)-1);const lines=[...f.lines];lines[6]='expires_epoch='+expired;f.save(lines);assert.notEqual(f.check(old,{NXGEST_BASE_EXPIRY:expired}).status,0)
 }finally{f.cleanup()}
})
