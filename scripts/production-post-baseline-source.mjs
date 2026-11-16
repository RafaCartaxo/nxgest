#!/usr/bin/env node
// Verificação composta no runner confiável; fixture não é fonte operacional.
import {createHash} from 'node:crypto'
import {readFileSync,lstatSync,unlinkSync,rmdirSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {verifyStagingReceipt} from './verify-staging-receipt.mjs'
import {verifyBuildArtifact} from './verify-build-artifact.mjs'
const digest=b=>'sha256:'+createHash('sha256').update(b).digest('hex')
function cleanupOwnedBuild(result){
 const dir=path.dirname(result.imagePath),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
 if(path.dirname(dir)!==root||!/^\.nxg-build-verified-[A-Za-z0-9]+$/.test(path.basename(dir))||path.dirname(result.receiptPath)!==dir||path.basename(result.imagePath)!=='image.tar'||path.basename(result.receiptPath)!=='receipt.json')throw Error('custódia')
 const ds=lstatSync(dir);if(!ds.isDirectory()||ds.isSymbolicLink()||ds.uid!==process.geteuid()||(ds.mode&0o077))throw Error('custódia')
 for(const f of [result.imagePath,result.receiptPath]){const st=lstatSync(f);if(!st.isFile()||st.isSymbolicLink()||st.uid!==process.geteuid())throw Error('custódia')}
 const again=lstatSync(dir);if(again.dev!==ds.dev||again.ino!==ds.ino)throw Error('custódia')
 unlinkSync(result.imagePath);unlinkSync(result.receiptPath);rmdirSync(dir)
}
export async function verifyProductionSource(options,deps={}) {
 const fixture=Object.keys(deps).length>0
 const stage=await (deps.verifyStage||verifyStagingReceipt)(options.stage, deps.stageDeps||{})
 if(!stage?.verified || stage.fixture!==fixture || stage.stagingAttempt!==1 || stage.ciAttempt!==1) throw Error('staging não verificado')
 const build=await (deps.verifyBuild||verifyBuildArtifact)({...options.build,eventRunId:stage.ciRun,eventSha:stage.sha},deps.buildDeps||{})
 try{
  if(!build?.verified || build.fixture!==fixture || build.attempt!==1 || build.sourceSha!==stage.sha || build.runId!==stage.ciRun || build.artifactId!==stage.artifact || build.zipSha256!==stage.zip || build.imageSha256!==stage.tar || !/^sha256:[a-f0-9]{64}$/.test(stage.image||'')) throw Error('seleção divergente')
  const st=lstatSync(build.imagePath)
  if(!st.isFile()||st.isSymbolicLink()||digest(readFileSync(build.imagePath))!==stage.tar)throw Error('bytes divergentes')
  // Docker config ID, tar e índice são distintos: o image ID é apenas o confirmado pelo staging.
  return Object.freeze({verified:true,fixture,operationalReady:false,sha:stage.sha,ciRun:stage.ciRun,attempt:stage.ciAttempt,artifact:stage.artifact,zip:stage.zip,tar:stage.tar,image:stage.image,stagingRun:stage.stagingRun,imagePath:build.imagePath,receiptPath:build.receiptPath})
 }catch(error){if(!fixture && build?.imagePath && build?.receiptPath)cleanupOwnedBuild(build);throw error}
}
export function productionOperationalGate(){ return Object.freeze({operationalReady:false,reason:'BA10_ROLLBACK_NOT_VERIFIED'}) }
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2)
 const select=a[0]==='select'; if(select)a.shift()
 if(a.length!==7){console.error('Uso: STAGING_POLICY HASH DECISAO STAGING_RUN BUILD_POLICY HASH DECISAO');process.exitCode=2}
 else {
  let result
  try {
   result=await verifyProductionSource({stage:{policyPath:a[0],policyHash:a[1],decision:a[2],runId:a[3],token:process.env.GH_TOKEN},build:{policyPath:a[4],policyHash:a[5],decision:a[6],token:process.env.GH_TOKEN}})
   if(select){console.log(JSON.stringify(result))}else{console.error('NO-GO: BA10 e rollback operacionais não verificados');process.exitCode=78}
  }catch{console.error('Origem de produção recusada');process.exitCode=1}
  finally {
   if(result&&!result.fixture&&!select){
    try{cleanupOwnedBuild(result)    }catch{console.error('Custódia do artifact temporário requer revisão');process.exitCode=1}
   }
  }
 }
}
