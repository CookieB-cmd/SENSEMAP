import {describe,expect,it} from 'vitest'
import {calculateFit} from './fitScore'
import {defaultPreferences} from './preferences'
describe('personal fit',()=>{it('scores only selected needs and reports data coverage',()=>{const result=calculateFit({...defaultPreferences,preferLowNoise:true,needSeating:true},{noise:'quiet',lighting:null,crowding:null,seating:true,quietArea:null,stepFree:null});expect(result.percent).toBe(100);expect(result.reasons).toContain('low_noise');expect(result.reasons).toContain('seating')});it('does not manufacture a score without known data',()=>{expect(calculateFit({...defaultPreferences,preferLowNoise:true},{noise:null,lighting:null,crowding:null,seating:null,quietArea:null,stepFree:null}).percent).toBeNull()})})
