import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { GeoPoint } from '../lib/geo'
import { SenseMap } from '../features/map/SenseMap'
import { useNearbyPlaces } from '../features/map/useNearbyPlaces'
import { SearchBox } from '../features/search/SearchBox'
import type { ExternalSearchPlace } from '../features/search/types'
import { PlaceSummaryCard } from '../features/places/PlaceSummaryCard'
import type { PlaceFilters } from '../features/needs/types'

export function MapPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [center, setCenter] = useState<GeoPoint | null>(null)
  const [filters, setFilters] = useState<PlaceFilters>({})
  const input = useMemo(() => center ? { ...center, radiusMeters: 5000, filters } : null, [center, filters])
  const { places, loading, error } = useNearbyPlaces(input)

  const selectExternal = useCallback((place: ExternalSearchPlace) => {
    const point = { lat: place.lat, lng: place.lng }
    setCenter(point)
  }, [])

  return <main className="page page--map">
    <h1 className="sr-only">{t('page.map.title')}</h1>
    <SearchBox
      bias={center ?? undefined}
      onSelect={selectExternal}
      onFiltersChange={setFilters}
    />
    <SenseMap
      places={places}
      onLocationResolved={setCenter}
      onViewportChanged={setCenter}
      onPlaceSelected={(id) => navigate(`/places/${id}`)}
    />
    <section className="place-list" aria-labelledby="map-list-heading">
      <h2 id="map-list-heading">{t('map.listAlternative')}</h2>
      {loading ? <p role="status">{t('map.loading')}</p> : null}
      {error ? <p role="alert">{t('map.loadError')}</p> : null}
      {!loading && !error && places.length === 0 ? <p>{t('map.noPlacesInList')}</p> : null}
      {places.map((place) => <PlaceSummaryCard key={place.id} place={place} onOpen={(id) => navigate(`/places/${id}`)} />)}
    </section>
  </main>
}
