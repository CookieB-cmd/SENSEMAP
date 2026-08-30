import {describe,expect,it} from 'vitest'
import en from '../i18n/locales/en/common.json'
import nn from '../i18n/locales/nn/common.json'
function flatten(value:unknown,prefix=''):string[]{if(value===null||typeof value!=='object')return[prefix];return Object.entries(value as Record<string,unknown>).flatMap(([k,v])=>flatten(v,prefix?`${prefix}.${k}`:k))}
describe('locale resources',()=>{it('have exactly matching key sets',()=>expect(new Set(flatten(nn))).toEqual(new Set(flatten(en))))})
