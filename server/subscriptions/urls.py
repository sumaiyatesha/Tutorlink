# subscriptions/urls.py — API route definitions for Subscription & Commission endpoints.

from django.urls import path
from .views import (
    SubscriptionPlanListView,
    MySubscriptionView,
    SubscribeView,
    CancelSubscriptionView,
    TutorCommissionListView,
)

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription_plans'),
    path('mine/', MySubscriptionView.as_view(), name='my_subscription'),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('cancel/', CancelSubscriptionView.as_view(), name='cancel_subscription'),
    path('commissions/', TutorCommissionListView.as_view(), name='tutor_commissions'),
]
