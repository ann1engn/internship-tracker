import { useState } from 'react'

// Your Logo.dev publishable key, read from .env.local
const TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN

// Logo.dev finds logos by website address, and we only store the
// company name. So we guess: "Western Digital" becomes westerndigital.com
function guessDomain(name) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned ? `${cleaned}.com` : null
}

export default function CompanyLogo({ name }) {
  // Becomes true if the image fails to load (no logo for our guess)
  const [failed, setFailed] = useState(false)
  const domain = guessDomain(name)

  // No key, no usable name, or no logo found: show the first letter instead
  if (!TOKEN || !domain || failed) {
    return (
      <span className="logo logo-fallback" aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      className="logo"
      src={`https://img.logo.dev/${domain}?token=${TOKEN}&size=80&format=png&fallback=404`}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}