#!/usr/bin/env node
// Ensaio opt-in de dados sintéticos; NÃO se executa sem autorização operacional específica.
import { spawnSync } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, realpathSync, lstatSync, statfsSync, openSync, closeSync, fstatSync, constants } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractSynthetic } from './synthetic-safe-extract.mjs'
import { reconcileFixture } from './reconcile-fixture.mjs'

const LIMIT=8*1024*1024, LABEL='nxg.ct011.run'
const digest=b=>createHash('sha256').update(b).digest('hex')
function fixtureTar(content) {
 const name='cliente/anexo.txt', h=Buffer.alloc(512), b=Buffer.from(content)
 h.write(name,0,100);h.write('0000600\0',100);h.write('0000000\0',108);h.write('0000000\0',116);h.write(b.length.toString(8).padStart(11,'0')+'\0',124);h.write('00000000000\0',136);h.fill(32,148,156);h[156]=48;h.write('ustar\0',257);h.write('00',263);let sum=0;for(const c of h)sum+=c;h.write(sum.toString(8).padStart(6,'0')+'\0 ',148)
 return gzipSync(Buffer.concat([h,b,Buffer.alloc((512-b.length%512)%512),Buffer.alloc(1024)]))
}
function makeRunner(context, deadline) {
 return (args,{input,allowFailure=false,cleanup=false}={})=>{
  const remaining=deadline+(cleanup?60000:0)-Date.now();if(remaining<=0)throw Error('prazo excedido')
  const env={PATH:'/usr/bin:/bin',HOME:process.env.HOME||'/nonexistent',LC_ALL:'C'}
  const r=spawnSync('/usr/bin/docker',['--context',context,...args],{input,env,timeout:Math.min(remaining,60000),maxBuffer:LIMIT})
  if(r.error||(!allowFailure&&r.status!==0))throw Error('comando Docker falhou')
  return {status:r.status,stdout:r.stdout||Buffer.alloc(0)}
 }
}
// Entrada controlada separada do bundle; hash vincula bytes à decisão, não autentica sua origem.
function loadControlledPolicy(policyPath,approvedHash,reference,repo) {
 if(typeof policyPath!=='string'||!path.isAbsolute(policyPath)||path.normalize(policyPath)!==policyPath||!/^sha256:[a-f0-9]{64}$/.test(approvedHash||'')||!/^[-A-Za-z0-9_./:]{1,160}$/.test(reference||''))throw Error('política, hash ou decisão ausente/inválida')
 const policyDir=path.join(repo,'.maestro','coord-qa','ct011-policies')
 if(path.dirname(policyPath)!==policyDir||!/^[-A-Za-z0-9_]+\.json$/.test(path.basename(policyPath)))throw Error('política fora da área controlada')
 const uid=process.geteuid();let current=path.parse(policyPath).root, policyStat
 for(const part of policyPath.slice(current.length).split(path.sep)) {
  current=path.join(current,part);const st=lstatSync(current),inWorkspace=current===repo||current.startsWith(repo+path.sep)
  if(st.isSymbolicLink()||((inWorkspace?st.uid!==uid:st.uid!==0&&st.uid!==uid))||(st.mode&0o022)!==0||(current===policyPath?!st.isFile():!st.isDirectory()))throw Error('custódia da política inválida')
  if(current===policyPath)policyStat=st
 }
 if((policyStat.mode&0o077)!==0)throw Error('permissão da política inválida')
 const fd=openSync(policyPath,constants.O_RDONLY|constants.O_NOFOLLOW)
 try {const st=fstatSync(fd);if(!st.isFile()||st.uid!==uid||(st.mode&0o077)||st.dev!==policyStat.dev||st.ino!==policyStat.ino||st.size>4096)throw Error('política insegura');const raw=readFileSync(fd);if('sha256:'+digest(raw)!==approvedHash)throw Error('hash da política divergente');const p=JSON.parse(raw.toString('utf8'));if(p.reference!==reference)throw Error('decisão divergente');return p} finally {closeSync(fd)}
}
function validatePolicy(policy,image) {
 if(!policy||Object.keys(policy).sort().join(',')!=='image,major,policy,reference,source'||policy.policy!=='nxg-ct011-pg16-v1'||policy.source!=='coord-qa-approved'||typeof policy.reference!=='string'||!/^[-A-Za-z0-9_./:]{1,160}$/.test(policy.reference)||policy.major!==16||policy.image!==image) throw Error('política PG16 ausente, inválida ou imagem não aprovada')
}
const text=r=>r.stdout.toString('utf8').trim()
export async function runRealRehearsal(options,{runner,runId,policyLoader,io,sleep,observer}={}) {
 const {context,socket,image,ack,policyPath,policyHash,decision}=options||{}
 if(ack!=='autorizado-somente-dados-sinteticos'||!/^[-A-Za-z0-9_.]{1,64}$/.test(context||'')||!/^unix:\/\/[A-Za-z0-9_./-]+\.sock$/.test(socket||'')||!/^sha256:[a-f0-9]{64}$/.test(image||'')) throw Error('autorização, contexto, socket ou imagem inválidos')
 if(observer!==undefined&&typeof observer!=='function')throw Error('observador inválido')
 if((runId||policyLoader||io||sleep)&&!runner)throw Error('injeção exige runner de teste')
 const repo=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'))
 validatePolicy((policyLoader||loadControlledPolicy)(policyPath,policyHash,decision,repo),image)
 const files=io||{write:writeFileSync,copy:copyFileSync,read:readFileSync}, pause=sleep||(ms=>new Promise(resolve=>setTimeout(resolve,ms)))
 const id=runId||randomBytes(16).toString('hex');if(!/^[a-f0-9]{32}$/.test(id))throw Error('ID inválido')
 const labelValue=id, base=`nxg-ct011-${id}`, deadline=Date.now()+30*60*1000
 const invoke=runner||makeRunner(context,deadline), createdContainers=[],createdVolumes=[]
 const run=(args,opts)=>{if(Date.now()>deadline)throw Error('prazo excedido');return invoke(args,opts)}
 const nameOf=suffix=>`${base}-${suffix}`
 const cwd=realpathSync(process.cwd()), parent=lstatSync(cwd)
 if(cwd!==repo)throw Error('execute apenas na raiz do checkout')
 if(!parent.isDirectory()||parent.isSymbolicLink()||!process.env.NXGEST_CT011_WORKSPACE || realpathSync(process.env.NXGEST_CT011_WORKSPACE)!==cwd)throw Error('workspace não confirmado')
 const fs=statfsSync(cwd);if(fs.bavail*fs.bsize<1024*1024*1024)throw Error('espaço mínimo indisponível')
 let work,workStat, failure, report
 try {
  if(text(run(['context','inspect',context,'--format','{{.Endpoints.docker.Host}}']))!==socket)throw Error('socket diverge')
  const imageInfo=text(run(['image','inspect',image,'--format','{{.Id}}']))
  if(imageInfo!==image)throw Error('imagem indisponível')
  const declaredVolumes=text(run(['image','inspect',image,'--format','{{range $k, $v := .Config.Volumes}}{{$k}};{{end}}']))
  if(declaredVolumes!==''&&declaredVolumes!=='/var/lib/postgresql/data;')throw Error('volumes declarados inesperados')
  work=mkdtempSync(path.join(cwd,`.${base}-`));workStat=lstatSync(work)
  const envPath=path.join(work,'synthetic.env')
  writeFileSync(envPath,`POSTGRES_USER=fixture\nPOSTGRES_DB=fixture\nPOSTGRES_PASSWORD=${randomBytes(24).toString('hex')}\n`,{mode:0o600,flag:'wx'})
  for(const suffix of ['source','target']) {
   const n=nameOf(suffix)
   const existing=text(run(['volume','ls','--filter',`name=^${n}$`,'--format','{{.Name}}']))
   if(existing)throw Error('colisão de volume')
   const v=text(run(['volume','create','--driver','local','--opt','type=tmpfs','--opt','device=tmpfs','--opt','o=size=384m','--label',`${LABEL}=${labelValue}`,n]))
   if(v!==n)throw Error('volume inesperado');createdVolumes.push(v)
   if(text(run(['volume','inspect','--format',`{{.Driver}}|{{index .Options "type"}}|{{index .Options "device"}}|{{index .Options "o"}}|{{index .Labels "${LABEL}"}}`,v]))!==`local|tmpfs|tmpfs|size=384m|${labelValue}`)throw Error('volume ou limite divergente')
   const existingC=text(run(['ps','-aq','--no-trunc','--filter',`name=^/${n}$`]))
   if(existingC)throw Error('colisão de container')
   const c=text(run(['create','--name',n,'--network','none','--log-driver','none','--pull=never','--cpus','2','--memory','1g','--label',`${LABEL}=${labelValue}`,'--mount',`type=volume,src=${v},dst=/var/lib/postgresql/data`,'--env-file',envPath,image]))
   if(!/^[a-f0-9]{64}$/.test(c))throw Error('ID de container inválido');createdContainers.push({id:c,name:n})
   const config=text(run(['inspect','--format',`{{.Id}}|{{.Name}}|{{index .Config.Labels "${LABEL}"}}|{{.HostConfig.NetworkMode}}|{{.Image}}|{{.HostConfig.NanoCpus}}|{{.HostConfig.Memory}}|{{len .Mounts}}{{range .Mounts}}|{{.Type}}|{{.Name}}|{{.Destination}}|{{.RW}}{{end}}`,c]))
   if(config!==`${c}|/${n}|${labelValue}|none|${image}|2000000000|1073741824|1|volume|${v}|/var/lib/postgresql/data|true`)throw Error('isolamento do container divergente')
   run(['start',c])
  }
  for(const c of createdContainers) {
   const ver=text(run(['exec',c.id,'postgres','--version']))
   if(!/^postgres \(PostgreSQL\) 16(?:\.[0-9]+)?(?:\s.*)?$/.test(ver))throw Error('PostgreSQL fora da versão 16')
   let ready=false
   for(let i=0;i<60;i++){const probe=run(['exec',c.id,'pg_isready','-U','fixture','-d','fixture'],{allowFailure:true});if(probe.status===0){ready=true;break} await pause(1000)}
   if(!ready)throw Error('PostgreSQL não iniciou')
  }
  const [src,dst]=createdContainers.map(c=>c.id), attachment=Buffer.from('anexo-sintetico-ct011'), expectedHash=digest(attachment)
  const sql=`CREATE TABLE anexos (caminho text NOT NULL, tamanho integer NOT NULL, sha256 text NOT NULL); INSERT INTO anexos VALUES ('cliente/anexo.txt', ${attachment.length}, '${expectedHash}');`
  run(['exec','-i',src,'psql','-X','-w','-v','ON_ERROR_STOP=1','-U','fixture','-d','fixture'],{input:Buffer.from(sql)})
  const dump=run(['exec','-i',src,'pg_dump','-w','-U','fixture','-d','fixture','-Fc']).stdout
  if(!dump.length||dump.length>LIMIT)throw Error('dump sintético inválido')
  const source=path.join(work,'source'),copy=path.join(work,'copy'),extract=path.join(work,'extract')
  for(const dir of [source,copy,extract])mkdirSync(dir,{mode:0o700})
  const archive=fixtureTar(attachment);if(archive.length>LIMIT)throw Error('tar sintético excede limite')
  for(const [name,value] of [['database.dump',dump],['uploads.tar.gz',archive]]) {files.write(path.join(source,name),value,{mode:0o600,flag:'wx'});files.copy(path.join(source,name),path.join(copy,name));if(digest(files.read(path.join(copy,name)))!==digest(value))throw Error('cópia divergente')}
  run(['exec','-i',dst,'pg_restore','-w','-U','fixture','-d','fixture','--exit-on-error'],{input:readFileSync(path.join(copy,'database.dump'))})
  const invalid=run(['exec','-i',dst,'pg_restore','--list'],{input:dump.subarray(0,Math.min(12,dump.length)),allowFailure:true})
  if(invalid.status===0)throw Error('dump truncado aceito')
  const rows=text(run(['exec',dst,'psql','-X','-w','-A','-t','-F','|','-U','fixture','-d','fixture','-c','SELECT caminho,tamanho,sha256 FROM anexos ORDER BY caminho']))
  if(rows!==`cliente/anexo.txt|${attachment.length}|${expectedHash}`)throw Error('conteúdo restaurado divergente')
  extractSynthetic(readFileSync(path.join(copy,'uploads.tar.gz')),extract)
  const reconciliation=reconcileFixture([{caminho:'cliente/anexo.txt',tamanho:attachment.length}],extract)
  if(reconciliation.references!==1||reconciliation.orphans.length||digest(readFileSync(path.join(extract,'cliente/anexo.txt')))!==expectedHash)throw Error('anexo divergente')
  let rejected=false
  try {reconcileFixture([{caminho:'cliente/ausente.txt',tamanho:1}],extract)} catch {rejected=true}
  if(!rejected)throw Error('referência ausente aceita')
  if(observer) {
   const view=Object.freeze({run:id,context,sourceContainer:src,targetContainer:dst,volumes:Object.freeze([...createdVolumes]),workdir:work,artifacts:Object.freeze({sourceDump:path.join(source,'database.dump'),sourceUploads:path.join(source,'uploads.tar.gz'),copiedDump:path.join(copy,'database.dump'),copiedUploads:path.join(copy,'uploads.tar.gz'),extractedAttachment:path.join(extract,'cliente/anexo.txt')})})
   const remaining=deadline-Date.now();if(remaining<=0)throw Error('prazo excedido antes do observador')
   let timer
   try {await Promise.race([Promise.resolve().then(()=>observer(view)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('prazo do observador excedido')),remaining)})])} catch {throw Error('observador QA falhou ou excedeu prazo')} finally {clearTimeout(timer)}
   if(Date.now()>deadline)throw Error('prazo excedido após observador')
  }
  report={result:'synthetic-recovery-verified',run:id,postgres:'16',references:1,orphans:0,operationalReady:false}
 } catch(error) {failure=error}
 finally {
  for(const c of createdContainers.reverse()) {try {const identity=text(invoke(['inspect','--format',`{{.Id}}|{{.Name}}|{{index .Config.Labels "${LABEL}"}}`,c.id],{cleanup:true}));if(identity!==`${c.id}|/${c.name}|${labelValue}`)throw Error('container não pertence ao ensaio');invoke(['rm','-f',c.id],{cleanup:true})} catch {failure=Error(`${failure?.message||'ensaio incompleto'}; limpeza de container não comprovada`)}}
  for(const v of createdVolumes.reverse()) {try {if(text(invoke(['volume','inspect','--format',`{{index .Labels "${LABEL}"}}`,v],{cleanup:true}))!==labelValue)throw Error('volume não pertence ao ensaio');invoke(['volume','rm',v],{cleanup:true})} catch {failure=Error(`${failure?.message||'ensaio incompleto'}; limpeza de volume não comprovada`)}}
  if(work){try{const st=lstatSync(work);if(!st.isDirectory()||st.isSymbolicLink()||st.dev!==workStat.dev||st.ino!==workStat.ino||path.dirname(realpathSync(work))!==cwd)throw Error('diretório divergente');rmSync(work,{recursive:true})}catch{failure=Error(`${failure?.message||'ensaio incompleto'}; limpeza da fixture não comprovada`)}}
 }
 if(failure){failure.message+=`; run=${id}; confira recursos com essa etiqueta se limpeza incompleta`;throw failure}
 return report
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2)
 if(args.length!==8||args[0]!=='--execute'){console.error('Uso bloqueado: --execute CONTEXTO SOCKET_UNIX IMAGE_ID POLITICA_ABSOLUTA SHA256_POLITICA DECISAO autorizado-somente-dados-sinteticos');process.exitCode=78}
 else runRealRehearsal({context:args[1],socket:args[2],image:args[3],policyPath:args[4],policyHash:args[5],decision:args[6],ack:args[7]}).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error('Ensaio falhou ou limpeza não comprovada:',e.message);process.exitCode=1})
}
