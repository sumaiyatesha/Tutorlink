# ai/serializers.py — Serializers for AI Interactions and Responses.

from rest_framework import serializers
from .models import AIInteraction


class AIInteractionSerializer(models.ModelSerializer if hasattr(models, 'ModelSerializer') else serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AIInteraction
        fields = ['id', 'user', 'username', 'type', 'input_text', 'output_text', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
