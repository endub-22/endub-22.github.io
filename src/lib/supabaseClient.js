import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ktxcovppdqmpydqmxhcd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_-MnC7zO52oAYZaoYjaBdZQ_LPmVhnpT'

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('PASTE_') &&
  !SUPABASE_ANON_KEY.includes('PASTE_')

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
