import { z } from 'zod'
import type { SensoryPreferences } from './types'
const STORAGE_KEY='sensemap.preferences.v1'
export const defaultPreferences:SensoryPreferences={preferLowNoise:false,avoidStrongLighting:false,crowdsAcceptable:true,needSeating:false,preferQuietArea:false,needStepFree:false}
const schema=z.object({preferLowNoise:z.boolean(),avoidStrongLighting:z.boolean(),crowdsAcceptable:z.boolean(),needSeating:z.boolean(),preferQuietArea:z.boolean(),needStepFree:z.boolean()}).strict()
export function loadPreferences():SensoryPreferences{if(typeof localStorage==='undefined')return {...defaultPreferences};const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return {...defaultPreferences};try{const p=schema.safeParse(JSON.parse(raw));return p.success?p.data:{...defaultPreferences}}catch{return {...defaultPreferences}}}
export function savePreferences(v:SensoryPreferences){if(typeof localStorage!=='undefined')localStorage.setItem(STORAGE_KEY,JSON.stringify(schema.parse(v)))}
export function clearPreferences(){if(typeof localStorage!=='undefined')localStorage.removeItem(STORAGE_KEY)}
