import {render,screen} from '@testing-library/react'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it,vi} from 'vitest'
import i18n from '../../i18n'
vi.mock('./moderationService',async()=>{const actual=await vi.importActual<typeof import('./moderationService')>('./moderationService');return{...actual,flagContent:vi.fn()}})
import {ReportContentDialog} from './ReportContentDialog'
describe('content reporting',()=>{it('offers every required reason',async()=>{await i18n.changeLanguage('en');render(<I18nextProvider i18n={i18n}><ReportContentDialog open entityType="place" entityId="00000000-0000-0000-0000-000000000001" onClose={()=>{}}/></I18nextProvider>);for(const label of ['Incorrect information','Offensive content','Spam','Personal information','Place is closed'])expect(screen.getByLabelText(label)).toBeInTheDocument()})})
