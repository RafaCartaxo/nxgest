import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash,randomBytes} from 'node:crypto'
import {writeFileSync,copyFileSync,readFileSync,mkdirSync,rmSync,chmodSync,symlinkSync,lstatSync,unlinkSync,rmdirSync} from 'node:fs'
import path from 'node:path'
import {runRealRehearsal} from './rehearsal-postgres-real.mjs'
const id='f'.repeat(32), image='sha256:'+'9'.repeat(64), socket='unix:///fixture/docker.sock', opts={context:'fixture',socket,image,ack:'autorizado-somente-dados-sinteticos'}
process.env.NXGEST_CT011_WORKSPACE=process.cwd()
const policy={policy:'nxg-ct011-pg16-v1',source:'coord-qa-approved',reference:'QA/PG16/fixture',major:16,image}
const runFixture=(o,dependencies={})=>runRealRehearsal(o,{policyLoader:()=>policy,...dependencies})
function fake({failRestore=false,wrongCleanup=false,wrongSocket=false,collision=false,unready=false,interrupted=false,wrongVersion=false}={}) {
 const calls=[],containers=new Map(),volumes=new Set(); let counter=0
 const out=(s='',status=0)=>({status,stdout:Buffer.from(s)})
 const run=(a,o={})=>{calls.push(a);const [c,s]=a
  if(c==='context')return out(wrongSocket?'unix:///wrong.sock':socket)
  if(c==='image')return out(a.at(-1).includes('.Config.Volumes')?'/var/lib/postgresql/data;':image)
  if(c==='volume'&&s==='ls')return out(collision?'existing':'')
  if(c==='volume'&&s==='create'){const n=a.at(-1);volumes.add(n);return out(n)}
  if(c==='volume'&&s==='inspect'){const n=a.at(-1);assert(volumes.has(n));return out(a.includes(`{{index .Labels "nxg.ct011.run"}}`)?id:`local|tmpfs|tmpfs|size=384m|${id}`)}
  if(c==='volume'&&s==='rm'){volumes.delete(a.at(-1));return out()}
  if(c==='ps')return out()
  if(c==='create'){const name=a[a.indexOf('--name')+1],cid=String(++counter).repeat(64);containers.set(cid,name);return out(cid)}
  if(c==='inspect'){const cid=a.at(-1),name=containers.get(cid);assert(name);return out(a[2].includes('NetworkMode')?`${cid}|/${name}|${id}|none|${image}|2000000000|1073741824|1|volume|${name}|/var/lib/postgresql/data|true`:`${cid}|/${name}|${wrongCleanup?'wrong':id}`)}
  if(c==='rm'){containers.delete(a.at(-1));return out()}
  if(c==='start')return out()
  if(c==='exec'){
   if(a.includes('postgres'))return out(wrongVersion?'postgres (PostgreSQL) 15.4':'postgres (PostgreSQL) 16.14')
   if(a.includes('pg_isready'))return out('',unready?1:0)
   if(a.includes('pg_dump')){if(interrupted)throw Error('interrupção simulada');return out('synthetic-custom-dump-contents')}
   if(a.includes('pg_restore')){if(a.includes('--list'))return out('',1);if(failRestore)throw Error('restore fixture falhou');assert.equal(o.input.toString(),'synthetic-custom-dump-contents');return out()}
   if(a.includes('psql')&&a.includes('-c')){const b=Buffer.from('anexo-sintetico-ct011');return out(`cliente/anexo.txt|${b.length}|${createHash('sha256').update(b).digest('hex')}`)}
   if(a.includes('psql')){assert.match(o.input.toString(),/CREATE TABLE anexos/);return out()}
  }
  throw Error(`comando imprevisto: ${a.join(' ')}`)
 }
 return {run,calls,containers,volumes}
}
test('ciclo sintético usa somente recursos limitados e remove IDs próprios',async()=>{const f=fake();const result=await runFixture(opts,{runner:f.run,runId:id});assert.equal(result.operationalReady,false);assert.equal(result.references,1);assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0);const creates=f.calls.filter(a=>a[0]==='create');assert.equal(creates.length,2);for(const a of creates){for(const flag of ['--pull=never','--network','none','--log-driver','--cpus','2','--memory','1g'])assert(a.includes(flag));assert.equal(a.at(-1),image)}assert.equal(f.calls.filter(a=>a[0]==='rm').length,2);assert(f.calls.some(a=>a.includes('pg_dump')));assert(f.calls.some(a=>a.includes('pg_restore')&&a.includes('--list')))})
test('falha de restore limpa somente recursos criados',async()=>{const f=fake({failRestore:true});await assert.rejects(runFixture(opts,{runner:f.run,runId:id}),/restore fixture/);assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0)})
test('divergência do contexto falha antes de criar',async()=>{const f=fake({wrongSocket:true});await assert.rejects(runFixture(opts,{runner:f.run,runId:id}),/socket diverge/);assert(!f.calls.some(a=>a[0]==='create'||a[1]==='create'))})
test('recusa remover containers com identidade divergente',async()=>{const f=fake({wrongCleanup:true});await assert.rejects(runFixture(opts,{runner:f.run,runId:id}),/limpeza de container/);assert.equal(f.calls.filter(a=>a[0]==='rm').length,0)})
test('opt-in inválido não chama runner',async()=>{const f=fake();await assert.rejects(runFixture({...opts,ack:'nao'},{runner:f.run,runId:id}));assert.equal(f.calls.length,0)})

