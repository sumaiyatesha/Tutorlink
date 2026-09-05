from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg
from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User, GuardianProfile, TutorProfile, TuitionPost, Application, Notification, Favorite, Review
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


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """
    GET /api/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TutorProfileView(APIView):
    """
    GET /api/tutor/profile/
    PUT /api/tutor/profile/
    PATCH /api/tutor/profile/
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
        serializer = TutorProfileSerializer(profile, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TutorCVUploadView(APIView):
    """
    POST /api/tutor/upload-cv/
    Uploads a CV file (PDF) for the logged-in tutor using MultiPartParser.
    Saves file to TutorProfile.cv and updates TutorProfile.cv_name.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        if 'cv' not in request.FILES:
            return Response({'error': 'No CV file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['cv']
        profile, _ = TutorProfile.objects.get_or_create(user=request.user)

        profile.cv = uploaded_file
        profile.cv_name = uploaded_file.name
        profile.save()

        serializer = TutorProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GuardianProfileView(APIView):
    """
    GET /api/guardian/profile/
    PUT /api/guardian/profile/
    PATCH /api/guardian/profile/
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
        serializer = GuardianProfileSerializer(profile, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow guardians who created a post to edit or delete it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, 'guardian') and obj.guardian == request.user


class TuitionPostListCreateView(generics.ListCreateAPIView):
    """
    GET /api/tuition-posts/
    GET /api/tuition-posts/?mine=true
    POST /api/tuition-posts/
    """
    serializer_class = TuitionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = TuitionPost.objects.all().order_by('-created_at')
        location_param = self.request.query_params.get('location')
        if location_param:
            queryset = queryset.filter(location__icontains=location_param)

        mine_param = self.request.query_params.get('mine')
        if mine_param and mine_param.lower() == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(guardian=self.request.user)

        return queryset

    def perform_create(self, serializer):
        from .utils import get_district_coordinates

        # Set guardian coordinates automatically if available on guardian profile
        guardian_profile = getattr(self.request.user, 'guardian_profile', None)
        lat = guardian_profile.latitude if guardian_profile else None
        lng = guardian_profile.longitude if guardian_profile else None

        # Fallback to district coordinate mapping from location text if profile coords not set yet
        if lat is None or lng is None:
            location_str = self.request.data.get('location', '')
            district_coords = get_district_coordinates(location_str)
            if district_coords:
                lat, lng = district_coords

        serializer.save(guardian=self.request.user, latitude=lat, longitude=lng)


class TuitionPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/tuition-posts/:id/
    PUT /api/tuition-posts/:id/
    DELETE /api/tuition-posts/:id/
    """
    queryset = TuitionPost.objects.all()
    serializer_class = TuitionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]



class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET /api/applications/
    POST /api/applications/
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

    def perform_create(self, serializer):
        serializer.save(tutor=self.request.user)


class ApplicationDetailView(APIView):
    """
    PATCH /api/applications/<id>/
    Allows guardian (owner of the post) to update application status to 'accepted' or 'rejected'.
    When 'accepted': sets TuitionPost.status to 'closed' and creates a Notification for the tutor.
    When 'rejected': creates a Notification for the tutor.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            application = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only allow the guardian who created the tuition post to update application status
        if application.post.guardian != request.user:
            return Response({'error': 'You do not have permission to update this application.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response({'error': "Status must be 'accepted' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        application.status = new_status
        application.save()

        # Handle accept / reject triggers
        if new_status == 'accepted':
            # Set related post to closed
            application.post.status = 'closed'
            application.post.save()

            # Automatically create a TutorCommission record (15% of tuition salary) upon hire.
            # Note for Viva Defense:
            # We use application.post.salary directly as TuitionPost defines salary as a single Decimal figure.
            # 15% of this tuition salary is automatically logged as a pending commission obligation owed by the tutor.
            from subscriptions.models import TutorCommission
            from decimal import Decimal

            tuition_amt = application.post.salary
            commission_amt = round(Decimal(str(tuition_amt)) * Decimal('0.15'), 2)

            TutorCommission.objects.get_or_create(
                application=application,
                defaults={
                    'tutor': application.tutor,
                    'tuition_amount': tuition_amt,
                    'commission_amount': commission_amt,
                    'status': 'pending',
                }
            )

            # Create notification for tutor
            Notification.objects.create(
                user=application.tutor,
                message=f"Your application for '{application.post.subject}' was accepted!",
            )
        elif new_status == 'rejected':
            # Create notification for tutor
            Notification.objects.create(
                user=application.tutor,
                message=f"Your application for '{application.post.subject}' was not selected.",
            )

        serializer = ApplicationSerializer(application, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Lists current user's notifications, most recent first.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationMarkReadView(APIView):
    """
    PUT /api/notifications/<id>/read/
    Marks a single notification as read if it belongs to request.user.
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


class FavoriteToggleView(APIView):
    """
    POST /api/favorites/<tutor_id>/ — add a tutor to favorites (IsAuthenticated + IsGuardian)
    DELETE /api/favorites/<tutor_id>/ — remove a tutor from favorites (IsAuthenticated + IsGuardian)
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
        return Response({'status': 'favorited', 'is_favorited': True}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

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
    GET /api/favorites/ — list the guardian's favorited tutors (IsAuthenticated + IsGuardian)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guardian':
            return Response({'error': 'Only guardians can view favorites.'}, status=status.HTTP_403_FORBIDDEN)

        favorited_tutor_ids = Favorite.objects.filter(guardian=request.user).values_list('tutor_id', flat=True)
        tutor_profiles = TutorProfile.objects.filter(user_id__in=favorited_tutor_ids)
        serializer = TutorCardSerializer(tutor_profiles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewListCreateView(APIView):
    """
    POST /api/reviews/ (IsAuthenticated + IsGuardian)
    Allows a guardian to submit a review for a tutor ONLY if they have an accepted application.
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
    GET /api/tutors/<tutor_id>/reviews/ (public, AllowAny)
    Lists reviews for a tutor with rating summary.
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


class TutorListView(APIView):
    """
    GET /api/tutors/ (public, AllowAny)
    Lists all tutor profiles with rating summary & favorite status.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from subscriptions.models import Subscription

        # Get user IDs of all active subscribers
        active_subscriber_user_ids = set(
            Subscription.objects.filter(status='active').values_list('user_id', flat=True)
        )

        tutor_profiles = list(TutorProfile.objects.all().select_related('user'))

        # Boost subscribed tutors so they appear at the top of listings
        tutor_profiles.sort(key=lambda tp: tp.user_id not in active_subscriber_user_ids)

        serializer = TutorCardSerializer(tutor_profiles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TutorDetailView(APIView):
    """
    GET /api/tutors/<tutor_id>/ (public, AllowAny)
    Gets detailed tutor profile including rating, review count, favorite status, and whether current guardian can review.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, tutor_id):
        try:
            profile = TutorProfile.objects.select_related('user').get(user_id=tutor_id)
        except TutorProfile.DoesNotExist:
            return Response({'error': 'Tutor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TutorCardSerializer(profile, context={'request': request})
        data = serializer.data

        # Check if request.user is a guardian who has hired this tutor
        can_review = False
        if request.user.is_authenticated and request.user.role == 'guardian':
            can_review = Application.objects.filter(
                tutor_id=tutor_id,
                post__guardian=request.user,
                status='accepted'
            ).exists()

        data['can_review'] = can_review
        return Response(data, status=status.HTTP_200_OK)


class IsAdmin(permissions.BasePermission):
    """
    Custom permission class to check request.user.role == 'admin'.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class AdminAnalyticsView(APIView):
    """
    GET /api/admin/analytics/ (IsAuthenticated + IsAdmin)
    Returns aggregated system analytics and 8-week signup metrics for admin dashboard & charts.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()

        # User counts
        total_users = User.objects.count()
        total_guardians = User.objects.filter(role='guardian').count()
        total_tutors = User.objects.filter(role='tutor').count()
        total_admins = User.objects.filter(role='admin').count()

        # Tutor verification
        tutors_verified = TutorProfile.objects.filter(is_verified=True).count()
        tutors_unverified = TutorProfile.objects.filter(is_verified=False).count()

        # Tuition post status
        posts_open = TuitionPost.objects.filter(status='open').count()
        posts_closed = TuitionPost.objects.filter(status='closed').count()
        total_posts = TuitionPost.objects.count()

        # Application status
        total_applications = Application.objects.count()
        applications_pending = Application.objects.filter(status='pending').count()
        applications_accepted = Application.objects.filter(status='accepted').count()
        applications_rejected = Application.objects.filter(status='rejected').count()

        # Moderation reports (Reports feature not built yet — return 0 as specified)
        total_reports = 0
        reports_open = 0

        # Signups per week for the last 8 weeks
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
            'total_reports': total_reports,
            'reports_open': reports_open,
            'signups_per_week': signups_per_week,
        }, status=status.HTTP_200_OK)



