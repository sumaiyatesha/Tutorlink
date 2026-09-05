# accounts/admin.py — Register the custom User model with Django admin.
#
# This lets us view and manage users through Django's built-in admin
# interface at http://localhost:8000/admin/.

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


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


# Register our custom User model with our custom admin class.
admin.site.register(User, UserAdmin)
