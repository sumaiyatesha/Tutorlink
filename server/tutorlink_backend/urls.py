# tutorlink_backend/urls.py — Main URL configuration.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from subscriptions.views import TutorCommissionListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/tutor/commissions/', TutorCommissionListView.as_view(), name='tutor_commissions'),
    path('api/ai/', include('ai.urls')),
    path('api/', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

