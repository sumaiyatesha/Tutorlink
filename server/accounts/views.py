"""
TutorLink - Accounts API Views (server/accounts/views.py)

This module handles all REST API endpoints for the core platform:
1. Authentication & Profile:
   - RegisterView: Creates new guardian or tutor accounts.
   - MeView: Returns the logged-in user's profile details.
   - TutorProfileView: Allows tutors to view/update their profile.
   - TutorCVUploadView: Handles CV PDF file uploads for tutors.
   - GuardianProfileView: Allows guardians to view/update their profile.
2. Tuition Posts:
   - TuitionPostListCreateView: Lists open tuition jobs or creates new posts.
   - TuitionPostDetailView: Fetches, updates, or deletes an individual tuition post.
3. Applications:
   - ApplicationListCreateView: Tutors apply for jobs, guardians view applicants.
   - ApplicationDetailView: Guardians accept/reject tutor applications & log platform commission.
4. Notifications:
   - NotificationListView: Fetches user alerts.
   - NotificationMarkReadView: Marks an alert as read.
5. Bookmarks & Reviews:
   - FavoriteToggleView & FavoriteListView: Bookmark tutors for later.
   - ReviewListCreateView & TutorReviewListView: Rating & review system.
6. Public Directory:
   - TutorListView & TutorDetailView: Browse tutors with search, filter, and review stats.
7. Administration:
   - AdminAnalyticsView: System-wide metrics and signup growth charts.
"""

from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Avg
from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    User, 
    GuardianProfile, 
    TutorProfile, 
    TuitionPost, 
    Application, 
    Notification, 
    Favorite, 
    Review
)
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    GuardianProfileSerializer,
    TutorProfileSerializer,
    TuitionPostSerializer,
    ApplicationSerializer,
    NotificationSerializer,
    ReviewSerializer,
    TutorCardSerializer,
)


