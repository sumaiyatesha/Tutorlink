# accounts/serializers.py — Converts data between Python models and JSON for TutorLink.

from rest_framework import serializers
from django.db.models import Avg
from .models import User, GuardianProfile, TutorProfile, TuitionPost, Application, Notification, Favorite, Review
from .utils import haversine_distance, get_district_coordinates


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration.
    Accepts: username, email, password, role.
    """

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def validate_role(self, value):
        if value not in ['guardian', 'tutor']:
            raise serializers.ValidationError("Role must be 'guardian' or 'tutor'.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
        )

        # Create corresponding profile instance automatically
        if user.role == 'tutor':
            TutorProfile.objects.create(user=user)
        else:
            GuardianProfile.objects.create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Returns user information for /api/auth/me/.
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined']


class GuardianProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for GuardianProfile, including latitude and longitude.
    """

    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = GuardianProfile
        fields = ['id', 'username', 'email', 'phone', 'location', 'latitude', 'longitude']


class TutorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for TutorProfile, including latitude, longitude, and distance_km when viewed by a guardian.
    """

    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    distance_km = serializers.SerializerMethodField()

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
            'latitude',
            'longitude',
            'available_days',
            'expected_salary',
            'distance_km',
        ]

    def get_distance_km(self, obj):
        """
        Calculates distance between this tutor and requesting guardian's profile or active post.
        Returns null if lat/lng is missing on either side.
        """
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None

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
    Serializer for TuitionPost requirements.
    Calculates dynamic 'distance_km' using Haversine formula relative to the requesting tutor/user.
    """

    guardian_name = serializers.CharField(source='guardian.username', read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = TuitionPost
        fields = [
            'id',
            'guardian',
            'guardian_name',
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

    def get_distance_km(self, obj):
        """
        Calculates distance in km between requesting user's profile and this tuition post.
        """
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None

        user = request.user
        user_lat, user_lng = None, None

        if hasattr(user, 'tutor_profile') and user.tutor_profile:
            user_lat = user.tutor_profile.latitude
            user_lng = user.tutor_profile.longitude
        elif hasattr(user, 'guardian_profile') and user.guardian_profile:
            user_lat = user.guardian_profile.latitude
            user_lng = user.guardian_profile.longitude

        if user_lat is None or user_lng is None:
            return None

        # Determine post coordinates (direct, guardian profile fallback, or district lookup)
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

        return haversine_distance(user_lat, user_lng, post_lat, post_lng)


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for Applications submitted by tutors.
    Includes applicant details, post information, and distance_km relative to the post location.
    """

    tutor_name = serializers.CharField(source='tutor.username', read_only=True)
    tutor_email = serializers.CharField(source='tutor.email', read_only=True)
    tutor_subjects = serializers.SerializerMethodField()
    post_title = serializers.CharField(source='post.title', read_only=True)
    post_subject = serializers.CharField(source='post.subject', read_only=True)
    post_location = serializers.CharField(source='post.location', read_only=True)
    post_salary = serializers.DecimalField(source='post.salary', max_digits=10, decimal_places=2, read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'tutor',
            'tutor_name',
            'tutor_email',
            'tutor_subjects',
            'post',
            'post_title',
            'post_subject',
            'post_location',
            'post_salary',
            'cover_note',
            'status',
            'created_at',
            'distance_km',
        ]
        read_only_fields = ['tutor']

    def get_tutor_subjects(self, obj):
        tutor_profile = getattr(obj.tutor, 'tutor_profile', None)
        return tutor_profile.subjects if tutor_profile else ''

    def get_distance_km(self, obj):
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
    Serializer for Notification model.
    """

    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'is_read', 'created_at']
        read_only_fields = ['user']


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model.
    Includes reviewer_name (username) for display on tutor profile/detail pages.
    """

    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'reviewer_name', 'tutor', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'tutor']


class TutorCardSerializer(serializers.ModelSerializer):
    """
    Serializer for listing tutors in Browse Tutors and Favorites pages.
    Includes average rating, review count, and is_favorited status for request.user.
    """

    tutor_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    cv_url = serializers.FileField(source='cv', read_only=True)
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
        avg = Review.objects.filter(tutor=obj.user).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else None

    def get_review_count(self, obj):
        return Review.objects.filter(tutor=obj.user).count()

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'guardian':
            return Favorite.objects.filter(guardian=request.user, tutor=obj.user).exists()
        return False

    def get_is_subscribed(self, obj):
        from subscriptions.models import Subscription
        return Subscription.objects.filter(user=obj.user, status='active').exists()

    def get_is_priority(self, obj):
        return self.get_is_subscribed(obj)


