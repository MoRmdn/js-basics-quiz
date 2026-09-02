import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { getDemoProfile, saveDemoProfile } from '../services/demoService.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

async function loadSupabaseProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        if (!isSupabaseConfigured) {
          if (active) setProfile(getDemoProfile())
          return
        }

        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (data.session?.user && active) {
          setProfile(await loadSupabaseProfile(data.session.user.id))
        }
      } catch (restoreError) {
        if (active) setError(restoreError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  async function enterName(displayName) {
    setError('')

    try {
      if (!isSupabaseConfigured) {
        const demoProfile = saveDemoProfile(displayName)
        setProfile(demoProfile)
        return demoProfile
      }

      let { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        const { data, error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) throw signInError
        sessionData = data
      }

      const userId = sessionData.session?.user?.id ?? sessionData.user?.id
      if (!userId) throw new Error('Supabase did not return an anonymous user.')

      const { data: savedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, display_name: displayName }, { onConflict: 'id' })
        .select('id, display_name, created_at')
        .single()

      if (profileError) throw profileError
      setProfile(savedProfile)
      return savedProfile
    } catch (enterError) {
      setError(enterError.message)
      throw enterError
    }
  }

  // Context is React's closest built-in equivalent to a lightweight Flutter Provider.
  const value = useMemo(
    () => ({ profile, loading, error, enterName, isDemo: !isSupabaseConfigured }),
    [profile, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
