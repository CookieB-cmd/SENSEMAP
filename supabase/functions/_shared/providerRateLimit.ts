interface RpcClient {
  rpc(name:string,args:Record<string,unknown>):PromiseLike<{data:unknown;error:unknown}>
}

export async function claimProviderRequestSlot(
  client:RpcClient,
  provider:string,
  intervalMs:number,
):Promise<boolean>{
  const {data,error}=await client.rpc('claim_provider_request_slot',{
    p_provider:provider,
    p_interval_ms:intervalMs,
  })
  if(error)throw error
  return data===true
}
