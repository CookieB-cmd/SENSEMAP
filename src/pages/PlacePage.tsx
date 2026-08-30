import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ContributionSheet } from '../features/contribute/ContributionSheet'
import { ReportContentDialog } from '../features/moderation/ReportContentDialog'
import { PlaceChangeDialog } from '../features/places/PlaceChangeDialog'
import { PlaceProfile } from '../features/places/PlaceProfile'
import { getPlaceProfile } from '../features/places/placeService'
import type { PlaceProfileData } from '../features/places/types'

export function PlacePage() {
  const { placeId } = useParams<{ placeId: string }>()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<PlaceProfileData | null>(null)
  const [error, setError] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)

  useEffect(() => {
    if (!placeId) return
    let cancelled = false
    setError(false)
    void getPlaceProfile(placeId).then((value) => { if (!cancelled) setProfile(value) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [placeId, refreshToken])

  if (error) return <p role="alert">{t('profile.loadError')}</p>
  if (!profile || !placeId) return <p role="status">{t('profile.loading')}</p>

  return <main className="page place-page">
    <PlaceProfile profile={profile} />
    <div className="place-actions">
      <button type="button" className="primary-action" onClick={() => setContributionOpen(true)}>{t('contribute.howIsItHere')}</button>
      <button type="button" className="secondary-action" onClick={() => setChangeOpen(true)}>{t('change.action')}</button>
      <button type="button" className="secondary-action" onClick={() => setReportOpen(true)}>{t('moderation.report.action')}</button>
    </div>
    <PlaceChangeDialog open={changeOpen} placeId={placeId} onClose={() => setChangeOpen(false)} />
    <ReportContentDialog open={reportOpen} entityType="place" entityId={placeId} onClose={() => setReportOpen(false)} />
    {contributionOpen ? <ContributionSheet placeId={placeId} open placeCoords={{ lat: profile.place.latitude, lng: profile.place.longitude }} onClose={() => setContributionOpen(false)} onSubmitted={() => setRefreshToken((v) => v + 1)} /> : null}
  </main>
}
