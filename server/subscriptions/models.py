"""
TutorLink - Subscriptions Database Models (server/subscriptions/models.py)

This module defines models for platform monetization:
1. SubscriptionPlan: Fixed pricing plans (Guardian Monthly 30 BDT, Tutor Monthly 50 BDT).
2. Subscription: Tracks active or cancelled subscriptions and transaction records.
3. TutorCommission: Tracks 15% platform hire fees owed by tutors when hired.
"""

from django.db import models
from django.conf import settings
from accounts.models import Application


class SubscriptionPlan(models.Model):
    """
    Subscription Plans available on the platform:
    - Guardian Monthly: 30 BDT/month (Unlimited tutor contact & matching)
    - Tutor Monthly: 50 BDT/month (Priority badge in search & unlimited job applications)
    """
    ROLE_CHOICES = [
        ('guardian', 'Guardian'),
        ('tutor', 'Tutor'),
    ]

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.name} ({self.price} BDT/mo for {self.role})"


class Subscription(models.Model):
    """
    User Subscription Record: Stores active/cancelled status and payment method.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('card', 'Card'),
    ]

    # One subscription record per user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )#orm for 
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='bkash')
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Subscription #{self.id} for {self.user.username} ({self.status})"


class TutorCommission(models.Model):
    """
    Tutor Commission: Automatically generated when a Guardian accepts a Tutor's application.
    Calculated as 15% of the first month's tuition salary.
    Must be paid within 10 days of hiring, regardless of subscription plan.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
    ]

    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commissions'
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='commission'
    )
    tuition_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)  # 15% of tuition_amount
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateTimeField(null=True, blank=True)  # Set to 10 days from hire date
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, blank=True, default='')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def days_left(self):
        """Returns number of days remaining until due date, or 0 if passed/paid."""
        if self.status == 'paid':
            return 0
        target = self.due_date
        if not target and self.created_at:
            from datetime import timedelta
            target = self.created_at + timedelta(days=10)
        if not target:
            return 10
        from django.utils import timezone
        diff = (target - timezone.now()).total_seconds()
        if diff <= 0:
            return 0
        return int(diff // 86400) + (1 if diff % 86400 > 0 else 0)

    @property
    def is_overdue(self):
        """Returns True if unpaid and current time is past due_date."""
        if self.status == 'paid':
            return False
        target = self.due_date
        if not target and self.created_at:
            from datetime import timedelta
            target = self.created_at + timedelta(days=10)
        if not target:
            return False
        from django.utils import timezone
        return timezone.now() > target

    def __str__(self):
        return f"Commission #{self.id}: {self.tutor.username} owes {self.commission_amount} BDT ({self.status})"