test('política ausente, falsificada, major incompatível e ID divergente falham antes de qualquer create/start',async()=>{
 for(const policyLoader of [()=>{throw Error('ausente')},()=>({...policy,source:'autoafirmado'}),()=>({...policy,major:15}),()=>({...policy,image:'sha256:'+'8'.repeat(64)})]){
  const f=fake();await assert.rejects(runFixture(opts,{runner:f.run,runId:id,policyLoader}));assert.equal(f.calls.length,0)
 }
})
test('colisão, interrupção e versão runtime divergente falham com limpeza por identidade',async()=>{
 for(const options of [{collision:true},{interrupted:true},{wrongVersion:true}]) {const f=fake(options);await assert.rejects(runFixture(opts,{runner:f.run,runId:id}));assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0);if(options.collision)assert(!f.calls.some(a=>a[0]==='create'||a[0]==='start'))}
})
test('readiness negativa esgota limite e limpa recursos; não é health da aplicação',async()=>{
 const f=fake({unready:true});await assert.rejects(runFixture(opts,{runner:f.run,runId:id,sleep:async()=>{}}),/não iniciou/);assert.equal(f.calls.filter(a=>a.includes('pg_isready')).length,60);assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0)
})
test('disco cheio, falha de cópia e corrupção de cópia falham e limpam',async()=>{
 for(const mode of ['disk','copy','corrupt']) {
  const f=fake(),io={write:(...a)=>{if(mode==='disk')throw Error('ENOSPC fixture');return writeFileSync(...a)},copy:(...a)=>{if(mode==='copy')throw Error('cópia fixture falhou');return copyFileSync(...a)},read:(p)=>mode==='corrupt'?Buffer.from('alterado'):readFileSync(p)}
  await assert.rejects(runFixture(opts,{runner:f.run,runId:id,io}));assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0);assert(!f.calls.some(a=>a.includes('pg_restore')))
 }
})
test('sem política externa provisionada, loader real bloqueia antes do runner',async()=>{
 const f=fake();await assert.rejects(runRealRehearsal(opts,{runner:f.run,runId:id}));assert.equal(f.calls.length,0)
})

