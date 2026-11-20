import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
const scripts=path.dirname(fileURLToPath(import.meta.url))
const directory=mkdtempSync(path.join(scripts,'.fingerprint-fixture-'))
const base={Config:{Env:['B=two','A=one'],Labels:{'com.docker.compose.config-hash':'old','com.docker.compose.image':'sha256:old','com.docker.compose.project.config_files':'/trusted/old.yml','com.docker.compose.replace':'old-container','com.docker.compose.project.working_dir':'/trusted',tenant:'example'}},HostConfig:{Privileged:false,ReadonlyRootfs:false,Binds:['data:/data:rw']}}
function fingerprint(value){
 const file=path.join(directory,'inspect.json');writeFileSync(file,JSON.stringify([value]))
 const r=spawnSync('/bin/bash',['-c','source "$1"; NXGEST_JQ=$(command -v jq); nxgest_production_config_hash "$2"','fixture',path.join(scripts,'recurring-host-policy.sh'),file],{encoding:'utf8'})
 assert.equal(r.status,0,r.stderr);return r.stdout.trim().split(' ')[0]
}
test('same configuration survives environment order and Compose recreation metadata',()=>{
 const next=structuredClone(base);next.Config.Env.reverse()
 Object.assign(next.Config.Labels,{'com.docker.compose.config-hash':'new','com.docker.compose.image':'sha256:new','com.docker.compose.project.config_files':'/trusted/random/new.yml','com.docker.compose.replace':'new-container'})
 assert.equal(fingerprint(next),fingerprint(base))
})
for(const [name,mutate] of [
 ['environment value',v=>{v.Config.Env[0]='B=changed'}],
 ['duplicate environment key',v=>{v.Config.Env.push('B=two')}],
 ['privileged mode',v=>{v.HostConfig.Privileged=true}],
 ['volume binding',v=>{v.HostConfig.Binds=['other:/data:rw']}],
 ['working directory label',v=>{v.Config.Labels['com.docker.compose.project.working_dir']='/other'}],
 ['application label',v=>{v.Config.Labels.tenant='other'}],
])test(`rejects drift in ${name}`,()=>{const next=structuredClone(base);mutate(next);assert.notEqual(fingerprint(next),fingerprint(base))})
process.on('exit',()=>rmSync(directory,{recursive:true,force:true}))
