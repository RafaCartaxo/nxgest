import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readFileSync,readdirSync,rmSync,existsSync,symlinkSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {createHash} from 'node:crypto'
const root=process.cwd()
function fixture(){
 const dir=mkdtempSync(path.join(root,'.backup-maintenance-test-')),scripts=path.join(dir,'scripts'),bin=path.join(dir,'bin')
 mkdirSync(scripts);mkdirSync(bin);mkdirSync(path.join(dir,'.git'));writeFileSync(path.join(dir,'.git/nxgest-deploy.lock'),'')
 mkdirSync(path.join(dir,'data/uploads'),{recursive:true});writeFileSync(path.join(dir,'data/uploads/proof.txt'),'fixture')
 for(const f of ['backup-maintenance-common.sh','backup-maintenance.sh','backup-restore-check.sh','verify-backup.sh'])copyFileSync(path.join(root,'scripts',f),path.join(scripts,f))
 writeFileSync(path.join(scripts,'host-jq.sh'),'nxgest_use_jq(){ NXGEST_JQ=$(command -v jq); }\n')
 writeFileSync(path.join(scripts,'container-health.sh'),'exit 0\n')
 const state={running:true,events:[]};writeFileSync(path.join(dir,'state.json'),JSON.stringify(state))
 writeFileSync(path.join(dir,'docker.cjs'),`#!/usr/bin/env node
const fs=require('node:fs'),cp=require('node:child_process');const a=process.argv.slice(2),d=process.env.FIXTURE,s=JSON.parse(fs.readFileSync(d+'/state.json'));s.events.push(a[0]+' '+(a[1]||''));
function out(x){fs.writeFileSync(d+'/state.json',JSON.stringify(s));if(x!==undefined)process.stdout.write(x);process.exit(0)}
const A='a'.repeat(64),I='sha256:'+'b'.repeat(64),D='c'.repeat(64),P='sha256:'+'d'.repeat(64);
if(a[0]==='inspect') {const f=a[2],target=a.at(-1),db=target==='nxgest-postgres'||target===D;
 if(f==='{{.Id}}')out(db?D:A);if(f==='{{.Image}}')out(db?P:I);if(f==='{{.State.Running}}')out(s.running?'true':'false');if(f==='{{.State.Status}}')out(s.running?'running':'exited');
 if(f==='{{.Id}}|{{.Image}}')out(A+'|'+I);if(f.includes('PortBindings'))out('{}');if(f==='{{json .Mounts}}')out(JSON.stringify([{Type:'volume',Name:'fixture_data',Destination:'/data',RW:true}]));
 if(f.includes('.Type'))out('volume|fixture_data|/data|true\\n');if(f.includes('.Source'))out('/fixture/uploads');out('image|/app|node|fixture|unless-stopped');}
if(a[0]==='stop'){s.running=false;out()}if(a[0]==='start'){s.running=true;out()}
if(a[0]==='image'){if(a[1]==='inspect'&&a.includes('--format'))out(I);out()}
if(a[0]==='exec'){
 if(a.includes('printenv'))out(a.at(-1)==='POSTGRES_USER'?'fixture':a.at(-1)==='POSTGRES_DB'?'fixture':'synthetic-password');
 if(a.includes('psql')){if(a.some(x=>x.includes('pg_stat_activity')))out(process.env.FAULT==='clients'?'1':'0');if(a.some(x=>x.includes('json_agg')))out('[]');out('fixture|1|hash\\n')}
 if(a.includes('pg_dump')){if(process.env.FAULT==='dump'){fs.writeFileSync(d+'/state.json',JSON.stringify(s));process.exit(43)}out('synthetic-dump')}
 if(a.includes('pg_restore'))out();}
if(a[0]==='run'){
 if(a.includes('node'))out(JSON.stringify({files:[{path:'proof.txt',size:7,sha256:'fixture'}],referenced:0,orphans:1}));
 if(a.includes('tar')){const r=cp.spawnSync('tar',['-C',d+'/data','-czf','-','uploads']);fs.writeFileSync(d+'/state.json',JSON.stringify(s));process.stdout.write(r.stdout);process.exit(r.status)} }
process.stderr.write('unexpected mock command');process.exit(97)
`,{mode:0o700})
 writeFileSync(path.join(bin,'docker'),'#!/bin/sh\nexec node "$FIXTURE/docker.cjs" "$@"\n',{mode:0o700})
 const env={...process.env,PATH:bin+':'+process.env.PATH,FIXTURE:dir,NXGEST_PROJECT_DIR:dir,NXGEST_BACKUP_DIR:path.join(dir,'backups')}
 return {dir,scripts,env,state:()=>JSON.parse(readFileSync(path.join(dir,'state.json'),'utf8')),cleanup:()=>rmSync(dir,{recursive:true,force:true})}
}
for(const fault of ['', 'dump','clients'])test(`maintenance ${fault||'success'} resumes the same application and preserves source files`,()=>{
 const f=fixture();try{
  const r=spawnSync('/bin/bash',[path.join(f.scripts,'backup-maintenance.sh')],{env:{...f.env,FAULT:fault},encoding:'utf8',timeout:20000})
  if(fault)assert.notEqual(r.status,0,r.stderr);else assert.equal(r.status,0,r.stderr);assert.equal(f.state().running,true)
  assert.equal(readFileSync(path.join(f.dir,'data/uploads/proof.txt'),'utf8'),'fixture')
  const completed=readdirSync(path.join(f.dir,'backups')).filter(n=>!n.startsWith('.'))
  assert.equal(completed.length,fault?0:1)
  const events=f.state().events;assert.ok(events.indexOf('stop --time')<events.indexOf('start '+'a'.repeat(64)))
  if(!fault){
   const bundle=path.join(f.dir,'backups',completed[0]);assert.match(r.stdout,/BACKUP_COMPLETE/)
   const verified=spawnSync('/bin/bash',[path.join(f.scripts,'verify-backup.sh'),bundle],{env:f.env,encoding:'utf8'})
   assert.equal(verified.status,0,verified.stderr)
   writeFileSync(path.join(bundle,'database.dump'),'tampered')
   writeFileSync(path.join(f.dir,'state.json'),JSON.stringify({running:true,events:[]}))
   const bad=spawnSync('/bin/bash',[path.join(f.scripts,'backup-restore-check.sh'),bundle],{env:f.env,encoding:'utf8'})
   assert.notEqual(bad.status,0);assert.equal(f.state().events.length,0,'tamper must fail before any Docker operation')
  }
 }finally{f.cleanup()}
})

