import { createClient } from '@supabase/supabase-js'

// The Supabase "client" is the object the app uses to talk to your
// database and login system. We create it once here and import it
// everywhere else, so there is a single connection for the whole app.
//
// import.meta.env reads values from your .env.local file. Keeping them
// out of the code means you can share the code without sharing your
// project details.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// True when .env.local has been filled in. The app shows setup
// instructions instead of crashing when it has not.
export const isConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null
