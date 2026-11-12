import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,copyFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {fixtureJq} from './host-jq-fixture.mjs'
const sha='a'.repeat(40),id='sha256:'+'b'.repeat(64)
test('loader usa tar íntegro, lock e ID observado; digest divergente bloqueia Docker',()=>{
 const tmp=mkdtempSync(path.join(process.cwd(),'.load-image-fixture-'))
 try{
  mkdirSync(path.join(tmp,'bin'));mkdirSync(path.join(tmp,'archive'));mkdirSync(path.join(tmp,'scripts'));assert.equal(spawnSync('git',['init','-q',tmp]).status,0);for(const f of ['host-jq.sh','load-verified-image.sh'])copyFileSync(path.join(process.cwd(),'scripts',f),path.join(tmp,'scripts',f));fixtureJq(tmp,tmp)
  writeFileSync(path.join(tmp,'archive/manifest.json'),JSON.stringify([{Config:'config.json',RepoTags:[`nxgest-build:${sha}`],Layers:['a/layer.tar']}]))
  assert.equal(spawnSync('/usr/bin/tar',['-cf',path.join(tmp,'image.tar'),'-C',path.join(tmp,'archive'),'manifest.json']).status,0)
  const d='sha256:'+createHash('sha256').update(readFileSync(path.join(tmp,'image.tar'))).digest('hex'),log=path.join(tmp,'calls')
  writeFileSync(path.join(tmp,'bin/docker'),`#!/bin/sh\nprintf '%s\\n' "$*" >> "$FIXTURE_LOG"\ncase "$*" in *load*) touch "$FIXTURE_LOG.loaded";; *inspect*) [ -f "$FIXTURE_LOG.loaded" ] || [ "\${FIXTURE_PREEXIST:-0}" = 1 ] || exit 1; printf '%s\\n' '${id}';; esac\n`,{mode:0o700})
  const run=(digest,preexist='0')=>spawnSync('/bin/bash',['-c','exec 9>"$1/lock"; flock -n 9; bash scripts/load-verified-image.sh "$1/image.tar" "$2" "$3"','fixture',tmp,digest,sha],{cwd:tmp,encoding:'utf8',env:{PATH:`${tmp}/bin:/usr/bin:/bin`,FIXTURE_LOG:log,FIXTURE_PREEXIST:preexist}})
  let r=run('sha256:'+'0'.repeat(64));assert.notEqual(r.status,0);assert.equal(existsSync(log),false)
  r=run(d,'1');assert.notEqual(r.status,0);assert.doesNotMatch(readFileSync(log,'utf8'),/^image load/m)
  r=run(d);assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),id);const calls=readFileSync(log,'utf8');assert.match(calls,/image load --input/);assert.match(calls,/image inspect/);assert.doesNotMatch(calls,/(^|\n)(pull|build|image pull|image build)( |\n)/)
 }finally{rmSync(tmp,{recursive:true,force:true})}
})
