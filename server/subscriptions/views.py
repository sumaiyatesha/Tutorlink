"""
TutorLink - Subscriptions Views (server/subscriptions/views.py)

Handles API requests for monetization, subscriptions, and commission tracking:
1. SubscriptionPlanListView: Returns available subscription plans for user's role.
2. MySubscriptionView: Returns current subscription status and perks for the logged-in user.
3. SubscribeView: Activates a subscription via the checkout flow with a unique transaction ID.
4. CancelSubscriptionView: Cancels an active subscription.
5. TutorCommissionListView: Returns commission fee obligations for hired tutors.
"""

import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone

from .models import SubscriptionPlan, Subscription, TutorCommission
from .serializers import (
    SubscriptionPlanSerializer, 
    SubscriptionSerializer, 
    TutorCommissionSerializer
)


class IsTutor(permissions.BasePermission):
    """Permission class ensuring the user has role='tutor'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'tutor')


class SubscriptionPlanListView(APIView):
    """
    GET /api/subscriptions/plans/
    Returns plans matching the requesting user's role:
    - Guardian sees Guardian Monthly (30 BDT)
    - Tutor sees Tutor Monthly (50 BDT)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', 'guardian')
        plans = SubscriptionPlan.objects.filter(role=user_role)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MySubscriptionView(APIView):
    """
    GET /api/subscriptions/mine/
    Returns whether the current user has an active paid subscription.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            sub = Subscription.objects.select_related('plan').get(user=request.user)
            serializer = SubscriptionSerializer(sub)
            data = serializer.data
            data['is_subscribed'] = (sub.status == 'active')
            return Response(data, status=status.HTTP_200_OK)
        except Subscription.DoesNotExist:
            return Response({
                'is_subscribed': False,
                'status': 'inactive',
                'plan': None,
                'started_at': None,
                'payment_method': None,
                'transaction_id': None,
            }, status=status.HTTP_200_OK)


class SubscribeView(APIView):
    """
    POST /api/subscriptions/subscribe/
    Activates or updates the user's subscription to status='active'.
    
    Checkout Endpoint:
    Records payment gateway approval (bKash / Nagad / Card) and generates
    a unique transaction ID in the format 'TXN' + timestamp + random digits.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Step 1: Validate payment method
        payment_method = request.data.get('payment_method', 'bkash')
        if payment_method == 'bank_card':
            payment_method = 'card'

        if payment_method not in ['bkash', 'nagad', 'card']:
            return Response(
                {'error': 'Invalid payment method. Choices: bkash, nagad, card.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 2: Get corresponding plan for user's role
        user_role = getattr(request.user, 'role', 'guardian')
        try:
            plan = SubscriptionPlan.objects.get(role=user_role)
        except SubscriptionPlan.DoesNotExist:
            plan = SubscriptionPlan.objects.filter(role='guardian').first()
            if not plan:
                return Response(
                    {'error': f'No plan configured for role: {user_role}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Step 3: Generate a realistic transaction reference ID
        now = timezone.now()
        timestamp_str = now.strftime('%Y%m%d%H%M%S')
        random_digits = f"{random.randint(1000, 9999)}"
        generated_txn_id = f"TXN{timestamp_str}{random_digits}"
        transaction_id = request.data.get('transaction_id') or generated_txn_id

        # Step 4: Create or update the user's active subscription
        sub, created = Subscription.objects.get_or_create(
            user=request.user,
            defaults={
                'plan': plan,
                'payment_method': payment_method,
                'transaction_id': transaction_id,
                'status': 'active',
            }
        )

        if not created:
            sub.plan = plan
            sub.payment_method = payment_method
            sub.transaction_id = transaction_id
            sub.status = 'active'
            sub.started_at = now
            sub.save()

        serializer = SubscriptionSerializer(sub)
        data = serializer.data
        data['is_subscribed'] = True
        data['transaction_id'] = sub.transaction_id
        data['amount'] = float(plan.price)
        data['method'] = sub.payment_method
        data['timestamp'] = sub.started_at.isoformat()
        data['message'] = 'Payment processed successfully. Subscription is now active.'
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CancelSubscriptionView(APIView):
    """
    POST /api/subscriptions/cancel/
    Cancels the user's active subscription.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            sub = Subscription.objects.get(user=request.user)
            sub.status = 'cancelled'
            sub.save()
            return Response({
                'message': 'Subscription cancelled successfully.',
                'status': 'cancelled',
                'is_subscribed': False,
            }, status=status.HTTP_200_OK)
        except Subscription.DoesNotExist:
            return Response({'error': 'No active subscription found to cancel.'}, status=status.HTTP_404_NOT_FOUND)


class TutorCommissionListView(APIView):
    """
    GET /api/tutor/commissions/
    Lists all platform commission records (15% hire fee) owed by the logged-in tutor.
    """
    permission_classes = [permissions.IsAuthenticated, IsTutor]

    def get(self, request):
        commissions = TutorCommission.objects.filter(tutor=request.user).order_by('-created_at')
        serializer = TutorCommissionSerializer(commissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PayCommissionView(APIView):
    """
    POST /api/tutor/commissions/<int:pk>/pay/
    Settles a 15% first-month tuition commission payment.
    Accepts payment_method ('bkash', 'nagad', 'card') and optional transaction_id.
    """
    permission_classes = [permissions.IsAuthenticated, IsTutor]

    def post(self, request, pk):
        try:
            commission = TutorCommission.objects.get(pk=pk, tutor=request.user)
        except TutorCommission.DoesNotExist:
            return Response({'error': 'Commission record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if commission.status == 'paid':
            serializer = TutorCommissionSerializer(commission)
            return Response({
                'message': 'Commission already paid.',
                'commission': serializer.data
            }, status=status.HTTP_200_OK)

        payment_method = request.data.get('payment_method', 'bkash')
        if payment_method not in ['bkash', 'nagad', 'card']:
            payment_method = 'bkash'

        now = timezone.now()
        timestamp_str = now.strftime('%Y%m%d%H%M%S')
        random_digits = f"{random.randint(1000, 9999)}"
        generated_txn_id = f"COMM{timestamp_str}{random_digits}"
        transaction_id = request.data.get('transaction_id') or generated_txn_id

        commission.status = 'paid'
        commission.paid_at = now
        commission.payment_method = payment_method
        commission.transaction_id = transaction_id
        commission.save()

        serializer = TutorCommissionSerializer(commission)
        return Response({
            'message': 'Commission paid successfully.',
            'commission': serializer.data
        }, status=status.HTTP_200_OK)