# ==========================================
# 1. AUTHENTICATION & USER PROFILE VIEWS
# ==========================================

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Allows any guest to register as a Guardian or Tutor.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the currently logged-in user's data using the JWT access token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TutorProfileView(APIView):
    """
    GET /api/tutor/profile/  -> Get tutor profile
    PUT /api/tutor/profile/  -> Full update
    PATCH /api/tutor/profile/ -> Partial update
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = TutorProfile.objects.get_or_create(user=request.user)
        serializer = TutorProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        return self.update(request, partial=False)

    def patch(self, request):
        return self.update(request, partial=True)

    def update(self, request, partial=False):
        profile, _ = TutorProfile.objects.get_or_create(user=request.user)
        serializer = TutorProfileSerializer(
            profile, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TutorCVUploadView(APIView):
    """
    POST /api/tutor/upload-cv/
    Uploads a CV file (PDF) for the logged-in tutor and stores it in the media directory.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        # Step 1: Check if file was included in request
        if 'cv' not in request.FILES:
            return Response({'error': 'No CV file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['cv']
        profile, _ = TutorProfile.objects.get_or_create(user=request.user)

        # Step 2: Save CV file and filename to tutor profile
        profile.cv = uploaded_file
        profile.cv_name = uploaded_file.name
        profile.save()

        serializer = TutorProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TutorCertificateUploadView(APIView):
    """
    POST /api/tutor/upload-certificate/
    Uploads an educational certificate or transcript for tutors who are not currently students.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        if 'certificate' not in request.FILES:
            return Response({'error': 'No certificate file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['certificate']
        profile, _ = TutorProfile.objects.get_or_create(user=request.user)

        profile.certificate = uploaded_file
        profile.certificate_name = uploaded_file.name
        profile.save()

        serializer = TutorProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GuardianProfileView(APIView):
    """
    GET /api/guardian/profile/  -> Get guardian profile
    PUT /api/guardian/profile/  -> Full update
    PATCH /api/guardian/profile/ -> Partial update
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = GuardianProfile.objects.get_or_create(user=request.user)
        serializer = GuardianProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        return self.update(request, partial=False)

    def patch(self, request):
        return self.update(request, partial=True)

    def update(self, request, partial=False):
        profile, _ = GuardianProfile.objects.get_or_create(user=request.user)
        serializer = GuardianProfileSerializer(
            profile, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 2. TUITION POST VIEWS
# ==========================================

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom Permission: Safe methods (GET) are allowed for everyone,
    but only the Guardian who created the post can edit (PUT/PATCH) or delete (DELETE) it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, 'guardian') and obj.guardian == request.user


class TuitionPostListCreateView(generics.ListCreateAPIView):
    """
    GET /api/tuition-posts/ -> Lists tuition jobs (filterable by location or ?mine=true)
    POST /api/tuition-posts/ -> Creates a new tuition post (Guardian only)
    """
    serializer_class = TuitionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = TuitionPost.objects.all().order_by('-created_at')
        
        # Optional filter by location
        location_param = self.request.query_params.get('location')
        if location_param:
            queryset = queryset.filter(location__icontains=location_param)

        # Optional filter for guardian's own posts
        mine_param = self.request.query_params.get('mine')
        if mine_param and mine_param.lower() == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(guardian=self.request.user)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Guards tuition post creation:
        Guardian must complete their profile status (contact number, NID number, and location)
        before they can post a tuition requirement.
        """
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check guardian role
        if getattr(user, 'role', '') != 'guardian' and not user.is_staff:
            return Response(
                {'error': 'Only registered guardians can post a tuition requirement.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check guardian profile completeness
        profile = getattr(user, 'guardian_profile', None)
        if not profile or not profile.is_profile_complete:
            missing = []
            if not profile or not (profile.phone and profile.phone.strip()):
                missing.append('Contact Number')
            if not profile or not (profile.nid_no and profile.nid_no.strip()):
                missing.append('NID Number')
            if not profile or not (profile.location and profile.location.strip()):
                missing.append('Location')

            return Response({
                'error': f'Profile incomplete. You must provide your {", ".join(missing)} in your profile before posting a tuition.',
                'missing_fields': missing,
                'is_profile_complete': False
            }, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        from .utils import get_district_coordinates

        # Step 1: Try to retrieve coordinates from the guardian's profile
        guardian_profile = getattr(self.request.user, 'guardian_profile', None)
        lat = guardian_profile.latitude if guardian_profile else None
        lng = guardian_profile.longitude if guardian_profile else None

        # Step 2: If profile has no coordinates, lookup from district name dictionary
        if lat is None or lng is None:
            location_str = self.request.data.get('location', '')
            district_coords = get_district_coordinates(location_str)
            if district_coords:
                lat, lng = district_coords

        serializer.save(guardian=self.request.user, latitude=lat, longitude=lng)


class TuitionPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/tuition-posts/<id>/   -> Retrieve a post
    PUT /api/tuition-posts/<id>/   -> Update a post (owner only)
    DELETE /api/tuition-posts/<id>/-> Delete a post (owner only)
    """
    queryset = TuitionPost.objects.all()
    serializer_class = TuitionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]


# ==========================================
# 3. JOB APPLICATION VIEWS
# ==========================================

class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET /api/applications/  -> Lists applications (tutor sees sent apps, guardian sees received apps)
    POST /api/applications/ -> Tutors apply for an open tuition post
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tutor':
            return Application.objects.filter(tutor=user).order_by('-created_at')
        elif user.role == 'guardian':
            return Application.objects.filter(post__guardian=user).order_by('-created_at')
        return Application.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Guards tutor job application submission:
        Tutor must complete their profile status:
        - Contact Number (phone)
        - NID Number (nid_no)
        - CV Document (cv) - Mandatory requirement
        - If currently student: Student ID (student_id)
        - If not currently student: Last institution certificate
        - Location
        """
        user = request.user
        if getattr(user, 'role', '') != 'tutor' and not user.is_staff:
            return Response({'error': 'Only registered tutors can apply for tuition jobs.'}, status=status.HTTP_403_FORBIDDEN)

        profile = getattr(user, 'tutor_profile', None)
        if not profile or not profile.is_profile_complete:
            missing = []
            if not profile or not (profile.phone and profile.phone.strip()):
                missing.append('Contact Number')
            if not profile or not (profile.nid_no and profile.nid_no.strip()):
                missing.append('NID Number')
            if not profile or not profile.cv:
                missing.append('CV Document')
            if not profile or (profile.is_currently_student and not (profile.student_id and profile.student_id.strip())):
                missing.append('Student ID')
            elif not profile or (not profile.is_currently_student and not (profile.certificate or profile.certificate_name)):
                missing.append('Last Institution Certificate')
            if not profile or not (profile.location and profile.location.strip()):
                missing.append('Location')

            return Response({
                'error': f'Profile incomplete. You must provide your {", ".join(missing)} in your profile before applying for tuitions.',
                'missing_fields': missing,
                'is_profile_complete': False
            }, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(tutor=self.request.user)


class ApplicationDetailView(APIView):
    """
    PATCH /api/applications/<id>/
    Allows the guardian who owns the post to accept or reject a tutor's application.
    When accepted:
    - Post status is changed to 'closed'.
    - Platform logs a 15% commission record for the tutor.
    - Tutor receives an acceptance notification.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        # Step 1: Find the application
        try:
            application = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Step 2: Ensure only the authoring guardian can accept/reject
        if application.post.guardian != request.user:
            return Response(
                {'error': 'You do not have permission to update this application.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        # Allow 'demo' as an intuitive alias for 'demo_requested'
        if new_status == 'demo':
            new_status = 'demo_requested'

        if new_status not in ['accepted', 'rejected', 'demo_requested']:
            return Response(
                {'error': "Status must be 'accepted', 'rejected', or 'demo_requested'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 3: Update application status
        application.status = new_status
        application.save()

        # Step 4: Handle Status-Specific Actions
        if new_status == 'accepted':
            # Mark the post as closed so no more applications are accepted
            application.post.status = 'closed'
            application.post.save()

            # Calculate and log the 15% platform commission fee (due within 10 days)
            from subscriptions.models import TutorCommission
            from datetime import timedelta
            from django.utils import timezone

            tuition_amt = application.post.salary
            commission_amt = round(Decimal(str(tuition_amt)) * Decimal('0.15'), 2)
            now = timezone.now()
            due_deadline = now + timedelta(days=10)

            TutorCommission.objects.get_or_create(
                application=application,
                defaults={
                    'tutor': application.tutor,
                    'tuition_amount': tuition_amt,
                    'commission_amount': commission_amt,
                    'status': 'pending',
                    'due_date': due_deadline,
                }
            )

            # Send acceptance alert to the tutor
            Notification.objects.create(
                user=application.tutor,
                message=f"Congratulations! Your application for '{application.post.subject}' was accepted. 15% platform commission ({commission_amt} BDT) is due within 10 days.",
            )
        elif new_status == 'demo_requested':
            # Send demo class selection alert to the tutor
            Notification.objects.create(
                user=application.tutor,
                message=f"Great news! You have been selected for a demo class for '{application.post.subject}' by guardian {request.user.username}. Please prepare your demo class.",
            )
        elif new_status == 'rejected':
            # Send rejection alert to the tutor
            Notification.objects.create(
                user=application.tutor,
                message=f"Your application for '{application.post.subject}' was not selected.",
            )

        serializer = ApplicationSerializer(application, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 4. NOTIFICATIONS
# ==========================================

class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Returns the current user's notifications sorted with newest first.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationMarkReadView(APIView):
    """
    PUT /api/notifications/<id>/read/
    Marks a single notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 5. FAVORITES (BOOKMARKS)
# ==========================================

class FavoriteToggleView(APIView):
    """
    POST /api/favorites/<tutor_id>/   -> Add a tutor to guardian favorites
    DELETE /api/favorites/<tutor_id>/ -> Remove a tutor from favorites
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tutor_id):
        if request.user.role != 'guardian':
            return Response({'error': 'Only guardians can favorite tutors.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            tutor = User.objects.get(pk=tutor_id, role='tutor')
        except User.DoesNotExist:
            return Response({'error': 'Tutor not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite, created = Favorite.objects.get_or_create(guardian=request.user, tutor=tutor)
        return Response(
            {'status': 'favorited', 'is_favorited': True}, 
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request, tutor_id):
        if request.user.role != 'guardian':
            return Response({'error': 'Only guardians can unfavorite tutors.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            tutor = User.objects.get(pk=tutor_id, role='tutor')
        except User.DoesNotExist:
            return Response({'error': 'Tutor not found.'}, status=status.HTTP_404_NOT_FOUND)

        Favorite.objects.filter(guardian=request.user, tutor=tutor).delete()
        return Response({'status': 'unfavorited', 'is_favorited': False}, status=status.HTTP_200_OK)


class FavoriteListView(APIView):
    """
    GET /api/favorites/
    Lists all tutors favorited by the logged-in guardian.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guardian':
            return Response({'error': 'Only guardians can view favorites.'}, status=status.HTTP_403_FORBIDDEN)

        favorited_tutor_ids = Favorite.objects.filter(guardian=request.user).values_list('tutor_id', flat=True)
        tutor_profiles = TutorProfile.objects.filter(user_id__in=favorited_tutor_ids)
        serializer = TutorCardSerializer(tutor_profiles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 6. REVIEWS & RATINGS
# ==========================================

class ReviewListCreateView(APIView):
    """
    POST /api/reviews/
    Allows a guardian to submit a 1-5 star review for a tutor they have hired.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'guardian':
            return Response({'error': 'Only guardians can review tutors.'}, status=status.HTTP_403_FORBIDDEN)

        tutor_id = request.data.get('tutor')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not tutor_id or rating is None:
            return Response({'error': 'Tutor ID and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except ValueError:
            return Response({'error': 'Rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tutor = User.objects.get(pk=tutor_id, role='tutor')
        except User.DoesNotExist:
            return Response({'error': 'Tutor not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate that guardian has hired this tutor (application status='accepted')
        has_hired = Application.objects.filter(
            tutor=tutor,
            post__guardian=request.user,
            status='accepted'
        ).exists()

        if not has_hired:
            return Response({'error': 'You can review this tutor after hiring them.'}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            reviewer=request.user,
            tutor=tutor,
            rating=rating,
            comment=comment
        )
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TutorReviewListView(APIView):
    """
    GET /api/tutors/<tutor_id>/reviews/
    Public endpoint: Returns all reviews and average star rating for a tutor.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, tutor_id):
        reviews = Review.objects.filter(tutor_id=tutor_id).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)

        avg = Review.objects.filter(tutor_id=tutor_id).aggregate(Avg('rating'))['rating__avg']
        avg_rating = round(float(avg), 1) if avg is not None else None
        review_count = reviews.count()

        return Response({
            'reviews': serializer.data,
            'average_rating': avg_rating,
            'review_count': review_count,
        }, status=status.HTTP_200_OK)


# ==========================================
# 7. PUBLIC TUTOR DIRECTORY
# ==========================================

class TutorListView(APIView):
    """
    GET /api/tutors/
    Public directory: Returns all tutor profiles.
    Subscribed tutors are placed at the top of results.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from subscriptions.models import Subscription

        # Step 1: Find all tutors with active subscriptions
        active_subscriber_user_ids = set(
            Subscription.objects.filter(status='active').values_list('user_id', flat=True)
        )

        tutor_profiles = list(TutorProfile.objects.all().select_related('user'))

        # Step 2: Sort subscribed tutors first
        tutor_profiles.sort(key=lambda tp: tp.user_id not in active_subscriber_user_ids)

        serializer = TutorCardSerializer(tutor_profiles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TutorDetailView(APIView):
    """
    GET /api/tutors/<tutor_id>/
    Public endpoint: Returns full tutor profile details.
    Also indicates whether the requesting guardian is eligible to write a review.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, tutor_id):
        try:
            profile = TutorProfile.objects.select_related('user').get(user_id=tutor_id)
        except TutorProfile.DoesNotExist:
            return Response({'error': 'Tutor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TutorCardSerializer(profile, context={'request': request})
        data = serializer.data

        # Check if the requesting user is a guardian who hired this tutor
        can_review = False
        if request.user.is_authenticated and request.user.role == 'guardian':
            can_review = Application.objects.filter(
                tutor_id=tutor_id,
                post__guardian=request.user,
                status='accepted'
            ).exists()

        data['can_review'] = can_review
        return Response(data, status=status.HTTP_200_OK)


# ==========================================
# 8. ADMIN ANALYTICS
# ==========================================

class IsAdmin(permissions.BasePermission):
    """Permission check ensuring only admin users can access analytics."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class AdminAnalyticsView(APIView):
    """
    GET /api/admin/analytics/
    Admin-only dashboard metrics: user counts, post stats, applications, and weekly signups.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()

        # Total counts by role
        total_users = User.objects.count()
        total_guardians = User.objects.filter(role='guardian').count()
        total_tutors = User.objects.filter(role='tutor').count()
        total_admins = User.objects.filter(role='admin').count()

        # Verification stats
        tutors_verified = TutorProfile.objects.filter(is_verified=True).count()
        tutors_unverified = TutorProfile.objects.filter(is_verified=False).count()

        # Post stats
        posts_open = TuitionPost.objects.filter(status='open').count()
        posts_closed = TuitionPost.objects.filter(status='closed').count()
        total_posts = TuitionPost.objects.count()

        # Application stats
        total_applications = Application.objects.count()
        applications_pending = Application.objects.filter(status='pending').count()
        applications_accepted = Application.objects.filter(status='accepted').count()
        applications_rejected = Application.objects.filter(status='rejected').count()

        # Signups per week over the last 8 weeks
        signups_per_week = []
        for i in range(7, -1, -1):
            start_date = now - timedelta(days=(i + 1) * 7)
            end_date = now - timedelta(days=i * 7)
            count = User.objects.filter(date_joined__gte=start_date, date_joined__lt=end_date).count()
            week_label = f"W-{i+1}" if i > 0 else "This Week"
            signups_per_week.append({
                'week_label': week_label,
                'count': count,
            })

        return Response({
            'total_users': total_users,
            'total_guardians': total_guardians,
            'total_tutors': total_tutors,
            'total_admins': total_admins,
            'tutors_verified': tutors_verified,
            'tutors_unverified': tutors_unverified,
            'total_posts': total_posts,
            'posts_open': posts_open,
            'posts_closed': posts_closed,
            'total_applications': total_applications,
            'applications_pending': applications_pending,
            'applications_accepted': applications_accepted,
            'applications_rejected': applications_rejected,
            'total_reports': 0,
            'reports_open': 0,
            'signups_per_week': signups_per_week,
        }, status=status.HTTP_200_OK)
