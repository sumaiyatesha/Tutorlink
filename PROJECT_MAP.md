# TutorLink — Complete Project File Map & Architectural Defense Guide

> **Prepared for Project Defense / Final Year Viva**
> **Tech Stack:** Django REST Framework (Backend) + React / Vite / CSS Modules & Custom Tokens (Frontend) + Google Gemini API (AI Matchmaking & LLM Tools) + SQLite (Relational DB) + JWT Authentication

---

## Part 1: Backend Architecture (`/server`)

The backend is built with Django and Django REST Framework (DRF), following a modular, app-based architecture. Data models, API views, serializers, and business logic are cleanly separated across distinct domain apps.

```
server/
├── manage.py                          # Django CLI entrypoint for running migrations, dev server, and management commands.
├── db.sqlite3                         # Local SQLite development database storing relational records.
├── .env                               # Environment variables (SECRET_KEY, GEMINI_API_KEY, DEBUG, ALLOWED_HOSTS).
├── tutorlink_backend/                 # Core project configuration package.
│   ├── __init__.py                    # Marks the directory as a Python package.
│   ├── settings.py                    # Global Django settings (installed apps, middleware, database, JWT, CORS, media roots).
│   ├── urls.py                        # Root URL dispatcher routing traffic to app-specific URL configurations.
│   ├── wsgi.py                        # WSGI entrypoint for synchronous production web server deployment.
│   └── asgi.py                        # ASGI entrypoint for asynchronous event-driven server protocols.
│
├── accounts/                          # Primary app for Users, Profiles, Tuition Posts, Applications, Reviews, Favorites, & Notifications.
│   ├── admin.py                       # Django Admin configuration for managing custom Users and Roles.
│   ├── apps.py                        # App configuration class registering the accounts application.
│   ├── models.py                      # Database models: User, GuardianProfile, TutorProfile, TuitionPost, Application, Notification, Favorite, Review.
│   ├── serializers.py                 # DRF serializers converting models to/from JSON with dynamic fields (distance_km, ratings, badges).
│   ├── views.py                       # API Class-Based Views handling Auth, Profiles, Post CRUD, Application workflows, Reviews, & Analytics.
│   ├── urls.py                        # Endpoint routes for /api/auth/, /api/tuition-posts/, /api/applications/, /api/reviews/, etc.
│   ├── utils.py                       # Helper functions including spherical Haversine distance calculation and district coordinates.
│   └── migrations/                    # Database migration history files tracking relational schema evolution.
│
├── ai/                                # Google Gemini AI integration app for intelligent matchmaking and automation.
│   ├── apps.py                        # App configuration registering the AI module.
│   ├── models.py                      # AIInteraction model for auditing and logging all LLM prompts and completions.
│   ├── serializers.py                 # Serializer for viewing and inspecting AI interactions.
│   ├── views.py                       # LLM endpoints: Post Generator, Tutor Recommender, CV Skill Parser, and Natural Language Chat Match.
│   ├── urls.py                        # Endpoint routes for /api/ai/generate-post/, /api/ai/recommend-tutors/, /api/ai/chat-match/, etc.
│   └── migrations/                    # Database migration history for AI audit tables.
│
└── subscriptions/                     # Monetization module handling Subscription Plans, Active User Subscriptions, and Tutor Commissions.
    ├── apps.py                        # App configuration registering the subscriptions module.
    ├── models.py                      # Database models: SubscriptionPlan, Subscription (mock checkout), and TutorCommission (15% hire fee).
    ├── serializers.py                 # Serializers formatting subscription tiers, payment receipts, and tutor commission ledger.
    ├── views.py                       # Views for plan listing, user subscription status, simulated checkout, cancellation, and commission summaries.
    ├── urls.py                        # Endpoint routes for /api/subscriptions/plans/, /api/subscriptions/subscribe/, /api/tutor/commissions/, etc.
    └── migrations/                    # Database migration files including initial seed data for Guardian and Tutor subscription plans.
```

---

### Backend App-by-App Breakdown (For Viva Explanations)

