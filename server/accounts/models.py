# accounts/models.py — Custom User, Profiles, TuitionPost, and Application models for TutorLink.

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for TutorLink.
    Adds role field: 'guardian', 'tutor', or 'admin'.
    """

    ROLE_CHOICES = [
        ('guardian', 'Guardian'),
        ('tutor', 'Tutor'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='guardian',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class GuardianProfile(models.Model):
    """
    Extended profile for Guardian users.
    Includes contact info, address location, and latitude/longitude for distance features.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='guardian_profile')
    phone = models.CharField(max_length=20, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Guardian Profile: {self.user.username}"


class TutorProfile(models.Model):
    """
    Extended profile for Tutor users.
    Includes bio, subjects, cv_name, teaching_preferences, location, phone, and latitude/longitude.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')
    bio = models.TextField(blank=True, default='')
    subjects = models.CharField(max_length=255, blank=True, default='')
    cv = models.FileField(upload_to='cvs/', null=True, blank=True)
    cv_name = models.CharField(max_length=255, blank=True, default='')
    teaching_preferences = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    available_days = models.JSONField(default=list, blank=True)
    expected_salary = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Tutor Profile: {self.user.username}"


class TuitionPost(models.Model):
    """
    Tuition post requirement created by a Guardian.
    Includes latitude/longitude of the tuition location for Haversine distance calculations.
    """

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tuition_posts')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    subject = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, default='')
    course = models.CharField(max_length=100, blank=True, default='')
    days_per_week = models.IntegerField(default=3)
    preferred_days = models.JSONField(default=list, blank=True)
    preferred_time = models.CharField(max_length=100, blank=True, default='')
    duration = models.CharField(max_length=100, blank=True, default='')
    method = models.CharField(max_length=100, default='In-Person')
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=8000.00)
    students = models.CharField(max_length=50, blank=True, default='1 Student')
    preferred_tutor_gender = models.CharField(max_length=20, blank=True, default='Any')
    location = models.CharField(max_length=255, default='Dhaka')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TuitionPost #{self.id}: {self.title} ({self.location})"


class Application(models.Model):
    """
    Application submitted by a Tutor for a TuitionPost.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    post = models.ForeignKey(TuitionPost, on_delete=models.CASCADE, related_name='applications')
    cover_note = models.TextField(blank=True, default='')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Application #{self.id} by {self.tutor.username} for Post #{self.post.id}"


class Notification(models.Model):
    """
    Notification model for user alerts (e.g. application status updates).
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}"


class Favorite(models.Model):
    """
    Bookmark/Favorite record linking a Guardian to a Tutor.
    """

    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('guardian', 'tutor')

    def __str__(self):
        return f"{self.guardian.username} favorited {self.tutor.username}"


class Review(models.Model):
    """
    Review left by a Guardian for a Tutor whom they have hired (accepted application).
    """

    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_written')
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review ({self.rating}⭐) by {self.reviewer.username} for {self.tutor.username}"


