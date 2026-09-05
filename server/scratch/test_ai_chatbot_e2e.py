import urllib.request, urllib.error, json, django, os, sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorlink_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import TutorProfile, TuitionPost
from subscriptions.models import Subscription, SubscriptionPlan
from ai.models import AIInteraction

User = get_user_model()

# Ensure test users exist
g_user, _ = User.objects.get_or_create(username='testguardian', defaults={'role': 'guardian', 'email': 'guardian@test.com'})
g_user.set_password('password123')
g_user.save()

t_user, _ = User.objects.get_or_create(username='testtutor', defaults={'role': 'tutor', 'email': 'tutor@test.com'})
t_user.set_password('password123')
t_user.save()

# Ensure TutorProfile has available_days and expected_salary
tp, _ = TutorProfile.objects.get_or_create(user=t_user)
tp.available_days = ['Friday', 'Saturday', 'Monday']
tp.expected_salary = 7500
tp.subjects = 'Physics, Higher Math'
tp.location = 'Uttara, Dhaka'
tp.latitude = 23.8759
tp.longitude = 90.3795
tp.save()

# Ensure at least one TuitionPost has preferred_days set
post = TuitionPost.objects.first()
if not post:
    post = TuitionPost.objects.create(
        guardian=g_user,
        title='Edexcel Class 10 Physics Tutor Needed in Uttara',
        subject='Physics & Higher Math',
        salary=8500,
        days_per_week=3,
        preferred_days=['Friday', 'Saturday'],
        location='Uttara, Dhaka',
        latitude=23.8759,
        longitude=90.3795,
        status='open'
    )
else:
    post.preferred_days = ['Friday', 'Saturday']
    post.status = 'open'
    post.save()

print("==================================================")
print("     AI MATCHING CHATBOT END-TO-END TEST SUITE    ")
print("==================================================")

# --- HELPER: Auth Login ---
def login(username, password='password123'):
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login/',
        data=json.dumps({'username': username, 'password': password}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())['access']

g_token = login('testguardian')
t_token = login('testtutor')

# Ensure Subscription Plans exist
plan_g, _ = SubscriptionPlan.objects.get_or_create(role='guardian', defaults={'name': 'Guardian Monthly', 'price': 30})
plan_t, _ = SubscriptionPlan.objects.get_or_create(role='tutor', defaults={'name': 'Tutor Monthly', 'price': 50})

# ---------------------------------------------------------------
# CASE 1: SUBSCRIBED GUARDIAN
# ---------------------------------------------------------------
print("\n[CASE 1] Testing SUBSCRIBED GUARDIAN...")
Subscription.objects.filter(user=g_user).delete()
Subscription.objects.create(user=g_user, plan=plan_g, status='active')

# Ensure tutor is also subscribed to verify Priority Pro boosting
Subscription.objects.filter(user=t_user).delete()
Subscription.objects.create(user=t_user, plan=plan_t, status='active')

