import { useTranslation } from 'react-i18next'
import type { ExternalSearchPlace } from './types'
export function SearchResults({results,onSelect}:{results:ExternalSearchPlace[];onSelect:(p:ExternalSearchPlace)=>void}){const {t}=useTranslation();if(!results.length)return null;return <ul className="search-results" aria-label={t('search.results')}>{results.map(p=><li key={p.id}><button type="button" className="search-result" onClick={()=>onSelect(p)}><strong>{p.name}</strong>{p.address?<span>{p.address}</span>:null}</button></li>)}</ul>}
