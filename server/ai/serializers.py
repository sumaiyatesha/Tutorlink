"""
TutorLink - AI Serializers (server/ai/serializers.py)

Converts AI interaction logs to JSON format for analytics and history.
"""

from rest_framework import serializers
from .models import AIInteraction


class AIInteractionSerializer(serializers.ModelSerializer):
    """Formats AI interaction logs for display in the admin or user logs."""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AIInteraction
        fields = ['id', 'user', 'username', 'type', 'input_text', 'output_text', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
