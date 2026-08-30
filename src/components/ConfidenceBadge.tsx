import { useTranslation } from 'react-i18next'
import type { PlaceProfileData } from '../features/places/types'
export function ConfidenceBadge({confidence,reportCount}:{confidence:PlaceProfileData['typical']['confidence'];reportCount:number}){const {t}=useTranslation();return <span className={`confidence-badge confidence-badge--${confidence}`}>{t(`confidence.${confidence}`)} · {t('profile.reportCount',{count:reportCount})}</span>}
