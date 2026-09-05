// App.jsx — Main application routes and providers.

import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute.jsx'

import LandingPage from './LandingPage.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Dashboard from './Dashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import PlaceholderPage from './PlaceholderPage.jsx'

// Updated Modular Dashboard & Profile Pages
import TutorDashboard from './pages/TutorDashboard/TutorDashboard.jsx'
import GuardianDashboard from './pages/GuardianDashboard/GuardianDashboard.jsx'
import BrowseJobs from './pages/TutorDashboard/BrowseJobs.jsx'
import JobDetail from './pages/TutorDashboard/JobDetail.jsx'
import ProfilePage from './pages/Profile/ProfilePage.jsx'
import PostTuition from './pages/GuardianDashboard/PostTuition.jsx'
import GuardianPosts from './pages/GuardianDashboard/GuardianPosts.jsx'
import GuardianApplicants from './pages/GuardianDashboard/GuardianApplicants.jsx'
import GuardianFavorites from './pages/GuardianDashboard/GuardianFavorites.jsx'
import BrowseTutors from './pages/TutorBrowse/BrowseTutors.jsx'
import TutorDetail from './pages/TutorBrowse/TutorDetail.jsx'
import AdminAnalytics from './pages/Admin/AdminAnalytics.jsx'

import MyApplications from './pages/TutorDashboard/MyApplications.jsx'
import SubscriptionPage from './pages/Subscription/SubscriptionPage.jsx'
import ChatMatchPage from './pages/AIMatching/ChatMatchPage.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tutors" element={<BrowseTutors />} />
        <Route path="/tutors/:id" element={<TutorDetail />} />

        {/* Tuition Jobs & Detail Routes */}
        <Route path="/posts" element={<BrowseJobs />} />
        <Route path="/posts/:id" element={<JobDetail />} />
        <Route path="/tutor/jobs" element={<BrowseJobs />} />
        <Route path="/tutor/jobs/:id" element={<JobDetail />} />

        {/* Profile, Subscription & AI Matching Pages */}
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

        {/* Guardian Navigation Pages */}
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
          path="/guardian/favorites"
          element={
            <ProtectedRoute allowedRole="guardian">
              <GuardianFavorites />
            </ProtectedRoute>
          }
        />

        {/* Tutor Navigation Pages */}
        <Route
          path="/tutor/applications"
          element={
            <ProtectedRoute allowedRole="tutor">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* Admin Navigation Pages */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        {/* General Dashboard Redirect */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Protected Role-Based Dashboards */}
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
      </Routes>
    </AuthProvider>
  )
}

export default App
