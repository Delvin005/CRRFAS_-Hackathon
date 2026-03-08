from django.db import models
import uuid

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    domain = models.CharField(max_length=200, blank=True)
    institution_type = models.CharField(max_length=100, choices=[
        ('engineering', 'Engineering'),
        ('arts_science', 'Arts & Science'),
        ('management', 'Management'),
        ('research', 'Research'),
        ('university', 'University'),
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
