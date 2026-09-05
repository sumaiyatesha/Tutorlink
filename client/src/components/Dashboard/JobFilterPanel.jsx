// JobFilterPanel.jsx — Job Search Bar & Bangladeshi District Filter Panel.
//
// Features:
// 1. Results count ("X jobs found") and Job ID / Keyword search input.
// 2. Collapsible location filter with checkboxes for major Bangladeshi districts:
//    Dhaka, Chittagong, Khulna, Gazipur, Narayanganj, Sylhet, Cumilla, Barishal, Rajshahi, Rangpur, Mymensingh.

import { useState } from 'react'
import './JobFilterPanel.css'

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Khulna',
  'Gazipur',
  'Narayanganj',
  'Sylhet',
  'Cumilla',
  'Barishal',
  'Rajshahi',
  'Rangpur',
  'Mymensingh',
]

function JobFilterPanel({
  totalCount = 0,
  searchQuery = '',
  onSearchChange,
  selectedDistricts = [],
  onDistrictToggle,
  sortByDistance = false,
  onToggleSortDistance,
}) {
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="job-filter-wrapper">
      {/* Top Bar: Search Input, Count, Distance Sort & Toggle */}
      <div className="job-filter-top-bar">
        <div className="job-results-count">
          Showing <span>{totalCount}</span> tuition {totalCount === 1 ? 'job' : 'jobs'}
        </div>

        <div className="job-search-input-group">
          <input
            type="text"
            className="job-search-input"
            placeholder="Search by Job ID or keyword (e.g. JOB-0001, Physics)..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {onToggleSortDistance && (
          <button
            type="button"
            className={`btn-toggle-filter ${sortByDistance ? 'selected' : ''}`}
            onClick={onToggleSortDistance}
            style={{
              backgroundColor: sortByDistance ? '#4f46e5' : '#ffffff',
              color: sortByDistance ? '#ffffff' : '#334155',
              borderColor: sortByDistance ? '#4f46e5' : '#cbd5e1',
            }}
          >
            <span>🚗 {sortByDistance ? 'Nearest First' : 'Sort by Distance'}</span>
          </button>
        )}

        <button
          className="btn-toggle-filter"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          <span>📍 Filter Location ({selectedDistricts.length})</span>
          <span>{panelOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Collapsible Districts Grid */}
      {panelOpen && (
        <div className="districts-collapsible-panel">
          <span className="districts-panel-title">Filter by Major Bangladeshi District:</span>
          <div className="districts-checkbox-grid">
            {BANGLADESH_DISTRICTS.map((district) => {
              const isSelected = selectedDistricts.includes(district)
              return (
                <label
                  key={district}
                  className={`district-checkbox-label ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="district-checkbox-input"
                    checked={isSelected}
                    onChange={() => onDistrictToggle && onDistrictToggle(district)}
                  />
                  <span>{district}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobFilterPanel
