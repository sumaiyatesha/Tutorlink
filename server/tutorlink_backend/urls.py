"""
TutorLink - Root URL Configuration (server/tutorlink_backend/urls.py)

This file routes top-level URL paths to their corresponding Django apps:
1. /admin/ -> Built-in Django administrative panel
2. /api/auth/ & /api/ -> Accounts, user profiles, posts, applications, reviews
3. /api/subscriptions/ -> Pricing plans, payments, and monetization
4. /api/ai/ -> AI matching, post generator, and CV parsing endpoints
5. /media/ -> Uploaded CV files (served during development)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from subscriptions.views import TutorCommissionListView, PayCommissionView

urlpatterns = [
    # Django Admin Interface
    path('admin/', admin.site.urls),

    # Authentication & User Management
    path('api/auth/', include('accounts.urls')),

    # Subscriptions & Monetization
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/tutor/commissions/', TutorCommissionListView.as_view(), name='tutor_commissions'),
    path('api/tutor/commissions/<int:pk>/pay/', PayCommissionView.as_view(), name='tutor_pay_commission'),

    # AI Matching & Gemini Services
    path('api/ai/', include('ai.urls')),

    # Direct Accounts & Profiles API Routes
    path('api/', include('accounts.urls')),
]

# Serve user uploaded files (e.g. CV PDFs) during local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
