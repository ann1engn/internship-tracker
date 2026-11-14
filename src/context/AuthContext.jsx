import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// "Context" is React's way to share one piece of data with every
// component without passing it down by hand. Here the shared data is:
// who is logged in right now?
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // session = the logged-in user's details, or null when logged out
  const [session, setSession] = useState(null)
  // loading = true until we have checked for an existing login
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. On page load, check whether the browser already has a saved
    //    login (so refreshing the page does not log you out).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // 2. Listen for future changes: sign in, sign out, token refresh.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    )

    // 3. Stop listening when this component is removed.
    return () => listener.subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// A small helper so any component can write:  const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
