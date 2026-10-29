"""
TutorLink - Subscriptions Serializers (server/subscriptions/serializers.py)

Converts subscription data models to and from JSON format:
1. SubscriptionPlanSerializer: Formats pricing plans and role requirements.
2. SubscriptionSerializer: Formats active subscription details.
3. TutorCommissionSerializer: Formats 15% platform commission records for hired tutors.
"""

from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, TutorCommission


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Formats subscription tier plans (name, price, role)."""
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'role', 'description']


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Formats the user's active subscription, including nested plan details
    and transaction ID.
    """
    plan = SubscriptionPlanSerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'user_name',
            'plan',
            'payment_method',
            'transaction_id',
            'status',
            'started_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'started_at', 'updated_at']


class TutorCommissionSerializer(serializers.ModelSerializer):
    """
    Formats 15% platform commission records owed by a tutor, including
    the tuition post title, tuition subject, guardian info, 10-day deadline,
    and payment transaction details.
    """
    tutor_name = serializers.CharField(source='tutor.username', read_only=True)
    post_title = serializers.CharField(source='application.post.title', read_only=True)
    post_subject = serializers.CharField(source='application.post.subject', read_only=True)
    guardian_name = serializers.CharField(source='application.post.guardian.username', read_only=True)
    days_left = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = TutorCommission
        fields = [
            'id',
            'tutor',
            'tutor_name',
            'application',
            'post_title',
            'post_subject',
            'guardian_name',
            'tuition_amount',
            'commission_amount',
            'status',
            'due_date',
            'paid_at',
            'payment_method',
            'transaction_id',
            'days_left',
            'is_overdue',
            'created_at',
        ]
        read_only_fields = [
            'tutor',
            'application',
            'tuition_amount',
            'commission_amount',
            'created_at',
            'due_date',
            'paid_at',
            'payment_method',
            'transaction_id',
            'days_left',
            'is_overdue',
        ]

