import {sha256Hex,valueOrDefault} from './provider.ts'

Deno.test('hashes cache keys deterministically',async()=>{const a=await sha256Hex('same'),b=await sha256Hex('same'),c=await sha256Hex('other');if(a!==b||a===c)throw new Error('hash contract failed')})

Deno.test('provider options prefer a configured value and otherwise use the fallback',()=>{
  if(valueOrDefault(undefined,'fallback')!=='fallback')throw new Error('undefined did not use fallback')
  if(valueOrDefault('   ','fallback')!=='fallback')throw new Error('blank value did not use fallback')
  if(valueOrDefault('  configured  ','fallback')!=='configured')throw new Error('configured value was not trimmed and used')
})
