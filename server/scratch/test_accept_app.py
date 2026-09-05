import urllib.request, json, django, os, sys

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorlink_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import TuitionPost, Application, Notification
from subscriptions.models import TutorCommission

User = get_user_model()
gurdian2 = User.objects.get(username='Gurdian2')

# 1. Login as Gurdian2
req_login = urllib.request.Request('http://127.0.0.1:8000/api/auth/login/', data=json.dumps({'username': 'Gurdian2', 'password': 'password123'}).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_login) as res:
    token = json.loads(res.read())['access']

# 2. Get applications for Gurdian2
req_list = urllib.request.Request('http://127.0.0.1:8000/api/applications/', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req_list) as res_list:
    apps = json.loads(res_list.read())

print(f"Gurdian2 has {len(apps)} real applications.")
target_app = [a for a in apps if a['status'] == 'pending'][0]
target_app_id = target_app['id']
print(f"Target Application to Accept: ID {target_app_id} (Tutor: {target_app['tutor_name']}, Post ID: {target_app['post']})")

# 3. Send PATCH to Accept target_app
req_patch = urllib.request.Request(
    f"http://127.0.0.1:8000/api/applications/{target_app_id}/",
    data=json.dumps({'status': 'accepted'}).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    method='PATCH'
)

with urllib.request.urlopen(req_patch) as res_patch:
    patched_data = json.loads(res_patch.read())

print("\nPATCH /api/applications/<id>/ Response:")
print(f"  Status: {patched_data.get('status')}")

# 4. Verify post status flipped to closed
post = TuitionPost.objects.get(id=target_app['post'])
print(f"  Post #{post.id} ('{post.title}') Status: {post.status}")

# 5. Verify TutorCommission created
comm = TutorCommission.objects.filter(application_id=target_app_id).first()
if comm:
    print(f"  TutorCommission: ID {comm.id} | Tutor: {comm.tutor.username} | Tuition: {comm.tuition_amount} BDT | Commission (15%): {comm.commission_amount} BDT | Status: {comm.status}")

# 6. Verify notification created
notif = Notification.objects.filter(user__username=target_app['tutor_name']).order_by('-created_at').first()
if notif:
    print(f"  Notification for {notif.user.username}: \"{notif.message}\"")
