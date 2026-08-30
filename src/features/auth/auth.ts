import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
export class ContributorAuthRequiredError extends Error{constructor(){super('Contributor authentication required');this.name='ContributorAuthRequiredError'}}
export async function requireContributorSession():Promise<Session>{const {data,error}=await supabase.auth.getSession();if(error)throw error;if(!data.session?.user)throw new ContributorAuthRequiredError();return data.session}
export async function sendMagicLink(email:string){const redirectTo=typeof window==='undefined'?undefined:window.location.origin;const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:redirectTo?{emailRedirectTo:redirectTo}:undefined});if(error)throw error}
export async function signOut(){const {error}=await supabase.auth.signOut();if(error)throw error}
