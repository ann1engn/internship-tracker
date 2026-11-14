import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { isConfigured } from './lib/supabase'
import App from './App'
import './index.css'

// The starting point of the app. It finds <div id="root"> in index.html
// and draws <App /> inside it, wrapped in two helpers:
//   BrowserRouter  lets the app have multiple pages (URLs)
//   AuthProvider   tells every page who is logged in
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {isConfigured ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </StrictMode>
)
