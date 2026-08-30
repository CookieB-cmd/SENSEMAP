import {describe,expect,it} from 'vitest'
import {markerKindFor} from './mapMarkers'
import type {PlaceSummary} from '../places/types'
const base:PlaceSummary={id:'p',name:'P',category:null,address:null,latitude:0,longitude:0,distanceM:0,reportCount:0,personalFit:null}
describe('neutral marker kinds',()=>{it('uses coverage rather than safety state',()=>{expect(markerKindFor(base)).toBe('osm-only');expect(markerKindFor({...base,reportCount:8})).toBe('substantial-data');expect(markerKindFor({...base,personalFit:'strong'})).toBe('strong-match')})})