#### 1. Core & Auth (`tutorlink_backend` & `accounts`)
- **`accounts/models.py` -> `User`**: Extends Django's `AbstractUser` with a custom `role` field (`'guardian'`, `'tutor'`, `'admin'`). Uses JWT tokens for stateless authentication.
- **`accounts/models.py` -> `GuardianProfile` & `TutorProfile`**: One-to-one profile tables linked to the user. Store contact details, bio, subjects, CV file attachments, verification status, and geographical coordinates (latitude/longitude).
- **`accounts/views.py` -> `RegisterView`, `MeView`**: Handles signup with automated profile creation and retrieves the authenticated user's session data.

#### 2. Tuition Posts & Job Board (`accounts`)
- **`accounts/models.py` -> `TuitionPost`**: Stores guardian-posted requirements (subject, class level, curriculum, salary, schedule, location, coordinates, status `'open'` / `'closed'`).
- **`accounts/views.py` -> `TuitionPostListCreateView`, `TuitionPostDetailView`**: Allows public/tutor browsing of open posts, filtering by district/query, guardian post creation, and owner-only editing (`IsOwnerOrReadOnly`).
- **`accounts/serializers.py` -> `TuitionPostSerializer`**: Dynamically computes `distance_km` relative to the viewing user's latitude/longitude using the Haversine formula.

#### 3. Applications & Hiring Flow (`accounts` & `subscriptions`)
- **`accounts/models.py` -> `Application`**: Tracks tutor applications to tuition posts (`status`: `'pending'`, `'accepted'`, `'rejected'`).
- **`accounts/views.py` -> `ApplicationDetailView`**: When a guardian accepts an application:
  1. Updates application status to `'accepted'`.
  2. Automatically closes the tuition post (`post.status = 'closed'`).
  3. Dispatches a real-time database `Notification` to the tutor.
  4. Automatically records a `TutorCommission` obligation (15% of tuition salary) for platform monetization.

#### 4. Reviews & Favorites (`accounts`)
- **`accounts/models.py` -> `Favorite`**: Allows guardians to bookmark qualified tutors for easy access.
- **`accounts/models.py` -> `Review`**: Verified review system requiring the guardian to have hired the tutor (`Application.status == 'accepted'`) before posting a 1–5 star rating and feedback.
- **`accounts/serializers.py` -> `TutorCardSerializer`**: Aggregates average star rating, review count, favorite state, and subscription priority badge.

#### 5. Distance & Geo-Matching (`accounts/utils.py`)
- **`haversine_distance(lat1, lon1, lat2, lon2)`**: Computes true great-circle spherical distance across the Earth's surface in kilometers.
- **`DISTRICT_COORDINATES` & `get_district_coordinates()`**: Built-in coordinate lookup table for all major Bangladeshi districts and Dhaka areas, providing instant fallback geolocation when precise GPS coordinates are omitted.

#### 6. AI Features (`ai`)
- **`ai/views.py` -> `GeneratePostView`**: Uses Google Gemini to generate engaging post titles and structured 3–4 sentence descriptions from brief guardian bullet points.
- **`ai/views.py` -> `RecommendTutorsView`**: Evaluates registered tutors against post requirements, ranks them with AI, and provides a clear match explanation for each candidate.
- **`ai/views.py` -> `ChatMatchView`**: Natural language conversational matchmaking assistant gated to active subscribers. Extracts structured query constraints, queries the relational DB, and formats ranked results with AI rationale.

#### 7. Subscriptions & Platform Monetization (`subscriptions`)
- **`subscriptions/models.py` -> `SubscriptionPlan`**: Pre-seeded pricing tiers (Guardian Monthly @ 30 BDT, Tutor Monthly @ 50 BDT).
- **`subscriptions/models.py` -> `Subscription`**: Active subscription tracking with simulated checkout transaction IDs.
- **`subscriptions/models.py` -> `TutorCommission`**: Platform fee ledger tracking 15% commission owed by hired tutors.

---

## Part 2: Frontend Architecture (`/client`)

The frontend is a single-page application (SPA) built with React and Vite. It utilizes standard CSS custom properties (design tokens) for dark/light themes, responsive navigation, and role-protected routing.

