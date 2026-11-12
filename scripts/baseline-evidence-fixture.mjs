// Política exclusivamente de fixture: NÃO fornece confiança operacional.
import { verify } from 'node:crypto'
const keys=['issuer','verifier','policy','run','bundle','environment','sha','artifact','image','schema','config','mounts','strategy','integrity','health','issued','expires']
export function verifyFixtureEnvelope(envelope, expected, trustedKey, now) {
 if (!envelope || typeof envelope.payload !== 'object' || typeof envelope.signature !== 'string') throw Error('envelope ausente')
 const p=envelope.payload
 if (Object.keys(p).sort().join('|')!==keys.slice().sort().join('|')) throw Error('campos inválidos')
 if (p.issuer!=='fixture-ci' || p.verifier!=='fixture-verifier' || p.policy!=='fixture-only-v1') throw Error('autoridade desconhecida')
 if (!Number.isSafeInteger(now) || !Number.isSafeInteger(p.issued) || !Number.isSafeInteger(p.expires) || p.issued>now || p.expires<=now || p.expires<=p.issued) throw Error('prova expirada')
 for(const k of ['run','bundle','environment','sha','artifact','image','schema','config','mounts','strategy']) if(typeof p[k]!=='string'||!p[k]||p[k]!==expected[k]) throw Error('sujeito divergente')
 if(!/^[a-f0-9]{40}$/.test(p.sha)||!/^sha256:[a-f0-9]{64}$/.test(p.artifact)||!/^sha256:[a-f0-9]{64}$/.test(p.image)||!['application','data'].includes(p.strategy)||p.integrity!=='verified'||p.health!=='ok') throw Error('evidência insuficiente')
 const canonical=JSON.stringify(Object.fromEntries(keys.map(k=>[k,p[k]])))
 if (!/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.signature) || !verify(null,Buffer.from(canonical),trustedKey,Buffer.from(envelope.signature,'base64'))) throw Error('assinatura inválida')
 return {fixtureOnly:true,operationalReady:false}
}
export function fixtureCanonical(payload) { return JSON.stringify(Object.fromEntries(keys.map(k=>[k,payload[k]]))) }
