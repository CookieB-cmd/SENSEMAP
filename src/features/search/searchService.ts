import { supabase } from '../../lib/supabase'
import type { DiscoveryBounds,ExternalSearchPlace,SearchBias } from './types'
interface ProviderResponse{results?:ExternalSearchPlace[]}
export async function searchPlace(query:string,locale:'nn'|'en',bias?:SearchBias){const q=query.trim();if(q.length<2)return[];const {data,error}=await supabase.functions.invoke<ProviderResponse>('place-search',{body:{query:q,locale,bias}});if(error)throw error;return data?.results??[]}
export async function discoverPlaces(bbox:DiscoveryBounds){const {data,error}=await supabase.functions.invoke<ProviderResponse>('place-discovery',{body:{bbox}});if(error)throw error;return data?.results??[]}
export const SearchService={searchPlace,discoverPlaces}
