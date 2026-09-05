# TutorLink Data Model Documentation

This document describes all the core database models in TutorLink, their fields, relationships, and business purposes in plain English for project reports and viva defense.

---

## 1. Accounts & Core User Models (`accounts` app)

### 1.1 User (`accounts.models.User`)
Custom user model extending Django's `AbstractUser`.
- **`username`**: Unique login username.
- **`email`**: User's email address.
- **`role`**: Character field defining the user's role on the platform. Choices are:
  - `'guardian'` — Guardians / Parents seeking tutors.
  - `'tutor'` — Qualified tutors looking for tuition jobs.
  - `'admin'` — Platform staff managing operations and analytics.
- **`first_name`**, **`last_name`**: User's personal names.
- **`date_joined`**: Registration timestamp.

---

### 1.2 GuardianProfile (`accounts.models.GuardianProfile`)
Extended profile information for Guardian users.
- **`user`**: One-to-one foreign key linking directly to `User` (`role='guardian'`).
- **`phone`**: Guardian's contact phone number.
- **`location`**: Text description of location / neighborhood (e.g. *"Uttara, Dhaka"*).
- **`latitude`**, **`longitude`**: GPS coordinates used for Haversine distance calculations and location-based tutor matching.

---

### 1.3 TutorProfile (`accounts.models.TutorProfile`)
Extended profile and academic background information for Tutor users.
- **`user`**: One-to-one foreign key linking directly to `User` (`role='tutor'`).
- **`bio`**: Brief biography and summary of teaching experience.
- **`subjects`**: Comma-separated list of subjects the tutor specializes in (e.g. *"Physics, Higher Math, ICT"*).
- **`cv`**: File field storing uploaded PDF CV documents.
- **`cv_name`**: Original filename of the uploaded CV document.
- **`teaching_preferences`**: Preferred tutoring format (e.g. *"In-Person, Online, Both"*).
- **`location`**: District or area of residence.
- **`phone`**: Contact phone number.
- **`latitude`**, **`longitude`**: GPS coordinates for distance sorting and proximity-based job matching.
- **`is_verified`**: Boolean flag indicating whether admin has verified tutor credentials.
- **`available_days`**: JSONField storing a list of weekday strings (e.g. `["Friday", "Saturday", "Monday"]`) when the tutor is available to teach.
- **`expected_salary`**: Integer field representing the tutor's desired monthly tuition rate (BDT/month), used by the AI Matching Assistant to match against guardian budgets.

---

### 1.4 TuitionPost (`accounts.models.TuitionPost`)
Tuition requirement postings published by Guardians.
- **`guardian`**: Foreign key linking to the `User` who created the post.
- **`title`**: Descriptive headline of the requirement (e.g. *"Class 10 Physics & Higher Math Tutor Needed in Uttara"*).
- **`description`**: Detailed requirement summary, expectations, and student needs (can be AI-generated via Gemini or custom written).
- **`subject`**: Subject(s) to be taught.
- **`category`**: Grade level (e.g. *"Class 9-10 (SSC)"*, *"HSC (College)"*, *"Class 1-5 (Primary)"*).
- **`course`**: Curriculum medium (e.g. *"National Curriculum (Bangla)"*, *"English Medium (Edexcel/Cambridge)"*).
- **`days_per_week`**: Frequency of tutoring sessions per week (1 to 7).
- **`preferred_days`**: JSONField storing a list of weekday strings (e.g. `["Friday", "Saturday"]`) preferred by the guardian, used by the AI Matching Assistant to match against tutor availability.
- **`preferred_time`**: Preferred time of day for sessions (e.g. *"5:00 PM"*).
- **`duration`**: Duration per session (e.g. *"1.5 Hours"*).
- **`method`**: Tutoring mode (*'In-Person'*, *'Online'*, *'Both'*).
- **`salary`**: Monthly remuneration offered in BDT (e.g. `8500.00`).
- **`students`**: Number of students (e.g. *"1 Student"*).
- **`preferred_tutor_gender`**: Tutor gender preference (*'Any'*, *'Male'*, *'Female'*).
- **`location`**: Area/neighborhood where tutoring will take place.
- **`latitude`**, **`longitude`**: Coordinates of tuition location for proximity calculations.
- **`status`**: Status of the post (*'open'* or *'closed'*).
- **`created_at`**: Timestamp when the post was created.

---

