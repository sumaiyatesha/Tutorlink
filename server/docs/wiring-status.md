# TutorLink Codebase Wiring & Feature Status Audit

**Date:** August 28, 2026  
**Audit Scope:** `/server` (Django REST Framework) & `/client` (React + Vite)

---

## Executive Summary Matrix

| Phase | Feature / Feature Group | Status | Backend Endpoints | Frontend Integration |
|---|---|:---:|---|---|
| **Phase 1** | Guardian Profile | ✅ Working | `GET/PUT/PATCH /api/guardian/profile/` | Wired in `ProfilePage.jsx` |
| | Tuition Posts (List & Detail) | ✅ Working | `GET/POST /api/tuition-posts/`, `GET/PUT/DELETE /api/tuition-posts/:id/` | `BrowseJobs.jsx` & `JobDetail.jsx` call `GET` |
| | Create Tuition Post Page | ❌ Stubbed | `POST /api/tuition-posts/` exists | `/guardian/post-tuition` routes to `PlaceholderPage` |
| | My Tuition Posts Page | ❌ Stubbed | `GET /api/tuition-posts/` exists | `/guardian/posts` routes to `PlaceholderPage` |
| **Phase 2** | Tutor Profile | ✅ Working | `GET/PUT/PATCH /api/tutor/profile/` | Wired in `ProfilePage.jsx` |
| | Apply for Tuition Post | ✅ Working | `POST /api/applications/` | Wired in `JobDetail.jsx` ("Apply Now") |
| | Tutor Dashboard Summary | ✅ Working | Uses `GET /api/applications/` & `GET /api/tutor/profile/` | Real metrics in `TutorDashboard.jsx` |
| | My Applications Page | ❌ Stubbed | `GET /api/applications/` exists | `/tutor/applications` routes to `PlaceholderPage` |
| | Real CV File Upload | ❌ Stubbed | Only text field `cv_name` on profile | Text input on `ProfilePage.jsx`, no file storage |
| **Phase 3** | Guardian Review Applicants | ⚠️ Partial | `GET /api/applications/` returns applicants | `GuardianApplicants.jsx` reads API; status updates are local state only |
| | Applicant Status Update (Accept/Reject) | ❌ Stubbed | No backend endpoint for application status update | `GuardianApplicants.jsx` (`handleUpdateStatus` local state only) |
| | Favorites / Bookmarks | ❌ Stubbed | No backend endpoint exists | `JobDetail.jsx` button has `TODO`; `/guardian/favorites` is `PlaceholderPage` |
| | Tutor Reviews / Ratings | ❌ Stubbed | No backend models/endpoints exist | No UI components exist |
| | Hiring Workflow | ❌ Stubbed | No backend models/endpoints exist | No UI components exist |
| **Phase 4** | Guest Browsing & Location Filter | ✅ Working | `GET /api/tuition-posts/?location=` | `LandingPage.jsx`, `BrowseJobs.jsx`, `JobDetail.jsx` |
| | Notifications System | ❌ Stubbed | No backend endpoints exist | No UI components exist |
| **Phase 5** | AI Post Generator | ❌ Stubbed | No backend endpoints exist | Copy in `Hero.jsx` only |
| | AI Tutor Recommendation | ❌ Stubbed | No backend endpoints exist | Copy in `Hero.jsx` only |
| | AI CV Skill Extraction | ❌ Stubbed | No backend endpoints exist | Copy in `Hero.jsx` only |
| **Phase 6** | Django Admin Console | ✅ Working | Standard Django `/admin/` | Linked from `AdminDashboard.jsx` |
| | Custom Admin Panel & Metrics | ❌ Stubbed | No REST API endpoints exist | `AdminDashboard.jsx` uses hardcoded mock numbers |
| | Admin Analytics Page | ❌ Stubbed | No REST API endpoints exist | `/admin/analytics` routes to `PlaceholderPage` |
| **Phase 7** | Subscription & Payments | ❌ Stubbed | No backend endpoints exist | `/subscription` & `/tutor/payment` route to `PlaceholderPage` |

