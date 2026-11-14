import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { supabase } from '../lib/supabase'

// Chart.js is modular: you switch on only the pieces you use.
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

// Same stages as the Applications page, in funnel order
const STAGES = [
  { value: 'applied', label: 'Applied' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'phone_screen', label: 'Phone screen' },
  { value: 'interview', label: 'Interview' },
  { value: 'final_round', label: 'Final round' },
  { value: 'offer', label: 'Offer' },
]

// Read a color from index.css so the chart matches the rest of the app
function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Turn 9 out of 20 into "45%". Shows a dash when there is nothing to divide by.
function percent(part, whole) {
  if (!whole) return '-'
  return `${Math.round((part / whole) * 100)}%`
}

export default function Analytics() {
  const [funnel, setFunnel] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFunnel() {
      // application_funnel is the saved query (a "view") in the database.
      // It returns one row per stage with how many applications reached it.
      const { data, error } = await supabase
        .from('application_funnel')
        .select('stage, applications_reached')

      if (error) {
        setError(error.message)
      } else {
        // Put the rows in funnel order and attach the screen labels
        const rows = STAGES.map((s) => {
          const match = data.find((row) => row.stage === s.value)
          return { ...s, count: match ? match.applications_reached : 0 }
        })
        setFunnel(rows)
      }
      setLoading(false)
    }
    loadFunnel()
  }, [])

  const applied = funnel[0]?.count ?? 0

  // What Chart.js needs: labels for the axis and numbers for the bars
  const chartData = {
    labels: funnel.map((row) => row.label),
    datasets: [
      {
        label: 'Applications',
        data: funnel.map((row) => row.count),
        backgroundColor: themeColor('--primary'),
        borderRadius: 4,
        maxBarThickness: 28,
      },
    ],
  }

  const chartOptions = {
    indexAxis: 'y', // horizontal bars, so the stage names are easy to read
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) =>
            ` ${item.raw} applications (${percent(item.raw, applied)} of applied)`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, color: themeColor('--muted') },
        grid: { color: themeColor('--border') },
        border: { display: false },
      },
      y: {
        ticks: { color: themeColor('--text') },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return (
    <>
      <h1>Analytics</h1>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="message message-error">{error}</p>}

      {!loading && !error && applied === 0 && (
        <div className="card">
          <p className="muted">
            Add a few applications and your conversion chart will appear here.
          </p>
        </div>
      )}

      {!loading && !error && applied > 0 && (
        <>
          <div className="card">
            <h2>Applications reaching each stage</h2>
            <div className="chart-box">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="card card-gap">
            <h2>Conversion rates</h2>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th className="number">Reached</th>
                    <th className="number">From previous stage</th>
                    <th className="number">Of all applied</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.map((row, index) => (
                    <tr key={row.value}>
                      <td>{row.label}</td>
                      <td className="number">{row.count}</td>
                      <td className="number">
                        {index === 0 ? '-' : percent(row.count, funnel[index - 1].count)}
                      </td>
                      <td className="number">{percent(row.count, applied)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
