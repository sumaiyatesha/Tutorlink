"""
TutorLink - Subscriptions URL Configuration (server/subscriptions/urls.py)

Routes incoming requests prefixed with '/api/subscriptions/' to views handling
plans, payments, and tutor commission tracking.
"""

from django.urls import path
from .views import (
    SubscriptionPlanListView,
    MySubscriptionView,
    SubscribeView,
    CancelSubscriptionView,
    TutorCommissionListView,
    PayCommissionView,
)

urlpatterns = [
    # Get available pricing plans for current user's role
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription_plans'),

    # Get current user's active subscription status
    path('mine/', MySubscriptionView.as_view(), name='my_subscription'),

    # Process payment checkout and activate subscription
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),

    # Cancel active subscription
    path('cancel/', CancelSubscriptionView.as_view(), name='cancel_subscription'),

    # Tutor commission ledger (15% platform hire fee)
    path('commissions/', TutorCommissionListView.as_view(), name='tutor_commissions'),

    # Settle tutor commission payment
    path('commissions/<int:pk>/pay/', PayCommissionView.as_view(), name='pay_commission'),
]
