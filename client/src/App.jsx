// client/src/App.jsx
// Main application routes and page structure for TutorLink.

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute.jsx'

// Authentication & Core Pages
import LandingPage from './LandingPage.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Dashboard from './Dashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import PlaceholderPage from './PlaceholderPage.jsx'

// Modular Dashboard & Profile Pages
import TutorDashboard from './pages/TutorDashboard/TutorDashboard.jsx'
import GuardianDashboard from './pages/GuardianDashboard/GuardianDashboard.jsx'
import BrowseJobs from './pages/TutorDashboard/BrowseJobs.jsx'
import JobDetail from './pages/TutorDashboard/JobDetail.jsx'
import ProfilePage from './pages/Profile/ProfilePage.jsx'
import PostTuition from './pages/GuardianDashboard/PostTuition.jsx'
import GuardianPosts from './pages/GuardianDashboard/GuardianPosts.jsx'
import GuardianApplicants from './pages/GuardianDashboard/GuardianApplicants.jsx'
import LetsTest from './pages/GuardianDashboard/letstest.jsx'
import TutorLetsTest from './pages/TutorDashboard/letstest.jsx'
import BrowseTutors from './pages/TutorBrowse/BrowseTutors.jsx'
import TutorDetail from './pages/TutorBrowse/TutorDetail.jsx'
import AdminAnalytics from './pages/Admin/AdminAnalytics.jsx'
import HowItWorksPage from './pages/HowItWorks/HowItWorksPage.jsx'

// Applications, Subscriptions & AI Matching
import MyApplications from './pages/TutorDashboard/MyApplications.jsx'
import SubscriptionPage from './pages/Subscription/SubscriptionPage.jsx'
import ChatMatchPage from './pages/AIMatching/ChatMatchPage.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ------------------------------------------------------------- */}
        {/* 1. Public Visitor Routes                                      */}
        {/* ------------------------------------------------------------- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tutors" element={<BrowseTutors />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/tutors/:id" element={<TutorDetail />} />

        {/* ------------------------------------------------------------- */}
        {/* 2. Tuition Jobs & Listings                                    */}
        {/* ------------------------------------------------------------- */}
        <Route path="/posts" element={<BrowseJobs />} />
        <Route path="/posts/:id" element={<JobDetail />} />
        <Route path="/tutor/jobs" element={<BrowseJobs />} />
        <Route path="/tutor/jobs/:id" element={<JobDetail />} />

        {/* Testing Page — reuses BrowseJobs in cards-only mode.           */}
        {/* Sidebar link is currently inactive; see Sidebar.jsx to enable. */}
        <Route
          path="/tutor/testing"
          element={
            <BrowseJobs
              cardsOnly
              title="Testing Page"
              subtitle="Preview showing tuition job cards only."
            />
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* 3. Profiles, Monetization & AI Matching                       */}
        {/* ------------------------------------------------------------- */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route
          path="/ai-matching"
          element={
            <ProtectedRoute>
              <ChatMatchPage />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* 4. Guardian-Only Protected Routes                             */}
        {/* ------------------------------------------------------------- */}
        <Route
          path="/guardian/posts"
          element={
            <ProtectedRoute allowedRole="guardian">
              <GuardianPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/posts/edit/:id"
          element={
            <ProtectedRoute allowedRole="guardian">
              <PostTuition isEdit={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/post-tuition"
          element={
            <ProtectedRoute allowedRole="guardian">
              <PostTuition />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/applicants"
          element={
            <ProtectedRoute allowedRole="guardian">
              <GuardianApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gurdianpost/letstest"
          element={
            <ProtectedRoute allowedRole="guardian">
              <LetsTest />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* 5. Tutor-Only Protected Routes                                */}
        {/* ------------------------------------------------------------- */}
        <Route
          path="/tutor/letstest"
          element={
            <ProtectedRoute allowedRole="tutor">
              <TutorLetsTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/applications"
          element={
            <ProtectedRoute allowedRole="tutor">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* 6. Admin-Only Protected Routes                                */}
        {/* ------------------------------------------------------------- */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* 7. Role-Based Dashboards                                      */}
        {/* ------------------------------------------------------------- */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/dashboard/guardian"
          element={
            <ProtectedRoute allowedRole="guardian">
              <GuardianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/dashboard"
          element={
            <ProtectedRoute allowedRole="guardian">
              <GuardianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tutor"
          element={
            <ProtectedRoute allowedRole="tutor">
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute allowedRole="tutor">
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard URL aliases for backward compatibility */}
        <Route path="/guardian-dashboard" element={<Navigate to="/guardian/dashboard" replace />} />
        <Route path="/tutor-dashboard" element={<Navigate to="/tutor/dashboard" replace />} />

        {/* ------------------------------------------------------------- */}
        {/* 8. 404 Fallback Page                                          */}
        {/* ------------------------------------------------------------- */}
        <Route path="*" element={<PlaceholderPage title="Page Not Found" icon="🔍" />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
