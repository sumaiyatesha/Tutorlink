"""
TutorLink - Accounts URL Configuration (server/accounts/urls.py)

This file routes incoming HTTP requests prefixed with '/api/auth/' to their
corresponding Python view functions and JWT token generators.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    MeView,
    TutorProfileView,
    TutorCVUploadView,
    TutorCertificateUploadView,
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
    # -------------------------------------------------------------
    # 1. Authentication (JWT Tokens & Current User)
    # -------------------------------------------------------------
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),

    # -------------------------------------------------------------
    # 2. User Profiles (Guardians & Tutors)
    # -------------------------------------------------------------
    path('tutor/profile/', TutorProfileView.as_view(), name='tutor_profile'),
    path('tutor/upload-cv/', TutorCVUploadView.as_view(), name='tutor_upload_cv'),
    path('tutor/upload-certificate/', TutorCertificateUploadView.as_view(), name='tutor_upload_certificate'),
    path('guardian/profile/', GuardianProfileView.as_view(), name='guardian_profile'),

    # -------------------------------------------------------------
    # 3. Tuition Posts (Job Listings)
    # -------------------------------------------------------------
    path('tuition-posts/', TuitionPostListCreateView.as_view(), name='tuition_posts'),
    path('tuition-posts/<int:pk>/', TuitionPostDetailView.as_view(), name='tuition_post_detail'),

    # -------------------------------------------------------------
    # 4. Job Applications
    # -------------------------------------------------------------
    path('applications/', ApplicationListCreateView.as_view(), name='applications'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application_detail'),

    # -------------------------------------------------------------
    # 5. Notifications
    # -------------------------------------------------------------
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),

    # -------------------------------------------------------------
    # 6. Bookmarks / Favorites
    # -------------------------------------------------------------
    path('favorites/', FavoriteListView.as_view(), name='favorites_list'),
    path('favorites/<int:tutor_id>/', FavoriteToggleView.as_view(), name='favorite_toggle'),

    # -------------------------------------------------------------
    # 7. Reviews & Public Tutor Directory
    # -------------------------------------------------------------
    path('reviews/', ReviewListCreateView.as_view(), name='reviews_create'),
    path('tutors/', TutorListView.as_view(), name='tutors_list'),
    path('tutors/<int:tutor_id>/', TutorDetailView.as_view(), name='tutor_detail'),
    path('tutors/<int:tutor_id>/reviews/', TutorReviewListView.as_view(), name='tutor_reviews'),

    # -------------------------------------------------------------
    # 8. Admin Dashboard Analytics
    # -------------------------------------------------------------
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
]
