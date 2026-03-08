"""
OTP Email Verification views for signup.
Endpoints:
  POST /api/accounts/otp/send/   { "email": "..." }
  POST /api/accounts/otp/verify/ { "email": "...", "otp": "123456" }
"""
import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


def _generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def _cache_key(email):
    return f"signup_otp_{email.lower().strip()}"


class SendOTPView(APIView):
    """Generate and email a 6-digit OTP. Expires in 10 minutes."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = _generate_otp()
        # Store in cache for 10 minutes (600 seconds)
        cache.set(_cache_key(email), otp, timeout=600)

        try:
            send_mail(
                subject='CRRFAS Cloud — Your Verification Code',
                message=f"""
Hello,

Your one-time verification code for CRRFAS Cloud signup is:

    {otp}

This code is valid for 10 minutes. Do not share it with anyone.

— The CRRFAS Team
""",
                html_message=f"""
<div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:40px;border:1px solid #eee;border-radius:12px;">
  <h2 style="color:#0DF5E3;letter-spacing:2px;">CRRFAS Cloud</h2>
  <p style="color:#555;font-size:15px;">Your one-time verification code is:</p>
  <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#111;margin:24px 0;padding:20px;background:#f7f7f7;border-radius:8px;text-align:center;">
    {otp}
  </div>
  <p style="color:#888;font-size:13px;">Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#aaa;font-size:12px;">The CRRFAS Team · CRRFAS Cloud Platform</p>
</div>
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            return Response(
                {'error': f'Failed to send email: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'OTP sent successfully.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """Verify the 6-digit OTP previously sent to the email."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp_input = request.data.get('otp', '').strip()

        if not email or not otp_input:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(_cache_key(email))

        if cached_otp is None:
            return Response(
                {'error': 'OTP expired or not found. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cached_otp != otp_input:
            return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        # OTP is correct — delete it so it can't be reused
        cache.delete(_cache_key(email))
        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)
