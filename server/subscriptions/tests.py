# subscriptions/tests.py — Unit tests for Subscriptions, Commissions, and Tutor Priority.

from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, TutorProfile, GuardianProfile, TuitionPost, Application
from subscriptions.models import SubscriptionPlan, Subscription, TutorCommission


class SubscriptionApiTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Create test guardian
        self.guardian = User.objects.create_user(
            username='test_guardian',
            email='guardian@test.com',
            password='password123',
            role='guardian'
        )
        GuardianProfile.objects.get_or_create(user=self.guardian)

        # Create test tutors
        self.tutor1 = User.objects.create_user(
            username='tutor_alpha',
            email='tutor1@test.com',
            password='password123',
            role='tutor'
        )
        TutorProfile.objects.get_or_create(user=self.tutor1, subjects='Physics, Math')

        self.tutor2 = User.objects.create_user(
            username='tutor_beta',
            email='tutor2@test.com',
            password='password123',
            role='tutor'
        )
        TutorProfile.objects.get_or_create(user=self.tutor2, subjects='Chemistry, Biology')

        # Ensure subscription plans exist (seeded by migration, or create fallback)
        self.guardian_plan, _ = SubscriptionPlan.objects.get_or_create(
            role='guardian',
            defaults={'name': 'Guardian Monthly', 'price': Decimal('30.00')}
        )
        self.tutor_plan, _ = SubscriptionPlan.objects.get_or_create(
            role='tutor',
            defaults={'name': 'Tutor Monthly', 'price': Decimal('50.00')}
        )

    def test_plans_endpoint_filtering_by_role(self):
        """Test GET /api/subscriptions/plans/ returns guardian plan for guardian, tutor plan for tutor."""
        # Guardian login
        self.client.force_authenticate(user=self.guardian)
        response = self.client.get('/api/subscriptions/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['role'], 'guardian')
        self.assertEqual(Decimal(str(response.data[0]['price'])), Decimal('30.00'))

        # Tutor login
        self.client.force_authenticate(user=self.tutor1)
        response = self.client.get('/api/subscriptions/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['role'], 'tutor')
        self.assertEqual(Decimal(str(response.data[0]['price'])), Decimal('50.00'))

    def test_subscribe_and_mine_endpoints(self):
        """Test subscribing via POST /api/subscriptions/subscribe/ and checking status via /mine/."""
        self.client.force_authenticate(user=self.guardian)

        # Before subscribing
        response_mine = self.client.get('/api/subscriptions/mine/')
        self.assertEqual(response_mine.status_code, status.HTTP_200_OK)
        self.assertFalse(response_mine.data['is_subscribed'])

        # Subscribe
        sub_payload = {
            'payment_method': 'bkash',
            'transaction_id': 'MOCK-TXN-99999'
        }
        response_sub = self.client.post('/api/subscriptions/subscribe/', sub_payload)
        self.assertEqual(response_sub.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response_sub.data['is_subscribed'])
        self.assertEqual(response_sub.data['payment_method'], 'bkash')

        # Check /mine/ again
        response_mine_after = self.client.get('/api/subscriptions/mine/')
        self.assertTrue(response_mine_after.data['is_subscribed'])
        self.assertEqual(response_mine_after.data['status'], 'active')

        # Cancel subscription
        response_cancel = self.client.post('/api/subscriptions/cancel/')
        self.assertEqual(response_cancel.status_code, status.HTTP_200_OK)
        self.assertFalse(response_cancel.data['is_subscribed'])

    def test_commission_creation_on_application_accepted(self):
        """Test that accepting a tutor's application auto-creates a TutorCommission with 15% amount."""
        # Create a tuition post with salary 10,000 Tk
        post = TuitionPost.objects.create(
            guardian=self.guardian,
            title='Class 10 Physics Tutor',
            subject='Physics',
            salary=Decimal('10000.00'),
            location='Dhaka'
        )

        # Tutor applies
        app = Application.objects.create(
            tutor=self.tutor1,
            post=post,
            cover_note='I have 5 years teaching physics.'
        )

        # Guardian accepts application via PATCH /api/applications/<id>/
        self.client.force_authenticate(user=self.guardian)
        patch_res = self.client.patch(f'/api/applications/{app.id}/', {'status': 'accepted'})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        # Verify TutorCommission record exists
        commission = TutorCommission.objects.filter(application=app).first()
        self.assertIsNotNone(commission)
        self.assertEqual(commission.tutor, self.tutor1)
        self.assertEqual(commission.tuition_amount, Decimal('10000.00'))
        self.assertEqual(commission.commission_amount, Decimal('1500.00'))  # 15% of 10,000
        self.assertEqual(commission.status, 'pending')

        # Tutor fetches their commissions via GET /api/tutor/commissions/
        self.client.force_authenticate(user=self.tutor1)
        comm_res = self.client.get('/api/tutor/commissions/')
        self.assertEqual(comm_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(comm_res.data), 1)
        self.assertEqual(Decimal(str(comm_res.data[0]['commission_amount'])), Decimal('1500.00'))

    def test_tutor_priority_ordering(self):
        """Test that subscribed tutors are listed ahead of unsubscribed tutors in GET /api/tutors/."""
        # Subscribe tutor2 (Chemistry), leave tutor1 (Physics) unsubscribed
        Subscription.objects.create(
            user=self.tutor2,
            plan=self.tutor_plan,
            payment_method='card',
            transaction_id='MOCK-TXN-CARD-1',
            status='active'
        )

        # Public fetch /api/tutors/
        response = self.client.get('/api/tutors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tutors = response.data

        self.assertGreaterEqual(len(tutors), 2)
        # Subscribed tutor2 should appear first
        first_tutor = tutors[0]
        self.assertEqual(first_tutor['username'], 'tutor_beta')
        self.assertTrue(first_tutor['is_subscribed'])
        self.assertTrue(first_tutor['is_priority'])

        second_tutor = tutors[1]
        self.assertEqual(second_tutor['username'], 'tutor_alpha')
        self.assertFalse(second_tutor['is_subscribed'])
