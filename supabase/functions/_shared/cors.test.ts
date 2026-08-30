import {jsonResponse} from './cors.ts'

Deno.test('jsonResponse preserves defaults and merges retry headers',()=>{
  const response=jsonResponse({error:'busy'},429,{'Retry-After':'1'})
  if(response.status!==429)throw new Error(`unexpected status: ${response.status}`)
  if(response.headers.get('Retry-After')!=='1')throw new Error('Retry-After header missing')
  if(response.headers.get('Content-Type')!=='application/json')throw new Error('Content-Type header missing')
  if(response.headers.get('Access-Control-Allow-Origin')!=='*')throw new Error('CORS header missing')
})
