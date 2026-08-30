import {describe,expect,it} from 'vitest'
import {isPlausiblyAtPlace} from './presence'
describe('presence plausibility',()=>{it('accepts nearby coordinates',()=>expect(isPlausiblyAtPlace({lat:61.452,lng:5.857},{lat:61.4521,lng:5.8572})).toBe(true));it('rejects distant coordinates',()=>expect(isPlausiblyAtPlace({lat:61.452,lng:5.857},{lat:61.5,lng:5.9})).toBe(false))})
