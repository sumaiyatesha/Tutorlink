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
  // To change this: add new user profile editable fields below
  const [phone, setPhone] = useState('')
  const [nidNo, setNidNo] = useState('')
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

  // Tutor Student / Graduate Verification State
  const [isCurrentlyStudent, setIsCurrentlyStudent] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [certificateName, setCertificateName] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [selectedCertFile, setSelectedCertFile] = useState(null)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [certUploadStatus, setCertUploadStatus] = useState('')

  // Coordinates state
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  // Status feedback messages
  const [geoStatus, setGeoStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch current profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get(profileEndpoint).catch(() => null)
        if (response && response.data) {
          const d = response.data
          setPhone(d.phone || '')
          setNidNo(d.nid_no || '')
          setLocationStr(d.location || '')
          setBio(d.bio || '')
          setSubjects(d.subjects || '')
          setTeachingPreferences(d.teaching_preferences || '')
          setAvailableDays(Array.isArray(d.available_days) ? d.available_days : [])
          setExpectedSalary(d.expected_salary !== null && d.expected_salary !== undefined ? d.expected_salary : '')
          setCvName(d.cv_name || '')
          setCvUrl(d.cv || '')
          setIsCurrentlyStudent(d.is_currently_student !== undefined ? Boolean(d.is_currently_student) : true)
          setStudentId(d.student_id || '')
          setCertificateName(d.certificate_name || '')
          setCertificateUrl(d.certificate || '')
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

  // Last Institution Certificate Upload Handler (for non-student tutors)
  async function handleUploadCertificate() {
    if (!selectedCertFile) {
      setCertUploadStatus('Please select a certificate file first.')
      return
    }
    setUploadingCert(true)
    setCertUploadStatus('')

    const formData = new FormData()
    formData.append('certificate', selectedCertFile)

    try {
      const res = await api.post('/api/tutor/upload-certificate/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (res.data) {
        setCertificateName(res.data.certificate_name || selectedCertFile.name)
        setCertificateUrl(res.data.certificate || '')
        setCertUploadStatus('✅ Certificate uploaded successfully!')
        setSelectedCertFile(null)
      }
    } catch (err) {
      console.error('Error uploading certificate:', err)
      setCertUploadStatus('Failed to upload certificate. Please try again.')
    } finally {
      setUploadingCert(false)
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
          nid_no: nidNo,
          is_currently_student: isCurrentlyStudent,
          student_id: isCurrentlyStudent ? studentId : '',
          certificate_name: !isCurrentlyStudent ? certificateName : '',
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
          nid_no: nidNo,
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

          {/* Guardian Profile Completeness Status Notice */}
          {!isTutor && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              border: (phone && nidNo && locationStr) ? '1px solid #86efac' : '1px solid #fde047',
              backgroundColor: (phone && nidNo && locationStr) ? '#f0fdf4' : '#fefce8',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{
                  fontSize: '15px',
                  color: (phone && nidNo && locationStr) ? '#15803d' : '#854d0e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {(phone && nidNo && locationStr) ? '✅ Guardian Profile Status: Complete' : '⚠️ Guardian Profile Status: Incomplete'}
                </strong>
                <Badge variant={(phone && nidNo && locationStr) ? 'success' : 'warning'}>
                  {(phone && nidNo && locationStr) ? 'Ready to Post Tuitions' : 'Action Required to Post'}
                </Badge>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: (phone && nidNo && locationStr) ? '#166534' : '#713f12' }}>
                {(phone && nidNo && locationStr)
                  ? 'Your contact number, NID number, and location are all set. You can freely post tuition requirements!'
                  : 'To post a tuition requirement, you must provide your Contact Number, NID Number, and Location below.'}
              </p>
            </div>
          )}

          {/* Tutor Profile Completeness Status Notice */}
          {isTutor && (() => {
            const hasPhone = Boolean(phone && phone.trim())
            const hasNid = Boolean(nidNo && nidNo.trim())
            const hasLocation = Boolean(locationStr && locationStr.trim())
            const hasAcademic = isCurrentlyStudent ? Boolean(studentId && studentId.trim()) : Boolean(certificateName || certificateUrl)
            const isTutorComplete = hasPhone && hasNid && hasLocation && hasAcademic

            return (
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: isTutorComplete ? '1px solid #86efac' : '1px solid #fde047',
                backgroundColor: isTutorComplete ? '#f0fdf4' : '#fefce8',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{
                    fontSize: '15px',
                    color: isTutorComplete ? '#15803d' : '#854d0e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isTutorComplete ? '✅ Tutor Profile Status: Complete' : '⚠️ Tutor Profile Status: Incomplete'}
                  </strong>
                  <Badge variant={isTutorComplete ? 'success' : 'warning'}>
                    {isTutorComplete ? 'Ready to Apply for Tuitions' : 'Action Required to Apply'}
                  </Badge>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: isTutorComplete ? '#166534' : '#713f12' }}>
                  {isTutorComplete
                    ? 'Your contact number, NID number, academic credentials, and location are verified. You can apply for tuition jobs!'
                    : `To apply for tuition jobs, please complete: ${[!hasPhone && 'Contact No', !hasNid && 'NID No', !hasAcademic && (isCurrentlyStudent ? 'Student ID' : 'Certificate'), !hasLocation && 'Location'].filter(Boolean).join(', ')}.`}
                </p>
              </div>
            )
          })()}

          {/* Profile Edit Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Contact Phone Number *</label>
                <input
                  type="text"
                  placeholder="+880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>National ID (NID) Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 19951234567890123 (10-17 digits)"
                  value={nidNo}
                  onChange={(e) => setNidNo(e.target.value)}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                  Required for identity verification & platform safety.
                </small>
              </div>

              <div className="form-group">
                <label>Location / Area *</label>
                <input
                  type="text"
                  placeholder="e.g. Uttara, Dhaka"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tutor Academic & Enrollment Status */}
            {isTutor && (
              <div style={{
                background: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <label style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  🎓 Current Academic & Enrollment Status *
                </label>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: isCurrentlyStudent ? '#4f46e5' : '#334155' }}>
                    <input
                      type="radio"
                      name="isCurrentlyStudentRadio"
                      checked={isCurrentlyStudent === true}
                      onChange={() => setIsCurrentlyStudent(true)}
                    />
                    <span>Yes, I am currently a student</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: !isCurrentlyStudent ? '#4f46e5' : '#334155' }}>
                    <input
                      type="radio"
                      name="isCurrentlyStudentRadio"
                      checked={isCurrentlyStudent === false}
                      onChange={() => setIsCurrentlyStudent(false)}
                    />
                    <span>No, I have completed my studies (Graduated / Working)</span>
                  </label>
                </div>

                {/* Option A: Current Student -> Student ID */}
                {isCurrentlyStudent ? (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Student ID Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021-1-60-001 or University ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                      Enter your college or university student ID for academic verification.
                    </small>
                  </div>
                ) : (
                  /* Option B: Not Student -> Upload Last Institution Certificate */
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Last Institution Certificate / Transcript * (PDF or Image)</label>
                    {certificateName && (
                      <div style={{ fontSize: '13px', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Uploaded Certificate: <strong>{certificateName}</strong></span>
                        {certificateUrl && (
                          <a
                            href={certificateUrl.startsWith('http') ? certificateUrl : `http://localhost:8000${certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
                          >
                            📜 View Certificate ↗
                          </a>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setSelectedCertFile(e.target.files[0])}
                        style={{ fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        className="btn-detect-location"
                        onClick={handleUploadCertificate}
                        disabled={uploadingCert || !selectedCertFile}
                      >
                        {uploadingCert ? 'Uploading...' : 'Upload Certificate'}
                      </button>
                    </div>

                    {certUploadStatus && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '13px', fontWeight: 600, color: certUploadStatus.includes('✅') ? '#16a34a' : '#ef4444' }}>
                        {certUploadStatus}
                      </p>
                    )}

                    <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Upload your graduation certificate, degree provisional certificate, or latest academic transcript.
                    </small>
                  </div>
                )}
              </div>
            )}

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
                    <label>
                      CV / Resume Document (PDF Upload) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <p style={{ margin: '2px 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                      Uploading your CV is required to apply for tuition jobs. Guardians review your CV when you apply.
                    </p>
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
