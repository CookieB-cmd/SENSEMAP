import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
export function BottomNav(){const {t}=useTranslation();const c=({isActive}:{isActive:boolean})=>isActive?'bottom-nav__link is-active':'bottom-nav__link';return <nav className="bottom-nav" aria-label={t('nav.ariaLabel')}><NavLink to="/" end className={c}>{t('nav.map')}</NavLink><NavLink to="/for-me" className={c}>{t('nav.forMe')}</NavLink><NavLink to="/?mode=contribute" className="bottom-nav__link">{t('nav.contribute')}</NavLink></nav>}