---

## Phase-by-Phase Detailed Breakdown

### Phase 1: Guardian Profile & Tuition Posts
* **Backend Endpoints:**
  * `GET /api/guardian/profile/` — **✅ Fully Working** (returns `GuardianProfile` model data with phone, location, latitude, longitude).
  * `PUT /api/guardian/profile/` & `PATCH /api/guardian/profile/` — **✅ Fully Working** (updates guardian profile fields and geolocation coordinates).
  * `GET /api/tuition-posts/` — **✅ Fully Working** (lists posts ordered by creation date, supports `?location=` filtering, calculates `distance_km` via Haversine formula relative to user coordinates).
  * `POST /api/tuition-posts/` — **✅ Fully Working** (creates new `TuitionPost`, attaches requesting user as `guardian`, and auto-sets coordinates from profile).
  * `GET /api/tuition-posts/<int:pk>/` — **✅ Fully Working** (retrieves single tuition post detail).
  * `PUT /api/tuition-posts/<int:pk>/` & `DELETE /api/tuition-posts/<int:pk>/` — **✅ Fully Working** (updates or deletes tuition post).
* **Frontend Component Wiring:**
  * `ProfilePage.jsx`: **✅ Fully Working** (calls `GET/PUT /api/guardian/profile/` and uses `navigator.geolocation` for latitude/longitude capture).
  * `BrowseJobs.jsx`: **✅ Fully Working** (calls `GET /api/tuition-posts/` with fallback to `SAMPLE_TUITION_POSTS` if DB is empty; filters by district & query).
  * `JobDetail.jsx`: **✅ Fully Working** (calls `GET /api/tuition-posts/:id/` and displays 3-column student information grid).
  * `GuardianDashboard.jsx`: **⚠️ Partial** (calls `GET /api/tuition-posts/` to calculate active post metrics and bar chart data).
  * `/guardian/post-tuition` route: **❌ Stubbed** (routes to `PlaceholderPage`).
  * `/guardian/posts` route: **❌ Stubbed** (routes to `PlaceholderPage`).
* **Endpoint Mismatches:**
  * `POST /api/tuition-posts/` exists on backend, but frontend `/guardian/post-tuition` uses `PlaceholderPage` instead of a creation form.
  * `PUT` and `DELETE` endpoints for `/api/tuition-posts/:id/` exist on backend, but are never called from frontend.

---

### Phase 2: Tutor Profile / CV / Applications
* **Backend Endpoints:**
  * `GET /api/tutor/profile/` — **✅ Fully Working** (returns `TutorProfile` data: bio, subjects, cv_name, teaching_preferences, location, phone, latitude, longitude, `distance_km`).
  * `PUT /api/tutor/profile/` & `PATCH /api/tutor/profile/` — **✅ Fully Working** (updates tutor profile).
  * `GET /api/applications/` — **✅ Fully Working** (returns `Application` list filtered by user role; for tutors, returns applications submitted by the tutor with post info & distance).
  * `POST /api/applications/` — **✅ Fully Working** (creates `Application` linking tutor to `TuitionPost`).
* **Frontend Component Wiring:**
  * `ProfilePage.jsx`: **✅ Fully Working** (calls `GET/PUT /api/tutor/profile/` for tutor bio, subjects, preferences, cv_name, coordinates).
  * `JobDetail.jsx`: **✅ Fully Working** (calls `POST /api/applications/` when tutor clicks "Apply Now").
  * `TutorDashboard.jsx`: **✅ Fully Working** (calls `GET /api/applications/` to compute pending/accepted/rejected counts and render Recharts bar & donut charts; calls `GET /api/tutor/profile/` for profile completeness & CV status).
  * `/tutor/applications` route: **❌ Stubbed** (routes to `PlaceholderPage`).
  * CV Upload: **❌ Stubbed** (frontend only provides text field `cv_name`; no backend file storage/upload endpoint exists).
