import type { PlaceSummary } from '../places/types'
export type MarkerKind='osm-only'|'limited-data'|'substantial-data'|'strong-match'
export function markerKindFor(place:Pick<PlaceSummary,'reportCount'|'personalFit'>):MarkerKind{if(place.personalFit==='strong'&&place.reportCount>0)return'strong-match';if(place.reportCount>=10)return'substantial-data';if(place.reportCount>0)return'limited-data';return'osm-only'}
