import { Routes, Route, Navigate } from 'react-router'
import { isConfigured } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Applications from './pages/Applications'
import Contacts from './pages/Contacts'
import Analytics from './pages/Analytics'

// App decides which page to show for which URL. This is "routing".
export default function App() {
  if (!isConfigured) return <SetupNeeded />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Everything inside ProtectedRoute requires a login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Applications />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Route>

      {/* Any unknown URL goes home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function SetupNeeded() {
  return (
    <div className="auth-screen">
      <div className="card auth-card">
        <h1>Almost there</h1>
        <p className="muted">
          The app cannot find your Supabase details. Copy .env.example to a
          new file named .env.local, paste in your Project URL and
          publishable key, then stop and restart "npm run dev".
        </p>
      </div>
    </div>
  )
}
