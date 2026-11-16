// Fixture only: no product entry point, network, Docker or access outside /work.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawn,spawnSync} from 'node:child_process'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,chmodSync,existsSync,symlinkSync} from 'node:fs'
import {createHash,createHmac} from 'node:crypto'
import path from 'node:path'
const sha='a'.repeat(40),image='sha256:'+'b'.repeat(64),tar=Buffer.from('tar fixture autenticado'),hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
const code=String.raw`
const fs=require('fs'),path=require('path'),crypto=require('crypto');
try {
 const d=process.env.D; if(process.cwd()!=='/work'||!/^\/work\/\.nxg036-repair-[A-Za-z0-9]+$/.test(d))throw Error('fixture only');
 const dir=fs.lstatSync(d);if(!dir.isDirectory()||dir.isSymbolicLink()||fs.realpathSync(d)!==d)throw Error('root');
 const read=(name)=>{const f=path.join(d,name),s=fs.lstatSync(f);if(!s.isFile()||s.isSymbolicLink()||s.uid!==Number(process.env.UID_EXPECTED)||(s.mode&0o777)!==0o600)throw Error('file');return fs.readFileSync(f)};
 const marker=read('marker').toString(),pending=read('pending').toString(),selection=read('selection').toString(),bytes=read('tar'),source=read('source').toString(),observation=JSON.parse(read('observation'));
 const digest='sha256:'+crypto.createHash('sha256').update(bytes).digest('hex');
 // Fixed independently provisioned synthetic expectations, not evidence about a real source.
 const trusted=crypto.createHmac('sha256','synthetic-key-not-real').update(process.env.SHA+'|'+process.env.IMAGE+'|'+digest).digest('hex');
 if(source!==trusted||digest!==process.env.TAR_HASH||marker!=='sha='+process.env.SHA+'\nimage='+process.env.IMAGE+'\n'||pending!=='pending sha='+process.env.SHA+'\n'||selection!=='environment=production\nsha='+process.env.SHA+'\ntar='+digest+'\nimage='+process.env.IMAGE+'\n'||observation.id!==process.env.IMAGE||observation.target!=='fixture-production'||observation.container!=='fixture-container-01'||observation.pin!==process.env.IMAGE||observation.health!=='ok'||observation.db!=='connected')throw Error('evidence');
 const a=fs.lstatSync(path.join(d,'pending'));fs.linkSync(path.join(d,'pending'),path.join(d,'completed'));const b=fs.lstatSync(path.join(d,'completed'));if(a.dev!==b.dev||a.ino!==b.ino)throw Error('identity');fs.unlinkSync(path.join(d,'pending'));
 console.log('FIXTURE_CONCLUDED');
} catch { process.stderr.write('FIXTURE_REFUSED\n');process.exitCode=1 }
`
function fixture(){
 assert.equal(process.cwd(),'/work');const d=mkdtempSync('/work/.nxg036-repair-');
 const files={marker:`sha=${sha}\nimage=${image}\n`,pending:`pending sha=${sha}\n`,selection:`environment=production\nsha=${sha}\ntar=${hash(tar)}\nimage=${image}\n`,tar,source:createHmac('sha256','synthetic-key-not-real').update(sha+'|'+image+'|'+hash(tar)).digest('hex'),observation:JSON.stringify({id:image,pin:image,target:'fixture-production',container:'fixture-container-01',health:'ok',db:'connected'})};
 for(const [n,v] of Object.entries(files))writeFileSync(path.join(d,n),v,{mode:0o600});writeFileSync(path.join(d,'lock'),'fixture',{mode:0o600})
 const env={...process.env,D:d,UID_EXPECTED:String(process.getuid()),TAR_HASH:hash(tar),SHA:sha,IMAGE:image}
 const run=(extra={})=>spawnSync('flock',['-n',path.join(d,'lock'),process.execPath,'-e',code],{env:{...env,...extra},encoding:'utf8'});
 return {d,env,run,snapshot:()=>Object.fromEntries(['marker','pending','selection','tar','source','observation'].map(n=>[n,readFileSync(path.join(d,n)).toString('hex')]))}
}
test('procedimento apenas sintético conclui pending após origem, seleção, dono, identidade, health e lock',()=>{const f=fixture();try{const before=f.snapshot();const r=f.run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/FIXTURE_CONCLUDED/);assert(!existsSync(path.join(f.d,'pending')));assert.equal(readFileSync(path.join(f.d,'completed'),'hex'),before.pending);for(const n of ['marker','selection','tar','source','observation'])assert.equal(readFileSync(path.join(f.d,n),'hex'),before[n])}finally{rmSync(f.d,{recursive:true,force:true})}})
test('cada evidência divergente ou ausente recusa e preserva o estado sintético',()=>{for(const variant of ['sha','tar','image','pin','target','health','marker','pending','selection','owner','mode','origin','symlink','missing']){const f=fixture();try{let extra={};if(variant==='sha')extra.SHA='c'.repeat(40);if(variant==='tar')writeFileSync(path.join(f.d,'tar'),'wrong');if(variant==='image')extra.IMAGE='sha256:'+'c'.repeat(64);if(variant==='pin')writeFileSync(path.join(f.d,'observation'),JSON.stringify({id:image,pin:'sha256:'+'c'.repeat(64),target:'fixture-production',container:'fixture-container-01',health:'ok',db:'connected'}));if(variant==='target')writeFileSync(path.join(f.d,'observation'),JSON.stringify({id:image,pin:image,target:'fixture-other',container:'fixture-container-01',health:'ok',db:'connected'}));if(variant==='health')writeFileSync(path.join(f.d,'observation'),JSON.stringify({id:image,pin:image,target:'fixture-production',container:'fixture-container-01',health:'error',db:'connected'}));if(['marker','pending','selection'].includes(variant))writeFileSync(path.join(f.d,variant),'incompleto');if(variant==='owner')extra.UID_EXPECTED=String(process.getuid()+1);if(variant==='mode')chmodSync(path.join(f.d,'pending'),0o644);if(variant==='origin')writeFileSync(path.join(f.d,'source'),'invalid');if(variant==='symlink'){rmSync(path.join(f.d,'marker'));symlinkSync('pending',path.join(f.d,'marker'))}if(variant==='missing')rmSync(path.join(f.d,'marker'));const before=variant==='missing'?null:f.snapshot(),r=f.run(extra);assert.notEqual(r.status,0,variant);assert(!existsSync(path.join(f.d,'completed')),variant);if(before)assert.deepEqual(f.snapshot(),before,variant);else assert(existsSync(path.join(f.d,'pending')))}finally{rmSync(f.d,{recursive:true,force:true})}}})
test('lock ocupado impede conclusão e preserva evidências',async()=>{const f=fixture();try{const before=f.snapshot(),holder=spawn('flock',['-x',path.join(f.d,'lock'),'sh','-c','printf READY; read x'],{stdio:['pipe','pipe','pipe']});await new Promise((resolve,reject)=>{holder.stdout.once('data',resolve);holder.once('error',reject)});try{const r=f.run();assert.notEqual(r.status,0);assert.deepEqual(f.snapshot(),before);assert(!existsSync(path.join(f.d,'completed')))}finally{holder.stdin.end('\n');await new Promise(resolve=>holder.once('exit',resolve))}}finally{rmSync(f.d,{recursive:true,force:true})}})

test('colisão de conclusão preserva pending e conclusão preexistente',()=>{const f=fixture();try{writeFileSync(path.join(f.d,'completed'),'terceiro',{mode:0o600});const before=f.snapshot(),r=f.run();assert.notEqual(r.status,0);assert.deepEqual(f.snapshot(),before);assert.equal(readFileSync(path.join(f.d,'completed'),'utf8'),'terceiro')}finally{rmSync(f.d,{recursive:true,force:true})}})
