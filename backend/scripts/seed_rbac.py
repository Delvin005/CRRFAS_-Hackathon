import os
import django
import sys

# Update path properly before deployment depending on your script execution style
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # Change config wrapper if needed

django.setup()

from accounts.models import Role

def run_seed():
    roles = [
        'super_admin', 'tenant_admin', 'academic_admin', 
        'facility_manager', 'faculty', 'student', 
        'it_admin', 'research_scholar', 'external_user'
    ]
    
    for role_name in roles:
        role, created = Role.objects.get_or_create(
            name=role_name,
            defaults={'description': f'Default system role for {role_name.replace("_", " ").title()}'}
        )
        if created:
            print(f"Created role: {role_name}")
        else:
            print(f"Role {role_name} already exists.")
            
    print("Seed complete.")

if __name__ == '__main__':
    run_seed()
