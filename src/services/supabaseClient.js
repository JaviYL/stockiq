/**
 * Supabase Client
 *
 * To enable cloud sync, create a Supabase project and add these to your .env:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Then create this table in Supabase SQL editor:
 *
 * CREATE TABLE user_data (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   watchlist JSONB DEFAULT '[]',
 *   preferences JSONB DEFAULT '{}',
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can CRUD own data" ON user_data
 *   FOR ALL USING (auth.uid() = user_id);
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if credentials exist
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

export const isSupabaseEnabled = () => !!supabase

/**
 * Auth helpers
 */
export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email, password) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Cloud data sync — watchlist & preferences
 */
export async function syncWatchlistToCloud(watchlist) {
  if (!supabase) return
  const user = await getUser()
  if (!user) return

  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: user.id,
      watchlist,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) console.error('Sync error:', error)
}

export async function loadWatchlistFromCloud() {
  if (!supabase) return null
  const user = await getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_data')
    .select('watchlist')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data.watchlist
}
