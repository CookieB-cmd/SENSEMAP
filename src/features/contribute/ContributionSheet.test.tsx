import {render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it,vi} from 'vitest'
import i18n from '../../i18n'
const {submitSenseReport}=vi.hoisted(()=>({submitSenseReport:vi.fn().mockResolvedValue(undefined)}))
vi.mock('./contributionService',async()=>{class ContributorAuthRequiredError extends Error{};return{submitSenseReport,submitLiveReport:vi.fn(),ContributorAuthRequiredError}})
import {ContributionSheet} from './ContributionSheet'
describe('quick contribution',()=>{it('submits three quick conditions in four primary clicks',async()=>{await i18n.changeLanguage('nn');const user=userEvent.setup();render(<I18nextProvider i18n={i18n}><ContributionSheet placeId="p1" open placeCoords={{lat:61.45,lng:5.86}}/></I18nextProvider>);await user.click(screen.getAllByRole('button',{name:'Stille'})[0]);await user.click(screen.getAllByRole('button',{name:'Lite folk'})[0]);await user.click(screen.getByRole('button',{name:'Mjukt'}));await user.click(screen.getByRole('button',{name:'Send inn'}));expect(submitSenseReport).toHaveBeenCalledWith(expect.objectContaining({placeId:'p1',noise:'quiet',crowding:'few',lighting:'soft'}))})})
