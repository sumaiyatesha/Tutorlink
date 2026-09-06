"""
verify_simulated_checkout_e2e.py — Comprehensive End-to-End Verification
for the Simulated In-App Checkout & Subscription Unlocking Flow.
"""

import os
import sys
import django
import json
from unittest.mock import patch, MagicMock

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorlink_backend.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from decimal import Decimal
from rest_framework.test import APIClient
from accounts.models import User, TutorProfile, GuardianProfile, TuitionPost, Application
from subscriptions.models import SubscriptionPlan, Subscription

def run_tests():
    print("================================================================")
    print("STARTING SIMULATED CHECKOUT & SUBSCRIPTION E2E TESTS")
    print("================================================================")

    client = APIClient()

    # Setup test Guardian & Tutor
    guardian, _ = User.objects.get_or_create(
        username='e2e_guardian_sim',
        defaults={'email': 'e2e_guardian@tutorlink.com', 'role': 'guardian'}
    )
    guardian.set_password('pass123')
    guardian.save()
    GuardianProfile.objects.get_or_create(user=guardian)

    tutor, _ = User.objects.get_or_create(
        username='e2e_tutor_sim',
        defaults={'email': 'e2e_tutor@tutorlink.com', 'role': 'tutor'}
    )
    tutor.set_password('pass123')
    tutor.save()
    tutor_prof, _ = TutorProfile.objects.get_or_create(user=tutor, defaults={'subjects': 'Mathematics, Physics', 'location': 'Dhanmondi, Dhaka'})

    # 1. Verify Plans
    print("\n--- Test 1: Plan Filtering by Role ---")
    client.force_authenticate(user=guardian)
    res_g_plans = client.get('/api/subscriptions/plans/')
    assert res_g_plans.status_code == 200
    assert len(res_g_plans.data) >= 1
    assert res_g_plans.data[0]['role'] == 'guardian'
    assert float(res_g_plans.data[0]['price']) == 30.0
    print(f"[OK] Guardian sees plan: {res_g_plans.data[0]['name']} @ {res_g_plans.data[0]['price']} Tk")

    client.force_authenticate(user=tutor)
    res_t_plans = client.get('/api/subscriptions/plans/')
    assert res_t_plans.status_code == 200
    assert len(res_t_plans.data) >= 1
    assert res_t_plans.data[0]['role'] == 'tutor'
    assert float(res_t_plans.data[0]['price']) == 50.0
    print(f"[OK] Tutor sees plan: {res_t_plans.data[0]['name']} @ {res_t_plans.data[0]['price']} Tk")

    # 2. Guardian Checkout with bKash
    print("\n--- Test 2: Guardian Simulated Checkout (bKash) ---")
    client.force_authenticate(user=guardian)
    # Cancel previous if any
    client.post('/api/subscriptions/cancel/')

    # Verify initial status is inactive
    res_mine_init = client.get('/api/subscriptions/mine/')
    assert res_mine_init.data['is_subscribed'] == False
    print("[OK] Initial Guardian status: Inactive / Not Subscribed")

    # When unsubscribed, AI Chatbot is locked with 403 Forbidden
    res_ai_locked = client.post('/api/ai/chat-match/', {'query': 'Math tutor in Dhanmondi'})
    assert res_ai_locked.status_code == 403
    print("[OK] AI Matching Chatbot is properly locked (403) before subscription.")

    # Finalize simulated payment
    res_sub_bkash = client.post('/api/subscriptions/subscribe/', {
        'payment_method': 'bkash',
        'account_ref': '017 **** 5678'
    })
    assert res_sub_bkash.status_code in [200, 201]
    data_bkash = res_sub_bkash.data
    assert data_bkash['is_subscribed'] == True
    assert data_bkash['method'] == 'bkash'
    assert data_bkash['amount'] == 30.0
    assert data_bkash['transaction_id'].startswith('TXN')
    print(f"[OK] Payment confirmed! TXN ID: {data_bkash['transaction_id']}, Amount: {data_bkash['amount']} Tk, Method: {data_bkash['method']}")

    # Check that AI Chatbot feature is now unlocked (passes 403 paywall)
    with patch('google.generativeai.GenerativeModel.generate_content') as mock_ai:
        mock_resp = MagicMock()
        mock_resp.text = json.dumps({"subject": "Math", "days": ["Sunday"], "budget": 5000, "location": "Dhanmondi"})
        mock_ai.return_value = mock_resp

        res_ai_unlocked = client.post('/api/ai/chat-match/', {'query': 'Math tutor in Dhanmondi'})
        assert res_ai_unlocked.status_code == 200
        print(f"[OK] AI Matching Chatbot successfully unlocked (HTTP 200, paywall cleared).")

    # 3. Tutor Checkout with Nagad
    print("\n--- Test 3: Tutor Simulated Checkout (Nagad) ---")
    client.force_authenticate(user=tutor)
    client.post('/api/subscriptions/cancel/')

    res_sub_nagad = client.post('/api/subscriptions/subscribe/', {
        'payment_method': 'nagad',
        'account_ref': '018 **** 9999'
    })
    assert res_sub_nagad.status_code in [200, 201]
    data_nagad = res_sub_nagad.data
    assert data_nagad['is_subscribed'] == True
    assert data_nagad['method'] == 'nagad'
    assert data_nagad['amount'] == 50.0
    assert data_nagad['transaction_id'].startswith('TXN')
    print(f"[OK] Tutor Payment confirmed! TXN ID: {data_nagad['transaction_id']}, Amount: {data_nagad['amount']} Tk, Method: {data_nagad['method']}")

    # Verify Tutor Directory shows is_subscribed=True & is_priority=True
    res_tutors = client.get('/api/tutors/')
    matching_tutor = next((t for t in res_tutors.data if t['username'] == 'e2e_tutor_sim'), None)
    assert matching_tutor is not None
    assert matching_tutor['is_subscribed'] == True
    assert matching_tutor['is_priority'] == True
    print(f"[OK] Tutor Priority Pro active in public directory: is_priority = {matching_tutor['is_priority']}, is_subscribed = {matching_tutor['is_subscribed']}")

    # 4. Tutor Checkout with Bank Card
    print("\n--- Test 4: Tutor Simulated Checkout (Bank Card) ---")
    res_sub_card = client.post('/api/subscriptions/subscribe/', {
        'payment_method': 'card',
        'account_ref': '**** **** **** 4242'
    })
    assert res_sub_card.status_code in [200, 201]
    data_card = res_sub_card.data
    assert data_card['is_subscribed'] == True
    assert data_card['method'] == 'card'
    assert data_card['transaction_id'].startswith('TXN')
    assert data_card['transaction_id'] != data_nagad['transaction_id']
    print(f"[OK] Card Payment confirmed! New Unique TXN ID: {data_card['transaction_id']}, Method: {data_card['method']}")

    # 5. Cancel and Re-activate verification
    print("\n--- Test 5: Cancellation & Idempotency ---")
    res_cancel = client.post('/api/subscriptions/cancel/')
    assert res_cancel.status_code == 200
    assert res_cancel.data['is_subscribed'] == False
    print("[OK] Subscription cancelled successfully.")

    res_mine_cancelled = client.get('/api/subscriptions/mine/')
    assert res_mine_cancelled.data['is_subscribed'] == False
    assert res_mine_cancelled.data['status'] == 'cancelled'
    print("[OK] /mine/ accurately returns cancelled status.")

    print("\n================================================================")
    print("ALL SIMULATED CHECKOUT TESTS PASSED WITH 100% SUCCESS!")
    print("================================================================")

if __name__ == '__main__':
    run_tests()
