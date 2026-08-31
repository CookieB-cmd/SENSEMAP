import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Vercel RC deployment configuration', () => {
  it('defines SPA routing and the public Vite build environment', () => {
    const configPath=resolve(process.cwd(),'vercel.json')
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
