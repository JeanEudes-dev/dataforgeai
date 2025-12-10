# Generated migration for enhanced report fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='model_comparison',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='report',
            name='report_metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='report',
            name='share_token',
            field=models.CharField(
                blank=True,
                help_text='Unique token for sharing report publicly',
                max_length=64,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='report',
            name='is_public',
            field=models.BooleanField(
                default=False,
                help_text='Whether report is publicly accessible via share link',
            ),
        ),
        migrations.AddIndex(
            model_name='report',
            index=models.Index(fields=['share_token'], name='reports_rep_share_t_idx'),
        ),
    ]
