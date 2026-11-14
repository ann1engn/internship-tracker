import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'

// Wraps the pages that need a login. If nobody is logged in, send them
// to /login. Otherwise show the page (<Outlet /> means "the page that
// matched the URL").
//
// Note: this only controls what the screen shows. The real protection
// is Row Level Security in the database (see supabase/schema.sql).
export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <p className="center-message">Loading...</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
