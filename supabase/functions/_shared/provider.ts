export interface ExternalPlace {
  source:'osm'
  sourceType:'node'|'way'|'relation'
  sourceId:string
  name:string
  category:string|null
  address:string|null
  lat:number
  lng:number
  sourceTags:Record<string,string>
}
export interface PlaceProvider {
  search(query:string,locale:'nn'|'en',bias?:{lat:number;lng:number}):Promise<ExternalPlace[]>
  discover(bbox:{south:number;west:number;north:number;east:number}):Promise<ExternalPlace[]>
}
export interface ProviderRequest{url:string;headers?:Record<string,string>;body?:BodyInit|null;method?:string}
export interface ProviderClient{fetchJson<T>(request:ProviderRequest):Promise<T>}
export class FetchProviderClient implements ProviderClient{async fetchJson<T>({url,headers,body,method='GET'}:ProviderRequest):Promise<T>{const response=await fetch(url,{method,headers,body});if(!response.ok)throw new Error(`Provider request failed: ${response.status}`);return await response.json() as T}}
export function requireSecret(name:string):string{const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`Missing Edge Function secret: ${name}`);return value}
export function valueOrDefault(value:string|undefined|null,fallback:string):string{return value?.trim()||fallback}
export function envOrDefault(name:string,fallback:string):string{return valueOrDefault(Deno.env.get(name),fallback)}
export async function sha256Hex(value:string):Promise<string>{const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')}
