import {normalizeNominatim,normalizeOsmElement} from './osmNormalize.ts'
function assert(value:unknown,message:string){if(!value)throw new Error(message)}
Deno.test('normalizes OSM identity and centroid',()=>{const r=normalizeOsmElement({type:'node',id:42,lat:61.45,lon:5.86,tags:{name:'Quiet Café',amenity:'cafe'}});assert(r?.source==='osm','source');assert(r?.sourceType==='node','type');assert(r?.sourceId==='42','id');assert(r?.category==='cafe','category')})
Deno.test('normalizes a Nominatim result to the same contract',()=>{const r=normalizeNominatim({osm_type:'node',osm_id:12,lat:'61.45',lon:'5.86',name:'Library',display_name:'Library, Førde',type:'library'});assert(r?.name==='Library','name');assert(r?.lat===61.45,'latitude')})
