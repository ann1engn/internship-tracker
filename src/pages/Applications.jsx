import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CompanyLogo from '../components/CompanyLogo'
import ImportCsv from '../components/ImportCsv'
import DatePicker from '../components/DatePicker'
import QuoteCard from '../components/QuoteCard'

// The stages from the database, with a nicer label for the screen
const STAGES = [
  { value: 'applied', label: 'Applied' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'phone_screen', label: 'Phone screen' },
  { value: 'interview', label: 'Interview' },
  { value: 'final_round', label: 'Final round' },
  { value: 'offer', label: 'Offer' },
]

// NEW: what is happening with the application right now
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

function stageLabel(value) {
  return STAGES.find((s) => s.value === value)?.label ?? value
}

function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value
}

// Today's date in the format a date box expects: 2026-11-14
function today() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// "2026-11-14" becomes "Nov 14, 2026" for showing in the list
function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Applications() {
  // Data from the database
  const [applications, setApplications] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // What is typed in the form
  const [jobUrl, setJobUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [location, setLocation] = useState('')
  const [appliedDate, setAppliedDate] = useState(today())
  const [stage, setStage] = useState('applied')
  const [status, setStatus] = useState('active') // NEW
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')

  // For the Fetch details button
  const [fetching, setFetching] = useState(false)
  const [fetchNote, setFetchNote] = useState(null) // { type, text } or null

  async function loadApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setApplications(data)
    setLoading(false)
  }

  async function loadCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')

    if (error) setError(error.message)
    else setCompanies(data)
  }

  useEffect(() => {
    loadApplications()
    loadCompanies()
  }, [])

  function resetForm() {
    setEditingId(null)
    setJobUrl('')
    setCompanyName('')
    setRoleTitle('')
    setLocation('')
    setAppliedDate(today())
    setStage('applied')
    setStatus('active')
    setFetchNote(null)
  }

  function startEdit(application) {
    setEditingId(application.id)
    setJobUrl(application.job_url ?? '')
    setCompanyName(application.companies.name)
    setRoleTitle(application.role_title)
    setLocation(application.location ?? '')
    setAppliedDate(application.applied_date ?? '')
    setStage(application.stage)
    setStatus(application.status)
    setError('')
    setFetchNote(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Send the link to the fetch-job function and fill in the form
  async function handleFetch() {
    if (!jobUrl.trim()) {
      setFetchNote({ type: 'error', text: 'Paste a job link first.' })
      return
    }

    setFetching(true)
    setFetchNote(null)

    const { data, error } = await supabase.functions.invoke('fetch-job', {
      body: { url: jobUrl.trim() },
    })

    if (error) {
      // Try to read the friendly message the function sent back
      let text = 'Could not read that link. Please type the details in.'
      try {
        const body = await error.context.json()
        if (body?.error) text = body.error
      } catch {
        // keep the default message
      }
      setFetchNote({ type: 'error', text })
    } else {
      // Only overwrite a box when the function found something for it
      if (data.title) setRoleTitle(data.title)
      if (data.company) setCompanyName(data.company)
      if (data.location) setLocation(data.location)

      const missing = []
      if (!data.company) missing.push('company')
      if (!data.location) missing.push('location')
      setFetchNote({
        type: 'success',
        text:
          missing.length === 0
            ? 'Filled in from the listing. Check it, then save.'
            : `Filled in what was found. Please add the ${missing.join(' and ')}.`,
      })
    }
    setFetching(false)
  }

  // Find the company by name, or create it. Returns the company,
  // or null if something went wrong.
  async function findOrCreateCompany(typedName) {
    const existing = companies.find(
      (c) => c.name.toLowerCase() === typedName.toLowerCase()
    )
    if (existing) return existing

    const { data, error } = await supabase
      .from('companies')
      .insert({ name: typedName })
      .select('id, name')
      .single()

    if (error) {
      setError(error.message)
      return null
    }
    return data
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const typedName = companyName.trim()
    if (!typedName) {
      setError('Please enter a company name.')
      return
    }

    setSaving(true)

    const company = await findOrCreateCompany(typedName)
    if (!company) {
      setSaving(false)
      return
    }

    const details = {
      company_id: company.id,
      role_title: roleTitle,
      location: location.trim() || null,
      applied_date: appliedDate || null,
      job_url: jobUrl.trim() || null,
      stage: stage,
      status: status,
    }

    let result
    if (editingId) {
      result = await supabase
        .from('applications')
        .update(details)
        .eq('id', editingId)
    } else {
      result = await supabase.from('applications').insert(details)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      resetForm()
      await loadApplications()
    }
    await loadCompanies()
    setSaving(false)
  }

  async function handleDelete(application) {
    const confirmed = window.confirm(
      `Delete ${application.role_title} at ${application.companies.name}?`
    )
    if (!confirmed) return

    setError('')
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application.id)

    if (error) {
      setError(error.message)
    } else {
      if (editingId === application.id) resetForm()
      await loadApplications()
    }
  }

  // Which applications to show for the chosen filter.
  // Stage filters show active applications only. Rejected and
  // Withdrawn have their own filters.
  const visibleApplications = applications.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'rejected' || filter === 'withdrawn') return a.status === filter
    return a.stage === filter && a.status === 'active'
  })

  function countFor(value) {
    if (value === 'rejected' || value === 'withdrawn') {
      return applications.filter((a) => a.status === value).length
    }
    return applications.filter((a) => a.stage === value && a.status === 'active').length
  }

  // The filter buttons: every stage, then Rejected and Withdrawn
  const filterOptions = [...STAGES, ...STATUSES.filter((s) => s.value !== 'active')]

  return (
    <>
      <h1>Applications</h1>
      <div className="top-row">
      <form className="card form-row" onSubmit={handleSubmit}>
        <h2 className="form-title">
          {editingId ? 'Edit application' : 'Add an application'}
        </h2>

        <div className="link-row">
          <label className="field">
            <span>Job link (optional)</span>
            <input
              type="url"
              placeholder="Paste a job link, then click Fetch details"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </label>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleFetch}
            disabled={fetching}
          >
            {fetching ? 'Fetching...' : 'Fetch details'}
          </button>
        </div>

        {fetchNote && (
          <p className={`message message-${fetchNote.type} form-note`}>
            {fetchNote.text}
          </p>
        )}

        <label className="field">
          <span>Company</span>
          <input
            list="company-options"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="off"
            required
          />
          <datalist id="company-options">
            {companies.map((company) => (
              <option key={company.id} value={company.name} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Role title</span>
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Location (optional)</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <div className="field">
          <span>Date applied</span>
          <DatePicker value={appliedDate} onChange={setAppliedDate} max={today()} />
        </div>

        <label className="field">
          <span>Stage</span>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* NEW: the status dropdown */}
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add application'}
          </button>
          {editingId && (
            <button
              className="button button-secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <QuoteCard /></div>


      <ImportCsv
        applications={applications}
        companies={companies}
        onDone={async () => {
          await loadApplications()
          await loadCompanies()
        }}
      />

      <div className="card">
        <div className="filters">
          <button
            type="button"
            className={filter === 'all' ? 'chip chip-active' : 'chip'}
            onClick={() => setFilter('all')}
          >
            All ({applications.length})
          </button>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? 'chip chip-active' : 'chip'}
              onClick={() => setFilter(option.value)}
            >
              {option.label} ({countFor(option.value)})
            </button>
          ))}
        </div>

        {loading && <p className="muted">Loading...</p>}
        {error && <p className="message message-error">{error}</p>}
        {!loading && !error && applications.length === 0 && (
          <p className="muted">No applications yet.</p>
        )}
        {applications.length > 0 && visibleApplications.length === 0 && (
          <p className="muted">No applications match this filter.</p>
        )}
        {visibleApplications.length > 0 && (
          <ul className="list">
            {visibleApplications.map((application) => (
              <li key={application.id} className="list-item">
                  <CompanyLogo
                  key={application.companies.name}
                  name={application.companies.name}
                />
                <div className="item-main">
                  <strong>{application.role_title}</strong>
                  <span className="muted"> · {application.companies.name}</span>
                  {application.location && (
                    <div className="muted small">{application.location}</div>
                  )}
                  {application.applied_date && (
                    <div className="muted small">
                      Applied {formatDate(application.applied_date)}
                    </div>
                  )}
                  {application.job_url && (
                    <div className="small">
                      <a
                        className="link"
                        href={application.job_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View listing
                      </a>
                    </div>
                  )}
                </div>
                <div className="item-side">
                  <span className={`badge badge-${application.stage}`}>
                    {stageLabel(application.stage)}
                  </span>
                  {application.status !== 'active' && (
                    <span className="badge badge-closed">
                      {statusLabel(application.status)}
                    </span>
                  )}
                  <button
                    className="button button-secondary"
                    onClick={() => startEdit(application)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => handleDelete(application)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
