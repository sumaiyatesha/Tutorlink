// StatsBar.jsx — Stats Bar component highlighting key platform metrics.
//
// Displays 4 metric cards: Registered Tutors, Total Tuition Posts, Active Applications, Verified Tutors.
//
// TODO: replace with real counts from GET /api/stats/ once backend endpoint exists

import './StatsBar.css'

function StatsBar() {
  // TODO: replace with real counts from GET /api/stats/ once backend endpoint exists
  // To change this: adjust public showcase metrics in statsData array below
  const statsData = [
    { label: 'Registered Tutors', value: '1,250+' },
    { label: 'Total Tuition Posts', value: '3,400+' },
    { label: 'Active Applications', value: '8,900+' },
    { label: 'Verified Tutors', value: '98%' },
  ]

  return (
    <section className="stats-bar-section">
      <div className="stats-bar-container">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsBar
