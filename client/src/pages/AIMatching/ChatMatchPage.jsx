// ChatMatchPage.jsx — AI Matching Assistant Dedicated View.
//
// Mounted for both Guardian and Tutor dashboards via sidebar navigation /ai-matching.

import { useAuth } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Navbar from '../../components/Navbar'
import ChatMatchWidget from '../../components/Dashboard/ChatMatchWidget'
import './ChatMatchPage.css'

function ChatMatchPage() {
  const { user } = useAuth()
  const role = user ? user.role : 'guardian'

  return (
    <div className="chat-match-page-layout">
      {user ? <Sidebar role={role} /> : <Navbar />}

      <main className={`chat-match-page-main ${user ? 'with-sidebar' : 'full-width'}`}>
        <div className="chat-match-page-content">
          <ChatMatchWidget />
        </div>
      </main>
    </div>
  )
}

export default ChatMatchPage