```
client/
├── index.html                         # HTML shell with Google Fonts preloads and root mount point.
├── package.json                       # Client dependencies (React, Lucide icons, React Router, Vite).
├── vite.config.js                     # Vite build tool and development server configuration.
├── docs/
│   └── design-system.md               # Visual design tokens, color palette, typography, and component styling rules.
│
├── public/                            # Static public assets (SVG icons, favicons).
│   ├── favicon.svg                    # Brand favicon icon.
│   └── icons.svg                      # Scalable vector graphics sprite sheet.
│
└── src/                               # Application source code.
    ├── main.jsx                       # App bootstrap entry point mounting React root onto DOM.
    ├── App.jsx                        # Root router configuration defining all public, authenticated, and role-based routes.
    ├── AuthContext.jsx                # Global React context managing JWT tokens, user login/logout, role, and profile state.
    ├── ProtectedRoute.jsx             # Route guard component restricting pages based on authentication and user roles.
    ├── index.css                      # Global design system stylesheet containing CSS variables, themes, reset, and typography tokens.
    ├── PlaceholderPage.jsx            # Fallback stub page for work-in-progress routes.
    │
    ├── assets/                        # Static bundled image assets.
    │   ├── hero.png                   # High-resolution hero illustration for landing page.
    │   ├── react.svg                  # React framework logo.
    │   └── vite.svg                   # Vite bundler logo.
    │
    ├── components/                    # Reusable UI component library.
    │   ├── Badge.jsx / .css           # Configurable status pill badge (Open, Closed, Pending, Accepted, Priority Pro).
    │   ├── Card.jsx / .css            # Glassmorphic card container with hover elevations.
    │   ├── EmptyState.jsx / .css      # Standardized zero-data display with icon, title, description, and action button.
    │   ├── Footer.jsx / .css          # Global site footer with links, copyright, and platform metadata.
    │   ├── LoadingSpinner.jsx / .css  # Animated loading indicator for async API operations.
    │   ├── Navbar.jsx / .css          # Top navigation bar with dynamic auth links, role switches, and mobile drawer.
    │   ├── NotificationBell.jsx / .css # Real-time notification bell dropdown with unread badge and mark-as-read triggers.
    │   │
    │   └── Dashboard/                 # Dashboard-specific composite widgets.
    │       ├── Sidebar.jsx / .css     # Unified dashboard sidebar navigation adapting dynamically to Guardian, Tutor, or Admin.
    │       ├── DashboardStatCard.jsx / .css # Metric counter card with icon, title, value, and trend indicator.
    │       ├── DashboardChart.jsx / .css    # Visual SVG/CSS bar chart displaying weekly signup analytics.
    │       ├── JobCard.jsx / .css     # Tuition post card displaying subject, salary, location, distance badge, and apply trigger.
    │       ├── JobFilterPanel.jsx / .css    # Search and multi-criteria filter sidebar (subject, class, salary range, location).
    │       └── ChatMatchWidget.jsx / .css   # Embedded dashboard launcher widget for the AI Chat Match assistant.
    │
    └── pages/                         # Route-level page views organized by feature domain.
        ├── Landing/                   # Public landing page sections.
        │   ├── LandingPage.jsx / .css # Main landing page composing Hero, StatsBar, Categories, HowItWorks, Testimonials, and CTA.
        │   ├── Navbar.jsx / .css      # Dedicated landing page transparent-to-solid sticky navbar.
        │   ├── Hero.jsx / .css        # Hero section with headline, CTA buttons, and feature badges.
        │   ├── StatsBar.jsx / .css    # Live platform stats counter bar (Tutors, Guardinas, Matches).
        │   ├── CategoryGrid.jsx / .css# Subject category browser cards (Science, Arts, English Medium, Math, Coding).
        │   ├── HowItWorks.jsx / .css  # 3-step visual workflow explanation for guardians and tutors.
        │   ├── Testimonials.jsx / .css# Social proof testimonial carousel cards from parents and tutors.
        │   ├── BecomeTutorCTA.jsx / .css # High-conversion bottom call-to-action banner for new tutors.
        │   └── Footer.jsx / .css      # Landing page footer with newsletter and links.
        │
        ├── HowItWorks/
        │   └── HowItWorksPage.jsx / .css # Standalone comprehensive workflow guide page.
        │
        ├── Profile/
        │   └── ProfilePage.jsx / .css # User profile management: edit bio, subjects, phone, location GPS, and CV upload.
        │
        ├── Subscription/
        │   └── SubscriptionPage.jsx / .css # Monetization & billing portal: view plan perks, simulated bKash/Nagad checkout, and invoice.
        │
        ├── AIMatching/
        │   └── ChatMatchPage.jsx / .css # Full-page conversational AI Matching Assistant with subscription verification guard.
        │
        ├── GuardianDashboard/
        │   ├── GuardianDashboard.jsx / .css # Main guardian overview with metric cards, quick post creator, and recent posts.
        │   ├── PostTuition.jsx / .css       # Tuition post creation form with integrated Gemini AI Post Generator.
        │   ├── GuardianPosts.jsx / .css     # Guardian's active and closed tuition posts management list.
        │   ├── GuardianApplicants.jsx / .css# Review tutor applicants with distance calculation, accept/reject, and hire triggers.
        │   └── GuardianFavorites.jsx / .css # Bookmarked tutor profiles collection.
        │
        ├── TutorDashboard/
        │   ├── TutorDashboard.jsx / .css    # Main tutor overview with statistics, commission dues, and quick job recommendations.
        │   ├── BrowseJobs.jsx / .css        # Searchable and filterable job board with distance indicators and quick apply.
        │   ├── JobDetail.jsx / .css         # Comprehensive tuition post details page with one-click application modal.
        │   └── MyApplications.jsx / .css    # Tutor's submitted job applications list with live status tracking.
        │
        ├── TutorBrowse/
        │   ├── BrowseTutors.jsx / .css      # Public and guardian directory of verified tutors with filters and star ratings.
        │   └── TutorDetail.jsx / .css       # Public tutor profile page featuring bio, skills, reviews, and review submission modal.
        │
        └── Admin/
            └── AdminAnalytics.jsx / .css    # System administrator dashboard with user counts, post stats, and signup chart.
```

