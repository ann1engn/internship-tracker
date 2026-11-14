import { useEffect, useState } from 'react'

// Finds every image in src/assets/quotes automatically.
// To add a quote, drop an image file into that folder. No code changes.
const images = Object.values(
  import.meta.glob('../assets/quotes/*.{png,jpg,jpeg,webp,gif}', {
    eager: true,
    query: '?url',
    import: 'default',
  })
)

// Mix a list into a random order, like shuffling a deck of cards
function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// A freshly shuffled deck that does not start with the image just shown
function newDeck(avoid) {
  const deck = shuffle(images)
  if (deck.length > 1 && deck[0] === avoid) deck.push(deck.shift())
  return deck
}

// The image that was showing last time the page was open, if any
function lastShown() {
  try {
    return localStorage.getItem('lastQuote')
  } catch {
    return null
  }
}

export default function QuoteCard() {
  const [deck, setDeck] = useState(() => newDeck(lastShown()))
  const [position, setPosition] = useState(0)
  const current = deck[position]

  // Remember what is showing, so a refresh starts on a different one
  useEffect(() => {
    try {
      if (current) localStorage.setItem('lastQuote', current)
    } catch {
      // Storage is unavailable. Nothing to do.
    }
  }, [current])

  // No images in the folder yet: show nothing
  if (images.length === 0) return null

  function showNext() {
    if (position + 1 < deck.length) {
      setPosition(position + 1) // next card in the deck
    } else {
      setDeck(newDeck(current)) // deck finished: reshuffle and start over
      setPosition(0)
    }
  }

  return (
    <div className="card quote-card">
      <div className="quote-frame">
        <img className="quote-image" src={current} alt="Motivational quote" />
      </div>
      {images.length > 1 && (
        <button type="button" className="button button-secondary" onClick={showNext}>
          Show another
        </button>
      )}
    </div>
  )
}