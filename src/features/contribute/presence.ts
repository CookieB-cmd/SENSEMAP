import { distanceMeters,type GeoPoint } from '../../lib/geo'
export const PRESENCE_RADIUS_METERS=500
export function isPlausiblyAtPlace(user:GeoPoint,place:GeoPoint,max=PRESENCE_RADIUS_METERS){return distanceMeters(user,place)<=max}
export function getCurrentPosition():Promise<GeoPoint>{return new Promise((resolve,reject)=>{if(!navigator.geolocation){reject(new Error('Geolocation unavailable'));return}navigator.geolocation.getCurrentPosition(({coords})=>resolve({lat:coords.latitude,lng:coords.longitude}),reject,{enableHighAccuracy:false,timeout:10_000,maximumAge:30_000})})}