query_g = "I need a Physics teacher for weekends, budget under 8000 taka in Uttara"
req1 = urllib.request.Request(
    'http://127.0.0.1:8000/api/ai/chat-match/',
    data=json.dumps({'query': query_g}).encode(),
    headers={'Authorization': f'Bearer {g_token}', 'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req1) as res1:
    data1 = json.loads(res1.read())

print(f"Status: HTTP {res1.status} OK")
print(f"Extracted Filters: {data1.get('extracted_filters')}")
print(f"Results Count: {len(data1.get('results', []))}")
assert len(data1.get('results', [])) > 0, "Expected at least 1 tutor match"
first_tutor = data1['results'][0]
print(f"Top Match: {first_tutor.get('username')} (Priority Pro: {first_tutor.get('is_subscribed')})")
print(f"Match Reason: {first_tutor.get('match_reason')}")
assert first_tutor.get('match_reason'), "Missing match_reason text"
print("CASE 1 PASS: Subscribed guardian received ranked tutors with AI match reason.")

# ---------------------------------------------------------------
# CASE 2: NON-SUBSCRIBED GUARDIAN
# ---------------------------------------------------------------
print("\n[CASE 2] Testing NON-SUBSCRIBED GUARDIAN...")
Subscription.objects.filter(user=g_user).delete() # Remove active subscription

req2 = urllib.request.Request(
    'http://127.0.0.1:8000/api/ai/chat-match/',
    data=json.dumps({'query': query_g}).encode(),
    headers={'Authorization': f'Bearer {g_token}', 'Content-Type': 'application/json'}
)
case2_passed = False
try:
    with urllib.request.urlopen(req2) as res2:
        print("FAIL: Expected 403 Forbidden but got 200")
except urllib.error.HTTPError as e:
    err = json.loads(e.read())
    print(f"Status: HTTP {e.code} Forbidden")
    print(f"Error Message: {err.get('error')}")
    print(f"Subscription Required Flag: {err.get('subscription_required')}")
    if e.code == 403 and err.get('subscription_required') is True:
        case2_passed = True

assert case2_passed, "Case 2 failed to enforce subscription gating"
print("CASE 2 PASS: Non-subscribed guardian was rejected with HTTP 403 subscription_required error.")

# ---------------------------------------------------------------
# CASE 3: SUBSCRIBED TUTOR
# ---------------------------------------------------------------
print("\n[CASE 3] Testing SUBSCRIBED TUTOR...")
Subscription.objects.filter(user=t_user).delete()
Subscription.objects.create(user=t_user, plan=plan_t, status='active')

query_t = "Class 10 Physics tuition jobs in Uttara with 8000+ salary"
req3 = urllib.request.Request(
    'http://127.0.0.1:8000/api/ai/chat-match/',
    data=json.dumps({'query': query_t}).encode(),
    headers={'Authorization': f'Bearer {t_token}', 'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req3) as res3:
    data3 = json.loads(res3.read())

print(f"Status: HTTP {res3.status} OK")
print(f"Extracted Filters: {data3.get('extracted_filters')}")
print(f"Results Count: {len(data3.get('results', []))}")
assert len(data3.get('results', [])) > 0, "Expected at least 1 job match"
first_job = data3['results'][0]
print(f"Top Match: {first_job.get('title')} ({first_job.get('salary')} BDT)")
print(f"Match Reason: {first_job.get('match_reason')}")
assert first_job.get('match_reason'), "Missing match_reason text"
print("CASE 3 PASS: Subscribed tutor received matching tuition jobs with AI match reason.")

# ---------------------------------------------------------------
# CASE 4: NON-SUBSCRIBED TUTOR
# ---------------------------------------------------------------
print("\n[CASE 4] Testing NON-SUBSCRIBED TUTOR...")
Subscription.objects.filter(user=t_user).delete() # Remove active subscription

req4 = urllib.request.Request(
    'http://127.0.0.1:8000/api/ai/chat-match/',
    data=json.dumps({'query': query_t}).encode(),
    headers={'Authorization': f'Bearer {t_token}', 'Content-Type': 'application/json'}
)
case4_passed = False
try:
    with urllib.request.urlopen(req4) as res4:
        print("FAIL: Expected 403 Forbidden but got 200")
except urllib.error.HTTPError as e:
    err = json.loads(e.read())
    print(f"Status: HTTP {e.code} Forbidden")
    print(f"Error Message: {err.get('error')}")
    print(f"Subscription Required Flag: {err.get('subscription_required')}")
    if e.code == 403 and err.get('subscription_required') is True:
        case4_passed = True

assert case4_passed, "Case 4 failed to enforce subscription gating"
print("CASE 4 PASS: Non-subscribed tutor was rejected with HTTP 403 subscription_required error.")

# ---------------------------------------------------------------
# CASE 5: FRONTEND SUBSCRIPTION STATUS API VERIFICATION
# ---------------------------------------------------------------
print("\n[CASE 5] Testing Frontend Subscription Status Endpoints...")
# When unsubscribed:
with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/api/subscriptions/mine/', headers={'Authorization': f'Bearer {g_token}'})) as res:
    mine_unsub = json.loads(res.read())
    print(f"Guardian Unsubscribed is_subscribed: {mine_unsub.get('is_subscribed')} (Renders Locked Card in UI)")
    assert mine_unsub.get('is_subscribed') == False

# When subscribed:
Subscription.objects.create(user=g_user, plan=plan_g, status='active')
with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/api/subscriptions/mine/', headers={'Authorization': f'Bearer {g_token}'})) as res:
    mine_sub = json.loads(res.read())
    print(f"Guardian Subscribed is_subscribed: {mine_sub.get('is_subscribed')} (Renders Working Chat Input in UI)")
    assert mine_sub.get('is_subscribed') == True

print("\n==================================================")
print("          ALL 4 CASES + UI CHECKS PASSED!         ")
print("==================================================")
