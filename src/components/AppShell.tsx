import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getReleaseInfo } from '../config/release'
import { BottomNav } from './BottomNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ReleaseBanner } from './ReleaseBanner'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const release = getReleaseInfo()
  return <div className="app-shell">
    <header className="app-header">
      <div><div className="app-name">{t('app.name')}</div><div className="app-tagline">{t('app.tagline')}</div></div>
      <LanguageSwitcher />
    </header>
    <ReleaseBanner release={release} />
    <div className="app-content">{children}</div>
    <footer className="app-footer"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{t('osm.attribution')}</a></footer>
    <BottomNav />
  </div>
}