test('loader controlado preserva objetos preexistentes em sucesso, erro e colisão',async()=>{
 const base=path.join(process.cwd(),'.maestro'),coord=path.join(base,'coord-qa'),dir=path.join(coord,'ct011-policies')
 const file=path.join(dir,`fixture-${randomBytes(16).toString('hex')}.json`),link=path.join(dir,`fixture-${randomBytes(16).toString('hex')}.json`),createdDirs=[],createdFiles=[]
 const identity=p=>{const st=lstatSync(p);return {dev:st.dev,ino:st.ino}}
 const same=(p,id)=>{const st=lstatSync(p);return st.dev===id.dev&&st.ino===id.ino}
 const content=Buffer.from(JSON.stringify(policy)),hash='sha256:'+createHash('sha256').update(content).digest('hex')
 const input={...opts,policyPath:file,policyHash:hash,decision:policy.reference}
 try {
  for(const d of [base,coord,dir]) {try{mkdirSync(d,{mode:0o700});createdDirs.push([d,identity(d)])}catch(e){if(e.code!=='EEXIST')throw e;const st=lstatSync(d);if(!st.isDirectory()||st.isSymbolicLink())throw e}}
  writeFileSync(file,content,{mode:0o600,flag:'wx'});createdFiles.push([file,identity(file)])
  assert.throws(()=>writeFileSync(file,'colisão',{flag:'wx'}),{code:'EEXIST'});assert.deepEqual(readFileSync(file),content)
  let f=fake();await runRealRehearsal(input,{runner:f.run,runId:id});assert(f.calls.some(a=>a[0]==='start'))
  for(const change of [{policyHash:'sha256:'+'0'.repeat(64)},{decision:'QA/PG16/outra'},{policyPath:path.join(process.cwd(),'approved.json')}]) {f=fake();await assert.rejects(runRealRehearsal({...input,...change},{runner:f.run,runId:id}));assert.equal(f.calls.length,0)}
  chmodSync(file,0o666);f=fake();await assert.rejects(runRealRehearsal(input,{runner:f.run,runId:id}));assert.equal(f.calls.length,0);chmodSync(file,0o600)
  symlinkSync('/nao-existe',link);createdFiles.push([link,identity(link)]);f=fake();await assert.rejects(runRealRehearsal({...input,policyPath:link},{runner:f.run,runId:id}));assert.equal(f.calls.length,0)
 } finally {
  for(const [p,id] of createdFiles.reverse()) {if(!same(p,id))throw Error('fixture substituída; limpeza recusada');unlinkSync(p)}
  for(const [p,id] of createdDirs.reverse()) {if(!same(p,id))throw Error('diretório substituído; limpeza recusada');try{rmdirSync(p)}catch(e){if(e.code!=='ENOTEMPTY')throw e}}
 }
})

test('observador recebe cópia imutável sem credenciais após restore e antes de cleanup',async()=>{
 const f=fake();let seen
 const report=await runFixture(opts,{runner:f.run,runId:id,observer:async view=>{
  await Promise.resolve();seen=view;assert(Object.isFrozen(view));assert(Object.isFrozen(view.volumes));assert(Object.isFrozen(view.artifacts));assert.equal(view.run,id);assert.equal(view.context,opts.context);assert.equal(view.sourceContainer,'1'.repeat(64));assert.equal(view.targetContainer,'2'.repeat(64));assert.equal(view.volumes.length,2)
  assert(!JSON.stringify(view).match(/password|secret|synthetic\.env/i));assert.equal(readFileSync(view.artifacts.extractedAttachment,'utf8'),'anexo-sintetico-ct011')
  assert(f.calls.some(a=>a.includes('pg_restore')));assert(!f.calls.some(a=>a[0]==='rm'||a[0]==='volume'&&a[1]==='rm'))
  assert.throws(()=>{view.volumes[0]='other'},TypeError)
 }})
 assert(seen);assert.equal(report.operationalReady,false);assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0)
})
test('erro do observador falha fechado e limpa recursos próprios',async()=>{
 const f=fake();await assert.rejects(runFixture(opts,{runner:f.run,runId:id,observer:async()=>{throw Error('não propagar detalhes')}}),/observador QA falhou/);assert.equal(f.containers.size,0);assert.equal(f.volumes.size,0);assert.equal(f.calls.filter(a=>a[0]==='rm').length,2)
})
test('injeções de teste sem runner continuam recusadas e observador inválido bloqueia',async()=>{
 await assert.rejects(runRealRehearsal(opts,{observer:()=>{},runId:id}),/injeção exige runner/)
 const f=fake();await assert.rejects(runFixture(opts,{runner:f.run,runId:id,observer:'arquivo'}),/observador inválido/);assert.equal(f.calls.length,0)
})
