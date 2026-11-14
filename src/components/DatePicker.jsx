import { useEffect, useRef, useState } from 'react'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const pad = (number) => String(number).padStart(2, '0')

// Build a date value like "2026-11-14". Months count from 0 in JavaScript.
const toValue = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`

function todayValue() {
  const now = new Date()
  return toValue(now.getFullYear(), now.getMonth(), now.getDate())
}

// "2026-11-14" becomes "Nov 14, 2026"
function formatLabel(value) {
  if (!value) return 'Pick a date'
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Which month the calendar should show for a given date value
function monthOf(value) {
  return { year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) - 1 }
}

// A custom calendar. Props:
//   value     the chosen date as "YYYY-MM-DD", or '' for none
//   onChange  called with the new value when a day is picked
//   max       optional latest date allowed, as "YYYY-MM-DD"
export default function DatePicker({ value, onChange, max }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(monthOf(value || todayValue()))
  const wrapperRef = useRef(null)

  // While the calendar is open, close it on an outside click or Escape
  useEffect(() => {
    if (!open) return

    function handleMouseDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function toggle() {
    // Each time it opens, start on the month of the chosen date
    if (!open) setView(monthOf(value || todayValue()))
    setOpen(!open)
  }

  function changeMonth(step) {
    const next = new Date(view.year, view.month + step, 1)
    setView({ year: next.getFullYear(), month: next.getMonth() })
  }

  function pick(newValue) {
    onChange(newValue)
    setOpen(false)
  }

  // Work out the grid: blank cells before day 1, then the days
  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const today = todayValue()
  // Can we go to the next month, or is it past the latest allowed date?
  const nextMonthBlocked = max ? toValue(view.year, view.month + 1, 1) > max : false
  const todayBlocked = max ? today > max : false

  return (
    <div className="datepicker" ref={wrapperRef}>
      <button
        type="button"
        className="datepicker-trigger"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? '' : 'muted'}>{formatLabel(value)}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="datepicker-popover" role="dialog" aria-label="Choose a date">
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="datepicker-month">{monthLabel}</span>
            <button
              type="button"
              className="datepicker-nav"
              onClick={() => changeMonth(1)}
              disabled={nextMonthBlocked}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="datepicker-grid">
            {WEEKDAYS.map((letter, index) => (
              <span key={index} className="datepicker-weekday">
                {letter}
              </span>
            ))}

            {cells.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} />

              const dayValue = toValue(view.year, view.month, day)
              const classes = ['datepicker-day']
              if (dayValue === value) classes.push('is-selected')
              if (dayValue === today) classes.push('is-today')

              return (
                <button
                  key={dayValue}
                  type="button"
                  className={classes.join(' ')}
                  onClick={() => pick(dayValue)}
                  disabled={max ? dayValue > max : false}
                  aria-label={formatLabel(dayValue)}
                  aria-pressed={dayValue === value}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="datepicker-footer">
            <button type="button" className="link-button" onClick={() => pick('')}>
              Clear
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => pick(today)}
              disabled={todayBlocked}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}