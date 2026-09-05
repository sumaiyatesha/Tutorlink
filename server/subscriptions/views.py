# subscriptions/views.py — API endpoints for Plans, User Subscriptions, and Tutor Commissions.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone

from .models import SubscriptionPlan, Subscription, TutorCommission
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer, TutorCommissionSerializer


class IsTutor(permissions.BasePermission):
    """
    Custom permission check to ensure request.user.role == 'tutor'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'tutor')


class SubscriptionPlanListView(APIView):
    """
    GET /api/subscriptions/plans/ (IsAuthenticated)
    Lists available subscription plans matching the requesting user's role.
    - Guardian sees Guardian Monthly (30 Tk)
    - Tutor sees Tutor Monthly (50 Tk)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', 'guardian')
        plans = SubscriptionPlan.objects.filter(role=user_role)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MySubscriptionView(APIView):
    """
    GET /api/subscriptions/mine/ (IsAuthenticated)
    Retrieves the current logged-in user's subscription status.
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
    POST /api/subscriptions/subscribe/ (IsAuthenticated)
    Creates or updates the user's subscription to status='active'.
    
    *** DEMO / MOCK PAYMENT ENDPOINT ***
    Note for Viva Defense:
    This endpoint simulates subscription activation. No real payment gateway
    (such as bKash, Nagad, or Stripe) is invoked, and no real currency is transferred.
    In production, this would handle webhook callbacks or payment tokens from a gateway.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_method = request.data.get('payment_method', 'bkash')
        transaction_id = request.data.get('transaction_id', 'MOCK-TXN-12345')

        if payment_method not in ['bkash', 'nagad', 'card']:
            return Response({'error': 'Invalid payment method. Choices: bkash, nagad, card.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get matching plan for user role (guardian or tutor)
        user_role = getattr(request.user, 'role', 'guardian')
        try:
            plan = SubscriptionPlan.objects.get(role=user_role)
        except SubscriptionPlan.DoesNotExist:
            # Fallback to guardian plan for admin / unassigned roles during testing
            plan = SubscriptionPlan.objects.filter(role='guardian').first()
            if not plan:
                return Response({'error': f'No plan configured for role: {user_role}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update subscription record
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
            sub.started_at = timezone.now()
            sub.save()

        serializer = SubscriptionSerializer(sub)
        data = serializer.data
        data['is_subscribed'] = True
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CancelSubscriptionView(APIView):
    """
    POST /api/subscriptions/cancel/ (IsAuthenticated)
    Sets the requesting user's active subscription to status='cancelled'.
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
    GET /api/tutor/commissions/ (IsAuthenticated + IsTutor)
    Lists commission records owed by the requesting tutor for accepted applications.
    """
    permission_classes = [permissions.IsAuthenticated, IsTutor]

    def get(self, request):
        commissions = TutorCommission.objects.filter(tutor=request.user).order_by('-created_at')
        serializer = TutorCommissionSerializer(commissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
