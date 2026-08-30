import {sha256Hex} from './provider.ts'
Deno.test('hashes cache keys deterministically',async()=>{const a=await sha256Hex('same'),b=await sha256Hex('same'),c=await sha256Hex('other');if(a!==b||a===c)throw new Error('hash contract failed')})
