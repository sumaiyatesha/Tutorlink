# accounts/tests.py — Automated end-to-end API tests for TutorLink features.

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, TuitionPost, Application, TutorProfile


class TutorLinkFeatureTests(APITestCase):

    def setUp(self):
        # Create Guardian 1
        self.guardian1 = User.objects.create_user(
            username='guardian1',
            email='guardian1@example.com',
            password='Password123!',
            role='guardian',
        )

        # Create Guardian 2
        self.guardian2 = User.objects.create_user(
            username='guardian2',
            email='guardian2@example.com',
            password='Password123!',
            role='guardian',
        )

        # Create Tutor 1
        self.tutor1 = User.objects.create_user(
            username='tutor1',
            email='tutor1@example.com',
            password='Password123!',
            role='tutor',
        )

    def test_01_guardian_post_management_and_owner_permissions(self):
        """
        Test creating, listing mine, editing, owner permission check, and deleting tuition posts.
        """
        # 1. Guardian 1 logs in and creates a post
        self.client.force_authenticate(user=self.guardian1)
        post_data = {
            'title': 'HSC Physics Tutor Needed in Uttara',
            'subject': 'Physics',
            'category': 'HSC (College)',
            'course': 'National Curriculum',
            'days_per_week': 4,
            'preferred_time': '6:00 PM',
            'duration': '1.5 Hours',
            'method': 'In-Person',
            'salary': 10000.00,
            'students': '1 Student',
            'preferred_tutor_gender': 'Any',
            'location': 'Uttara, Dhaka',
        }
        create_res = self.client.post('/api/tuition-posts/', post_data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        post_id = create_res.data['id']
        self.assertEqual(create_res.data['title'], 'HSC Physics Tutor Needed in Uttara')

        # 2. Guardian 1 queries GET /api/tuition-posts/?mine=true
        mine_res = self.client.get('/api/tuition-posts/?mine=true')
        self.assertEqual(mine_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mine_res.data), 1)
        self.assertEqual(mine_res.data[0]['id'], post_id)

        # 3. Guardian 1 edits the post via PUT /api/tuition-posts/:id/
        post_data['salary'] = 12000.00
        post_data['title'] = 'HSC Physics & Chemistry Tutor Needed in Uttara'
        edit_res = self.client.put(f'/api/tuition-posts/{post_id}/', post_data, format='json')
        self.assertEqual(edit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(edit_res.data['salary']), 12000.00)

        # 4. Guardian 2 attempts to edit Guardian 1's post -> Expect HTTP 403 Forbidden
        self.client.force_authenticate(user=self.guardian2)
        unauthorized_edit = self.client.put(f'/api/tuition-posts/{post_id}/', post_data, format='json')
        self.assertEqual(unauthorized_edit.status_code, status.HTTP_403_FORBIDDEN)

        # 5. Guardian 2 attempts to delete Guardian 1's post -> Expect HTTP 403 Forbidden
        unauthorized_delete = self.client.delete(f'/api/tuition-posts/{post_id}/')
        self.assertEqual(unauthorized_delete.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Guardian 1 deletes post -> Expect HTTP 204 No Content
        self.client.force_authenticate(user=self.guardian1)
        delete_res = self.client.delete(f'/api/tuition-posts/{post_id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_02_tutor_applications_list(self):
        """
        Test tutor applying for post and retrieving application with post details.
        """
        # Create a post as Guardian 1
        post = TuitionPost.objects.create(
            guardian=self.guardian1,
            title='Class 10 Math Tutor',
            subject='Mathematics',
            location='Dhanmondi, Dhaka',
            salary=8500.00,
        )

        # Tutor 1 submits application
        self.client.force_authenticate(user=self.tutor1)
        app_res = self.client.post(
            '/api/applications/',
            {'post': post.id, 'cover_note': 'I am qualified for Math tutoring.'},
            format='json',
        )
        self.assertEqual(app_res.status_code, status.HTTP_201_CREATED)

        # Tutor 1 lists applications
        list_res = self.client.get('/api/applications/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)
        app_data = list_res.data[0]
        self.assertEqual(app_data['post_title'], 'Class 10 Math Tutor')
        self.assertEqual(app_data['post_subject'], 'Mathematics')
        self.assertEqual(app_data['post_location'], 'Dhanmondi, Dhaka')
        self.assertEqual(app_data['status'], 'pending')

    def test_03_tutor_real_cv_file_upload(self):
        """
        Test PDF file upload endpoint for tutor CV.
        """
        self.client.force_authenticate(user=self.tutor1)

        # Mock PDF file
        pdf_file = SimpleUploadedFile(
            'Tutor_Resume_Test.pdf',
            b'%PDF-1.4 sample pdf content bytes',
            content_type='application/pdf',
        )

        upload_res = self.client.post(
            '/api/tutor/upload-cv/',
            {'cv': pdf_file},
            format='multipart',
        )
        self.assertEqual(upload_res.status_code, status.HTTP_200_OK)
        self.assertEqual(upload_res.data['cv_name'], 'Tutor_Resume_Test.pdf')
        self.assertIn('/media/cvs/', upload_res.data['cv'])

        # Verify profile model updated
        tutor_profile = TutorProfile.objects.get(user=self.tutor1)
        self.assertEqual(tutor_profile.cv_name, 'Tutor_Resume_Test.pdf')
        self.assertTrue(bool(tutor_profile.cv))

    def test_04_application_status_update_and_notifications(self):
        """
        Test guardian accepting an application, closing post, creating tutor notification,
        and tutor marking notification as read.
        """
        # Create post as Guardian 1
        post = TuitionPost.objects.create(
            guardian=self.guardian1,
            title='Class 12 Physics Tutor',
            subject='Physics',
            location='Gulshan, Dhaka',
            status='open',
        )

        # Create application from Tutor 1
        app = Application.objects.create(
            tutor=self.tutor1,
            post=post,
            cover_note='Excited to teach Physics',
            status='pending',
        )

        # Guardian 2 attempts to accept app -> 403 Forbidden
        self.client.force_authenticate(user=self.guardian2)
        unauth_res = self.client.patch(f'/api/applications/{app.id}/', {'status': 'accepted'}, format='json')
        self.assertEqual(unauth_res.status_code, status.HTTP_403_FORBIDDEN)

        # Guardian 1 accepts app -> 200 OK
        self.client.force_authenticate(user=self.guardian1)
        accept_res = self.client.patch(f'/api/applications/{app.id}/', {'status': 'accepted'}, format='json')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_res.data['status'], 'accepted')

        # Check post is now closed
        post.refresh_from_db()
        self.assertEqual(post.status, 'closed')

        # Tutor 1 checks notifications
        self.client.force_authenticate(user=self.tutor1)
        notif_res = self.client.get('/api/notifications/')
        self.assertEqual(notif_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(notif_res.data), 1)
        notif_id = notif_res.data[0]['id']
        self.assertIn("was accepted!", notif_res.data[0]['message'])
        self.assertFalse(notif_res.data[0]['is_read'])

        # Tutor 1 marks notification as read
        read_res = self.client.put(f'/api/notifications/{notif_id}/read/')
        self.assertEqual(read_res.status_code, status.HTTP_200_OK)
        self.assertTrue(read_res.data['is_read'])

    def test_05_favorites_and_reviews_end_to_end(self):
        """
        Test favoriting/unfavoriting tutors, listing favorites, and writing reviews for hired tutors.
        """
        # Ensure tutor1 has a profile
        TutorProfile.objects.get_or_create(
            user=self.tutor1,
            defaults={'bio': 'Physics teacher', 'subjects': 'Physics'}
        )

        # 1. Guardian 1 favorites Tutor 1 -> 201 Created
        self.client.force_authenticate(user=self.guardian1)
        fav_res = self.client.post(f'/api/favorites/{self.tutor1.id}/')
        self.assertEqual(fav_res.status_code, status.HTTP_201_CREATED)

        # 2. Guardian 1 lists favorites -> 200 OK, contains tutor1
        fav_list = self.client.get('/api/favorites/')
        self.assertEqual(fav_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(fav_list.data), 1)
        self.assertEqual(fav_list.data[0]['tutor_id'], self.tutor1.id)
        self.assertTrue(fav_list.data[0]['is_favorited'])

        # 3. Guardian 1 attempts to review Tutor 1 BEFORE hiring -> 400 Bad Request
        review_bad = self.client.post('/api/reviews/', {'tutor': self.tutor1.id, 'rating': 5, 'comment': 'Great!'}, format='json')
        self.assertEqual(review_bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('after hiring them', review_bad.data['error'])

        # 4. Guardian 1 creates post & accepts Tutor 1's application
        post = TuitionPost.objects.create(guardian=self.guardian1, title='Physics Class', subject='Physics')
        app = Application.objects.create(tutor=self.tutor1, post=post, status='accepted')

        # 5. Guardian 1 reviews Tutor 1 -> 201 Created
        review_ok = self.client.post('/api/reviews/', {'tutor': self.tutor1.id, 'rating': 5, 'comment': 'Outstanding teacher!'}, format='json')
        self.assertEqual(review_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(review_ok.data['rating'], 5)

        # 6. Public user fetches Tutor 1's reviews -> 200 OK
        self.client.logout()
        pub_reviews = self.client.get(f'/api/tutors/{self.tutor1.id}/reviews/')
        self.assertEqual(pub_reviews.status_code, status.HTTP_200_OK)
        self.assertEqual(pub_reviews.data['review_count'], 1)
        self.assertEqual(pub_reviews.data['average_rating'], 5.0)
        self.assertEqual(pub_reviews.data['reviews'][0]['reviewer_name'], 'guardian1')

    def test_06_admin_analytics_api_and_permissions(self):
        """
        Test Admin Analytics endpoint access permission (403 for non-admins)
        and accurate metric calculations for admin users.
        """
        # Create Admin user
        admin = User.objects.create_user(
            username='adminuser',
            email='adminuser@example.com',
            password='Password123!',
            role='admin',
        )

        # 1. Non-admin (Guardian 1) attempts GET /api/admin/analytics/ -> 403 Forbidden
        self.client.force_authenticate(user=self.guardian1)
        non_admin_res = self.client.get('/api/admin/analytics/')
        self.assertEqual(non_admin_res.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Admin user attempts GET /api/admin/analytics/ -> 200 OK
        self.client.force_authenticate(user=admin)
        admin_res = self.client.get('/api/admin/analytics/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)

        data = admin_res.data
        self.assertIn('total_users', data)
        self.assertIn('total_guardians', data)
        self.assertIn('total_tutors', data)
        self.assertIn('signups_per_week', data)
        self.assertEqual(len(data['signups_per_week']), 8)



