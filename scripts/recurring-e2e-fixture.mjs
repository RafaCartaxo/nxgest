// Entire file runs only in the guarded, network/socket-free test namespace.
import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
const scenario=process.argv[3]||'success',phase=process.argv[2],controller='/work/controller',host='/work/host',daemonFile='/work/recurring-daemon.json'
if(!fs.existsSync('/work/recurring-guard-confirmed')||fs.existsSync('/etc')||fs.existsSync('/home')||fs.existsSync('/var/run/docker.sock'))throw Error('guardas ausentes')
const digest=b=>createHash('sha256').update(b).digest('hex'),h=b=>'sha256:'+digest(b),id=c=>c.repeat(64)
const write=(file,data)=>fs.writeFileSync(file,typeof data==='string'?data:JSON.stringify(data),{mode:0o600})
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'))
function call(cmd,args,cwd=host){const r=spawnSync(cmd,args,{cwd,encoding:'utf8',maxBuffer:1048576});assert.equal(r.status,0,`${cmd} ${args.slice(0,3).join(' ')}: ${r.stderr}`);return r.stdout.trim()}
function git(args,cwd=host){return call('/usr/bin/git',args,cwd)}
const sourceFiles=fs.readdirSync('/source/scripts')
if(phase==='setup'){
 fs.mkdirSync(controller,{mode:0o700});fs.mkdirSync(controller+'/scripts');fs.mkdirSync(controller+'/infra');fs.mkdirSync('/work/receipts',{mode:0o700});fs.mkdirSync('/work/runner-private',{mode:0o700})
 for(const f of sourceFiles)fs.copyFileSync('/source/scripts/'+f,controller+'/scripts/'+f)
 fs.copyFileSync('/source/docker-compose.prod.yml',controller+'/infra/docker-compose.prod.yml');fs.copyFileSync('/source/staging-known-hosts',controller+'/infra/staging-known-hosts')
 git(['init','-q'],controller)
 const {fixtureJq}=await import(pathToFileURL(controller+'/scripts/host-jq-fixture.mjs'));fixtureJq(controller,controller)
 // Only this copied fixture helper uses the isolated allowlisted awk tool.
 fs.appendFileSync(controller+'/scripts/host-jq.sh','\nexport PATH=/runtime:/usr/bin:/bin\n')
 git(['add','scripts','infra'],controller);git(['-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','-qm','trusted-controller'],controller)
 const ctrl=git(['rev-parse','HEAD'],controller)
 call('/usr/bin/git',['clone','-q','--no-hardlinks',controller,host],'/work')
 fixtureJq(host,host)
 fs.appendFileSync(host+'/.git/info/exclude','.env\n');write(host+'/.env','PORT=8080\nFIXTURE_SECRET=DO_NOT_PRINT\n')
 const candidates=[]
 for(const [name,run,artifact,stage,cd] of [['A','11','34','21','31'],['B','12','35','22','32']]){
  write(host+'/candidate.txt',name+'\n')
  for(const script of ['staging-post-baseline-entry.sh','staging-post-baseline-policy.sh','production-preclients.sh','recurring-production-entry.sh'])write(host+'/scripts/'+script,'#!/bin/bash\nprintf candidate-code > /work/candidate-code-ran\nexit 99\n')
  git(['add','candidate.txt','scripts']);git(['-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','-qm','candidate-'+name])
  candidates.push({name,sha:git(['rev-parse','HEAD']),run,artifact,stage,cd})
 }
 git(['checkout','-q','--detach',ctrl])
 const network=id('9'),adoption='f'.repeat(32),legacy=id('e'),current=id('d'),prod=id('f'),oldStage='sha256:'+id('a'),oldProd='sha256:'+id('b'),peerImage='sha256:'+id('c')
 const labels=service=>({'com.docker.compose.project':'nxgestao','com.docker.compose.service':service})
 const nets=()=>({nxgestao_net:{NetworkID:network,Aliases:['staging-app'],IPAMConfig:null,IPAddress:'172.20.0.2'}})
 const stageMounts=[{Type:'volume',Name:'nxgestao_nxgestao_staging_data',Destination:'/data',RW:true}]
 const app=(cid,name,image,service,status='running')=>({Id:cid,Name:'/'+name,Image:image,State:{Status:status,Running:status==='running'},Config:{Hostname:'synthetic',Image:image,Env:['PORT=8081','FIXTURE_SECRET=DO_NOT_PRINT'],Cmd:['old'],Entrypoint:null,WorkingDir:'/old',User:'',ExposedPorts:{'8081/tcp':{}},Labels:{...labels(service),...(service==='staging-app'?{'nxgest.adoption.operation':adoption}:{})}},HostConfig:{Privileged:false,Binds:null,PortBindings:null,Devices:null,PublishAllPorts:false,AutoRemove:false,NetworkMode:network},Mounts:service==='staging-app'?structuredClone(stageMounts):[],NetworkSettings:{Networks:nets()},boot:status==='running'})
 const containers={}
 containers[current]=app(current,'staging-app',oldStage,'staging-app')
 containers[legacy]=app(legacy,'nxgest-legacy-'+adoption,oldStage,'staging-app','exited')
 containers[prod]=app(prod,'nxgestao-app-1',oldProd,'app')
 const peers=[]
 for(const [c,name,service] of [['1','nxgest-postgres','postgres'],['2','staging-pg','staging-pg'],['3','caddy','caddy']]){
  const cid=id(c),p=app(cid,name,peerImage,service);p.State.Health={Status:'healthy'};containers[cid]=p;peers.push({id:cid,image:peerImage,service})
 }
 const state={counter:1000,network,adoption,legacy,initialStage:current,initialProd:prod,stageMounts,containers,images:{[oldStage]:{Id:oldStage,Config:{Cmd:['old'],Entrypoint:null,WorkingDir:'/old',User:''}},[oldProd]:{Id:oldProd,Config:{Cmd:['old'],Entrypoint:null,WorkingDir:'/old',User:''}},[peerImage]:{Id:peerImage,Config:{}}},tags:{'initial-stage:baseline':oldStage,'initial-production:baseline':oldProd,'peer:baseline':peerImage},volumes:{staging:'preserved',production:'preserved'},events:[],fault:null,phase:'staging'}
 write(daemonFile,state)
 const gd=host+'/.git',initialDigest='sha256:'+id('8')
 write(gd+'/nxgest-deploy.lock','')
 write(gd+'/nxgest-baseline-established',`version=first-baseline-v1\nsha=${ctrl}\ntar=${initialDigest}\nzip=${initialDigest}\nci_run=1\nartifact=2\nstaging_run=3\nimage=${oldProd}\n`)
 write(gd+'/nxgest-staging-selection',`environment=staging\nsha=${ctrl}\nrun=1\nattempt=1\nartifact=2\nzip=${initialDigest}\ntar=${initialDigest}\nimage=${oldStage}\n`)
 write(gd+'/nxgest-staging-sha',ctrl+'\n');write(gd+'/nxgest-staging-adoption-consumed','operation='+adoption+'\n')
 write('/work/initial-stage.json',[containers[current]])
 const sh=controller+'/scripts/recurring-host-policy.sh'
 const configHash=call('/bin/bash',['-c','source "$1"; NXGEST_JQ=/usr/bin/jq; nxgest_stage_config_hash /work/initial-stage.json','fixture',sh]).split(' ')[0]
 const mountHash=call('/usr/bin/jq',['-cS','.[0].Mounts','/work/initial-stage.json'])+'\n'
 const networkHash=call('/bin/bash',['-c','source "$1"; NXGEST_JQ=/usr/bin/jq; nxgest_stage_network_hash /work/initial-stage.json','fixture',sh]).split(' ')[0]
 write('/work/initial-prod.json',[containers[prod]])
 const prodConfigHash=call('/bin/bash',['-c','source "$1"; NXGEST_JQ=/usr/bin/jq; nxgest_production_config_hash /work/initial-prod.json','fixture',sh]).split(' ')[0]
 const prodMountHash=digest(Buffer.from(call('/usr/bin/jq',['-cS','.[0].Mounts','/work/initial-prod.json'])+'\n'))
 const prodNetworkHash=call('/bin/bash',['-c','source "$1"; NXGEST_JQ=/usr/bin/jq; nxgest_stage_network_hash /work/initial-prod.json','fixture',sh]).split(' ')[0]
 const hostname=call('/usr/bin/hostname',['-s'])
 const ghPath='/usr/bin/gh',ghSha256=h(fs.readFileSync(ghPath))
 const buildPolicy={version:'nxg-build-recurring-v1',repo:'RafaCartaxo/nxgest',workflowId:'330080640',signerRule:'ci-push-source',decision:'QA/recurring-fixture',expiresAt:'2099-01-01T00:00:00.000Z',ghPath,ghSha256}
 const receiptPolicy={version:'nxg-staging-recurring-v2',repo:'RafaCartaxo/nxgest',workflowId:'88',signerRule:'staging-run-source',decision:'QA/recurring-fixture',expiresAt:'2099-01-01T00:00:00.000Z',ghPath,ghSha256}
 const common={version:'nxgest-host-recurring-v1',mode:'preclients',noClients:true,repo:'RafaCartaxo/nxgest',repoId:1304448439,host:hostname,controllerSha:ctrl,decision:'QA/recurring-fixture',expiresEpoch:4102444800,productionBaseline:{sha:ctrl,id:prod,image:oldProd},runnerPolicies:{build:h(Buffer.from(JSON.stringify(buildPolicy))),staging:null},peers}
 const stagePolicy={...common,environment:'staging',topology:{baseline:{sha:ctrl,id:current,image:oldStage},legacyId:legacy,legacyImage:oldStage,configSha256:configHash,mountsSha256:digest(Buffer.from(mountHash)),networksSha256:networkHash,networkId:network}}
 const prodPolicy={...common,environment:'production',runnerPolicies:{build:h(Buffer.from(JSON.stringify(buildPolicy))),staging:h(Buffer.from(JSON.stringify(receiptPolicy)))},topology:{composeSha256:digest(fs.readFileSync(controller+'/infra/docker-compose.prod.yml')),envSha256:digest(fs.readFileSync(host+'/.env')),configSha256:prodConfigHash,mountsSha256:prodMountHash,networksSha256:prodNetworkHash}}
 for(const [env,policy] of [['staging',stagePolicy],['production',prodPolicy]]){
  const f=gd+`/nxgest-${env}-recurring-policy.json`;write(f,policy)
  write(gd+`/nxgest-recurring-${env}-authority`,`version=recurring-authority-v2\nenvironment=${env}\nhost=${hostname}\ncontroller=${ctrl}\npolicy_sha256=${h(fs.readFileSync(f))}\ndecision=QA/recurring-fixture\nexpires_epoch=4102444800\npeer=nxgest-${env}-runner\n`)
 }
 for(const env of ['staging','production'])write('/work/runner-private/'+env+'.key','fixture-'+env+'-key\n')
 fs.copyFileSync('/source/staging-known-hosts','/work/runner-private/known_hosts');fs.chmodSync('/work/runner-private/known_hosts',0o600)
 const gateway=controller+'/scripts/recurring-staging-gateway.sh',contracts={}
 for(const env of ['staging','production'])contracts['fixture-'+env+'-key']={restrict:true,environment:env,peer:`nxgest-${env}-runner`,account:'fixtureuser@fixturehost',gateway,gatewaySha256:digest(fs.readFileSync(gateway))}
 write('/work/recurring-authorized-keys.json',contracts)
 fs.mkdirSync(controller+'/.maestro/coord-qa/build-policies',{recursive:true,mode:0o700})
 write(controller+'/.maestro/coord-qa/build-policies/build.json',buildPolicy);write(controller+'/.maestro/coord-qa/build-policies/staging.json',receiptPolicy)
 fs.mkdirSync('/work/artifacts')
 for(const c of candidates){
  const archive='/work/artifacts/'+c.name;fs.mkdirSync(archive);fs.mkdirSync(archive+'/blobs/sha256',{recursive:true})
  const cfg=Buffer.from(JSON.stringify({architecture:'amd64',os:'linux',config:{Cmd:['node','app-'+c.name],Entrypoint:null,WorkingDir:'/app',User:''}})),configHash=digest(cfg)
  fs.writeFileSync(archive+'/blobs/sha256/'+configHash,cfg)
  write(archive+'/manifest.json',[{Config:'blobs/sha256/'+configHash,RepoTags:['nxgest-build:'+c.sha],Layers:['layer.tar']}]);write(archive+'/layer.tar','synthetic layer '+c.name)
  call('/usr/bin/tar',['-cf',archive+'/image.tar','-C',archive,'manifest.json','blobs/sha256/'+configHash,'layer.tar'])
  c.image='sha256:'+configHash;c.tar=h(fs.readFileSync(archive+'/image.tar'));c.archive=archive
 }
 write('/work/recurring-fixture.json',{ctrl,candidates,hostname,baseHashes:Object.fromEntries(['staging','production'].flatMap(env=>[`nxgest-${env}-recurring-policy.json`,`nxgest-recurring-${env}-authority`]).map(f=>[f,h(fs.readFileSync(gd+'/'+f))]))})
 fs.symlinkSync(host,'/opt/nxgestao')
 console.log('FIXTURE_SETUP_READY')
}else if(phase==='run'){
 const fixture=read('/work/recurring-fixture.json'),{ctrl,candidates}=fixture
 const {runRecurring:actualRun}=await import(pathToFileURL(controller+'/scripts/recurring-runner.mjs'))
 const traceSpawn=(cmd,args,opts)=>{const r=spawnSync(cmd,args,opts);if(r.status!==0){console.error('FIXTURE_CHILD_FAILURE status='+r.status);console.error(r.stderr||r.error?.message||'');const d=read(daemonFile);console.error('FIXTURE_LAST_EVENTS '+JSON.stringify(d.events.slice(-8)))}return r}
 const runRecurring=(options,deps)=>actualRun(options,{...deps,spawn:deps.spawn||traceSpawn})
 const {resolveBuildSelection,inspectBuildRun,downloadBuildZip,inspectStagingRun}=await import(pathToFileURL(controller+'/scripts/build-provider.mjs'))
 const {verifyBuildAttestation}=await import(pathToFileURL(controller+'/scripts/build-attestation.mjs'))
 const {zip:makeZip}=await import(pathToFileURL(controller+'/scripts/build-zip-fixture.mjs'))
 const stages=new Map(),builds=new Map()
 for(const c of candidates){
  const image=fs.readFileSync(c.archive+'/image.tar'),receipt=Buffer.from(JSON.stringify({version:'nxg-build-receipt-v1',runId:c.run,attempt:1,sourceSha:c.sha,platform:'linux/amd64',imageSize:image.length,imageSha256:c.tar}))
  const zip=makeZip(['image.tar','receipt.json'],[0o100600,0o100600],[image,receipt]);builds.set(c.run,{c,zip})
 }
 const token='fixture-token-not-a-secret'
 const fetcher=async(url,opts)=>{
  assert.equal(opts.redirect,'manual')
  if(url.startsWith('https://fixture.blob.core.windows.net/')){assert.equal(opts.headers,undefined);const [kind,id]=new URL(url).pathname.slice(1).split('/');const data=(kind==='build'?builds:stages).get(id);return new Response(data.zip)}
  assert.equal(opts.headers.Authorization,'Bearer '+token);assert(!url.includes(token))
  const u=new URL(url),p=u.pathname
  if(p.endsWith('/repositories/1304448439'))return new Response(JSON.stringify({id:1304448439,full_name:'RafaCartaxo/nxgest'}))
  const workflow=/\/workflows\/(\d+)$/.exec(p)
  if(workflow)return new Response(JSON.stringify({id:Number(workflow[1]),path:workflow[1]==='88'?'.github/workflows/staging.yml':'.github/workflows/ci.yml'}))
  const r=/\/runs\/(\d+)(?:\/attempts\/1)?(?:\/artifacts)?$/.exec(p)
  if(r){
   const stage=stages.get(r[1]),build=builds.get(r[1]),data=stage||build;if(!data)return new Response('{}',{status:404})
   if(p.endsWith('/artifacts'))return new Response(JSON.stringify({total_count:1,artifacts:[data.artifact]}))
   const meta={id:Number(r[1]),workflow_id:stage?88:330080640,run_attempt:1,status:'completed',conclusion:'success',event:stage?'workflow_run':'push',head_branch:'main',head_sha:stage?ctrl:data.c.sha}
   if(scenario==='source-ref')meta.head_branch='other'
   return new Response(JSON.stringify(meta))
  }
  const a=/\/artifacts\/(\d+)(\/zip)?$/.exec(p)
  if(a){
   for(const [kind,map] of [['build',builds],['stage',stages]])for(const [run,data] of map)if(String(data.artifact.id)===a[1])return a[2]?new Response(null,{status:302,headers:{location:`https://fixture.blob.core.windows.net/${kind}/${run}`}}):new Response(JSON.stringify(data.artifact))
  }
  return new Response('{}',{status:404})
 }
 for(const {c,zip} of builds.values())builds.get(c.run).artifact={id:Number(c.artifact),name:`nxgest-build-${c.run}-1`,workflow_run:{id:Number(c.run),head_sha:c.sha},expired:false,expires_at:'2099-01-01T00:00:00Z',digest:h(zip),size_in_bytes:zip.length}
 const attest=(file,p)=>verifyBuildAttestation(file,p,{spawn:(_binary,args)=>{
  assert(!args.includes(token))
  const certificate={issuer:scenario==='issuer'?'bad':p.issuer,sourceRepositoryURI:'https://github.com/RafaCartaxo/nxgest',sourceRepositoryIdentifier:'1304448439',sourceRepositoryDigest:p.sourceSha,sourceRepositoryRef:p.sourceRef,buildSignerURI:`https://github.com/${p.signerWorkflow}@${p.sourceRef}`,buildSignerDigest:p.signerSha,runnerEnvironment:'github-hosted',buildTrigger:p.signerWorkflow.endsWith('/staging.yml')?'workflow_run':'push',runInvocationURI:`https://github.com/RafaCartaxo/nxgest/actions/runs/${p.runId}/attempts/${p.attempt}`}
  return {status:0,stdout:JSON.stringify([{verificationResult:{signature:{certificate},verifiedTimestamps:[{}]}}])}
 }})
 const buildDeps={resolve:(s,t)=>resolveBuildSelection(s,t,{fetcher}),inspect:(s,t)=>inspectBuildRun(s,t,{fetcher}),download:(id,t)=>downloadBuildZip(id,t,{fetcher}),attest}
 const stageDeps={inspect:(s,t)=>inspectStagingRun(s,t,{fetcher}),download:(id,t)=>downloadBuildZip(id,t,{fetcher}),attest}
 const buildFile=controller+'/.maestro/coord-qa/build-policies/build.json',stageFile=controller+'/.maestro/coord-qa/build-policies/staging.json'
 const variables={controllerSha:ctrl,host:'fixturehost',user:'fixtureuser',knownHosts:'/work/runner-private/known_hosts',build:{policyPath:buildFile,policyHash:h(fs.readFileSync(buildFile)),decision:'QA/recurring-fixture',token},stage:{policyPath:stageFile,policyHash:h(fs.readFileSync(stageFile)),decision:'QA/recurring-fixture',token}}
 const state=()=>read(daemonFile),mutations=()=>state().events.filter(e=>/^(stage\.(stop|rename|create|start)|production\.swap|image\.(load|tag|untag))$/.test(e.op)).length
 const setPhase=p=>{const s=state();s.phase=p;write(daemonFile,s)}
 const gd=host+'/.git',envHash=h(fs.readFileSync(host+'/.env')),consumed=fs.readFileSync(gd+'/nxgest-staging-adoption-consumed','utf8'),volumes=JSON.stringify(state().volumes)
 if(['source-ref','issuer','backend','stage-load','stage-create','stage-health','extra-peer'].includes(scenario)){
  const s=state();s.fault=scenario
  if(scenario==='extra-peer'){const copy=structuredClone(s.containers[id('1')]);copy.Id=id('7');copy.Name='/unexpected';copy.Config.Labels['com.docker.compose.service']='unknown';s.containers[copy.Id]=copy}
  write(daemonFile,s)
 }
 if(scenario==='historical-pending')write(gd+'/nxgest-baseline-pending','historical fixture\n')
 if(scenario==='revoked'){
  const f=gd+'/nxgest-staging-recurring-policy.json',p=read(f);p.noClients=false;write(f,p)
  const a=fs.readFileSync(gd+'/nxgest-recurring-staging-authority','utf8').replace(/^policy_sha256=.*$/m,'policy_sha256='+h(fs.readFileSync(f)));write(gd+'/nxgest-recurring-staging-authority',a)
 }
 let expectedFailure=false
 for(const c of candidates){
  setPhase('staging')
  const stagePath='/work/receipts/staging-'+c.name+'.json',stageOptions={...variables,kind:'staging',runId:c.stage,runAttempt:1,eventRunId:c.run,eventSha:c.sha,key:'/work/runner-private/staging.key',receiptPath:stagePath}
  if(c.name==='B'&&['stage-identity','stage-journal'].includes(scenario)){
   if(scenario==='stage-identity'){
    const d=state(),current=Object.values(d.containers).find(x=>x.Name==='/staging-app'),copy=structuredClone(current)
    delete d.containers[current.Id];copy.Id=id('6');d.containers[copy.Id]=copy;write(daemonFile,d)
   }else{
    const dirs=fs.readdirSync(gd).filter(x=>/^nxgest-post-baseline-[a-f0-9]{32}$/.test(x));assert.equal(dirs.length,1)
    const f=gd+'/'+dirs[0]+'/journal';write(f,fs.readFileSync(f,'utf8').replace('phase=completed','phase=ambiguous'))
   }
   const before=mutations();await assert.rejects(runRecurring(stageOptions,{buildDeps}));assert.equal(mutations(),before);assert(!fs.existsSync(stagePath));expectedFailure=true;break
  }
  if(c.name==='A'&&['source-ref','issuer','backend','stage-load','stage-create','stage-health','extra-peer','historical-pending','revoked','wrong-key','wrong-peer','transport','lock','controller','controller-bytes','runner-policy','attempt'].includes(scenario)){
   if(scenario==='wrong-key')write('/work/runner-private/wrong.key','unknown fixture key\n')
   if(scenario==='wrong-key')stageOptions.key='/work/runner-private/wrong.key'
   if(scenario==='wrong-peer'){const p=read('/work/recurring-authorized-keys.json');p['fixture-staging-key'].peer='nxgest-production-runner';write('/work/recurring-authorized-keys.json',p)}
   if(scenario==='controller')stageOptions.controllerSha='0'.repeat(40)
   if(scenario==='controller-bytes')fs.appendFileSync(controller+'/scripts/build-provider.mjs','\n// changed fixture controller bytes\n')
   if(scenario==='attempt')stageOptions.runAttempt=2
   if(scenario==='runner-policy'){
    const p=read(buildFile);p.expiresAt='2098-01-01T00:00:00.000Z';write(buildFile,p)
    stageOptions.build={...variables.build,policyHash:h(fs.readFileSync(buildFile))}
   }
   const before=mutations()
   const deps={buildDeps,spawn:(cmd,args,opts)=>{
    if(cmd==='/bin/bash'&&scenario==='transport'){
     // Alter verified bytes immediately before the transport rechecks them.
     fs.appendFileSync(args[1],'changed fixture bytes')
    }
    if(cmd==='/bin/bash'&&scenario==='lock')return spawnSync('/usr/bin/flock',['-n',gd+'/nxgest-deploy.lock',cmd,...args],opts)
    return spawnSync(cmd,args,opts)
   }}
   await assert.rejects(runRecurring(stageOptions,deps))
   assert(!fs.existsSync(stagePath));assert.equal(fs.readFileSync(gd+'/nxgest-staging-adoption-consumed','utf8'),consumed)
   if(['source-ref','issuer','backend','extra-peer','historical-pending','revoked','wrong-key','wrong-peer','transport','lock','controller','controller-bytes','runner-policy','attempt'].includes(scenario))assert.equal(mutations(),before)
   if(['stage-load','stage-create','stage-health'].includes(scenario))assert(fs.existsSync(gd+'/nxgest-staging-pending'))
   if(scenario==='historical-pending')assert.equal(fs.readFileSync(gd+'/nxgest-baseline-pending','utf8'),'historical fixture\n')
   expectedFailure=true;break
  }
  const sr=await runRecurring(stageOptions,{buildDeps});assert(sr.fixture);assert.equal(sr.sha,c.sha);assert.equal(sr.image,c.image)
  const signed=fs.readFileSync(stagePath),zip=makeZip(['staging-receipt.json'],[0o100600],[signed])
  stages.set(c.stage,{c,zip,artifact:{id:100+Number(c.stage),name:`nxgest-staging-${c.stage}-1`,workflow_run:{id:Number(c.stage),head_sha:ctrl},expired:false,expires_at:'2099-01-01T00:00:00Z',digest:h(zip),size_in_bytes:zip.length}})
  assert.equal(fs.readFileSync(gd+'/nxgest-staging-adoption-consumed','utf8'),consumed)
  assert(Object.values(state().containers).some(x=>x.Name==='/nxgest-legacy-'+state().adoption&&x.State.Status==='exited'))
  setPhase('production')
  const prodPath='/work/receipts/production-'+c.name+'.json',prodOptions={...variables,kind:'production',stageRun:c.stage,runId:c.cd,runAttempt:1,key:'/work/runner-private/production.key',receiptPath:prodPath}
  if(c.name==='A'&&scenario==='production-swap'){const s=state();s.fault='production-swap';write(daemonFile,s);await assert.rejects(runRecurring(prodOptions,{buildDeps,stageDeps}));assert(fs.existsSync(gd+'/nxgest-production-pending'));assert(fs.existsSync(gd+'/nxgest-recurring-production-active'));assert(!fs.existsSync(prodPath));expectedFailure=true;break}
  const pr=await runRecurring(prodOptions,{buildDeps,stageDeps});assert.equal(pr.image,c.image);assert.equal(pr.sha,c.sha);assert(fs.existsSync(gd+'/nxgest-production-pending'));assert(fs.existsSync(gd+'/nxgest-recurring-production-active'))
  if(c.name==='A'&&scenario==='receipt-upload'){assert.equal(pr.status,'applied_pending_finalization');expectedFailure=true;break}
  if(c.name==='A'&&['finalize','finalize-active'].includes(scenario)){
   const s=state();s.fault=scenario;write(daemonFile,s)
   await assert.rejects(runRecurring({...prodOptions,kind:'finalize'},{buildDeps,stageDeps}))
   assert(state().events.some(e=>e.op==='fault.'+scenario))
   assert.equal(fs.existsSync(gd+'/nxgest-production-pending'),scenario==='finalize')
   if(scenario==='finalize-active')assert(fs.readdirSync(gd).some(f=>f.startsWith('nxgest-production-completed-'+c.sha+'-')))
   assert(fs.existsSync(gd+'/nxgest-recurring-production-active'));expectedFailure=true;break
  }
  const end=await runRecurring({...prodOptions,kind:'finalize'},{buildDeps,stageDeps});assert(end.finalized);assert(!fs.existsSync(gd+'/nxgest-production-pending'));assert(!fs.existsSync(gd+'/nxgest-recurring-production-active'))
  assert.equal(fs.readFileSync(gd+'/nxgest-production-sha','utf8').trim(),c.sha)
  console.log(`REC_VERSION_${c.name}_COMPLETED sha=${c.sha} image=${c.image}`)
 }
 assert.equal(h(fs.readFileSync(host+'/.env')),envHash);assert.equal(JSON.stringify(state().volumes),volumes);assert(!fs.existsSync('/work/candidate-code-ran'))
 if(scenario==='success'){
  assert(!expectedFailure)
  for(const [f,sum] of Object.entries(fixture.baseHashes))assert.equal(h(fs.readFileSync(gd+'/'+f)),sum)
  assert.equal(h(fs.readFileSync(buildFile)),variables.build.policyHash);assert.equal(h(fs.readFileSync(stageFile)),variables.stage.policyHash)
  const c=candidates[0],before=mutations()
  await assert.rejects(runRecurring({...variables,kind:'staging',runId:c.stage,runAttempt:1,eventRunId:c.run,eventSha:c.sha,key:'/work/runner-private/staging.key',receiptPath:'/work/receipts/replay.json'},{buildDeps}))
  assert.equal(mutations(),before)
  const b=candidates[1]
  await assert.rejects(runRecurring({...variables,kind:'production',stageRun:b.stage,runId:'33',runAttempt:1,key:'/work/runner-private/production.key',receiptPath:'/work/receipts/repeat.json'},{buildDeps,stageDeps}))
  assert.equal(mutations(),before)
  const events=state().events
  for(const e of events.filter(e=>e.op==='health.internal'))assert(events.some(x=>x.op==='migrations.boot'&&x.id===e.id&&x.ok)||e.id===state().initialStage)
  console.log('REC_01_TWO_VERSIONS_SAME_POLICIES_OK; REPLAY_REFUSED; NO_OPERATIONAL_READINESS')
 }else{assert(expectedFailure);console.log(`REC_NEGATIVE_${scenario}_CLOSED; NO_OPERATIONAL_READINESS`)}
 console.log('FIXTURE_ENV_VOLUMES_LEGACY_AND_CANDIDATE_CODE_GUARD_PRESERVED')
}else throw Error('phase inválida')
