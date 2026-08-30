import { z } from 'zod'
const envSchema=z.object({VITE_SUPABASE_URL:z.string().url(),VITE_SUPABASE_PUBLISHABLE_KEY:z.string().min(1),VITE_MAP_STYLE_URL:z.string().url()})
export type ClientEnv=z.infer<typeof envSchema>
export function getEnv():ClientEnv{return envSchema.parse({VITE_SUPABASE_URL:import.meta.env.VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,VITE_MAP_STYLE_URL:import.meta.env.VITE_MAP_STYLE_URL})}
