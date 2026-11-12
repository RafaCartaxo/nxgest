// Aceita somente o formato limitado de dois arquivos regulares do artifact de build.
import {inflateRawSync} from 'node:zlib'
const MAX_ZIP=512*1024*1024,MAX_ENTRY=512*1024*1024
function crc32(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
const u16=(b,p)=>b.readUInt16LE(p),u32=(b,p)=>b.readUInt32LE(p)
export function extractBuildZip(data, expectedNames=['image.tar','receipt.json']) {
 if(!Array.isArray(expectedNames)||!(['image.tar,receipt.json','staging-receipt.json'].includes(expectedNames.join(','))))throw Error('contrato ZIP inválido')
 const count=expectedNames.length
 if(!Buffer.isBuffer(data)||data.length<22||data.length>MAX_ZIP)throw Error('ZIP inválido')
 const e=data.length-22;if(u32(data,e)!==0x06054b50||u16(data,e+20)!==0||u16(data,e+4)!==0||u16(data,e+6)!==0||u16(data,e+8)!==count||u16(data,e+10)!==count)throw Error('ZIP fim inválido')
 const size=u32(data,e+12),start=u32(data,e+16);if(start+size!==e)throw Error('ZIP diretório inválido')
 let p=start;const result=new Map(),ranges=[]
 for(let i=0;i<count;i++){
  if(p+46>e||u32(data,p)!==0x02014b50)throw Error('ZIP entrada inválida')
  const flags=u16(data,p+8),method=u16(data,p+10),crc=u32(data,p+16),compressed=u32(data,p+20),plain=u32(data,p+24),nl=u16(data,p+28),extra=u16(data,p+30),comment=u16(data,p+32),ext=u32(data,p+38),offset=u32(data,p+42),end=p+46+nl+extra+comment
  if(end>e||(flags&~0x808)!==0||![0,8].includes(method)||compressed>MAX_ENTRY||plain>MAX_ENTRY||u16(data,p+34)!==0)throw Error('ZIP formato recusado')
  const name=data.subarray(p+46,p+46+nl).toString('utf8'),mode=ext>>>16
  if(!expectedNames.includes(name)||result.has(name)||(mode&0o170000)!==0&&(mode&0o170000)!==0o100000)throw Error('ZIP nome ou tipo recusado')
  if(offset+30>start||u32(data,offset)!==0x04034b50||u16(data,offset+6)!==flags||u16(data,offset+8)!==method)throw Error('ZIP cabeçalho divergente')
  const localNameLen=u16(data,offset+26),localExtra=u16(data,offset+28),begin=offset+30+localNameLen+localExtra,finish=begin+compressed
  if(finish>start||!data.subarray(offset+30,offset+30+localNameLen).equals(Buffer.from(name))||ranges.some(([a,b])=>offset<b&&finish>a))throw Error('ZIP conteúdo divergente')
  ranges.push([offset,finish]);const slice=data.subarray(begin,finish);let body
  try{body=method===0?Buffer.from(slice):inflateRawSync(slice,{maxOutputLength:MAX_ENTRY})}catch{throw Error('ZIP descompressão inválida')}
  if(body.length!==plain||crc32(body)!==crc)throw Error('ZIP integridade inválida')
  result.set(name,body);p=end
 }
 if(p!==e||result.size!==count)throw Error('ZIP entradas divergentes')
 return Object.freeze({image:result.get('image.tar'),receipt:result.get(expectedNames.length===1?'staging-receipt.json':'receipt.json')})
}