* **Endpoint Mismatches:**
  * `GET /api/applications/` exists on backend and is used by `TutorDashboard.jsx`, but the dedicated page `/tutor/applications` routes to `PlaceholderPage`.

---

### Phase 3: Guardian Reviewing Applicants / Hiring / Reviews / Favorites
* **Backend Endpoints:**
  * `GET /api/applications/` — **⚠️ Partial** (returns applications for posts created by the requesting guardian `Application.objects.filter(post__guardian=user)`).
  * Application Status Update (Accept/Reject): **❌ Missing** (no `PATCH/PUT /api/applications/:id/` endpoint exists; `ApplicationListCreateView` does not support updating application status).
  * Favorites / Bookmarks API: **❌ Missing** (no models or endpoints exist).
  * Reviews & Ratings API: **❌ Missing** (no models or endpoints exist).
  * Hiring / Contract API: **❌ Missing** (no models or endpoints exist).
* **Frontend Component Wiring:**
  * `GuardianDashboard.jsx`: **⚠️ Partial** (calls `GET /api/applications/` for applicant counts and accepted vs pending donut chart).
  * `GuardianApplicants.jsx` (`/guardian/applicants`): **⚠️ Partial** (calls `GET /api/applications/` with fallback to hardcoded mock applicants; Accept/Reject buttons only update local React state `handleUpdateStatus` because no backend update endpoint exists).
  * `JobDetail.jsx` ("Bookmark Job" button): **❌ Stubbed** (local state toggle only; contains `TODO: Wire up bookmark favorite endpoint once backend endpoint exists`).
  * `/guardian/favorites` route: **❌ Stubbed** (routes to `PlaceholderPage`).
  * Reviews & Hiring UI: **❌ Stubbed** (no components exist).
* **Endpoint Mismatches:**
  * Frontend `GuardianApplicants.jsx` attempts to accept or reject applicants, but no backend endpoint exists to save application status changes.
  * Frontend includes bookmark buttons and favorite routes, but backend has no bookmarks/favorites API.

---

### Phase 4: Notifications & Guest Browsing / Search
* **Backend Endpoints:**
  * `GET /api/tuition-posts/?location=` — **✅ Fully Working** (allows unauthenticated guest read access with `IsAuthenticatedOrReadOnly` permission and location query filtering).
  * Notifications API (`/api/notifications/`): **❌ Missing** (no models or endpoints exist).
* **Frontend Component Wiring:**
  * Public Guest Browsing (`LandingPage.jsx`, `Hero.jsx`, `BrowseJobs.jsx`, `JobDetail.jsx`): **✅ Fully Working** (guests can search, view job cards, filter by Bangladeshi districts, and view job details without logging in).
  * Job Search by ID / Keyword (`BrowseJobs.jsx`): **✅ Fully Working** (filters by ID string like `JOB-0001`, subject, title, or location).
  * Notifications UI: **❌ Stubbed** (no notifications dropdown, badge, or page exists).
* **Endpoint Mismatches:**
  * None for guest browsing. Notifications are completely absent on both backend and frontend.

---

### Phase 5: AI Features (Post Generator, Tutor Recommendation, CV Skill Extraction)
* **Backend Endpoints:**
  * AI Post Generator (`/api/ai/generate-post/`): **❌ Missing**.
  * AI Tutor Recommendation (`/api/ai/recommend-tutors/`): **❌ Missing**.
  * AI CV Skill Extraction (`/api/ai/extract-cv/`): **❌ Missing**.
* **Frontend Component Wiring:**
  * `Hero.jsx`: Marketing text mentions "✨ AI-Powered Tuition Marketplace" and "⚡ AI Smart Match".
  * AI Functionality / UI Components: **❌ Stubbed** (no AI tools, forms, buttons, or API calls exist anywhere in the code).
