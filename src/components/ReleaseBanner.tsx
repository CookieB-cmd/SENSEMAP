import { useTranslation } from 'react-i18next'
import type { ReleaseInfo } from '../config/release'

export function ReleaseBanner({ release }: { release: ReleaseInfo | null }) {
  const { t } = useTranslation()
  if (!release) return null
  return (
    <aside className="release-banner" role="status">
      <strong>{t('release.rcLabel', { version: release.version })}</strong>
      <span>{t('release.realDataNotice')}</span>
    </aside>
  )
}
