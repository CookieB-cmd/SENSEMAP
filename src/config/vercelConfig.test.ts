import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Vercel RC deployment configuration', () => {
  it('defines SPA routing and the public Vite build environment', () => {
    const configPath=fileURLToPath(new URL('../../vercel.json',import.meta.url))
    const exists=existsSync(configPath)
    expect(exists).toBe(true)
    if(!exists)return

    const config=JSON.parse(readFileSync(configPath,'utf8')) as {
      build?:{env?:Record<string,string>}
      rewrites?:Array<{source?:string;destination?:string}>
    }
    expect(config.rewrites).toContainEqual({source:'/(.*)',destination:'/index.html'})
    expect(config.build?.env?.VITE_SUPABASE_URL).toBe('https://hzrwzoyfpmgvmsdtqgkk.supabase.co')
    expect(config.build?.env?.VITE_SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_/)
    expect(config.build?.env?.VITE_MAP_STYLE_URL).toBe('https://tiles.openfreemap.org/styles/liberty')
  })
})
