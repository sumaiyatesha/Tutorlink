// BrowseJobs.jsx — Browse Tuition Jobs Page.
//
// Features:
// 1. Used by logged-in tutors (with Sidebar) and guest users (with top Navbar).
// 2. Results count and search input.
// 3. Collapsible location filter with Bangladeshi district checkboxes.
// 4. JobCard grid rendering available tuition posts.

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Navbar from '../Landing/Navbar'
import JobFilterPanel from '../../components/Dashboard/JobFilterPanel'
import JobCard from '../../components/Dashboard/JobCard'
import './BrowseJobs.css'

// Default mock jobs fallback if backend database has no posts created yet
const SAMPLE_TUITION_POSTS = [
  {
    id: 1,
    title: 'Class 10 Physics & Higher Math Tutor Needed',
    subject: 'Physics & Higher Math',
    location: 'Dhaka (Uttara)',
    days_per_week: 3,
    method: 'In-Person',
    salary: 8500,
    preferred_time: '6:00 PM (1.5 hrs)',
    preferred_tutor_gender: 'Male',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Open',
  },
  {
    id: 2,
    title: 'HSC English Grammar Specialist Required',
    subject: 'English',
    location: 'Chittagong (GEC Circle)',
    days_per_week: 4,
    method: 'In-Person',
    salary: 10000,
    preferred_time: '5:00 PM (1.5 hrs)',
    preferred_tutor_gender: 'Female',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'Open',
  },
  {
    id: 3,
    title: 'Python Programming Tutor for College Student',
    subject: 'Programming',
    location: 'Dhaka (Dhanmondi)',
    days_per_week: 2,
    method: 'Online',
    salary: 12000,
    preferred_time: '8:00 PM (2 hrs)',
    preferred_tutor_gender: 'Any',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'Open',
  },
  {
    id: 4,
    title: 'Class 8 General Science & Math Teacher',
    subject: 'General Science',
    location: 'Gazipur (Board Bazar)',
    days_per_week: 3,
    method: 'In-Person',
    salary: 6500,
    preferred_time: '4:30 PM (1 hr)',
    preferred_tutor_gender: 'Female',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'Open',
  },
]

function BrowseJobs() {
  const { user } = useAuth()
  const location = useLocation()

  // State for posts, search query, selected districts
  const [posts, setPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [loading, setLoading] = useState(true)

  // Read URL query params on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const queryParam = params.get('query') || params.get('subject') || ''
    const locationParam = params.get('location') || ''

    if (queryParam) setSearchQuery(queryParam)
    if (locationParam) setSelectedDistricts([locationParam])
  }, [location.search])

  // Fetch tuition posts from backend
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await api.get('/api/tuition-posts/').catch(() => null)
        if (response && Array.isArray(response.data) && response.data.length > 0) {
          setPosts(response.data)
        } else {
          setPosts(SAMPLE_TUITION_POSTS)
        }
      } catch (err) {
        console.error('Error fetching tuition posts:', err)
        setPosts(SAMPLE_TUITION_POSTS)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Toggle district checkbox
  function handleDistrictToggle(district) {
    setSelectedDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    )
  }

  const [sortByDistance, setSortByDistance] = useState(false)

  // Filter posts based on search query (Job ID or subject) and district selections
  const filteredPosts = posts.filter((job) => {
    // 1. Search Query Filter (Job ID, subject, title, location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const formattedJobId = `job-${String(job.id).padStart(4, '0')}`.toLowerCase()
      const matchesId = formattedJobId.includes(q) || String(job.id) === q
      const matchesSubject = (job.subject || '').toLowerCase().includes(q)
      const matchesTitle = (job.title || '').toLowerCase().includes(q)
      const matchesLoc = (job.location || '').toLowerCase().includes(q)

      if (!matchesId && !matchesSubject && !matchesTitle && !matchesLoc) {
        return false
      }
    }

    // 2. District Filter
    if (selectedDistricts.length > 0) {
      const jobLoc = (job.location || '').toLowerCase()
      const matchesAnyDistrict = selectedDistricts.some((dist) =>
        jobLoc.includes(dist.toLowerCase())
      )
      if (!matchesAnyDistrict) return false
    }

    return true
  })

  // Sort by distance (nearest first) if enabled
  const displayedPosts = [...filteredPosts]
  if (sortByDistance) {
    displayedPosts.sort((a, b) => {
      const distA = a.distance_km !== undefined && a.distance_km !== null ? a.distance_km : 999999
      const distB = b.distance_km !== undefined && b.distance_km !== null ? b.distance_km : 999999
      return distA - distB
    })
  }

  const isTutorLoggedIn = user && user.role === 'tutor'

  return (
    <div className={`browse-jobs-page ${isTutorLoggedIn ? 'with-sidebar-layout' : 'with-navbar-layout'}`}>
      {/* Show Sidebar if logged-in tutor, else top Navbar */}
      {isTutorLoggedIn ? <Sidebar role="tutor" /> : <Navbar />}

      <main
        className={`browse-jobs-main ${
          isTutorLoggedIn ? 'with-sidebar' : 'full-width'
        }`}
      >
        {/* Page Header */}
        <div className="browse-jobs-header">
          <h1>Browse Tuition Jobs</h1>
          <p>Explore active tuition posts from guardians across Bangladesh and apply directly.</p>
        </div>

        {/* Filter Panel (Search + District Checkboxes + Distance Sort) */}
        <JobFilterPanel
          totalCount={displayedPosts.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDistricts={selectedDistricts}
          onDistrictToggle={handleDistrictToggle}
          sortByDistance={sortByDistance}
          onToggleSortDistance={() => setSortByDistance((prev) => !prev)}
        />

        {/* Jobs Grid */}
        <div className="jobs-grid-container">
          {displayedPosts.length > 0 ? (
            displayedPosts.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="no-jobs-state">
              <h3>No tuition jobs found</h3>
              <p>Try clearing your search query or unchecking district location filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default BrowseJobs
