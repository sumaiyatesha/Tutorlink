// PlaceholderPage.jsx — Temporary placeholder page component for upcoming features.
//
// Renders the standard Navbar, an EmptyState component informing the user
// that the feature page is under development, and the Footer.

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import EmptyState from './components/EmptyState'

function PlaceholderPage({ title = 'Page Coming Soon', icon = '🚀' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
        <EmptyState
          icon={icon}
          title={title}
          message={`The ${title} module is currently under development and will be available in the next phase.`}
        />
      </main>

      <Footer />
    </div>
  )
}

export default PlaceholderPage
