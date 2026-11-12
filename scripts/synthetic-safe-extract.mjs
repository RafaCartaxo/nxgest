// Extração para ensaio sintético isolado; aceita apenas tar ustar regular/diretório.
import { gunzipSync } from 'node:zlib'
import { lstatSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const MAX=8*1024*1024
export function extractSynthetic(buffer, root) {
 const dir=lstatSync(root); if(!dir.isDirectory()||dir.isSymbolicLink()||readdirSync(root).length) throw Error('destino não vazio ou inseguro')
 const data=gunzipSync(buffer,{maxOutputLength:MAX}); let offset=0, terminated=false; const seen=new Set()
 const field=(b,start,len)=>b.subarray(start,start+len).toString('utf8').replace(/\0.*$/s,'')
 while(offset+512<=data.length) {
  const h=data.subarray(offset,offset+512);offset+=512
  if(h.every(x=>x===0)){terminated=true;break}
  if(!h.subarray(257,263).equals(Buffer.from('ustar\0','ascii')) || !h.subarray(263,265).equals(Buffer.from('00','ascii')))throw Error('formato ustar inválido')
  const raw=field(h,0,100),prefix=field(h,345,155),name=prefix?`${prefix}/${raw}`:raw
  const type=String.fromCharCode(h[156]||48), sizeRaw=field(h,124,12).trim(), checksumRaw=field(h,148,8).trim()
  if(!/^[0-7]+$/.test(sizeRaw)||!/^[0-7]+$/.test(checksumRaw)) throw Error('tar inválido')
  let sum=0;for(let i=0;i<512;i++)sum+=(i>=148&&i<156)?32:h[i]
  if(sum!==parseInt(checksumRaw,8))throw Error('checksum tar inválido')
  const size=parseInt(sizeRaw,8), clean=name.endsWith('/')?name.slice(0,-1):name, parts=clean.split('/')
  if(!clean||path.posix.isAbsolute(clean)||clean.includes('\\')||parts.some(x=>!x||x==='.'||x==='..')||seen.has(clean)||!['0','5'].includes(type)||size>MAX||(type==='5'&&size!==0))throw Error('membro inseguro')
  if(offset+Math.ceil(size/512)*512>data.length)throw Error('tar truncado')
  seen.add(clean);const dest=path.join(root,...parts)
  if(type==='5') mkdirSync(dest,{recursive:true,mode:0o700})
  else {mkdirSync(path.dirname(dest),{recursive:true,mode:0o700});writeFileSync(dest,data.subarray(offset,offset+size),{flag:'wx',mode:0o600})}
  offset+=Math.ceil(size/512)*512
 }
 if(!terminated)throw Error('tar incompleto')
 return {entries:seen.size}
}
