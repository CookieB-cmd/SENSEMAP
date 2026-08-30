export interface ReleaseInfo {
  channel: 'rc'
  version: string
}

interface ReleaseEnv {
  VITE_RELEASE_CHANNEL?: string
  VITE_RELEASE_VERSION?: string
}

export function getReleaseInfo(env: ReleaseEnv = import.meta.env): ReleaseInfo | null {
  if (env.VITE_RELEASE_CHANNEL !== 'rc') return null
  const version = env.VITE_RELEASE_VERSION?.trim()
  if (!version) return null
  return { channel: 'rc', version }
}
