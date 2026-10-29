// PostTuition.jsx — Form for Guardians to Create or Edit Tuition Posts with Gemini AI Assistance.
//
// Features:
// 1. Supports both "Create Post" and "Edit Post" modes.
// 2. "✨ Generate with AI" assistant powered by Google Gemini API (POST /api/ai/generate-post/).
//    - Automatically generates a professional title and a 3-4 sentence detailed requirement description.
//    - Allows guardians to freely review and edit all generated fields before submitting.
// 3. Pre-fills form data when editing an existing post ID via URL param /guardian/posts/edit/:id.
// 4. Submits data to POST /api/tuition-posts/ or PUT /api/tuition-posts/:id/.
// 5. On success, redirects user to /guardian/posts.

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Badge from '../../components/Badge'
import './PostTuition.css'

function PostTuition({ isEdit = false }) {
  const { id } = useParams()
  const navigate = useNavigate()

  // Form Field State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Class 9-10 (SSC)')
  const [course, setCourse] = useState('National Curriculum')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [preferredTime, setPreferredTime] = useState('5:00 PM')
  const [duration, setDuration] = useState('1.5 Hours')
  const [method, setMethod] = useState('In-Person')
  // To change this: adjust initial default tuition salary in BDT
  const [salary, setSalary] = useState(8000)
  const [students, setStudents] = useState('1 Student')
  const [preferredDays, setPreferredDays] = useState([])
  const [preferredGender, setPreferredGender] = useState('Any')
  const [location, setLocation] = useState('Dhaka')

  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiSuccess, setAiSuccess] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Guardian Profile Completeness State
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Profile Verification Checklist
  const hasPhone = Boolean(profile && profile.phone && profile.phone.trim())
  const hasNid = Boolean(profile && profile.nid_no && profile.nid_no.trim())
  const hasLocation = Boolean(profile && profile.location && profile.location.trim())
  const isProfileComplete = hasPhone && hasNid && hasLocation

  // Fetch Guardian Profile to enforce verification status
  useEffect(() => {
    async function checkGuardianProfile() {
      try {
        const res = await api.get('/api/guardian/profile/').catch(() => null)
        if (res && res.data) {
          setProfile(res.data)
          // Default post location to profile location if not manually set
          if (res.data.location && (!location || location === 'Dhaka')) {
            setLocation(res.data.location)
          }
        }
      } catch (err) {
        console.error('Error fetching guardian profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    checkGuardianProfile()
  }, [])

  // Handle AI Post Generation with 6s timeout and fast feedback
  async function handleAiGenerate() {
    setGeneratingAi(true)
    setError('')
    setAiSuccess('')

    try {
      const res = await api.post('/api/ai/generate-post/', {
        subject: subject || 'General Academic Subjects',
        category,
        course,
        days_per_week: daysPerWeek,
        preferred_time: preferredTime,
        salary,
        location: location || 'Dhaka',
        bullets: title || description || 'Looking for an experienced and caring tutor for regular home tuition.',
      }, { timeout: 6000 })

      if (res && res.data) {
        if (res.data.title) setTitle(res.data.title)
        if (res.data.description) setDescription(res.data.description)
        setAiSuccess('✨ AI generated a tailored title and detailed description! Review or edit any field below before submitting.')
      }
    } catch (err) {
      console.error('AI post generation error:', err)
      setError('AI generation request failed. Please enter details manually.')
    } finally {
      setGeneratingAi(false)
    }
  }

  // If in Edit Mode, fetch existing post details to pre-fill form
  useEffect(() => {
    if (isEdit && id) {
      async function fetchPostDetail() {
        try {
          const response = await api.get(`/api/tuition-posts/${id}/`)
          if (response && response.data) {
            const d = response.data
            setTitle(d.title || '')
            setDescription(d.description || '')
            setSubject(d.subject || '')
            setCategory(d.category || 'Class 9-10 (SSC)')
            setCourse(d.course || 'National Curriculum')
            setDaysPerWeek(d.days_per_week || 3)
            setPreferredDays(Array.isArray(d.preferred_days) ? d.preferred_days : [])
            setPreferredTime(d.preferred_time || '5:00 PM')
            setDuration(d.duration || '1.5 Hours')
            setMethod(d.method || 'In-Person')
            setSalary(d.salary || 8000)
            setStudents(d.students || '1 Student')
            setPreferredGender(d.preferred_tutor_gender || 'Any')
            setLocation(d.location || 'Dhaka')
          }
        } catch (err) {
          console.error('Error fetching post for edit:', err)
          setError('Failed to load existing post data.')
        } finally {
          setLoading(false)
        }
      }

      fetchPostDetail()
    }
  }, [isEdit, id])

  // Toggle preferred day checkbox
  function handleDayToggle(day) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // Handle Form Submission
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Enforce profile completion rule before allowing tuition posting
    if (!isProfileComplete && !isEdit) {
      setError('⚠️ Profile Incomplete: You must provide your Contact Number, NID Number, and Location in your Profile before posting a tuition.')
      return
    }

    setSubmitting(true)

    const payload = {
      title: title || `${subject} Tutor Needed`,
      description,
      subject,
      category,
      course,
      days_per_week: Number(daysPerWeek),
      preferred_days: preferredDays,
      preferred_time: preferredTime,
      duration,
      method,
      salary: Number(salary),
      students,
      preferred_tutor_gender: preferredGender,
      location,
    }

    try {
      if (isEdit && id) {
        await api.put(`/api/tuition-posts/${id}/`, payload)
      } else {
        await api.post('/api/tuition-posts/', payload)
      }
      // Success -> Redirect to Guardian Posts list
      navigate('/guardian/posts')
    } catch (err) {
      console.error('Error saving post:', err)
      if (err.response && err.response.data) {
        const data = err.response.data
        const firstKey = Object.keys(data)[0]
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
        setError(`${firstKey}: ${msg}`)
      } else {
        setError('Failed to save tuition post. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="post-tuition-page">
        <Sidebar role="guardian" />
        <main className="post-tuition-main" style={{ padding: '60px', textAlign: 'center' }}>
          <h2>Loading post details...</h2>
        </main>
      </div>
    )
  }

  return (
    <div className="post-tuition-page">
      <Sidebar role="guardian" />

      <main className="post-tuition-main">
        <div className="post-tuition-header">
          <Badge variant="primary">{isEdit ? 'Edit Mode' : 'New Post'}</Badge>
          <h1>{isEdit ? 'Edit Tuition Requirement' : 'Post a Tuition Requirement'}</h1>
          <p>
            {isEdit
              ? 'Update details for your active tuition requirement.'
              : 'Fill in your tutoring requirements or use Gemini AI to generate a complete description.'}
          </p>
        </div>

        <div className="post-tuition-card">
          {error && <div className="post-error-banner">{error}</div>}

          {/* Profile Incomplete Warning Banner */}
          {!isProfileComplete && !isEdit && !profileLoading && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #f59e0b',
              borderRadius: '12px',
              padding: '18px 22px',
              marginBottom: '20px',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#92400e', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛡️</span> Guardian Profile Incomplete — Verification Required
                  </h3>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                    To ensure trust and student safety, guardians must provide their <strong>Contact Number</strong>, <strong>National ID (NID) Number</strong>, and <strong>Location</strong> before they can post a tuition requirement.
                  </p>
                  
                  {/* Status Badges Checklist */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{
                      backgroundColor: hasPhone ? '#dcfce7' : '#fee2e2',
                      color: hasPhone ? '#166534' : '#991b1b',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${hasPhone ? '#86efac' : '#fca5a5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {hasPhone ? '✅' : '❌'} Contact No: {hasPhone ? profile.phone : 'Missing'}
                    </span>

                    <span style={{
                      backgroundColor: hasNid ? '#dcfce7' : '#fee2e2',
                      color: hasNid ? '#166534' : '#991b1b',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${hasNid ? '#86efac' : '#fca5a5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {hasNid ? '✅' : '❌'} NID No: {hasNid ? profile.nid_no : 'Missing'}
                    </span>

                    <span style={{
                      backgroundColor: hasLocation ? '#dcfce7' : '#fee2e2',
                      color: hasLocation ? '#166534' : '#991b1b',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${hasLocation ? '#86efac' : '#fca5a5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {hasLocation ? '✅' : '❌'} Location: {hasLocation ? profile.location : 'Missing'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    alignSelf: 'center'
                  }}
                >
                  <span>✏️</span> Complete Profile
                </button>
              </div>
            </div>
          )}

          {aiSuccess && (
            <div style={{
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid #a7f3d0'
            }}>
              {aiSuccess}
            </div>
          )}

          {/* AI Assistance Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f5f3ff',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid #ddd6fe',
            marginBottom: '20px'
          }}>
            <div>
              <strong style={{ color: '#4f46e5', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✨ AI Tuition Post Assistant (Powered by Gemini)
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                Select your subject and grade below, then click to automatically generate a tailored title and 3-4 sentence description.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={generatingAi}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: generatingAi ? 0.7 : 1,
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                whiteSpace: 'nowrap',
                marginLeft: '12px'
              }}
            >
              {generatingAi ? '🤖 Generating...' : '✨ Generate with AI'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="post-tuition-form">
            {/* Title / Headline */}
            <div className="form-group full-width">
              <label>Post Title / Requirement Headline *</label>
              <input
                type="text"
                placeholder="e.g. Class 10 Physics & Higher Math Tutor Needed in Uttara"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description / Additional Notes */}
            <div className="form-group full-width">
              <label>Detailed Tuition Description & Expectations (AI Generated / Custom)</label>
              <textarea
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
                placeholder="Detailed description of student requirements, expectations, and preferred teacher profile..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Grid 2 Columns */}
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Subject(s) *</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Higher Math"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location / Area *</label>
                <input
                  type="text"
                  placeholder="e.g. Uttara Sector 7, Dhaka"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category / Grade Level</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Class 1-5 (Primary)">Class 1-5 (Primary)</option>
                  <option value="Class 6-8 (Junior)">Class 6-8 (Junior)</option>
                  <option value="Class 9-10 (SSC)">Class 9-10 (SSC)</option>
                  <option value="HSC (College)">HSC (College)</option>
                  <option value="University / Admission">University / Admission</option>
                </select>
              </div>

              <div className="form-group">
                <label>Curriculum / Medium</label>
                <select value={course} onChange={(e) => setCourse(e.target.value)}>
                  <option value="National Curriculum (Bangla)">National Curriculum (Bangla)</option>
                  <option value="National Curriculum (English Version)">National Curriculum (English Version)</option>
                  <option value="English Medium (Edexcel/Cambridge)">English Medium (Edexcel/Cambridge)</option>
                  <option value="Skill / Programming">Skill / Programming</option>
                </select>
              </div>

              <div className="form-group">
                <label>Days Per Week</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                  required
                />
              </div>

              {/* Preferred Days Checkboxes */}
              <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                <label>Preferred Days (Multi-select)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                    const isChecked = preferredDays.includes(day)
                    return (
                      <label
                        key={day}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: isChecked ? '#ede9fe' : '#f8fafc',
                          border: isChecked ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                          color: isChecked ? '#5b21b6' : '#334155',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDayToggle(day)}
                        />
                        <span>{day}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Monthly Salary Offered (BDT) *</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  placeholder="8000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Time</label>
                <input
                  type="text"
                  placeholder="e.g. 5:00 PM"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Session Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 1.5 Hours"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tutoring Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="In-Person">In-Person (Home Tutoring)</option>
                  <option value="Online">Online</option>
                  <option value="Both">Both In-Person & Online</option>
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Tutor Gender</label>
                <select value={preferredGender} onChange={(e) => setPreferredGender(e.target.value)}>
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male Preferred</option>
                  <option value="Female">Female Preferred</option>
                </select>
              </div>
            </div>

            {/* Submit Action Row */}
            <div className="form-action-row">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/guardian/posts')}
              >
                Cancel
              </button>

              {!isProfileComplete && !isEdit ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                  }}
                  title="Please provide Contact No, NID No, and Location in your Profile first"
                >
                  🔒 Complete Profile to Post Tuition
                </button>
              ) : (
                <button type="submit" className="btn-submit-post" disabled={submitting}>
                  {submitting ? 'Saving...' : isEdit ? 'Update Tuition Post' : 'Create Tuition Post'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default PostTuition
