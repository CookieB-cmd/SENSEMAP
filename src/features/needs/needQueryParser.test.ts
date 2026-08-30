import {describe,expect,it} from 'vitest'
import {parseNeedQuery} from './needQueryParser'
describe('need query parser',()=>{it('parses Nynorsk needs and leaves place text',()=>{expect(parseNeedQuery('stille kafé Førde','nn')).toMatchObject({filters:{maxNoise:'quiet',category:'cafe'},unmatchedText:'førde'})});it('parses English needs deterministically',()=>{expect(parseNeedQuery('quiet cafe seating Norwich','en')).toMatchObject({filters:{maxNoise:'quiet',category:'cafe',needsSeating:true},unmatchedText:'norwich'})})})
