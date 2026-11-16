// Modelo exclusivo para testes: não autentica origem nem opera infraestrutura.
import { isDeepStrictEqual } from 'node:util';

export async function exerciseFixture(state, candidate, adapter) {
  if (adapter?.kind !== 'fixture-only' || state?.kind !== 'fixture-only') throw Error('fixture required');
  const fail = () => { throw Error('fixture gate refused'); };
  if (!state.lock || state.pending || !state.consumed || !state.marker || !state.selection || !state.legacy || !state.current) fail();
  if (state.marker !== state.selection.sha || state.legacy.id !== state.consumed.legacyId || state.legacy.id === state.current.id) fail();
  if (!candidate.verifiedByFixture || candidate.environment !== 'staging' || candidate.expired || candidate.attempt !== 1 || !candidate.sha || !candidate.image || !candidate.tar || !candidate.zip || !candidate.run || !candidate.artifact) fail();
  if (state.selection.sha === candidate.sha) {
    if (!isDeepStrictEqual(state.selection, candidate.selection) || !state.current.healthy || state.current.image !== candidate.image) fail();
    return { fixture: true, operationalReady: false, retry: true };
  }
  if (state.previousCandidates.includes(candidate.sha)) fail();
  await adapter.recheck(state, candidate);
  state.pending = { sha: candidate.sha, phase: 'intent' };
  await adapter.step('intent', state, candidate);
  for (const phase of ['load', 'create', 'start', 'health']) {
    state.pending.phase = `${phase}-requested`;
    await adapter.step(phase, state, candidate);
  }
  if (!state.current.healthy || state.current.image !== candidate.image || state.legacy.id !== state.consumed.legacyId) fail();
  await adapter.recheck(state, candidate);
  state.pending.phase = 'publication-requested';
  await adapter.step('publish', state, candidate);
  state.selection = structuredClone(candidate.selection);
  state.marker = candidate.sha;
  state.pending = null;
  return { fixture: true, operationalReady: false, receipt: structuredClone(candidate.selection) };
}

export function fixtureProductionGate(evidence) {
  if (evidence?.kind !== 'fixture-only') throw Error('fixture required');
  const required = ['source','receipt','backup','copy','restore','integrity','reconciliation','schema','config','mounts','compatibility','health'];
  return { fixture: true, operationalReady: false, syntheticPass: required.every(k => evidence[k] === true) };
}

// Somente fixture: não é adaptador de BA10, não autentica dados nem permite deploy.
export async function exerciseProductionFixture(state, candidate, receipt, evidence, adapter) {
 if (state?.kind !== 'fixture-only' || adapter?.kind !== 'fixture-only' || receipt?.kind !== 'fixture-only' || evidence?.kind !== 'fixture-only') throw Error('fixture required')
 const fail=()=>{throw Error('fixture production gate refused')}
 if (!state.lock || state.pending || !state.baseline || !state.previousImage || candidate?.kind !== 'fixture-only' || candidate.environment !== 'production' || !candidate.authenticatedFixture || !receipt.attestedFixture) fail()
 for (const key of ['sha','run','attempt','artifact','zip','tar','image','stagingRun']) if (!candidate[key] || candidate[key] !== receipt[key]) fail()
 if (candidate.attempt !== 1 || !fixtureProductionGate(evidence).syntheticPass) fail()
 await adapter.recheck(state,candidate,receipt,evidence)
 state.pending={sha:candidate.sha,phase:'intent'}
 for (const phase of ['intent','load','swap','health','publish']) {
  state.pending.phase=`${phase}-requested`
  await adapter.step(phase,state,candidate)
 }
 state.selection=structuredClone(candidate);state.pending=null
 return Object.freeze({fixture:true,operationalReady:false,syntheticReceipt:true})
}
