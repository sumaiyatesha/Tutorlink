"""
TutorLink - Accounts Serializers (server/accounts/serializers.py)

Serializers in Django REST Framework convert complex database model instances
into Python dictionaries (which become JSON) and validate incoming JSON data
sent by frontend React clients.

Serializers defined in this file:
1. RegisterSerializer: Validates new user signup and creates user + profile.
2. UserSerializer: Formats basic logged-in user information.
3. GuardianProfileSerializer: Handles Guardian profile details and GPS coordinates.
4. TutorProfileSerializer: Handles Tutor profile details and calculates distance to Guardian.
5. TuitionPostSerializer: Formats tuition posts and calculates distance to requesting Tutor.
6. ApplicationSerializer: Formats tutor job applications and candidate distance.
7. NotificationSerializer: Formats notification alerts.
8. ReviewSerializer: Formats 1-5 star ratings and reviews.
9. TutorCardSerializer: Formats tutor directory cards (rating, reviews, favorite status).
"""

from rest_framework import serializers
from django.db.models import Avg
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
from .utils import haversine_distance, get_district_coordinates


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user signup (POST /api/auth/register/).
    - Validates password minimum length (8 characters).
    - Checks that the role is either 'guardian' or 'tutor'.
    - Automatically creates the associated Profile model.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def validate_role(self, value):
        """Ensure role is either 'guardian' or 'tutor'."""
        if value not in ['guardian', 'tutor']:
            raise serializers.ValidationError("Role must be 'guardian' or 'tutor'.")
        return value

    def create(self, validated_data):
        """Create the user and auto-create the corresponding profile."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
        )

        # Automatically create GuardianProfile or TutorProfile
        if user.role == 'tutor':
            TutorProfile.objects.create(user=user)
        else:
            GuardianProfile.objects.create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Formats the currently authenticated user's profile info (GET /api/auth/me/).
    Includes whether their role-specific profile is complete.
    """
    is_profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined', 'is_profile_complete']

    def get_is_profile_complete(self, obj):
        if obj.role == 'guardian' and hasattr(obj, 'guardian_profile'):
            return obj.guardian_profile.is_profile_complete
        if obj.role == 'tutor' and hasattr(obj, 'tutor_profile'):
            return obj.tutor_profile.is_profile_complete
        return True


class GuardianProfileSerializer(serializers.ModelSerializer):
    """
    Formats GuardianProfile data for viewing and editing.
    Includes username, email, phone, nid_no, address, coordinates, and completeness status.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    is_profile_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = GuardianProfile
        fields = ['id', 'username', 'email', 'phone', 'nid_no', 'location', 'latitude', 'longitude', 'is_profile_complete']


class TutorProfileSerializer(serializers.ModelSerializer):
    """
    Formats TutorProfile data. When viewed by an authenticated Guardian,
    it dynamically calculates the distance in km between the Guardian and Tutor.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    distance_km = serializers.SerializerMethodField()
    is_profile_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = TutorProfile
        fields = [
            'id',
            'username',
            'email',
            'bio',
            'subjects',
            'cv',
            'cv_name',
            'teaching_preferences',
            'location',
            'phone',
            'nid_no',
            'is_currently_student',
            'student_id',
            'certificate',
            'certificate_name',
            'latitude',
            'longitude',
            'available_days',
            'expected_salary',
            'distance_km',
            'is_profile_complete',
        ]

    def get_distance_km(self, obj):
        """
        Calculate distance between this tutor and the requesting guardian.
        Returns distance in km or None if coordinates are missing.
        """
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None

        # Check if requesting user has a guardian profile with coordinates
        user = request.user
        user_lat, user_lng = None, None

        if hasattr(user, 'guardian_profile') and user.guardian_profile:
            user_lat = user.guardian_profile.latitude
            user_lng = user.guardian_profile.longitude

        if user_lat is None or user_lng is None or obj.latitude is None or obj.longitude is None:
            return None

        return haversine_distance(user_lat, user_lng, obj.latitude, obj.longitude)


