import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl?.startsWith('https://') &&
    supabaseKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseKey.includes('your_key_here'),
)

// The publishable key is designed for browser use. Security comes from RLS,
// just as Firebase client config is public while Security Rules protect data.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null
