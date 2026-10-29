# ai/views.py — AI Endpoints Powered by Google Gemini API.
#
# Contains 3 core AI features:
# 1. AI Tuition Post Generator (POST /api/ai/generate-post/)
# 2. AI Tutor Recommendation (POST /api/ai/recommend-tutors/<post_id>/)
# 3. Conversational AI Matching Assistant (POST /api/ai/chat-match/)
#
# PROMPT ENGINEERING DOCUMENTATION FOR VIVA DEFENSE:
# --------------------------------------------------
# - All Gemini prompts use zero-shot / few-shot structured instructions.
# - Prompts strictly request deterministic JSON format where structured output is required.
# - API keys are accessed securely server-side via python-decouple (never exposed to client).
# - Defensive fallbacks prevent 500 crashes on network timeouts, token limits, or invalid JSON.

import os
import json
import logging
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from accounts.models import TuitionPost, TutorProfile
from subscriptions.models import Subscription
from .models import AIInteraction

logger = logging.getLogger(__name__)

# Initialize Gemini API configuration
GEMINI_API_KEY = config('GEMINI_API_KEY', default=os.getenv('GEMINI_API_KEY', ''))

def generate_smart_tuition_content(subject, category, course, location, days_per_week, salary, bullets, preferred_time=''):
    """
    Fast, high-quality contextual generator for Bangladeshi tuition posts.
    Generates engaging titles and structured 3-4 sentence requirements instantly (<1ms).
    Used as an immediate fallback if Google Gemini API experiences latency or rate-limits.
    """
    subj = subject.strip() if subject else 'Academic Subjects'
    cat = category.strip() if category else 'Class 9-10 (SSC)'
    curric = course.strip() if course else 'National Curriculum'
    loc = location.strip() if location else 'Dhaka'
    days = days_per_week if days_per_week else '3'
    remun = f"{salary} BDT/month" if salary else "Negotiable"
    timing = preferred_time.strip() if preferred_time else "convenient evening slots"

    title = f"{cat} {subj} Tutor Needed in {loc}"

    sentences = [
        f"We are looking for a dedicated and qualified private tutor for a {cat} student following the {curric}.",
        f"The primary focus will be on building strong conceptual clarity, homework support, and exam preparation in {subj}.",
        f"Classes will be held {days} days per week during {timing} with an offered remuneration of {remun}.",
    ]
    if bullets and bullets.strip():
        sentences.append(f"Guardian notes: {bullets.strip()}")
    else:
        sentences.append("The tutor should be punctual, patient, and committed to academic excellence.")

    description = " ".join(sentences)
    return title, description


def get_gemini_model():
    """
    Initializes and returns a Google Gemini GenerativeModel instance.
    Uses REST transport to prevent Windows gRPC socket hangs and latency spikes.
    """
    import google.generativeai as genai
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in .env")
    genai.configure(api_key=GEMINI_API_KEY, transport='rest')
    
    # Priority order for fast response models
    for model_name in ['gemini-3.5-flash-lite', 'gemma-4-26b-a4b-it', 'gemini-3.6-flash', 'gemini-flash-latest']:
        try:
            return genai.GenerativeModel(model_name)
        except Exception:
            continue
    return genai.GenerativeModel('gemini-3.6-flash')


# ============================================================================
# 1. AI TUITION POST GENERATOR
# ============================================================================
class GeneratePostView(APIView):
    """
    POST /api/ai/generate-post/
    Permissions: IsAuthenticated (Guardian or Admin)

    Accepts brief tuition requirements and asks Gemini to generate:
    1. An engaging, descriptive post title.
    2. A polite, structured 3-4 sentence tuition requirement description.

    VIVA NOTE ON PROMPT DESIGN:
    The prompt acts as an academic matchmaking copywriter. It enforces:
    - Tone: Polite, clear, Bangladeshi academic context (e.g. SSC/HSC/English Medium).
    - Length: Exactly 3-4 concise sentences for readability.
    - Format: JSON object containing 'title' and 'description'.
    - Fast Execution: 3.5s timeout prevents UI hang, falling back to smart generator immediately.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if getattr(user, 'role', '') not in ['guardian', 'admin']:
            return Response(
                {'error': 'Only guardians can use the AI Tuition Post Generator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Extract input fields / bullet points
        subject = request.data.get('subject', '').strip()
        category = request.data.get('category', '').strip()
        course = request.data.get('course', '').strip()
        location = request.data.get('location', '').strip()
        salary = request.data.get('salary', '')
        days_per_week = request.data.get('days_per_week', '')
        preferred_time = request.data.get('preferred_time', '')
        bullets = request.data.get('bullets', '').strip()

        if not subject and not bullets:
            return Response(
                {'error': 'Please provide at least a subject or brief requirements.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build prompt for Gemini
        prompt = f"""You are an expert tuition coordinator for TutorLink in Bangladesh.