class TuitionPostSerializer(serializers.ModelSerializer):
    """
    Formats tuition posts and dynamically calculates distance_km
    relative to the requesting tutor's location.
    Also exposes guardian_phone when the requesting tutor has received
    a demo offer ('demo_requested') or is accepted ('accepted').
    """
    guardian_name = serializers.CharField(source='guardian.username', read_only=True)
    guardian_phone = serializers.SerializerMethodField()
    my_application_status = serializers.SerializerMethodField()
    my_application_id = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = TuitionPost
        fields = [
            'id',
            'guardian',
            'guardian_name',
            'guardian_phone',
            'my_application_status',
            'my_application_id',
            'title',
            'description',
            'subject',
            'category',
            'course',
            'days_per_week',
            'preferred_days',
            'preferred_time',
            'duration',
            'method',
            'salary',
            'students',
            'preferred_tutor_gender',
            'location',
            'latitude',
            'longitude',
            'status',
            'created_at',
            'distance_km',
        ]
        read_only_fields = ['guardian']

    def get_my_application(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return None
        if getattr(user, 'role', '') != 'tutor':
            return None
        from accounts.models import Application
        return Application.objects.filter(post=obj, tutor=user).first()

    def get_my_application_status(self, obj):
        app = self.get_my_application(obj)
        return app.status if app else None

    def get_my_application_id(self, obj):
        app = self.get_my_application(obj)
        return app.id if app else None

    def get_guardian_phone(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return None

        # Guardian or staff can view their own contact number
        if user == obj.guardian or getattr(user, 'is_staff', False):
            guardian_prof = getattr(obj.guardian, 'guardian_profile', None)
            return guardian_prof.phone if guardian_prof else ''

        # Tutor can view guardian phone if they got a demo offer or were accepted
        app = self.get_my_application(obj)
        if app and app.status in ['demo_requested', 'accepted']:
            guardian_prof = getattr(obj.guardian, 'guardian_profile', None)
            return guardian_prof.phone if guardian_prof else ''

        return None


    def get_distance_km(self, obj):
        """
        Calculate distance in km between the logged-in user and this tuition post.
        """
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None

        user = request.user
        user_lat, user_lng = None, None

        # Step 1: Get user's coordinates (from tutor or guardian profile)
        if hasattr(user, 'tutor_profile') and user.tutor_profile:
            user_lat = user.tutor_profile.latitude
            user_lng = user.tutor_profile.longitude
        elif hasattr(user, 'guardian_profile') and user.guardian_profile:
            user_lat = user.guardian_profile.latitude
            user_lng = user.guardian_profile.longitude

        if user_lat is None or user_lng is None:
            return None

        # Step 2: Determine post coordinates (from post, or fallback to district table)
        post_lat = obj.latitude
        post_lng = obj.longitude
        
        if post_lat is None or post_lng is None:
            guardian_prof = getattr(obj.guardian, 'guardian_profile', None)
            if guardian_prof and guardian_prof.latitude is not None and guardian_prof.longitude is not None:
                post_lat = guardian_prof.latitude
                post_lng = guardian_prof.longitude

        if post_lat is None or post_lng is None:
            post_coords = get_district_coordinates(obj.location)
            if post_coords:
                post_lat, post_lng = post_coords

        if post_lat is None or post_lng is None:
            return None

        # Step 3: Compute Haversine distance
        return haversine_distance(user_lat, user_lng, post_lat, post_lng)


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Formats tuition applications submitted by tutors.
    Includes applicant info, post summary, distance between tutor and post,
    tutor CV for guardian evaluation, and reveals guardian_phone when status is 'demo_requested' or 'accepted'.
    """
    tutor_name = serializers.CharField(source='tutor.username', read_only=True)
    tutor_email = serializers.CharField(source='tutor.email', read_only=True)
    tutor_subjects = serializers.SerializerMethodField()
    tutor_cv = serializers.SerializerMethodField()
    tutor_cv_name = serializers.SerializerMethodField()
    post_title = serializers.CharField(source='post.title', read_only=True)
    post_subject = serializers.CharField(source='post.subject', read_only=True)
    post_location = serializers.CharField(source='post.location', read_only=True)
    post_salary = serializers.DecimalField(source='post.salary', max_digits=10, decimal_places=2, read_only=True)
    guardian_name = serializers.CharField(source='post.guardian.username', read_only=True)
    guardian_phone = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'tutor',
            'tutor_name',
            'tutor_email',
            'tutor_subjects',
            'tutor_cv',
            'tutor_cv_name',
            'post',
            'post_title',
            'post_subject',
            'post_location',
            'post_salary',
            'guardian_name',
            'guardian_phone',
            'cover_note',
            'status',
            'created_at',
            'distance_km',
        ]
        read_only_fields = ['tutor']

    def get_tutor_cv(self, obj):
        """Provide absolute URL to tutor's uploaded CV file so guardian can view it."""
        tutor_profile = getattr(obj.tutor, 'tutor_profile', None)
        if tutor_profile and tutor_profile.cv:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(tutor_profile.cv.url)
            return tutor_profile.cv.url
        return None

    def get_tutor_cv_name(self, obj):
        """Provide human-friendly file name for tutor's CV."""
        tutor_profile = getattr(obj.tutor, 'tutor_profile', None)
        if tutor_profile and tutor_profile.cv_name:
            return tutor_profile.cv_name
        if tutor_profile and tutor_profile.cv:
            return tutor_profile.cv.name.split('/')[-1]
        return None

    def get_guardian_phone(self, obj):
        # If tutor is accepted or selected for demo, reveal guardian phone
        if obj.status in ['demo_requested', 'accepted']:
            guardian_prof = getattr(obj.post.guardian, 'guardian_profile', None)
            return guardian_prof.phone if guardian_prof else ''
        return None


    def get_tutor_subjects(self, obj):
        """Retrieve tutor's subjects from their profile."""
        tutor_profile = getattr(obj.tutor, 'tutor_profile', None)
        return tutor_profile.subjects if tutor_profile else ''

    def get_distance_km(self, obj):
        """Calculate distance between tutor and post location."""
        tutor_profile = getattr(obj.tutor, 'tutor_profile', None)
        if not tutor_profile or tutor_profile.latitude is None or tutor_profile.longitude is None:
            return None

        post_lat = obj.post.latitude
        post_lng = obj.post.longitude
        
        if post_lat is None or post_lng is None:
            guardian_prof = getattr(obj.post.guardian, 'guardian_profile', None)
            if guardian_prof and guardian_prof.latitude is not None and guardian_prof.longitude is not None:
                post_lat = guardian_prof.latitude
                post_lng = guardian_prof.longitude

        if post_lat is None or post_lng is None:
            post_coords = get_district_coordinates(obj.post.location)
            if post_coords:
                post_lat, post_lng = post_coords

        if post_lat is None or post_lng is None:
            return None

        return haversine_distance(
            tutor_profile.latitude,
            tutor_profile.longitude,
            post_lat,
            post_lng,
        )


class NotificationSerializer(serializers.ModelSerializer):
    """
    Formats system notification alerts for the current user.
    """
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'is_read', 'created_at']
        read_only_fields = ['user']


class ReviewSerializer(serializers.ModelSerializer):
    """
    Formats tutor ratings (1 to 5 stars) and review comments.
    """
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'reviewer_name', 'tutor', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'tutor']