* **Endpoint Mismatches:**
  * Feature exists purely as landing page promotional text; zero backend or frontend logic is implemented.

---

### Phase 6: Admin Panel & Analytics
* **Backend Endpoints:**
  * Django Admin Panel (`http://localhost:8000/admin/`): **✅ Fully Working** (configured via `accounts/admin.py` with custom `UserAdmin` displaying user role filters).
  * REST API Admin Analytics (`/api/admin/analytics/`): **❌ Missing**.
* **Frontend Component Wiring:**
  * `AdminDashboard.jsx` (`/dashboard/admin`): **⚠️ Partial** (renders welcome banner and link to Django Admin `http://localhost:8000/admin/`, but metric cards display hardcoded static values: 12 users, 3 pending verification, 0 reports).
  * `/admin/analytics` route: **❌ Stubbed** (routes to `PlaceholderPage`).
* **Endpoint Mismatches:**
  * `AdminDashboard.jsx` shows system metrics, but reads no backend API endpoints.

---

### Phase 7: Subscription (Mock)
* **Backend Endpoints:**
  * Subscription / Payment API (`/api/subscriptions/`): **❌ Missing**.
* **Frontend Component Wiring:**
  * `/subscription` route: **❌ Stubbed** (routes to `PlaceholderPage`).
  * `/tutor/payment` route: **❌ Stubbed** (routes to `PlaceholderPage`).
* **Endpoint Mismatches:**
  * Completely unbacked on both server and client.

---

## Detailed Summary of API Mismatches

### 1. Endpoints Implemented on Backend but Uncalled or Partially Called on Frontend
| Backend Endpoint | Backend Method | Status | Frontend Behavior |
|---|---|---|---|
| `/api/tuition-posts/` | `POST` | Working (Creates post) | `/guardian/post-tuition` renders `PlaceholderPage` instead of a creation form |
| `/api/tuition-posts/:id/` | `PUT`, `DELETE` | Working (Updates/Deletes post) | Never called by any component in frontend |
| `/api/applications/` | `GET` | Working (Lists applications) | Used by `TutorDashboard.jsx` and `GuardianApplicants.jsx`, but `/tutor/applications` page uses `PlaceholderPage` |

### 2. Frontend Features Missing Backend Endpoints
| Frontend Feature | Affected Component | Required Backend Endpoint | Current Frontend Behavior |
|---|---|---|---|
| Applicant Accept/Reject | `GuardianApplicants.jsx` | `PATCH /api/applications/:id/` | Updates local React state only; changes lost on refresh |
| Post Tuition Requirement | `/guardian/post-tuition` | Form UI for `POST /api/tuition-posts/` | Renders `PlaceholderPage` |
| View My Tuition Posts | `/guardian/posts` | UI for `GET /api/tuition-posts/` | Renders `PlaceholderPage` |
| View My Applications | `/tutor/applications` | UI for `GET /api/applications/` | Renders `PlaceholderPage` |
| Bookmark / Favorite Job | `JobDetail.jsx`, `/guardian/favorites` | `POST/GET /api/favorites/` | Local state toggle only / `PlaceholderPage` |
| Real CV File Upload | `ProfilePage.jsx` | `POST /api/tutor/upload-cv/` | Text field `cv_name` only |
| Platform Analytics | `AdminDashboard.jsx`, `/admin/analytics` | `GET /api/admin/analytics/` | Static hardcoded card values / `PlaceholderPage` |
| Tutor Reviews & Ratings | Landing / Profile | `GET/POST /api/reviews/` | Non-existent |
| Notifications System | Top Bar / Nav | `GET /api/notifications/` | Non-existent |
| AI Generator / Match / Extract | Forms / Prompts | `/api/ai/*` | Landing page copy only |
| Subscriptions & Payments | `/subscription`, `/tutor/payment` | `/api/subscriptions/` | Renders `PlaceholderPage` |
