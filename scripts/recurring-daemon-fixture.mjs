#!/runtime/node
// Test-only command doubles. Never imported by deployment code.
import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
if(!fs.existsSync('/work/recurring-guard-confirmed')||fs.existsSync('/etc')||fs.existsSync('/home')||fs.existsSync('/var/run/docker.sock'))process.exit(97)
const command=path.basename(process.argv[1]),raw=process.argv.slice(2),file='/work/recurring-daemon.json'
const state=JSON.parse(fs.readFileSync(file,'utf8'))
const save=()=>fs.writeFileSync(file,JSON.stringify(state),{mode:0o600})
const event=(op,extra={})=>state.events.push({op,...extra})
const ok=(value='')=>{save();if(value)process.stdout.write(typeof value==='string'?value+'\n':JSON.stringify(value)+'\n');process.exit(0)}
const bad=()=>{save();process.exit(1)}
const sha=b=>createHash('sha256').update(b).digest('hex')
const getContainer=x=>state.containers[x]||Object.values(state.containers).find(c=>c.Name==='/'+x)
const imageId=x=>state.tags[x]|| (state.images[x]?x:undefined)
const nextId=()=> (++state.counter).toString(16).padStart(64,'0')
const service=c=>c.Config?.Labels?.['com.docker.compose.service']
if(command==='timeout'){
 let args=raw
 if(args[2]==='90s'&&state.fault==='stage-health')args=[...args.slice(0,2),'1s',...args.slice(3)]
 const r=spawnSync('/runtime/timeout',args,{stdio:'inherit'});process.exit(r.status??1)
}
if(command==='ln'){
 if((state.fault==='finalize'&&raw.some(x=>x.includes('/nxgest-production-completed-')))||(state.fault==='finalize-active'&&raw.some(x=>x.includes('/nxgest-recurring-production-finished-')))){event('fault.'+state.fault);save();process.exit(1)}
 const r=spawnSync('/runtime/ln-real',raw,{stdio:'inherit'});process.exit(r.status??1)
}
if(command==='ssh-keygen')ok('256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc fixture (ED25519)')
if(command==='ssh'){
 const k=raw.indexOf('-i');if(k<0)bad()
 const keyFile=raw[k+1],st=fs.lstatSync(keyFile);if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077))bad()
 const key=fs.readFileSync(keyFile,'utf8').trim()
 const configPath='/work/recurring-authorized-keys.json',cs=fs.lstatSync(configPath)
 if(!cs.isFile()||cs.isSymbolicLink()||(cs.mode&0o077))bad()
 const contract=JSON.parse(fs.readFileSync(configPath,'utf8'))[key]
 if(!contract||contract.restrict!==true||contract.account!=='fixtureuser@fixturehost'||contract.gateway!=='/work/controller/scripts/recurring-staging-gateway.sh'||contract.peer!==`nxgest-${contract.environment}-runner`||contract.gatewaySha256!==sha(fs.readFileSync(contract.gateway)))bad()
 if(raw.at(-2)!==contract.account||raw.at(-1)!==`nxgest-recurring-${contract.environment}-v2`)bad()
 event('ssh.authenticated',{environment:contract.environment,peer:contract.peer});save()
 const r=spawnSync('/usr/bin/env',['-i','PATH=/usr/bin:/bin','HOME=/nonexistent','/bin/bash','--noprofile','--norc',contract.gateway,contract.environment,contract.peer],{input:fs.readFileSync(0),encoding:'buffer',maxBuffer:1048576})
 if(r.stdout?.length)process.stdout.write(r.stdout);if(r.stderr?.length)process.stderr.write(r.stderr)
 process.exit(r.status??1)
}
if(command==='curl'){
 if(raw.includes('--unix-socket')){
  if(raw[raw.indexOf('--unix-socket')+1]!=='/var/run/docker.sock'||!raw.at(-1).endsWith('/v1.41/containers/create?name=staging-app'))bad()
  const src=raw[raw.indexOf('--data-binary')+1];if(!src?.startsWith('@'))bad()
  const payload=JSON.parse(fs.readFileSync(src.slice(1),'utf8'))
  if(getContainer('staging-app')||!state.images[payload.Image]||JSON.stringify(payload.HostConfig.Mounts)!==JSON.stringify([{Type:'volume',Source:'nxgestao_nxgestao_staging_data',Target:'/data',VolumeOptions:{NoCopy:true}}]))bad()
  const id=nextId(),{HostConfig,NetworkingConfig,...Config}=payload
  const networks={nxgestao_net:{NetworkID:state.network,Aliases:NetworkingConfig.EndpointsConfig.nxgestao_net.Aliases,IPAMConfig:null,IPAddress:'172.20.0.'+state.counter}}
  state.containers[id]={Id:id,Name:'/staging-app',Image:payload.Image,State:{Status:'created',Running:false},Config,HostConfig,Mounts:structuredClone(state.stageMounts),NetworkSettings:{Networks:networks},boot:false}
  event('stage.create',{id,image:payload.Image});if(state.fault==='stage-create')bad();ok({Id:id})
 }
 const stage=raw.at(-1).includes('duckdns'),c=getContainer(stage?'staging-app':'nxgestao-app-1')
 event('health.public',{id:c?.Id,environment:stage?'staging':'production'})
 if(!c?.boot||!c.State.Running)bad();ok({status:'ok',db:'connected'})
}
if(command!=='docker')bad()
let args=raw
if(args[0]==='--host'){if(args[1]!=='unix:///var/run/docker.sock')bad();args=args.slice(2)}
const op=args[0]
if(op==='version')ok(args[2]?.includes('APIVersion')?'26.1.3|1.45':state.fault==='backend'?'29.0.0|linux|amd64':'26.1.3|linux|amd64')
if(op==='info')ok(args[2]?.includes('DriverStatus')?'[["Backing Filesystem","extfs"]]':'overlay2')
if(op==='network')ok(state.network)
if(op==='ps'){
 const filters=[];for(let i=0;i<args.length;i++)if(args[i]==='--filter')filters.push(args[++i])
 let list=Object.values(state.containers)
 if(!args.some(x=>x.includes('a')&&x.startsWith('-')&&x!=='--filter'&&x!=='--no-trunc'))list=list.filter(c=>c.State.Running)
 for(const f of filters){
  if(f.startsWith('label=')){const [key,value]=f.slice(6).split('=');list=list.filter(c=>c.Config?.Labels?.[key]===value)}
  else if(f.startsWith('name=')){const n=f.slice(5).replace(/^\^\//,'').replace(/\$$/,'');list=list.filter(c=>c.Name==='/'+n)}
  else if(f.startsWith('network='))list=list.filter(c=>c.NetworkSettings?.Networks?.[f.slice(8)])
  else if(f.startsWith('volume='))list=list.filter(c=>c.Mounts?.some(m=>m.Name===f.slice(7)))
  else bad()
 }
 ok(list.map(c=>c.Id).join('\n'))
}
if(op==='inspect'){
 const format=args[1]==='--format'?args[2]:null,obj=getContainer(args.at(-1))||state.images[imageId(args.at(-1))];if(!obj)bad()
 if(!format)ok([obj])
 if(format==='{{json .Config.Env}}')ok(JSON.stringify(obj.Config?.Env??[]))
 if(format==='{{.Id}}')ok(obj.Id)
 if(format==='{{.Image}}')ok(obj.Image)
 if(format==='{{.State.Status}}')ok(obj.State.Status)
 if(format.includes('.State.Status}}|'))ok(obj.State.Status+'|'+(obj.State.Health?.Status||'missing'))
 const m=/^\{\{index \.Config.Labels "([^"]+)"\}\}$/.exec(format)
 if(m)ok(obj.Config.Labels?.[m[1]]||'<no value>')
 bad()
}
if(op==='exec'){
 const c=getContainer(args[1]);event('health.internal',{id:c?.Id,image:c?.Image})
 if(!c?.boot||!c.State.Running)bad();ok()
}
if(op==='image'){
 const action=args[1]
 if(action==='ls')ok(Object.entries(state.tags).map(([tag,id])=>`${tag}|${id}`).join('\n'))
 if(action==='inspect'){
  const id=imageId(args.at(-1));if(!id)bad()
  if(args[2]==='--format')ok(id);ok([state.images[id]])
 }
 if(action==='load'){
  const archive=args[args.indexOf('--input')+1]
  const read=name=>{const r=spawnSync('/usr/bin/tar',['-xOf',archive,name],{maxBuffer:1048576});if(r.status!==0)bad();return r.stdout}
  const manifest=JSON.parse(read('manifest.json'))[0],bytes=read(manifest.Config),id='sha256:'+sha(bytes),config=JSON.parse(bytes)
  if(manifest.RepoTags.length!==1||state.tags[manifest.RepoTags[0]])bad()
  state.images[id]={Id:id,Config:config.config||{}};state.tags[manifest.RepoTags[0]]=id
  event('image.load',{id,tag:manifest.RepoTags[0]});if(state.fault==='stage-load'&&state.phase==='staging')bad();ok()
 }
 if(action==='tag'){
  const id=imageId(args[2]);if(!id||state.tags[args[3]]&&state.tags[args[3]]!==id)bad()
  state.tags[args[3]]=id;event('image.tag',{id,tag:args[3]});ok()
 }
 if(action==='rm'){
  const tag=args[2],id=state.tags[tag];if(!id)bad()
  const refs=Object.values(state.tags).filter(x=>x===id).length
  if(refs===1&&Object.values(state.containers).some(c=>c.Image===id&&c.State.Running))bad()
  delete state.tags[tag];event('image.untag',{id,tag});ok()
 }
 bad()
}
if(op==='stop'){
 const c=getContainer(args[1]);if(!c||service(c)!=='staging-app'||c.Name!=='/staging-app')bad()
 c.State={Status:'exited',Running:false};c.boot=false;event('stage.stop',{id:c.Id});ok()
}
if(op==='rename'){
 const c=getContainer(args[1]);if(!c||service(c)!=='staging-app'||c.State.Running||!/^nxgest-staging-previous-[a-f0-9]{32}$/.test(args[2])||getContainer(args[2]))bad()
 c.Name='/'+args[2];event('stage.rename',{id:c.Id,name:c.Name});ok()
}
if(op==='start'){
 const c=getContainer(args[1]);if(!c||c.Name!=='/staging-app'||service(c)!=='staging-app')bad()
 c.State={Status:'running',Running:true};c.boot=state.fault!=='stage-health';event('migrations.boot',{id:c.Id,ok:c.boot});event('stage.start',{id:c.Id});ok()
}
if(op==='compose'){
 const idx=args.indexOf('up')
 if(idx>=0){
  if(args.at(-1)!=='app'||!args.includes('--no-deps')||!args.includes('--no-build')||args[args.indexOf('--pull')+1]!=='never')bad()
  const idImage=process.env.NXGEST_PROD_IMAGE,old=getContainer('nxgestao-app-1');if(!old||!state.images[idImage])bad()
  const id=nextId(),next=structuredClone(old);delete state.containers[old.Id]
  next.Id=id;next.Image=idImage;next.Config.Image=idImage;Object.assign(next.Config,state.images[idImage].Config);next.Config.Labels=structuredClone(old.Config.Labels);next.Config.Env=structuredClone(old.Config.Env);next.State={Status:'running',Running:true};next.boot=true
  state.containers[id]=next;event('migrations.boot',{id,ok:true});event('production.swap',{id,image:idImage});if(state.fault==='production-swap')bad();ok()
 }
 if(args.includes('ps')&&args.at(-1)==='app'){const c=getContainer('nxgestao-app-1');if(!c)bad();ok(c.Id)}
 bad()
}
bad()
