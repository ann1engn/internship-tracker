// =====================================================================
// Helpers for importing applications from a spreadsheet (CSV file).
// These functions only transform text. They do not touch the database,
// which makes them easy to test.
// =====================================================================

// Turn CSV text into rows of cells.
// A simple split on commas is not enough, because a cell can contain
// a comma when it is wrapped in quotes:  "Irvine, CA"
export function parseCsv(text) {
    const rows = []
    let row = []
    let cell = ''
    let inQuotes = false
  
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
  
      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') {
          cell += '"' // two quotes in a row mean one real quote
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          cell += char
        }
      } else if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(cell)
        cell = ''
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++
        row.push(cell)
        rows.push(row)
        row = []
        cell = ''
      } else {
        cell += char
      }
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell)
      rows.push(row)
    }
  
    // Drop completely empty lines
    return rows.filter((r) => r.some((c) => c.trim() !== ''))
  }
  
  // Find which column holds what, by looking for keywords in the header row.
  function findColumns(header) {
    const names = header.map((h) => h.toLowerCase())
    const find = (pattern) => names.findIndex((n) => pattern.test(n))
    return {
      link: find(/link|url/),
      company: find(/company|employer/),
      role: find(/role|position|title/),
      location: find(/location/),
      notes: find(/note/),
      status: find(/status|stage/),
      date: find(/date/),
    }
  }
  
  // Translate the spreadsheet's status into the tracker's stage and status.
  // Returns null for rows that should be skipped.
  export function mapStatus(text) {
    const value = text.toLowerCase()
    if (/need to apply|to apply|not applied/.test(value)) return null
    if (/reject/.test(value)) return { stage: 'applied', status: 'rejected' }
    if (/withdr/.test(value)) return { stage: 'applied', status: 'withdrawn' }
    if (/hirevue|\boa\b|assessment/.test(value)) return { stage: 'assessment', status: 'active' }
    if (/interview/.test(value)) return { stage: 'interview', status: 'active' }
    if (/hired|offer/.test(value)) return { stage: 'offer', status: 'active' }
    // "Applied", "In progress", or blank
    return { stage: 'applied', status: 'active' }
  }
  
  // "7/15/2025" becomes "2025-07-15", the format the database expects.
  function parseDate(text) {
    const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) return null
    const [, month, day, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Names typed in all lowercase get tidied: "cisco" becomes "Cisco",
  // and very short ones become capitals: "ibm" becomes "IBM".
  function tidyCompanyName(name) {
    if (name !== name.toLowerCase()) return name
    if (name.length <= 3) return name.toUpperCase()
    return name.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
  }
  
  // Turn the CSV text into a list of applications ready to save, plus a
  // list of rows that were skipped and why.
  // "existing" is the applications already in the tracker, used to avoid
  // importing the same one twice.
  export function readSpreadsheet(text, existing = []) {
    const rows = parseCsv(text)
    if (rows.length < 2) {
      return { error: 'That file has no data rows.', ready: [], skipped: [] }
    }
  
    const columns = findColumns(rows[0])
    if (columns.company === -1) {
      return { error: 'Could not find a "Company" column in that file.', ready: [], skipped: [] }
    }
  
    const cell = (row, index) => (index === -1 ? '' : (row[index] ?? '').trim())
    const key = (company, role) => `${company.toLowerCase()}|${role.toLowerCase()}`
  
    const seen = new Set(existing.map((a) => key(a.companies.name, a.role_title)))
    const ready = []
    const skipped = []
  
    rows.slice(1).forEach((row, index) => {
      const line = index + 2 // spreadsheet row number, counting the header
      const company = tidyCompanyName(cell(row, columns.company))
      const role = cell(row, columns.role) || 'Role not listed'
      const label = company ? `${role} at ${company}` : `Row ${line}`
  
      if (!company) {
        skipped.push({ line, label, reason: 'No company name' })
        return
      }
  
      const mapped = mapStatus(cell(row, columns.status))
      if (!mapped) {
        skipped.push({ line, label, reason: 'Not applied yet' })
        return
      }
  
      if (seen.has(key(company, role))) {
        skipped.push({ line, label, reason: 'Already in your tracker' })
        return
      }
      seen.add(key(company, role))
  
      const link = cell(row, columns.link)
      ready.push({
        company,
        role_title: role,
        location: cell(row, columns.location) || null,
        job_url: /^https?:\/\//i.test(link) ? link : null,
        notes: cell(row, columns.notes) || null,
        applied_date: parseDate(cell(row, columns.date)),
        stage: mapped.stage,
        status: mapped.status,
      })
    })
  
    return { error: '', ready, skipped }
  }