for(const mode of ['original','imported','tampered','ambiguous'])test(`restore image identity ${mode}: binds imported image to source configuration`,()=>{
 const dir=mkdtempSync(path.join(root,'.backup-maintenance-test-'))
 try{
  const bin=path.join(dir,'bin'),tree=path.join(dir,'tree');mkdirSync(bin);mkdirSync(tree)
  const bytes=Buffer.from('{"rootfs":{"type":"layers","diff_ids":[]},"config":{"Env":["FIXTURE=only"]}}')
  const expected='sha256:'+createHash('sha256').update(bytes).digest('hex'),candidate=mode==='original'?expected:'sha256:'+'f'.repeat(64)
  const config='blobs/sha256/'+expected.slice(7);mkdirSync(path.dirname(path.join(tree,config)),{recursive:true})
  writeFileSync(path.join(tree,config),mode==='tampered'?'changed configuration':bytes)
  writeFileSync(path.join(tree,'manifest.json'),JSON.stringify(Array.from({length:mode==='ambiguous'?2:1},()=>({Config:config,RepoTags:[],Layers:[]}))))
  const archive=path.join(dir,'export.tar');assert.equal(spawnSync('tar',['-cf',archive,'-C',tree,'manifest.json',config]).status,0)
  writeFileSync(path.join(bin,'docker'),'#!/bin/sh\nif [ "$2" = inspect ];then printf "%s\\n" "$FIXTURE_IMAGE";elif [ "$2" = save ];then cat "$FIXTURE_ARCHIVE";else exit 97;fi\n',{mode:0o700})
  const checked=path.join(dir,'check.tar')
  const r=spawnSync('/bin/bash',['-c','source "$1"; NXGEST_JQ=$(command -v jq); nxg_backup_restore_image "$2" "$3" "$4"','fixture',path.join(root,'scripts/backup-maintenance-common.sh'),expected,candidate,checked],{env:{...process.env,PATH:bin+':'+process.env.PATH,FIXTURE_IMAGE:candidate,FIXTURE_ARCHIVE:archive},encoding:'utf8'})
  if(['original','imported'].includes(mode)){assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),candidate);assert.equal(existsSync(checked),false)}
  else assert.notEqual(r.status,0,'different configuration or ambiguous export must not authorize an image')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ['newest','empty','symlink','corrupt-newest'])test(`periodic restore selection ${mode}: complete immutable names only, no hidden fallback`,()=>{
 const dir=mkdtempSync(path.join(root,'.backup-maintenance-test-'))
 try{
  const older='20260101T020001Z-1-1',newer='20260102T020001Z-2-2'
  function bundle(id,marker=id){mkdirSync(path.join(dir,id));writeFileSync(path.join(dir,id,'COMPLETE'),marker)}
  if(mode!=='empty')bundle(older)
  if(mode==='newest'||mode==='corrupt-newest')bundle(newer,mode==='corrupt-newest'?'bad':newer)
  if(mode==='symlink')symlinkSync(path.join(dir,older),path.join(dir,newer))
  mkdirSync(path.join(dir,'.partial-20270101'));writeFileSync(path.join(dir,'.partial-20270101/COMPLETE'),'unpublished')
  const r=spawnSync('/bin/bash',['-c','source "$1"; BACKUP_DIR=$2; nxg_backup_latest','fixture',path.join(root,'scripts/backup-maintenance-common.sh'),dir],{encoding:'utf8'})
  if(mode==='empty')assert.notEqual(r.status,0)
  else{assert.equal(r.status,0,r.stderr);assert.equal(path.basename(r.stdout.trim()),['newest','corrupt-newest'].includes(mode)?newer:older)}
 }finally{rmSync(dir,{recursive:true,force:true})}
})
