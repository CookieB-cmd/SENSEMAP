import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { GeoPoint } from '../lib/geo'
import { calculateFit, hasSelectedFitNeeds } from '../features/needs/fitScore'
import { loadPreferences } from '../features/needs/preferences'
import type { FitResult, SensoryProfile } from '../features/needs/types'
import { useNearbyPlaces } from '../features/map/useNearbyPlaces'
import type { PlaceSummary } from '../features/places/types'
import { PlaceSummaryCard } from '../features/places/PlaceSummaryCard'
import { SearchBox } from '../features/search/SearchBox'
import type { ExternalSearchPlace } from '../features/search/types'

export interface RankedPlace extends PlaceSummary { fit: FitResult }

export function rankForMe(rows: RankedPlace[]): RankedPlace[] {
  return [...rows].sort((a, b) => {
    const aFit = a.fit.percent ?? -1
    const bFit = b.fit.percent ?? -1
    if (aFit !== bFit) return bFit - aFit
    return a.distanceM - b.distanceM
  })
}

function profileFor(place: PlaceSummary, profile?: import('../features/places/types').PlaceProfileData): SensoryProfile {
  return {
    noise: profile?.typical.noise ?? null,
    lighting: profile?.typical.lighting ?? null,
    crowding: profile?.typical.crowding ?? null,
    seating: profile?.facts.seating ?? null,
    quietArea: profile?.facts.quietArea ?? null,
    stepFree: profile?.facts.stepFree ?? null,
  }
}

export function ForMePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const preferences = useMemo(() => loadPreferences(), [])
  const [point, setPoint] = useState<GeoPoint | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle'|'locating'|'denied'|'unavailable'>('idle')
  const { places, profiles, loading, error } = useNearbyPlaces(point ? { ...point, radiusMeters: 5000 } : null, { includeProfiles: true })

  const ranked = useMemo(() => rankForMe(places.map((place) => ({
    ...place,
    reportCount: profiles[place.id]?.typical.reportCount ?? place.reportCount,
    fit: calculateFit(preferences, profileFor(place, profiles[place.id])),
  }))), [places, profiles, preferences])

  const locate = () => {
    if (!navigator.geolocation) { setLocationStatus('unavailable'); return }
    setLocationStatus('locating')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setPoint({ lat: coords.latitude, lng: coords.longitude })
      setLocationStatus('idle')
    }, (e) => setLocationStatus(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'), { timeout: 10000, maximumAge: 60000 })
  }

  const selectSearch = (p: ExternalSearchPlace) => setPoint({ lat: p.lat, lng: p.lng })

  if (!hasSelectedFitNeeds(preferences)) return <main className="page"><h1>{t('page.forMe.title')}</h1><p>{t('forMe.configurePrompt')}</p><Link className="primary-action button-link" to="/needs">{t('needs.title')}</Link></main>

  return <main className="page">
    <h1>{t('page.forMe.title')}</h1>
    <p>{t('page.forMe.description')}</p>
    <div className="for-me-actions"><button type="button" onClick={locate} disabled={locationStatus === 'locating'}>{t('forMe.useLocation')}</button><Link to="/">{t('forMe.openMap')}</Link></div>
    {locationStatus === 'locating' ? <p role="status">{t('map.locating')}</p> : null}
    {locationStatus === 'denied' ? <p role="status">{t('forMe.locationDenied')}</p> : null}
    {locationStatus === 'unavailable' ? <p role="status">{t('forMe.locationUnavailable')}</p> : null}
    <p>{t('forMe.manualFallback')}</p>
    <SearchBox bias={point ?? undefined} onSelect={selectSearch} />
    {loading ? <p role="status">{t('forMe.loading')}</p> : null}
    {error ? <p role="alert">{t('forMe.loadError')}</p> : null}
    {!loading && !error && point && ranked.length === 0 ? <p>{t('forMe.noResults')}</p> : null}
    {ranked.length ? <section aria-labelledby="for-me-results"><h2 id="for-me-results">{t('forMe.results')}</h2>{ranked.map((row) => <PlaceSummaryCard key={row.id} place={row} fit={row.fit} onOpen={(id) => navigate(`/places/${id}`)} />)}</section> : null}
  </main>
}