class TutorCardSerializer(serializers.ModelSerializer):
    """
    Formats tutor summary cards shown in Browse Tutors and Favorites pages.
    Computes average rating, total reviews, and bookmark state.
    """
    tutor_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    cv_url = serializers.FileField(source='cv', read_only=True)
    certificate_url = serializers.FileField(source='certificate', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    is_priority = serializers.SerializerMethodField()

    class Meta:
        model = TutorProfile
        fields = [
            'id',
            'tutor_id',
            'username',
            'email',
            'bio',
            'subjects',
            'cv_name',
            'cv_url',
            'teaching_preferences',
            'location',
            'phone',
            'nid_no',
            'is_currently_student',
            'student_id',
            'certificate_name',
            'certificate_url',
            'latitude',
            'longitude',
            'available_days',
            'expected_salary',
            'average_rating',
            'review_count',
            'is_favorited',
            'is_subscribed',
            'is_priority',
        ]

    def get_average_rating(self, obj):
        """Calculate average star rating from all received reviews."""
        avg = Review.objects.filter(tutor=obj.user).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else None

    def get_review_count(self, obj):
        """Count total reviews received by this tutor."""
        return Review.objects.filter(tutor=obj.user).count()

    def get_is_favorited(self, obj):
        """Check if currently logged-in guardian has bookmarked this tutor."""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'guardian':
            return Favorite.objects.filter(guardian=request.user, tutor=obj.user).exists()
        return False

    def get_is_subscribed(self, obj):
        """Check if tutor has an active subscription."""
        from subscriptions.models import Subscription
        return Subscription.objects.filter(user=obj.user, status='active').exists()

    def get_is_priority(self, obj):
        """Subscribed tutors receive priority search placement."""
        return self.get_is_subscribed(obj)
