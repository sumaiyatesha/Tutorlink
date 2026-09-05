# accounts/urls.py — API endpoint routes for auth, profiles, tuition posts, and applications.

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    MeView,
    TutorProfileView,
    TutorCVUploadView,
    GuardianProfileView,
    TuitionPostListCreateView,
    TuitionPostDetailView,
    ApplicationListCreateView,
    ApplicationDetailView,
    NotificationListView,
    NotificationMarkReadView,
    FavoriteToggleView,
    FavoriteListView,
    ReviewListCreateView,
    TutorReviewListView,
    TutorListView,
    TutorDetailView,
    AdminAnalyticsView,
)

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),

    # Profile endpoints
    path('tutor/profile/', TutorProfileView.as_view(), name='tutor_profile'),
    path('tutor/upload-cv/', TutorCVUploadView.as_view(), name='tutor_upload_cv'),
    path('guardian/profile/', GuardianProfileView.as_view(), name='guardian_profile'),

    # Tuition posts endpoints
    path('tuition-posts/', TuitionPostListCreateView.as_view(), name='tuition_posts'),
    path('tuition-posts/<int:pk>/', TuitionPostDetailView.as_view(), name='tuition_post_detail'),

    # Applications endpoints
    path('applications/', ApplicationListCreateView.as_view(), name='applications'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application_detail'),

    # Notifications endpoints
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),

    # Favorites endpoints
    path('favorites/', FavoriteListView.as_view(), name='favorites_list'),
    path('favorites/<int:tutor_id>/', FavoriteToggleView.as_view(), name='favorite_toggle'),

    # Reviews endpoints
    path('reviews/', ReviewListCreateView.as_view(), name='reviews_create'),
    path('tutors/', TutorListView.as_view(), name='tutors_list'),
    path('tutors/<int:tutor_id>/', TutorDetailView.as_view(), name='tutor_detail'),
    path('tutors/<int:tutor_id>/reviews/', TutorReviewListView.as_view(), name='tutor_reviews'),

    # Admin Analytics endpoint
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
]
