// Orquestração exclusivamente para dublês; adaptador Docker/PG real ainda não implementado.
// Nunca aceita um adaptador operacional como fonte de confiança.
export async function runSyntheticRehearsal(adapter, request) {
 if (!adapter || adapter.kind!=='synthetic-double' || !request || !/^nxg-ct011-[a-f0-9]{16}$/.test(request.run) || request.quiescence!=='fixture-controlled') throw Error('alvo ou quiescência não comprovados')
 const context={run:request.run,bundle:`${request.run}-bundle`}
 const created=await adapter.capture(context)
 if(!created || created.bundle!==context.bundle || created.complete!==true)throw Error('captura incompleta')
 const copied=await adapter.copy(context,created)
 if(!copied || copied.bundle!==context.bundle || copied.verified!==true)throw Error('cópia incompleta')
 const restored=await adapter.restore(context,copied)
 if(!restored || restored.bundle!==context.bundle || restored.database!=='fixture-restored' || restored.attachments!=='fixture-reconciled')throw Error('restore divergente')
 return {fixtureOnly:true,operationalReady:false,bundle:context.bundle}
}
