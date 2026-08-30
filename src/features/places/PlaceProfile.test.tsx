import {render,screen,within} from '@testing-library/react'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it} from 'vitest'
import i18n from '../../i18n'
import {PlaceProfile} from './PlaceProfile'
const profile={place:{id:'p1',name:'Test Library',category:'library',address:'1 Testgata',latitude:61.45,longitude:5.86,distanceM:0,reportCount:5,personalFit:null},facts:{toilet:true,seating:true,quietArea:true,stepFree:true,entranceExitClear:true,strongSmells:false,flashingLights:false,crampedAreas:false,queueCommon:false},typical:{noise:'quiet' as const,lighting:'soft' as const,crowding:'few' as const,reportCount:5,confidence:'good' as const},current:{noise:'quiet' as const,crowding:'few' as const,reportCount:1,freshestAt:new Date().toISOString()}}
describe('place profile',()=>{it('shows seven core environmental attributes without interaction',async()=>{await i18n.changeLanguage('en');render(<I18nextProvider i18n={i18n}><PlaceProfile profile={profile}/></I18nextProvider>);const heading=screen.getByRole('heading',{name:'Usually'});const section=heading.closest('section');expect(section).not.toBeNull();for(const label of ['Noise','Lighting','Crowds','Quiet area','Seating','Toilets','Accessibility'])expect(within(section!).getByText(label)).toBeInTheDocument();expect(screen.getByRole('heading',{name:'Right now'})).toBeInTheDocument()})})
