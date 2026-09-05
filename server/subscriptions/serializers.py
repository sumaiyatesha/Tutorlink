# subscriptions/serializers.py — Serializers for Subscription plans, user Subscription records, and Tutor Commissions.

from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, TutorCommission


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for SubscriptionPlan model.
    """
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'role', 'description']


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for Subscription model.
    Includes nested plan details.
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
    Serializer for TutorCommission model.
    Includes post title and post subject from application for rich display.
    """
    tutor_name = serializers.CharField(source='tutor.username', read_only=True)
    post_title = serializers.CharField(source='application.post.title', read_only=True)
    post_subject = serializers.CharField(source='application.post.subject', read_only=True)

    class Meta:
        model = TutorCommission
        fields = [
            'id',
            'tutor',
            'tutor_name',
            'application',
            'post_title',
            'post_subject',
            'tuition_amount',
            'commission_amount',
            'status',
            'created_at',
        ]
        read_only_fields = ['tutor', 'application', 'tuition_amount', 'commission_amount', 'created_at']
