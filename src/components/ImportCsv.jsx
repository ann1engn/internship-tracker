import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { readSpreadsheet } from '../lib/importCsv'

// Lets you pick a CSV file, shows what will be imported, and saves it.
// Props (values handed in by the Applications page):
//   applications  what is already in the tracker, to avoid duplicates
//   companies     the companies that already exist
//   onDone        a function to call after a successful import
export default function ImportCsv({ applications, companies, onDone }) {
  const [preview, setPreview] = useState(null) // { ready, skipped } or null
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  // Runs when you choose a file
  async function handleFile(event) {
    const file = event.target.files[0]
    event.target.value = '' // lets you pick the same file again later
    if (!file) return

    setError('')
    setNotice('')
    const text = await file.text()
    const result = readSpreadsheet(text, applications)

    if (result.error) {
      setError(result.error)
      setPreview(null)
    } else {
      setPreview(result)
    }
  }

  // Runs when you click "Import"
  async function handleImport() {
    setSaving(true)
    setError('')

    // 1. Create any companies that do not exist yet, all in one request
    const byName = new Map(companies.map((c) => [c.name.toLowerCase(), c]))
    const missing = []
    for (const row of preview.ready) {
      const lower = row.company.toLowerCase()
      if (!byName.has(lower) && !missing.some((m) => m.toLowerCase() === lower)) {
        missing.push(row.company)
      }
    }

    if (missing.length > 0) {
      const { data, error } = await supabase
        .from('companies')
        .insert(missing.map((name) => ({ name })))
        .select('id, name')

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      for (const company of data) byName.set(company.name.toLowerCase(), company)
    }

    // 2. Save every application in one request
    const { error } = await supabase.from('applications').insert(
      preview.ready.map((row) => ({
        company_id: byName.get(row.company.toLowerCase()).id,
        role_title: row.role_title,
        location: row.location,
        job_url: row.job_url,
        notes: row.notes,
        applied_date: row.applied_date,
        stage: row.stage,
        status: row.status,
      }))
    )

    if (error) {
      setError(error.message)
    } else {
      setNotice(`Imported ${preview.ready.length} applications.`)
      setPreview(null)
      await onDone()
    }
    setSaving(false)
  }

  return (
    <div className="card import-card">
      <div className="import-head">
        <div>
          <h2>Import from a spreadsheet</h2>
          <p className="muted small">
            Upload a CSV file with columns for company, role, link, location,
            notes, status, and date applied.
          </p>
        </div>
        <label className="button button-secondary file-button">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
        </label>
      </div>

      {error && <p className="message message-error">{error}</p>}
      {notice && <p className="message message-success">{notice}</p>}

      {preview && (
        <div className="import-preview">
          <p>
            <strong>{preview.ready.length}</strong> applications ready to import
            {preview.skipped.length > 0 && (
              <>
                , <strong>{preview.skipped.length}</strong> skipped
              </>
            )}
            .
          </p>

          {preview.skipped.length > 0 && (
            <ul className="import-skipped muted small">
              {preview.skipped.map((item) => (
                <li key={item.line}>
                  {item.label}: {item.reason}
                </li>
              ))}
            </ul>
          )}

          <div className="form-actions">
            <button
              className="button"
              onClick={handleImport}
              disabled={saving || preview.ready.length === 0}
            >
              {saving ? 'Importing...' : `Import ${preview.ready.length} applications`}
            </button>
            <button
              className="button button-secondary"
              onClick={() => setPreview(null)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
