# accounts/admin.py — Register the custom User model with Django admin.
#
# This lets us view and manage users through Django's built-in admin
# interface at http://localhost:8000/admin/.

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, TutorProfile


class UserAdmin(BaseUserAdmin):
    """
    Extend the default UserAdmin so our 'role' field shows up
    in the admin interface alongside the standard fields.
    """

    # Add 'role' to the list of columns in the user list page.
    list_display = ('username', 'email', 'role', 'is_staff')

    # Add 'role' to the filter sidebar.
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')

    # Add 'role' to the user edit form (in a new "Role" section).
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )

    # Add 'role' to the "add user" form in admin.
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role', {'fields': ('role',)}),
    )


class TutorProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for TutorProfile to review tutor credentials,
    inspect uploaded CVs and certificates, and verify tutors.
    """

    # Add key tutor info to the list of columns in the tutor list page.
    list_display = ('user', 'phone', 'location', 'is_verified', 'is_currently_student')

    # Add verification status to the filter sidebar to filter unverified tutors.
    list_filter = ('is_verified',)

    # Allow ticking the verification checkbox directly from the list view.
    list_editable = ('is_verified',)

    # Add search bar to quickly find tutors by username or email.
    search_fields = ('user__username', 'user__email')

    # Show CV and certificate as clickable download links in the detail view.
    readonly_fields = ('cv', 'certificate')


# Register our custom User model with our custom admin class.
admin.site.register(User, UserAdmin)

# Register the TutorProfile model with our TutorProfileAdmin class.
admin.site.register(TutorProfile, TutorProfileAdmin)