---

## Part 3: Key Architectural Decisions for Viva Examiners

### 1. How does the Distance Calculation work?
- **Formula:** We implement the mathematical **Haversine formula** in `server/accounts/utils.py`.
- **Reasoning:** Standard Euclidean distance ($\sqrt{\Delta x^2 + \Delta y^2}$) causes large errors over spherical latitude and longitude coordinates. Haversine converts coordinates to radians and calculates the great-circle arc length on a sphere of radius $R = 6371\text{ km}$.
- **Fallback:** If a user does not enable GPS, our backend maps the location string (e.g., "Uttara", "Dhanmondi", "Chittagong") to pre-mapped district coordinates (`DISTRICT_COORDINATES`).

### 2. How is AI Prompt Engineering implemented?
- **Models:** Google Gemini (`gemini-3.6-flash` / `gemini-flash-latest`) integrated via `google-generativeai` in `server/ai/views.py`.
- **Security:** API keys are stored server-side in `.env` and never leaked to the browser.
- **Robustness:** Prompts request strict JSON output. Server-side code includes sanitization (stripping markdown code fences) and fallback heuristic engines in `try/except` blocks so user workflows are never blocked even if the AI API is rate-limited or offline.

### 3. How does the Monetization & Subscription system work?
- **Subscription Model:** Guardians (30 BDT/mo) and Tutors (50 BDT/mo) can subscribe to receive Priority Pro status (top-ranked search results and unlocked AI Chat Match).
- **Simulated Checkout:** Built in `subscriptions/views.py` with mock bKash/Nagad transaction confirmation generating unique audit IDs.
- **Commission Model:** When a guardian accepts a tutor's application, a `TutorCommission` record is automatically created for 15% of the tuition salary.

### 4. How does Authentication and Role-Based Authorization work?
- **JWT (JSON Web Tokens):** `SimpleJWT` issues access and refresh tokens upon login. Tokens are stored in localStorage and passed via `Authorization: Bearer <token>` headers.
- **Frontend Guard:** `ProtectedRoute.jsx` checks authentication and verifies the user's role before rendering private pages.
- **Backend Guard:** Custom permission classes (`IsOwnerOrReadOnly`, `IsAdmin`, `IsTutor`) and queryset filters enforce strict security at the database layer.
