import {render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {I18nextProvider} from 'react-i18next'
import {describe,expect,it} from 'vitest'
import i18n from '../i18n'
import {AppShell} from '../components/AppShell'
describe('AppShell',()=>{it('renders Nynorsk navigation and language switch',async()=>{await i18n.changeLanguage('nn');render(<I18nextProvider i18n={i18n}><MemoryRouter><AppShell><div>fixture</div></AppShell></MemoryRouter></I18nextProvider>);expect(screen.getByRole('link',{name:'Kart'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'For meg'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'English'})).toBeInTheDocument()})})
