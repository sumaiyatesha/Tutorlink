# subscriptions/models.py — Data models for Subscription plans, User Subscriptions, and Tutor Commission tracking.

from django.db import models
from django.conf import settings
from accounts.models import Application


class SubscriptionPlan(models.Model):
    """
    Fixed Subscription Plan defined in the system.
    Seeded with:
    - Guardian Monthly (30 Tk, role='guardian')
    - Tutor Monthly (50 Tk, role='tutor')
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
        return f"{self.name} ({self.price} Tk/mo for {self.role})"


class Subscription(models.Model):
    """
    Active or cancelled Subscription record for a User.
    Mock payment — created via demo endpoint.
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

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='bkash')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Subscription #{self.id} for {self.user.username} ({self.status})"


class TutorCommission(models.Model):
    """
    Tracks a tutor's 15% commission obligation when their application is accepted by a guardian.
    Created automatically upon hire — not something the tutor "subscribes" to.
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commission #{self.id}: {self.tutor.username} owes {self.commission_amount} Tk for App #{self.application_id}"
