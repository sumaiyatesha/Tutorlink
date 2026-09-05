// Testimonials.jsx — Testimonials Section for TutorLink Landing Page.
//
// Displays 3 cards with user quotes, names, roles, and star ratings.
//
// TODO: Placeholder content, replace with real testimonials API/data in future

import Badge from '../../components/Badge'
import './Testimonials.css'

function Testimonials() {
  // TODO: Placeholder content, replace with real testimonials API/data in future
  const testimonials = [
    {
      id: 1,
      name: 'Rahim Ahmed',
      role: 'Guardian — Dhaka',
      quote:
        'Finding a qualified Physics tutor for my HSC examinee was quick and reliable through TutorLink. The background verification gave us great confidence.',
      rating: '⭐⭐⭐⭐⭐',
      initials: 'R',
    },
    {
      id: 2,
      name: 'Sumaiya Akter',
      role: 'Tutor — University of Dhaka',
      quote:
        'As a student at DU, TutorLink helped me find 3 flexible tuition jobs close to my hall. The application process is seamless!',
      rating: '⭐⭐⭐⭐⭐',
      initials: 'S',
    },
    {
      id: 3,
      name: 'Nusrat Jahan',
      role: 'Guardian — Uttara, Dhaka',
      quote:
        'The AI matching system recommended tutors who perfectly matched my child’s learning speed in Mathematics. Highly recommended platform!',
      rating: '⭐⭐⭐⭐⭐',
      initials: 'N',
    },
  ]

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        
        {/* Section Header */}
        <div className="testimonials-header">
          <Badge variant="primary" icon="💬">
            Success Stories
          </Badge>
          <h2>Loved by Guardians & Tutors</h2>
          <p>Read what our community has to say about their TutorLink experience</p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <div key={item.id} className="testimonial-card">
              <div className="quote-icon">“</div>
              <p className="testimonial-text">{item.quote}</p>
              
              <div className="testimonial-author">
                <div className="author-avatar">{item.initials}</div>
                <div>
                  <h4 className="author-name">{item.name}</h4>
                  <p className="author-role">{item.role}</p>
                </div>
                <div className="rating-stars">{item.rating}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Testimonials
