import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url'
import 'maplibre-gl/dist/maplibre-gl.css'
setWorkerUrl(workerUrl)
export const DEFAULT_CENTER:[number,number]=[5.857,61.452]
export const DEFAULT_ZOOM=13
