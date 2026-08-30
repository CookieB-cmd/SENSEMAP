import {envOrDefault,sha256Hex} from './provider.ts'

Deno.test('hashes cache keys deterministically',async()=>{const a=await sha256Hex('same'),b=await sha256Hex('same'),c=await sha256Hex('other');if(a!==b||a===c)throw new Error('hash contract failed')})

Deno.test('provider options prefer a configured value and otherwise use the fallback',()=>{
  const name='SENSEMAP_TEST_PROVIDER_OPTION'
  const previous=Deno.env.get(name)
  try{
    Deno.env.delete(name)
    if(envOrDefault(name,'fallback')!=='fallback')throw new Error('fallback was not used')
    Deno.env.set(name,'  configured  ')
    if(envOrDefault(name,'fallback')!=='configured')throw new Error('configured value was not trimmed and used')
  }finally{
    if(previous===undefined)Deno.env.delete(name)
    else Deno.env.set(name,previous)
  }
})
