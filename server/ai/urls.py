# ai/urls.py — Routing for AI Endpoints.

from django.urls import path
from .views import GeneratePostView, RecommendTutorsView, ChatMatchView

urlpatterns = [
    path('generate-post/', GeneratePostView.as_view(), name='ai-generate-post'),
    path('recommend-tutors/<int:post_id>/', RecommendTutorsView.as_view(), name='ai-recommend-tutors'),
    path('chat-match/', ChatMatchView.as_view(), name='ai-chat-match'),
]
