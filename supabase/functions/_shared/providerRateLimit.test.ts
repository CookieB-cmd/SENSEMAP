import {claimProviderRequestSlot} from './providerRateLimit.ts'

Deno.test('maps provider slot RPC results to booleans',async()=>{
  let rpcName=''
  let rpcArgs:Record<string,unknown>={}
  const allowedClient={rpc:async(name:string,args:Record<string,unknown>)=>{rpcName=name;rpcArgs=args;return {data:true,error:null}}}
  if(!await claimProviderRequestSlot(allowedClient,'nominatim',1000))throw new Error('expected first slot claim to succeed')
  if(rpcName!=='claim_provider_request_slot')throw new Error(`unexpected RPC: ${rpcName}`)
  if(rpcArgs.p_provider!=='nominatim'||rpcArgs.p_interval_ms!==1000)throw new Error('unexpected RPC arguments')

  const busyClient={rpc:async()=>({data:false,error:null})}
  if(await claimProviderRequestSlot(busyClient,'nominatim',1000))throw new Error('busy slot must return false')
})

Deno.test('surfaces provider slot RPC errors',async()=>{
  const brokenClient={rpc:async()=>({data:null,error:new Error('rpc failed')})}
  let message=''
  try{await claimProviderRequestSlot(brokenClient,'nominatim',1000)}catch(error){message=error instanceof Error?error.message:String(error)}
  if(message!=='rpc failed')throw new Error(`unexpected error: ${message}`)
})
