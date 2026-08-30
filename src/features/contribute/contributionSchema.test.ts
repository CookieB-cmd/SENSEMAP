import {describe,expect,it} from 'vitest'
import {contributionSchema} from './contributionSchema'
describe('contribution schema',()=>{it('preserves optional tri-state facts',()=>{expect(contributionSchema.parse({noise:'quiet',crowding:'few',lighting:'soft',seating:true})).toMatchObject({noise:'quiet',crowding:'few',lighting:'soft',seating:true})});it('rejects comments above 500 characters',()=>{expect(()=>contributionSchema.parse({noise:'quiet',crowding:'few',lighting:'soft',comment:'x'.repeat(501)})).toThrow()})})
