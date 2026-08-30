import {render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it,vi} from 'vitest'
import i18n from '../i18n'
vi.mock('../features/map/SenseMap',()=>({SenseMap:()=> <div data-testid="map-fixture"/>}))
vi.mock('../features/map/useNearbyPlaces',()=>({useNearbyPlaces:()=>({places:[],profiles:{},loading:false,error:null})}))
import {MapPage} from './MapPage'
describe('map page privacy',()=>{it('does not request geolocation on initial render and manual search stays available',async()=>{await i18n.changeLanguage('en');const getCurrentPosition=vi.fn();Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition}});render(<I18nextProvider i18n={i18n}><MemoryRouter><MapPage/></MemoryRouter></I18nextProvider>);expect(getCurrentPosition).not.toHaveBeenCalled();expect(screen.getByRole('searchbox')).toBeEnabled()})})
