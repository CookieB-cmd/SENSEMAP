import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { MapPage } from '../pages/MapPage'
import { ForMePage } from '../pages/ForMePage'
import { PlacePage } from '../pages/PlacePage'
import { ModerationPage } from '../pages/ModerationPage'
import { NeedsPage } from '../pages/NeedsPage'

export const router = createBrowserRouter([{ path: '/', element: <App />, children: [
  { index: true, element: <MapPage /> },
  { path: 'for-me', element: <ForMePage /> },
  { path: 'needs', element: <NeedsPage /> },
  { path: 'places/:placeId', element: <PlacePage /> },
  { path: 'moderation', element: <ModerationPage /> },
] }])
