"""
TutorLink - Accounts Database Models (server/accounts/models.py)

This file defines the database schema for:
1. User: Custom user model with roles ('guardian', 'tutor', 'admin').
2. GuardianProfile: Stores location and contact info for students/guardians.
3. TutorProfile: Stores qualifications, CV, teaching subjects, and pricing for tutors.
4. TuitionPost: Tuition job postings created by guardians.
5. Application: Job applications submitted by tutors for tuition posts.
6. Notification: Alerts and messages sent to users (e.g. status changes).
7. Favorite: Saved bookmarks linking guardians to tutors.
8. Review: Ratings (1-5 stars) and feedback left by guardians for tutors.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User Model: Extends Django's default authentication system.
    Adds a 'role' field to distinguish between Guardians, Tutors, and Admins.
    """
    ROLE_CHOICES = [
        ('guardian', 'Guardian'),
        ('tutor', 'Tutor'),
        ('admin', 'Admin'),
    ]

    # The user's platform role: determines dashboard UI and permissions
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='guardian',
        help_text="User type: 'guardian', 'tutor', or 'admin'"
    )

    def __str__(self):
        """String representation showing username and role."""
        return f"{self.username} ({self.role})"


class GuardianProfile(models.Model):
    """
    Guardian Profile: Stores personal and location details for parents/students.
    Coordinates (latitude, longitude) are used for distance-based tutor matching.
    """
    # Links each profile to exactly one User record
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='guardian_profile'
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    nid_no = models.CharField(max_length=50, blank=True, default='', help_text="National ID Number")
    location = models.CharField(max_length=255, blank=True, default='')
    
    # GPS Coordinates for distance calculation (Haversine formula)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    @property
    def is_profile_complete(self):
        """
        Check if the guardian has completed their profile status.
        Must give contact number (phone), NID number (nid_no), and location.
        """
        has_phone = bool(self.phone and self.phone.strip())
        has_nid = bool(self.nid_no and self.nid_no.strip())
        has_location = bool(self.location and self.location.strip())
        return has_phone and has_nid and has_location

    def __str__(self):
        return f"Guardian Profile: {self.user.username}"


class TutorProfile(models.Model):
    """
    Tutor Profile: Stores qualifications, subjects, CV files, and availability for tutors.
    """
    # Links each profile to exactly one User record
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='tutor_profile'
    )
    bio = models.TextField(blank=True, default='')
    subjects = models.CharField(max_length=255, blank=True, default='')
    
    # CV file upload for verification and AI skill extraction
    cv = models.FileField(upload_to='cvs/', null=True, blank=True)
    cv_name = models.CharField(max_length=255, blank=True, default='')
    
    teaching_preferences = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    nid_no = models.CharField(max_length=50, blank=True, default='', help_text="National ID Number")

    # Academic & Student Status
    is_currently_student = models.BooleanField(
        default=True,
        help_text="True if the tutor is currently enrolled as a student; False if graduated/working"
    )
    student_id = models.CharField(
        max_length=100, 
        blank=True, 
        default='', 
        help_text="Student ID number if currently enrolled"
    )

    # Last Institution Certificate (for non-student tutors)
    certificate = models.FileField(
        upload_to='certificates/', 
        null=True, 
        blank=True, 
        help_text="Educational certificate or graduation transcript"
    )
    certificate_name = models.CharField(
        max_length=255, 
        blank=True, 
        default='', 
        help_text="Original file name of the certificate"
    )
    
    # GPS Coordinates for location-based search
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Verification badge status (verified by admin)
    is_verified = models.BooleanField(default=False)
    
    # JSON list of available days (e.g. ["Sunday", "Tuesday", "Thursday"])
    available_days = models.JSONField(default=list, blank=True)
    
    # Expected monthly salary in BDT
    expected_salary = models.IntegerField(null=True, blank=True)

    @property
    def is_profile_complete(self):
        """
        Check if the tutor has completed their profile status:
        1. Contact number (phone)
        2. NID number (nid_no)
        3. Uploaded CV document (cv) - Mandatory for applying
        4. Academic verification:
           - If currently student: must provide student_id
           - If not currently student: must upload last institution certificate
        5. Location
        """
        has_phone = bool(self.phone and self.phone.strip())
        has_nid = bool(self.nid_no and self.nid_no.strip())
        has_location = bool(self.location and self.location.strip())
        has_cv = bool(self.cv)

        if self.is_currently_student:
            has_academic = bool(self.student_id and self.student_id.strip())
        else:
            has_academic = bool(self.certificate or self.certificate_name)

        return has_phone and has_nid and has_location and has_cv and has_academic

    def __str__(self):
        return f"Tutor Profile: {self.user.username}"


class TuitionPost(models.Model):
    """
    Tuition Job Post: Created by a Guardian seeking a tutor for a student.
    Contains subject, salary, schedule, location, and status ('open' / 'closed').
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    # The guardian user who published this tuition job
    guardian = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tuition_posts'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    subject = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, default='')
    course = models.CharField(max_length=100, blank=True, default='')
    
    # Teaching schedule requirements
    days_per_week = models.IntegerField(default=3)
    preferred_days = models.JSONField(default=list, blank=True)
    preferred_time = models.CharField(max_length=100, blank=True, default='')
    duration = models.CharField(max_length=100, blank=True, default='')
    method = models.CharField(max_length=100, default='In-Person')
    
    # Monthly salary offered in BDT
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=8000.00)
    students = models.CharField(max_length=50, blank=True, default='1 Student')
    preferred_tutor_gender = models.CharField(max_length=20, blank=True, default='Any')
    
    # Location details for matching
    location = models.CharField(max_length=255, default='Dhaka')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Status: 'open' accepting applications, 'closed' when tutor is hired
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TuitionPost #{self.id}: {self.title} ({self.location})"


class Application(models.Model):
    """
    Job Application: Submitted by a Tutor when applying to a TuitionPost.
    Status can be 'pending', 'demo_requested', 'accepted', or 'rejected'.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('demo_requested', 'Demo Requested'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    # The tutor applying for the tuition
    tutor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='applications'
    )
    # The tuition post being applied to
    post = models.ForeignKey(
        TuitionPost, 
        on_delete=models.CASCADE, 
        related_name='applications'
    )
    cover_note = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Application #{self.id} by {self.tutor.username} for Post #{self.post.id}"


class Notification(models.Model):
    """
    User Notifications: Stores alerts (e.g. application accepted/rejected)
    displayed in the navbar notification bell icon.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}"


class Favorite(models.Model):
    """
    Bookmark / Favorite: Allows a Guardian to save a Tutor profile for later.
    """
    guardian = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='favorites'
    )
    tutor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents bookmarking the same tutor twice
        unique_together = ('guardian', 'tutor')

    def __str__(self):
        return f"{self.guardian.username} favorited {self.tutor.username}"


class Review(models.Model):
    """
    Rating & Review: 1-5 star ratings and reviews submitted by Guardians for Tutors.
    """
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reviews_written'
    )
    tutor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reviews_received'
    )
    rating = models.IntegerField(default=5)  # 1 to 5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review ({self.rating}⭐) by {self.reviewer.username} for {self.tutor.username}"
