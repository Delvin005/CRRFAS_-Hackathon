import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from apps.tenants.models import Tenant
from apps.accounts.models import User

u = User.objects.filter(role='super_admin').first()
print('Super admin:', u.username, '| tenant:', u.tenant)

if u.tenant is None:
    t = Tenant.objects.first()
    if t:
        u.tenant = t
        u.save()
        print(f'Assigned tenant "{t.name}" to super_admin user "{u.username}"')
    else:
        print('No tenant found!')
else:
    print('Tenant already set, no action needed.')
