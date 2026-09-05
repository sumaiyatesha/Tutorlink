import urllib.request, urllib.error, json, django, os, sys

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorlink_backend.settings')
django.setup()
from django.contrib.auth import get_user_model
from accounts.models import TutorProfile, TuitionPost
from subscriptions.models import Subscription, SubscriptionPlan
from ai.models import AIInteraction

User = get_user_model()
g_user = User.objects.get(username='testguardian')
t_user = User.objects.get(username='testtutor')

# Setup tutor available days and expected salary
tp = TutorProfile.objects.get(user=t_user)
tp.available_days = ['Friday', 'Saturday', 'Monday']
tp.expected_salary = 7500
tp.subjects = 'Physics, Higher Math'
tp.location = 'Uttara, Dhaka'
tp.save()

# Setup tuition post preferred days
post = TuitionPost.objects.first()
if post:
    post.preferred_days = ['Friday', 'Saturday']
    post.save()

# 1. Login Guardian
req_g = urllib.request.Request('http://127.0.0.1:8000/api/auth/login/', data=json.dumps({'username': 'testguardian', 'password': 'password123'}).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_g) as res:
    g_token = json.loads(res.read())['access']

# 2. Test Unsubscribed Guardian Access Gating
Subscription.objects.filter(user=g_user).delete()
req_chat_unsub = urllib.request.Request('http://127.0.0.1:8000/api/ai/chat-match/', data=json.dumps({'query': 'Physics teacher for weekends under 9000'}).encode(), headers={'Authorization': f'Bearer {g_token}', 'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req_chat_unsub) as res:
        print('FAIL: Unsubscribed guardian was not blocked')
except urllib.error.HTTPError as e:
    err_body = json.loads(e.read())
    print('TEST 1 (Access Gating): Unsubscribed Guardian blocked with status', e.code, '| Message:', err_body.get('error'))

# 3. Subscribe Guardian and Test Chat Match
plan_g, _ = SubscriptionPlan.objects.get_or_create(role='guardian', defaults={'name': 'Guardian Plan', 'price': 30})
Subscription.objects.create(user=g_user, plan=plan_g, status='active')

# Subscribe Tutor for Priority Pro
plan_t, _ = SubscriptionPlan.objects.get_or_create(role='tutor', defaults={'name': 'Tutor Pro', 'price': 50})
Subscription.objects.filter(user=t_user).delete()
Subscription.objects.create(user=t_user, plan=plan_t, status='active')

req_chat_sub_g = urllib.request.Request('http://127.0.0.1:8000/api/ai/chat-match/', data=json.dumps({'query': 'I need a Physics teacher for weekends, budget under 8000 taka in Uttara'}).encode(), headers={'Authorization': f'Bearer {g_token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req_chat_sub_g) as res:
    g_match_res = json.loads(res.read())

print('\nTEST 2 (Subscribed Guardian Chat Match):')
print('  Query:', g_match_res['query'])
print('  Extracted Filters:', g_match_res['extracted_filters'])
print('  Matches Count:', len(g_match_res['results']))
for r in g_match_res['results']:
    print('    - Tutor:', r.get('username'), '| Priority Pro:', r.get('is_subscribed'), '| Reason:', r.get('match_reason'))

# 4. Login Tutor
req_t = urllib.request.Request('http://127.0.0.1:8000/api/auth/login/', data=json.dumps({'username': 'testtutor', 'password': 'password123'}).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_t) as res:
    t_token = json.loads(res.read())['access']

req_chat_sub_t = urllib.request.Request('http://127.0.0.1:8000/api/ai/chat-match/', data=json.dumps({'query': 'Class 10 Physics tuition jobs in Uttara with 8000+ salary'}).encode(), headers={'Authorization': f'Bearer {t_token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req_chat_sub_t) as res:
    t_match_res = json.loads(res.read())

print('\nTEST 3 (Subscribed Tutor Chat Match):')
print('  Query:', t_match_res['query'])
print('  Extracted Filters:', t_match_res['extracted_filters'])
print('  Matches Count:', len(t_match_res['results']))
for r in t_match_res['results']:
    print('    - Job:', r.get('title'), f"({r.get('salary')} BDT)", '| Reason:', r.get('match_reason'))

# 5. Check AIInteraction Logs
print('\nTEST 4 (Audit Logging):')
for ai in AIInteraction.objects.filter(type__startswith='chat_match').order_by('-created_at')[:2]:
    print('  [', ai.type, '] User:', ai.user.username, '| In:', ai.input_text[:50], '| Out:', ai.output_text[:70])
