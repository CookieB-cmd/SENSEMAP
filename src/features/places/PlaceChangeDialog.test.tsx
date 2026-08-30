import {render,screen} from '@testing-library/react'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it} from 'vitest'
import i18n from '../../i18n'
import {PlaceChangeDialog} from './PlaceChangeDialog'
describe('place change dialog',()=>{it('offers factual change categories',async()=>{await i18n.changeLanguage('en');render(<I18nextProvider i18n={i18n}><PlaceChangeDialog open placeId="p" onClose={()=>{}}/></I18nextProvider>);expect(screen.getByRole('option',{name:'Toilets'})).toBeInTheDocument();expect(screen.getByRole('option',{name:'Place is closed'})).toBeInTheDocument()})})
