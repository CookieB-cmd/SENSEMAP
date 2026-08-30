import {claimProviderRequestSlot,retryAfterSeconds,sha256Hex} from './provider.ts'

Deno.test('hashes cache keys deterministically',async()=>{const a=await sha256Hex('same'),b=await sha256Hex('same'),c=await sha256Hex('other');if(a!==b||a===c)throw new Error('hash contract failed')})

Deno.test('claims provider slots through the service-role RPC',async()=>{
  let rpcName=''
  let rpcArgs:Record<string,unknown>={}
  const client={rpc:async(name:string,args:Record<string,unknown>)=>{rpcName=name;rpcArgs=args;return {data:true,error:null}}}
  const claimed=await claimProviderRequestSlot(client,'nominatim',1000)
  if(!claimed)throw new Error('expected slot to be claimed')
  if(rpcName!=='claim_provider_request_slot')throw new Error(`unexpected RPC: ${rpcName}`)
  if(rpcArgs.p_provider!=='nominatim'||rpcArgs.p_interval_ms!==1000)throw new Error('unexpected RPC arguments')
})

Deno.test('returns false for a busy provider slot and surfaces RPC errors',async()=>{
  const busy={rpc:async()=>({data:false,error:null})}
  if(await claimProviderRequestSlot(busy,'nominatim',1000))throw new Error('busy slot must return false')
  const broken={rpc:async()=>({data:null,error:{message:'rpc failed'}})}
  let message=''
  try{await claimProviderRequestSlot(broken,'nominatim',1000)}catch(error){message=error instanceof Error?error.message:String(error)}
  if(!message.includes('rpc failed'))throw new Error('RPC errors must be surfaced')
})

Deno.test('rounds provider retry-after to whole seconds',()=>{
  if(retryAfterSeconds(1000)!==1)throw new Error('1000ms should be 1 second')
  if(retryAfterSeconds(1001)!==2)throw new Error('1001ms should round up to 2 seconds')
})
