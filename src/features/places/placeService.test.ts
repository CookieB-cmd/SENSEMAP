import {beforeEach,describe,expect,it,vi} from 'vitest'
const rpc=vi.fn()
vi.mock('../../lib/supabase',()=>({supabase:{rpc}}))
vi.mock('../needs/preferences',()=>({loadPreferences:()=>({preferLowNoise:false,avoidStrongLighting:false,crowdsAcceptable:true,needSeating:false,preferQuietArea:false,needStepFree:false})}))
import {listNearbyPlaces} from './placeService'
describe('place service',()=>{beforeEach(()=>rpc.mockReset());it('queries nearby places without persisting device position',async()=>{rpc.mockResolvedValue({data:[{id:'p1',name:'Library',category:'library',address:null,latitude:61.45,longitude:5.86,distance_m:120,report_count:4}],error:null});const rows=await listNearbyPlaces({lat:61.45,lng:5.86,radiusMeters:2000});expect(rpc).toHaveBeenCalledWith('nearby_places',{p_lat:61.45,p_lng:5.86,p_radius_m:2000});expect(rows[0]).toMatchObject({distanceM:120,reportCount:4})})})
