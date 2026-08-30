import { calculateFit } from '../needs/fitScore'
import { loadPreferences } from '../needs/preferences'
import type { PlaceFilters } from '../needs/types'
import { clampRadiusMeters,isValidGeoPoint } from '../../lib/geo'
import { supabase } from '../../lib/supabase'
import type { PlaceProfileData,PlaceSummary } from './types'
interface Row{id:string;name:string;category:string|null;address:string|null;latitude:number;longitude:number;distance_m:number;report_count?:number}
export async function listNearbyPlaces({lat,lng,radiusMeters=5000,filters}:{lat:number;lng:number;radiusMeters?:number;filters?:PlaceFilters}):Promise<PlaceSummary[]>{if(!isValidGeoPoint({lat,lng}))throw new Error('Invalid geographic position');const {data,error}=await supabase.rpc('nearby_places',{p_lat:lat,p_lng:lng,p_radius_m:clampRadiusMeters(radiusMeters)});if(error)throw error;return ((data??[]) as Row[]).filter(r=>!filters?.category||r.category===filters.category).map(r=>({id:r.id,name:r.name,category:r.category,address:r.address,latitude:r.latitude,longitude:r.longitude,distanceM:r.distance_m,reportCount:r.report_count??0,personalFit:null}))}
export async function getPlaceProfile(placeId:string):Promise<PlaceProfileData>{const {data,error}=await supabase.rpc('get_place_profile',{p_place_id:placeId});if(error)throw error;if(!data)throw new Error('Place not found');const p=data as PlaceProfileData;const fit=calculateFit(loadPreferences(),{noise:p.typical.noise,lighting:p.typical.lighting,crowding:p.typical.crowding,seating:p.facts.seating,quietArea:p.facts.quietArea,stepFree:p.facts.stepFree,toilet:p.facts.toilet});p.place={...p.place,personalFit:fit.kind==='insufficient'?null:fit.kind};return p}
