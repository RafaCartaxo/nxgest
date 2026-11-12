// Exclusivamente para ensaio de dados sintéticos: não valida dump PostgreSQL real.
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
export function reconcileFixture(rows, root) {
  if (!Array.isArray(rows)) throw Error('referências indisponíveis')
  const base=path.resolve(root), used=new Set()
  if (!lstatSync(base).isDirectory()) throw Error('uploads indisponíveis')
  for (const row of rows) {
    if (!row || typeof row.caminho !== 'string' || !Number.isSafeInteger(row.tamanho) || row.tamanho < 0) throw Error('referência inválida')
    const parts=row.caminho.split('/')
    if (parts.some(p=>!p || p==='.' || p==='..') || row.caminho.includes('\\') || path.isAbsolute(row.caminho) || used.has(row.caminho)) throw Error('caminho inseguro ou duplicado')
    let current=base
    for (const [index,part] of parts.entries()) {
      current=path.join(current,part)
      const st=lstatSync(current)
      if (st.isSymbolicLink() || (index<parts.length-1 && !st.isDirectory()) || (index===parts.length-1 && (!st.isFile() || st.size!==row.tamanho))) throw Error('arquivo ausente, inseguro ou tamanho divergente')
    }
    used.add(row.caminho)
  }
  const orphans=[]
  function walk(dir,relative='') {
    for(const item of readdirSync(dir,{withFileTypes:true})) {
      const name=relative ? `${relative}/${item.name}` : item.name, full=path.join(dir,item.name)
      if(item.isSymbolicLink()) throw Error('link inseguro')
      if(item.isDirectory()) walk(full,name)
      else if(item.isFile()) {if(!used.has(name)) orphans.push(name)}
      else throw Error('entrada insegura')
    }
  }
  walk(base)
  return { references:used.size, orphans:orphans.sort() }
}
if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 try { const rows=JSON.parse(readFileSync(process.argv[2],'utf8')); console.log(JSON.stringify(reconcileFixture(rows,process.argv[3]))) } catch { console.error('Reconciliação sintética falhou'); process.exitCode=1 }
}
