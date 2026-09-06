// ProfilePage.jsx — User Profile Edit Page with Geolocation Location Capture and CV File Upload.
//
// Features:
// 1. "Set My Location" button using navigator.geolocation.getCurrentPosition().
// 2. Captures latitude/longitude coordinates and saves them via API.
// 3. Real PDF CV file upload using POST /api/tutor/upload-cv/.

import { useState, useEffect } from 'react'
import { useAuth, api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Navbar from '../Landing/Navbar'
import Badge from '../../components/Badge'
import './ProfilePage.css'

function ProfilePage() {
  const { user } = useAuth()
  const isTutor = user && user.role === 'tutor'
  const profileEndpoint = isTutor ? '/api/tutor/profile/' : '/api/guardian/profile/'

  // Form State
  const [phone, setPhone] = useState('')
  const [locationStr, setLocationStr] = useState('')
  const [bio, setBio] = useState('')
  const [subjects, setSubjects] = useState('')
  const [teachingPreferences, setTeachingPreferences] = useState('')
  const [availableDays, setAvailableDays] = useState([])
  const [expectedSalary, setExpectedSalary] = useState('')
  const [cvName, setCvName] = useState('')
  const [cvUrl, setCvUrl] = useState('')
  const [selectedCvFile, setSelectedCvFile] = useState(null)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [cvUploadStatus, setCvUploadStatus] = useState('')

  // Coordinates state
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  // Status feedback messages
  const [geoStatus, setGeoStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // AI Skill Extraction State
  const [extractingSkills, setExtractingSkills] = useState(false)
  const [extractedSkills, setExtractedSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [aiSkillStatus, setAiSkillStatus] = useState('')

  // Handle Extract Skills with AI
  async function handleExtractSkills() {
    setExtractingSkills(true)
    setAiSkillStatus('')
    try {
      const res = await api.post('/api/ai/extract-cv-skills/')
      if (res && res.data && res.data.skills) {
        setExtractedSkills(res.data.skills)
        setSelectedSkills(res.data.skills)
        setAiSkillStatus('✨ Gemini extracted these skills from your CV. Select the ones you want to keep and click "Merge & Save Skills".')
      }
    } catch (err) {
      console.error('Error extracting CV skills:', err)
      setAiSkillStatus(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to extract skills from CV.'
      )
    } finally {
      setExtractingSkills(false)
    }
  }

  // Toggle skill selection in checklist
  function toggleSkill(skill) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  // Merge selected AI skills into profile subjects and save
  async function handleMergeSkills() {
    if (selectedSkills.length === 0) {
      setAiSkillStatus('Please select at least one skill to merge.')
      return
    }

    const existingList = subjects ? subjects.split(',').map((s) => s.trim()).filter(Boolean) : []
    const combined = Array.from(new Set([...existingList, ...selectedSkills]))
    const newSubjectsStr = combined.join(', ')
    setSubjects(newSubjectsStr)

    try {
      await api.patch(profileEndpoint, { subjects: newSubjectsStr })
      setAiSkillStatus('✅ Selected skills successfully merged into your Subject Expertise!')
      setExtractedSkills([])
    } catch (err) {
      console.error('Error saving merged skills:', err)
      setAiSkillStatus('Failed to update subjects. Please click Save Profile Changes manually.')
    }
  }

  // Fetch current profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get(profileEndpoint).catch(() => null)
        if (response && response.data) {
          const d = response.data
          setPhone(d.phone || '')
          setLocationStr(d.location || '')
          setBio(d.bio || '')
          setSubjects(d.subjects || '')
          setTeachingPreferences(d.teaching_preferences || '')
          setAvailableDays(Array.isArray(d.available_days) ? d.available_days : [])
          setExpectedSalary(d.expected_salary !== null && d.expected_salary !== undefined ? d.expected_salary : '')
          setCvName(d.cv_name || '')
          setCvUrl(d.cv || '')
          setLatitude(d.latitude !== undefined ? d.latitude : null)
          setLongitude(d.longitude !== undefined ? d.longitude : null)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [profileEndpoint])

  // CV File Upload Handler
  async function handleUploadCv() {
    if (!selectedCvFile) {
      setCvUploadStatus('Please select a PDF file first.')
      return
    }
    setUploadingCv(true)
    setCvUploadStatus('')

    const formData = new FormData()
    formData.append('cv', selectedCvFile)

    try {
      const res = await api.post('/api/tutor/upload-cv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (res.data) {
        setCvName(res.data.cv_name || selectedCvFile.name)
        setCvUrl(res.data.cv || '')
        setCvUploadStatus('✅ CV uploaded successfully!')
        setSelectedCvFile(null)
      }
    } catch (err) {
      console.error('Error uploading CV:', err)
      setCvUploadStatus('Failed to upload CV. Please ensure file is a PDF.')
    } finally {
      setUploadingCv(false)
    }
  }

  // Toggle available weekday checkbox
  function handleDayToggle(day) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // Geolocation Capture Handler
  function handleSetLocation() {
    setGeoStatus('Locating your position...')
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setGeoStatus(`📍 Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Saving...)`)

        // Immediately auto-save coordinates to profile on backend
        try {
          await api.patch(profileEndpoint, { latitude: lat, longitude: lng })
          setGeoStatus(`✅ Location saved: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } catch (err) {
          console.warn('Auto-save coordinates warning:', err)
          setGeoStatus(`📍 Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Click Save Profile Changes below to persist)`)
        }
      },
      (error) => {
        console.warn('Geolocation error:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus(
            '⚠️ Location permission denied. Please allow location access in your browser.'
          )
        } else {
          setGeoStatus('Unable to retrieve location automatically. Please enter your location text below.')
        }
      }
    )
  }

  // Save Profile Handler
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveStatus('')

    const payload = isTutor
      ? {
          phone,
          location: locationStr,
          bio,
          subjects,
          teaching_preferences: teachingPreferences,
          available_days: availableDays,
          expected_salary: expectedSalary ? Number(expectedSalary) : null,
          cv_name: cvName,
          latitude,
          longitude,
        }
      : {
          phone,
          location: locationStr,
          latitude,
          longitude,
        }

    try {
      await api.put(profileEndpoint, payload)
      setSaveStatus('✅ Profile updated successfully!')
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveStatus('Error saving profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initialLetter = user && user.username ? user.username.charAt(0).toUpperCase() : '👤'

  return (
    <div className="profile-page-wrapper">
      {user ? <Sidebar role={user.role} /> : <Navbar />}

      <main className={`profile-main-content ${!user ? 'full-width' : ''}`}>
        <div className="profile-card">
          
          {/* Profile Header */}
          <div className="profile-header-area">
            <div className="profile-avatar-large">{initialLetter}</div>
            <div className="profile-header-text">
              <h1>{user ? user.username : 'User Profile'}</h1>
              <p>
                Role: <Badge variant="primary">{user ? user.role : 'Guest'}</Badge> | Email: {user ? user.email : 'N/A'}
              </p>
            </div>
          </div>

          {/* Location & Geolocation Box */}
          <div className="location-box">
            <div className="location-box-info">
              <h3>📍 My Precise Geolocation Coordinates</h3>
              <p>
                {latitude && longitude
                  ? `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                  : 'No coordinates set yet. Click "Set My Location" to enable distance calculations.'}
              </p>
              {geoStatus && (
                <p style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                  {geoStatus}
                </p>
              )}
            </div>

            <button type="button" className="btn-detect-location" onClick={handleSetLocation}>
              📍 Set My Location
            </button>
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Location / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Uttara, Dhaka"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                />
              </div>
            </div>

            {/* Additional Tutor Fields */}
            {isTutor && (
              <>
                <div className="form-group">
                  <label>Subject Expertise</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics, Higher Math"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Bio / Overview</label>
                  <textarea
                    rows={3}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0' }}
                    placeholder="Brief summary of your teaching experience..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Teaching Preferences</label>
                    <input
                      type="text"
                      placeholder="e.g. Home Tutoring, Online"
                      value={teachingPreferences}
                      onChange={(e) => setTeachingPreferences(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Expected Monthly Salary (BDT)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                    />
                  </div>
                </div>

                {/* Available Days Checkboxes */}
                <div className="form-group">
                  <label>Available Tutoring Days (Multi-select)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                      const isChecked = availableDays.includes(day)
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
                    <label>CV / Resume Document (PDF Upload)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cvName && (
                        <div style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>Uploaded CV: <strong>{cvName}</strong></span>
                          {cvUrl && (
                            <a
                              href={cvUrl.startsWith('http') ? cvUrl : `http://localhost:8000${cvUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
                            >
                              📄 View CV ↗
                            </a>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedCvFile(e.target.files[0])}
                          style={{ fontSize: '14px' }}
                        />
                        <button
                          type="button"
                          className="btn-detect-location"
                          onClick={handleUploadCv}
                          disabled={uploadingCv || !selectedCvFile}
                        >
                          {uploadingCv ? 'Uploading...' : 'Upload CV'}
                        </button>
                      </div>

                      {cvUploadStatus && (
                        <p style={{ fontSize: '13px', fontWeight: 600, color: cvUploadStatus.includes('✅') ? '#16a34a' : '#ef4444' }}>
                          {cvUploadStatus}
                        </p>
                      )}

                      {/* AI Skill Extraction Trigger & Checklist */}
                      {(cvName || cvUrl) && (
                        <div style={{
                          marginTop: '12px',
                          padding: '14px',
                          background: '#f5f3ff',
                          borderRadius: '10px',
                          border: '1px solid #ddd6fe'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <strong style={{ color: '#4f46e5', fontSize: '14px' }}>✨ AI CV Skill Extractor (Gemini)</strong>
                              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                Automatically parse your uploaded PDF CV to extract subject competencies.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleExtractSkills}
                              disabled={extractingSkills}
                              style={{
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                opacity: extractingSkills ? 0.7 : 1,
                              }}
                            >
                              {extractingSkills ? 'Extracting...' : '✨ Extract Skills with AI'}
                            </button>
                          </div>

                          {aiSkillStatus && (
                            <p style={{ margin: '6px 0', fontSize: '13px', fontWeight: 600, color: aiSkillStatus.includes('✅') ? '#16a34a' : '#4f46e5' }}>
                              {aiSkillStatus}
                            </p>
                          )}

                          {/* Extracted Skills Checklist */}
                          {extractedSkills.length > 0 && (
                            <div style={{
                              marginTop: '12px',
                              backgroundColor: '#ffffff',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                Select skills to merge into your Subject Expertise:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
                                {extractedSkills.map((skill) => {
                                  const isSelected = selectedSkills.includes(skill)
                                  return (
                                    <label
                                      key={skill}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: isSelected ? '#ede9fe' : '#f1f5f9',
                                        border: isSelected ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                                        color: isSelected ? '#5b21b6' : '#475569',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSkill(skill)}
                                      />
                                      <span>{skill}</span>
                                    </label>
                                  )
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={handleMergeSkills}
                                style={{
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                }}
                              >
                                ✓ Merge & Save {selectedSkills.length} Selected Skills
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            {saveStatus && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '14px', fontWeight: 600 }}>
                {saveStatus}
              </div>
            )}

            <button type="submit" className="btn-save-profile" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

        </div>
      </main>
    </div>
  )
}

export default ProfilePage
