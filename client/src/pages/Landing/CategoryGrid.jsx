// CategoryGrid.jsx — Grid of popular subject categories for TutorLink.
//
// Features 6 subject cards with icons and labels.
// Clicking a card navigates to /posts?subject=...

import { Link } from 'react-router-dom'
import Badge from '../../components/Badge'
import './CategoryGrid.css'

function CategoryGrid() {
  const categories = [
    { id: 'math', name: 'Mathematics', icon: '📐', count: '140+ Posts' },
    { id: 'english', name: 'English', icon: '📚', count: '95+ Posts' },
    { id: 'physics', name: 'Physics', icon: '⚡', count: '80+ Posts' },
    { id: 'programming', name: 'Programming', icon: '💻', count: '110+ Posts' },
    { id: 'music', name: 'Music & Arts', icon: '🎵', count: '45+ Posts' },
    { id: 'testprep', name: 'Test Prep', icon: '📝', count: '75+ Posts' },
  ]

  return (
    <section className="category-section">
      <div className="category-container">
        
        {/* Section Header */}
        <div className="category-header">
          <Badge variant="primary" icon="💡">
            Popular Categories
          </Badge>
          <h2>Explore Tuition Subjects</h2>
          <p>Find tutoring opportunities or top tutors across major subjects</p>
        </div>

        {/* Subject Grid */}
        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/posts?subject=${encodeURIComponent(cat.name)}`}
              className="category-card"
            >
              <div className="category-icon-wrapper">
                <span>{cat.icon}</span>
              </div>
              <h3 className="category-title">{cat.name}</h3>
              <span className="category-count">{cat.count}</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}

export default CategoryGrid
