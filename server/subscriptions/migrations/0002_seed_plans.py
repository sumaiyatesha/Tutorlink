# subscriptions/migrations/0002_seed_plans.py — Data migration to seed Guardian and Tutor SubscriptionPlans.

from django.db import migrations


def seed_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')

    # Guardian Monthly Plan (30 Tk/month)
    SubscriptionPlan.objects.get_or_create(
        role='guardian',
        defaults={
            'name': 'Guardian Monthly',
            'price': 30.00,
            'description': 'Access all guardian portal features, priority support, and direct tutor contact.',
        }
    )

    # Tutor Monthly Plan (50 Tk/month)
    SubscriptionPlan.objects.get_or_create(
        role='tutor',
        defaults={
            'name': 'Tutor Monthly',
            'price': 50.00,
            'description': 'Get Priority Pro badge, top search placement when guardians browse tutors, and unlimited application updates.',
        }
    )


def remove_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    SubscriptionPlan.objects.filter(role__in=['guardian', 'tutor']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_subscription_plans, reverse_code=remove_subscription_plans),
    ]
