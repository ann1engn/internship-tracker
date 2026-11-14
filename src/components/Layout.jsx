import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'

// The frame around every logged-in page: top bar with navigation, and
// the current page underneath.
export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Internship Tracker</span>
        <nav className="nav">
          <NavLink to="/" end>Applications</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/contacts">Contacts</NavLink>
        </nav>
        <div className="account">
          <span className="account-email">{user?.email}</span>
          <button className="button button-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
