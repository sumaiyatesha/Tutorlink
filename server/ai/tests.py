# ai/tests.py — Automated Unit Tests for AI Endpoints.

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import TuitionPost, TutorProfile, GuardianProfile
from .models import AIInteraction

User = get_user_model()


class AIFeaturesTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Guardian User & Profile
        self.guardian = User.objects.create_user(
            username='guardiantest',
            email='guardian@test.com',
            password='password123',
            role='guardian'
        )
        self.guardian_profile = GuardianProfile.objects.create(
            user=self.guardian,
            phone='01711111111',
            location='Uttara, Dhaka'
        )

        # Create Tutor User & Profile
        self.tutor = User.objects.create_user(
            username='tutortest',
            email='tutor@test.com',
            password='password123',
            role='tutor'
        )
        self.tutor_profile = TutorProfile.objects.create(
            user=self.tutor,
            phone='01722222222',
            location='Uttara, Dhaka',
            subjects='Physics, Higher Math',
            bio='B.Sc in Physics from University of Dhaka.'
        )

        # Create Tuition Post
        self.post = TuitionPost.objects.create(
            guardian=self.guardian,
            title='Class 10 Physics Tutor Needed in Uttara',
            subject='Physics & Higher Math',
            category='Class 9-10 (SSC)',
            course='National Curriculum',
            days_per_week=3,
            preferred_time='6:00 PM',
            duration='1.5 Hours',
            method='In-Person',
            salary=8500,
            location='Uttara Sector 7, Dhaka'
        )

    def test_generate_post_endpoint(self):
        """Test AI post generator generates title/description and logs AIInteraction."""
        self.client.force_authenticate(user=self.guardian)
        response = self.client.post('/api/ai/generate-post/', {
            'subject': 'Physics & Higher Math',
            'category': 'Class 10 (SSC)',
            'location': 'Uttara, Dhaka',
            'salary': 8500,
            'days_per_week': 3,
            'bullets': 'Prefer tutor from BUET or DU. 3 days a week in the evening.'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('title', response.data)
        self.assertIn('description', response.data)
        self.assertTrue(len(response.data['description']) > 10)

        # Check AIInteraction record created
        interaction = AIInteraction.objects.filter(user=self.guardian, type='post_generator').first()
        self.assertIsNotNone(interaction)

    def test_recommend_tutors_endpoint(self):
        """Test AI tutor recommendation ranks matching candidates and logs AIInteraction."""
        self.client.force_authenticate(user=self.guardian)
        response = self.client.post(f'/api/ai/recommend-tutors/{self.post.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recommendations', response.data)
        self.assertTrue(len(response.data['recommendations']) >= 1)
        self.assertIn('match_reason', response.data['recommendations'][0])

        # Check AIInteraction record created
        interaction = AIInteraction.objects.filter(user=self.guardian, type='tutor_recommendation').first()
        self.assertIsNotNone(interaction)

    def test_recommend_tutors_forbidden_for_other_user(self):
        """Ensure users cannot request recommendations for posts they do not own."""
        other_guardian = User.objects.create_user(
            username='otherguardian',
            email='other@test.com',
            password='password123',
            role='guardian'
        )
        self.client.force_authenticate(user=other_guardian)
        response = self.client.post(f'/api/ai/recommend-tutors/{self.post.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chat_match_unsubscribed_blocked(self):
        """Test unsubscribed user is rejected with HTTP 403 Forbidden."""
        self.client.force_authenticate(user=self.guardian)
        response = self.client.post('/api/ai/chat-match/', {'query': 'Need a Physics tutor for weekends'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data.get('subscription_required'))

    def test_chat_match_subscribed_guardian(self):
        """Test subscribed guardian gets matching tutor results with match reasons."""
        from subscriptions.models import Subscription, SubscriptionPlan
        plan, _ = SubscriptionPlan.objects.get_or_create(role='guardian', defaults={'name': 'Guardian Monthly', 'price': 30})
        Subscription.objects.create(user=self.guardian, plan=plan, status='active')

        self.client.force_authenticate(user=self.guardian)
        response = self.client.post('/api/ai/chat-match/', {'query': 'Need a Physics teacher in Uttara'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertTrue(len(response.data['results']) >= 1)

    def test_chat_match_subscribed_tutor(self):
        """Test subscribed tutor gets matching open tuition posts."""
        from subscriptions.models import Subscription, SubscriptionPlan
        plan, _ = SubscriptionPlan.objects.get_or_create(role='tutor', defaults={'name': 'Tutor Monthly', 'price': 50})
        Subscription.objects.create(user=self.tutor, plan=plan, status='active')

        self.client.force_authenticate(user=self.tutor)
        response = self.client.post('/api/ai/chat-match/', {'query': 'Class 10 Physics tuition jobs in Uttara'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertTrue(len(response.data['results']) >= 1)

