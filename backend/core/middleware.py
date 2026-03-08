from tenants.models import Tenant

class TenantMiddleware:
    """
    Resolves the current tenant based on X-Tenant-Domain header or subdomain.
    Attaches the resolved tenant to the request object.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant = None
        
        # 1. Check custom header for API clients
        tenant_header = request.headers.get('X-Tenant-Domain')
        if tenant_header:
            tenant = Tenant.objects.filter(domain=tenant_header).first()
            if not tenant:
                tenant = Tenant.objects.filter(subdomain=tenant_header).first()
                
        # 2. Fallback to extracting from Host header (e.g. collegeA.crrfas.com)
        if not tenant:
            host_parts = request.get_host().split(':')[0].split('.')
            if len(host_parts) >= 2:
                subdomain = host_parts[0]
                tenant = Tenant.objects.filter(subdomain=subdomain).first()

        request.tenant = tenant
        return self.get_response(request)
