// Validador exclusivamente sintético; não define uma fonte de confiança real.
export function compareEvidence(e, observed) {
 if (!e || !observed || e.reviewer === '' || typeof e.reviewer !== 'string') throw Error('revisão ausente')
 if (e.schemaStatus !== 'compatible' || observed.schemaStatus !== 'compatible') throw Error('schema incompatível')
 for (const key of ['previousSha','image','mounts','config','bundle']) {
  if (typeof e[key] !== 'string' || !e[key] || e[key] !== observed[key]) throw Error(`divergência: ${key}`)
 }
 return {syntheticOnly:true, readyForProduction:false}
}