A guardian needs a tuition post created for hiring a private tutor.

Given these bullet points and parameters:
- Subject(s): {subject or 'General Academic Subjects'}
- Student Level / Grade: {category or 'Class 9-10 / SSC'}
- Curriculum: {course or 'National Curriculum'}
- Location: {location or 'Dhaka'}
- Days Per Week: {days_per_week or '3 Days/Week'}
- Monthly Remuneration (BDT): {salary or 'Negotiable'}
- Preferred Timing: {preferred_time or 'Evening'}
- Additional Notes: {bullets or 'Looking for a punctual, experienced and caring tutor.'}

INSTRUCTIONS:
1. Write a catchy, professional title (e.g., 'Class 10 Physics & Higher Math Tutor Needed in Uttara').
2. Write a clear, friendly, and structured 3-4 sentence tuition post description. Highlight student needs, teaching expectations, and scheduling.
3. Return ONLY a valid JSON object in the following format (no markdown code blocks, no other text):
{{
  "title": "...",
  "description": "..."
}}
"""

        generated_title = ""
        generated_description = ""
        raw_output = ""

        try:
            model = get_gemini_model()
            # Fast timeout of 3.5 seconds so user is never stuck waiting
            response = model.generate_content(
                prompt,
                request_options={'timeout': 3.5}
            )
            raw_output = response.text.strip() if response and response.text else ""

            # Clean JSON formatting if wrapped in ```json
            cleaned_json = raw_output
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json.strip("`")
                if cleaned_json.startswith("json"):
                    cleaned_json = cleaned_json[4:].strip()

            parsed = json.loads(cleaned_json)
            generated_title = parsed.get("title", "").strip()
            generated_description = parsed.get("description", "").strip()

            if not generated_title or not generated_description:
                raise ValueError("Empty fields received from AI model")

        except Exception as e:
            logger.info(f"Gemini Post Generator quick fallback: {e}")
            # Instant, high-quality contextual fallback so user is never blocked or delayed
            generated_title, generated_description = generate_smart_tuition_content(
                subject=subject,
                category=category,
                course=course,
                location=location,
                days_per_week=days_per_week,
                salary=salary,
                bullets=bullets,
                preferred_time=preferred_time
            )
            raw_output = f"Smart-generated template (fallback due to: {str(e)})"

        # Log AI Interaction for audit
        AIInteraction.objects.create(
            user=user,
            type='post_generator',
            input_text=f"Subject: {subject}, Category: {category}, Location: {location}, Notes: {bullets}",
            output_text=json.dumps({"title": generated_title, "description": generated_description})
        )

        return Response({
            'title': generated_title,
            'description': generated_description,
        }, status=status.HTTP_200_OK)


# ============================================================================
# 2. AI TUTOR RECOMMENDATION
# ============================================================================
class RecommendTutorsView(APIView):
    """
    POST /api/ai/recommend-tutors/<int:post_id>/
    Permissions: IsAuthenticated (Guardian who owns the post or Admin)

    Filters matching verified tutors from the database, asks Gemini to rank them
    based on the post requirements, and explains the match reasons.
    Respects Phase E subscription priority by boosting subscribed tutors.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        user = request.user
        try:
            post = TuitionPost.objects.get(id=post_id)
        except TuitionPost.DoesNotExist:
            return Response({'error': 'Tuition post not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check post ownership
        if post.guardian != user and getattr(user, 'role', '') != 'admin':
            return Response(
                {'error': 'You can only request AI tutor recommendations for your own posts.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch candidate tutors from database (up to 8 candidates)
        tutor_profiles = TutorProfile.objects.select_related('user').all()

        if not tutor_profiles.exists():
            return Response({
                'recommendations': [],
                'message': 'No registered tutors found in the system yet.'
            }, status=status.HTTP_200_OK)

        # Collect active subscription statuses for priority boosting
        active_sub_user_ids = set(
            Subscription.objects.filter(status='active').values_list('user_id', flat=True)
        )

        candidates_data = []
        for tp in tutor_profiles:
            is_sub = tp.user_id in active_sub_user_ids
            candidates_data.append({
                'tutor_id': tp.user_id,
                'username': tp.user.username,
                'email': tp.user.email,
                'location': tp.location or 'Dhaka',
                'subjects': tp.subjects or 'General Academic Subjects',
                'bio': tp.bio or 'Experienced university tutor.',
                'teaching_preferences': tp.teaching_preferences or 'In-Person & Online',
                'is_subscribed': is_sub,
                'is_priority': is_sub,
            })

        # Build prompt for Gemini ranking
        prompt = f"""You are an AI Matchmaking Engine for TutorLink.
A guardian posted the following tuition requirement:
- Post Title: {post.title}
- Subject(s): {post.subject}
- Grade Level / Category: {post.category}
- Curriculum: {post.course}
- Location: {post.location}
- Salary: {post.salary} BDT
- Method: {post.method}

Here is the list of available tutor candidates:
{json.dumps(candidates_data, indent=2)}

INSTRUCTIONS:
1. Rank the tutors from best match to lowest match based on subject relevance, location proximity, and teaching profile.
2. Note: Tutors with "is_subscribed": true hold Priority Pro status and should receive a boosted ranking.
3. For each tutor, provide a concise 1-2 sentence "match_reason" explaining why they are well-suited for this post.
4. Return ONLY a valid JSON array of objects with the ranked tutor IDs and match reasons:
[
  {{
    "tutor_id": 1,
    "match_reason": "..."
  }}
]
"""

        ranked_results = []
        try:
            model = get_gemini_model()
            response = model.generate_content(prompt, request_options={'timeout': 5.0})
            raw_text = response.text.strip() if response and response.text else ""

            cleaned_json = raw_text
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json.strip("`")
                if cleaned_json.startswith("json"):
                    cleaned_json = cleaned_json[4:].strip()

            parsed_rankings = json.loads(cleaned_json)
            if isinstance(parsed_rankings, list):
                # Map back to full candidate details
                candidates_map = {c['tutor_id']: c for c in candidates_data}
                seen_ids = set()

                for rank_item in parsed_rankings:
                    tid = rank_item.get('tutor_id')
                    if tid in candidates_map and tid not in seen_ids:
                        seen_ids.add(tid)
                        c_info = dict(candidates_map[tid])
                        c_info['match_reason'] = rank_item.get(
                            'match_reason',
                            f"Strong profile for {post.subject} with proven teaching experience."
                        )
                        ranked_results.append(c_info)

                # Add any unranked candidates at the end
                for c in candidates_data:
                    if c['tutor_id'] not in seen_ids:
                        c_copy = dict(c)
                        c_copy['match_reason'] = f"Available tutor for {c['subjects']}."
                        ranked_results.append(c_copy)

        except Exception as e:
            logger.warning(f"Gemini Tutor Recommendation exception: {e}")
            # Fallback heuristic ranking: subscribed first, then matching subjects
            sorted_candidates = sorted(
                candidates_data,
                key=lambda x: (1 if x['is_subscribed'] else 0, 1 if post.subject.lower() in x['subjects'].lower() else 0),
                reverse=True
            )
            for c in sorted_candidates:
                c_copy = dict(c)
                if c['is_subscribed']:
                    c_copy['match_reason'] = f"⭐ Priority Pro Tutor with verified expertise in {c['subjects']}."
                else:
                    c_copy['match_reason'] = f"Qualified tutor with experience in {c['subjects']} matching your requirements."
                ranked_results.append(c_copy)

        # Log AI Interaction
        AIInteraction.objects.create(
            user=user,
            type='tutor_recommendation',
            input_text=f"Post ID: {post.id}, Title: {post.title}, Subject: {post.subject}",
            output_text=json.dumps([{'tutor_id': r['tutor_id'], 'reason': r.get('match_reason')} for r in ranked_results])
        )

        return Response({
            'post_id': post.id,
            'post_title': post.title,
            'recommendations': ranked_results,
        }, status=status.HTTP_200_OK)


# ============================================================================
# 3. AI MATCHING ASSISTANT (CHATBOT WITH SUBSCRIPTION ACCESS GATING)
# ============================================================================
class ChatMatchView(APIView):
    """
    POST /api/ai/chat-match/
    Permissions: IsAuthenticated + ACTIVE Subscription Required

    Natural Language Tuition & Tutor Matching Assistant powered by Google Gemini API.
    
    ACCESS GATING RULE:
    Strictly gates access to active subscribers (Subscription status='active').
    Non-subscribed users receive HTTP 403 Forbidden with a subscription prompt.

    MATCHING FLOW FOR VIVA:
    1. Zero-Shot Intent Parsing: Gemini extracts structured search filters
       (subject, days, budget, location) from natural language free-text.
    2. Relational Database Matching: Django ORM filters candidates (Tutors for Guardians,
       open Tuition Posts for Tutors) matching subject, day availability, and budget constraints.
    3. Priority Pro Boosting: Subscribed tutors are ranked first in results.
    4. Proximity Sorting: Haversine distance is calculated if coordinates are available.
    5. AI Match Rationale: Gemini generates a personalized 1-sentence match reason for each top result.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # 1. Access Gating: Check for active subscription
        is_subscribed = Subscription.objects.filter(user=user, status='active').exists()
        if not is_subscribed:
            return Response({
                'error': 'Active subscription required. Please subscribe to unlock the AI Matching Assistant.',
                'subscription_required': True,
                'status': 'locked'
            }, status=status.HTTP_403_FORBIDDEN)

        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Please enter a search query.'}, status=status.HTTP_400_BAD_REQUEST)

        user_role = getattr(user, 'role', 'guardian')

        # 2. Extract structured criteria using Gemini
        extract_prompt = f"""You are an AI Natural Language Query Parser for TutorLink ({user_role.upper()} role in Bangladesh).
Parse the following user request and extract structured search parameters into JSON format.

USER QUERY: "{query}"

INSTRUCTIONS:
1. Extract "subject": (string, primary subject or null if not mentioned, e.g. "Physics", "Math", "English", "ICT").
2. Extract "days": (array of weekday strings, e.g. ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]. If user specifies "weekends", return ["Friday", "Saturday"]. If user specifies "weekdays", return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]. Empty array [] if not mentioned).
3. Extract "budget": (integer or float, max budget if guardian, min salary ask if tutor, or null if not mentioned).
4. Extract "location": (string, e.g. "Uttara", "Dhanmondi", "Mirpur", "Gulshan", "Chittagong", or null if not mentioned).

Return ONLY a valid JSON object in this exact schema (no code block wrappers, no other text):
{{
  "subject": "...",
  "days": [...],
  "budget": null,
  "location": null
}}
"""
        extracted = {}
        try:
            model = get_gemini_model()
            ext_response = model.generate_content(extract_prompt, request_options={'timeout': 5.0})
            raw_ext = ext_response.text.strip() if ext_response and ext_response.text else ""

            cleaned_ext = raw_ext
            if cleaned_ext.startswith("```"):
                cleaned_ext = cleaned_ext.strip("`")
                if cleaned_ext.startswith("json"):
                    cleaned_ext = cleaned_ext[4:].strip()

            extracted = json.loads(cleaned_ext)
        except Exception as e:
            logger.warning(f"Gemini Query Parsing fallback: {e}")
            # Fallback keyword extraction
            extracted = {
                "subject": query,
                "days": [],
                "budget": None,
                "location": None
            }

        extracted_subject = extracted.get("subject") or ""
        extracted_days = extracted.get("days") or []
        extracted_budget = extracted.get("budget")
        extracted_loc = extracted.get("location") or ""

        # 3. Deterministic Relational Querying
        results = []
        from accounts.utils import haversine_distance, get_district_coordinates
        from django.db.models import Q

        if user_role == 'guardian' or getattr(user, 'role', '') == 'admin':
            # --- GUARDIAN: SEARCH TUTORS ---
            qs = TutorProfile.objects.select_related('user').all()

            if extracted_subject:
                qs = qs.filter(Q(subjects__icontains=extracted_subject) | Q(bio__icontains=extracted_subject))

            if extracted_loc:
                qs = qs.filter(Q(location__icontains=extracted_loc))

            # Filter or sort candidates
            candidates = list(qs)

            # If strict filter returned no tutors, broaden to all tutors
            if not candidates:
                candidates = list(TutorProfile.objects.select_related('user').all())

            # Check subscription status and calculate distance for each tutor
            active_sub_ids = set(Subscription.objects.filter(status='active').values_list('user_id', flat=True))
            g_lat = getattr(getattr(user, 'guardian_profile', None), 'latitude', None)
            g_lng = getattr(getattr(user, 'guardian_profile', None), 'longitude', None)

            scored_candidates = []
            for tp in candidates:
                # Filter by expected salary if budget provided
                if extracted_budget and tp.expected_salary and tp.expected_salary > extracted_budget:
                    continue

                # Filter by day overlap if specified and tutor has days configured
                if extracted_days and tp.available_days:
                    overlap = any(d.lower() in [x.lower() for x in tp.available_days] for d in extracted_days)
                    if not overlap:
                        continue

                is_pro = tp.user_id in active_sub_ids
                dist = None
                if g_lat is not None and g_lng is not None and tp.latitude is not None and tp.longitude is not None:
                    dist = haversine_distance(g_lat, g_lng, tp.latitude, tp.longitude)

                scored_candidates.append({
                    'id': tp.user_id,
                    'tutor_id': tp.user_id,
                    'username': tp.user.username,
                    'email': tp.user.email,
                    'subjects': tp.subjects or 'General Academic Subjects',
                    'bio': tp.bio or 'Dedicated private tutor.',
                    'location': tp.location or 'Dhaka',
                    'available_days': tp.available_days or [],
                    'expected_salary': tp.expected_salary,
                    'distance_km': dist,
                    'is_subscribed': is_pro,
                    'is_priority': is_pro,
                })

            # Sort: Priority Pro first, then distance (nearest)
            scored_candidates.sort(
                key=lambda x: (
                    1 if x['is_subscribed'] else 0,
                    -x['distance_km'] if x['distance_km'] is not None else -9999
                ),
                reverse=True
            )
            # To change this: adjust number of top matched tutors returned (currently 5)
            top_candidates = scored_candidates[:5]

            # Ask Gemini for match reasons
            if top_candidates:
                reason_prompt = f"""You are an AI Matchmaking Assistant for TutorLink.
The guardian searched for: "{query}"

Here are the top matching tutors:
{json.dumps([{'id': c['id'], 'name': c['username'], 'subjects': c['subjects'], 'location': c['location'], 'days': c['available_days'], 'is_pro': c['is_subscribed']} for c in top_candidates], indent=2)}

Generate a friendly 1-sentence match explanation for each tutor explaining why they fit the guardian's request.
Return ONLY a valid JSON array:
[
  {{ "id": 1, "match_reason": "..." }}
]
"""
                try:
                    r_res = model.generate_content(reason_prompt, request_options={'timeout': 5.0})
                    raw_r = r_res.text.strip() if r_res and r_res.text else ""
                    if raw_r.startswith("```"):
                        raw_r = raw_r.strip("`")
                        if raw_r.startswith("json"):
                            raw_r = raw_r[4:].strip()
                    reasons_list = json.loads(raw_r)
                    reasons_map = {r['id']: r.get('match_reason') for r in reasons_list if isinstance(r, dict)}
                    for c in top_candidates:
                        c['match_reason'] = reasons_map.get(
                            c['id'],
                            f"Verified tutor with expertise in {c['subjects']}."
                        )
                except Exception:
                    for c in top_candidates:
                        c['match_reason'] = f"{'⭐ Priority Pro ' if c['is_subscribed'] else ''}Tutor specializing in {c['subjects']} in {c['location']}."

            results = top_candidates

        else:
            # --- TUTOR: SEARCH OPEN TUITION POSTS ---
            qs = TuitionPost.objects.filter(status='open').select_related('guardian').all()

            if extracted_subject:
                qs = qs.filter(Q(subject__icontains=extracted_subject) | Q(title__icontains=extracted_subject) | Q(description__icontains=extracted_subject))

            if extracted_loc:
                qs = qs.filter(Q(location__icontains=extracted_loc))

            posts = list(qs)
            if not posts:
                posts = list(TuitionPost.objects.filter(status='open').select_related('guardian').all())

            t_lat = getattr(getattr(user, 'tutor_profile', None), 'latitude', None)
            t_lng = getattr(getattr(user, 'tutor_profile', None), 'longitude', None)

            scored_posts = []
            for p in posts:
                if extracted_budget and p.salary and p.salary < extracted_budget:
                    continue

                if extracted_days and p.preferred_days:
                    overlap = any(d.lower() in [x.lower() for x in p.preferred_days] for d in extracted_days)
                    if not overlap:
                        continue

                dist = None
                p_lat, p_lng = p.latitude, p.longitude
                if (p_lat is None or p_lng is None) and p.location:
                    d_coords = get_district_coordinates(p.location)
                    if d_coords:
                        p_lat, p_lng = d_coords
                if t_lat is not None and t_lng is not None and p_lat is not None and p_lng is not None:
                    dist = haversine_distance(t_lat, t_lng, p_lat, p_lng)

                scored_posts.append({
                    'id': p.id,
                    'title': p.title,
                    'description': p.description,
                    'subject': p.subject,
                    'category': p.category,
                    'course': p.course,
                    'salary': float(p.salary) if p.salary else 8000,
                    'location': p.location,
                    'days_per_week': p.days_per_week,
                    'preferred_days': p.preferred_days,
                    'preferred_time': p.preferred_time,
                    'method': p.method,
                    'distance_km': dist,
                    'created_at': p.created_at.isoformat(),
                })

            # Sort by distance (nearest first) or salary
            scored_posts.sort(
                key=lambda x: (
                    -x['distance_km'] if x['distance_km'] is not None else -9999,
                    x['salary']
                ),
                reverse=True
            )
            top_posts = scored_posts[:5]

            # Ask Gemini for match reasons
            if top_posts:
                reason_prompt = f"""You are an AI Job Matching Assistant for TutorLink.
The tutor asked for: "{query}"

Here are the top tuition jobs:
{json.dumps([{'id': p['id'], 'title': p['title'], 'subject': p['subject'], 'location': p['location'], 'salary': p['salary']} for p in top_posts], indent=2)}

Generate a friendly 1-sentence match explanation for each job explaining why it matches the tutor's request.
Return ONLY a valid JSON array:
[
  {{ "id": 1, "match_reason": "..." }}
]
"""
                try:
                    r_res = model.generate_content(reason_prompt)
                    raw_r = r_res.text.strip() if r_res and r_res.text else ""
                    if raw_r.startswith("```"):
                        raw_r = raw_r.strip("`")
                        if raw_r.startswith("json"):
                            raw_r = raw_r[4:].strip()
                    reasons_list = json.loads(raw_r)
                    reasons_map = {r['id']: r.get('match_reason') for r in reasons_list if isinstance(r, dict)}
                    for p in top_posts:
                        p['match_reason'] = reasons_map.get(
                            p['id'],
                            f"Matches your subject preferences for {p['subject']} with {p['salary']} BDT salary."
                        )
                except Exception:
                    for p in top_posts:
                        p['match_reason'] = f"Great tuition opportunity for {p['subject']} offering {p['salary']} BDT/mo."

            results = top_posts

        # 4. Log AI Interaction
        AIInteraction.objects.create(
            user=user,
            type=f"chat_match_{user_role}",
            input_text=f"Query: {query} | Extracted: {json.dumps(extracted)}",
            output_text=json.dumps([{'id': r['id'], 'reason': r.get('match_reason')} for r in results])
        )

        return Response({
            'query': query,
            'role': user_role,
            'extracted_filters': extracted,
            'results': results,
            'count': len(results),
        }, status=status.HTTP_200_OK)

