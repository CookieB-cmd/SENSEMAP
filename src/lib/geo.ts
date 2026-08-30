export interface GeoPoint{lat:number;lng:number}
export function isValidGeoPoint(p:GeoPoint){return Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-90&&p.lat<=90&&p.lng>=-180&&p.lng<=180}
export function clampRadiusMeters(v:number){return Math.min(50_000,Math.max(100,Math.round(v)))}
export function distanceMeters(a:GeoPoint,b:GeoPoint){const R=6371000;const rad=(n:number)=>n*Math.PI/180;const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
