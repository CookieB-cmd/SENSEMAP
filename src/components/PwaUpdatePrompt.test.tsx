import {render,screen} from '@testing-library/react'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it,vi} from 'vitest'
import i18n from '../i18n'
vi.mock('virtual:pwa-register/react',()=>({useRegisterSW:()=>({offlineReady:[false,vi.fn()],needRefresh:[true,vi.fn()],updateServiceWorker:vi.fn()})}))
import {PwaUpdatePrompt} from './PwaUpdatePrompt'
describe('PWA update prompt',()=>{it('offers an explicit localized update action',async()=>{await i18n.changeLanguage('en');render(<I18nextProvider i18n={i18n}><PwaUpdatePrompt/></I18nextProvider>);expect(screen.getByText('New version available.')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Update now'})).toBeInTheDocument()})})