### 1.5 Application (`accounts.models.Application`)
Application submitted by a Tutor for an open TuitionPost.
- **`tutor`**: Foreign key linking to the applying `User` (`role='tutor'`).
- **`post`**: Foreign key linking to the target `TuitionPost`.
- **`cover_note`**: Introductory message from tutor to guardian.
- **`status`**: Application state (*'pending'*, *'accepted'*, *'rejected'*).
- **`created_at`**: Timestamp when application was submitted.

---

### 1.6 Notification (`accounts.models.Notification`)
User alerts and system notifications.
- **`user`**: Recipient `User`.
- **`message`**: Text content of the notification.
- **`is_read`**: Boolean flag indicating whether the user has seen the alert.
- **`created_at`**: Timestamp.

---

### 1.7 Favorite (`accounts.models.Favorite`)
Bookmark record linking a Guardian to a saved Tutor.
- **`guardian`**: The `User` who bookmarked the tutor.
- **`tutor`**: The `User` tutor being bookmarked.
- **`created_at`**: Timestamp.
- *Constraint:* `unique_together = ('guardian', 'tutor')`.

---

### 1.8 Review (`accounts.models.Review`)
Rating and review submitted by a Guardian after hiring a Tutor.
- **`reviewer`**: The `User` (Guardian) submitting the review.
- **`tutor`**: The `User` (Tutor) receiving the review.
- **`rating`**: Numeric rating from 1 to 5 stars.
- **`comment`**: Feedback text.
- **`created_at`**: Timestamp.

---

## 2. Subscription & Commission Models (`subscriptions` app)

### 2.1 SubscriptionPlan (`subscriptions.models.SubscriptionPlan`)
Pre-configured recurring subscription packages defined in the platform.
- **`name`**: Plan name (e.g. *"Guardian Monthly"*, *"Tutor Monthly"*).
- **`price`**: Monthly price in BDT (e.g. `30.00` for Guardians, `50.00` for Tutors).
- **`role`**: Role constraint (*'guardian'* or *'tutor'*). Unique per role.
- **`description`**: Summary of subscription benefits (Priority Pro badge, unlimited applications, AI Matching Assistant access).

---

### 2.2 Subscription (`subscriptions.models.Subscription`)
Active or cancelled subscription record for a User.
- **`user`**: One-to-one foreign key linking to `User`.
- **`plan`**: Foreign key linking to `SubscriptionPlan`.
- **`payment_method`**: Gateway/method used (*'bkash'*, *'nagad'*, *'card'*).
- **`transaction_id`**: Reference transaction string.
- **`status`**: Current status (*'active'* or *'cancelled'*).
- **`started_at`**: Timestamp when subscription began.
- **`updated_at`**: Timestamp of last modification.

---

### 2.3 TutorCommission (`subscriptions.models.TutorCommission`)
Tracks the platform commission obligation incurred by a tutor upon being hired for a tuition job.
- **`tutor`**: Foreign key linking to the hired `User` (`role='tutor'`).
- **`application`**: Foreign key linking to the accepted `Application`.
- **`tuition_amount`**: The monthly tuition salary agreed upon in the tuition post.
- **`commission_amount`**: 15% platform commission calculated automatically from `tuition_amount` (`tuition_amount * 0.15`).
- **`status`**: Commission payment status (*'pending'* or *'paid'*).
- **`created_at`**: Timestamp when the commission record was created.
- **Plain English Explanation:** This tracks the one-time 15% platform commission a tutor owes after being hired (when a guardian accepts their application), completely separate from their flat monthly Subscription fee. It is generated automatically whenever an application transitions to the *'accepted'* state.

---

## 3. AI Interaction & Auditing Models (`ai` app)

### 3.1 AIInteraction (`ai.models.AIInteraction`)
Audit log recording every invocation of Google Gemini API across the system.
- **`user`**: Foreign key linking to the `User` who triggered the AI request.
- **`type`**: Category of AI interaction:
  - `'post_generator'` — Tuition post title and requirement generation for guardians.
  - `'tutor_recommendation'` — Ranking and match reason generation for tuition posts.
  - `'cv_skill_extraction'` — PDF CV parsing and competency extraction for tutors.
  - `'chat_match_guardian'` / `'chat_match_tutor'` / `'chatbot'` — Natural language AI Matching Assistant searches.
- **`input_text`**: Input query, prompts, or parameters sent to Gemini.
- **`output_text`**: Structured JSON or generated text returned by Gemini.
- **`created_at`**: Timestamp when the AI request was executed.
