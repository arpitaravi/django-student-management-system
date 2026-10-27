import hashlib
import hmac
import logging
import secrets
import smtplib
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.core.mail import send_mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import PasswordResetChallenge

logger = logging.getLogger(__name__)
OTP_LIFETIME = timedelta(minutes=5)
RESET_AUTHORIZATION_LIFETIME = timedelta(minutes=10)
MAX_OTP_ATTEMPTS = 5
RESET_COOKIE_NAME = 'password_reset_authorization'
GENERIC_REQUEST_MESSAGE = (
    'If an account exists for this email, a verification code will be sent.'
)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r'^\d{6}$')


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'The passwords do not match.',
            })

        try:
            password_validation.validate_password(
                attrs['password'],
                user=self.context['user'],
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                'password': error.messages,
            }) from error
        return attrs


def otp_digest(challenge_id, code):
    message = f'{challenge_id}:{code}'.encode()
    return hmac.new(
        settings.SECRET_KEY.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()


def reset_cookie_value(challenge_id, token):
    return f'{challenge_id}.{token}'


def set_reset_cookie(response, value, request, max_age):
    response.set_cookie(
        RESET_COOKIE_NAME,
        value,
        max_age=max_age,
        httponly=True,
        secure=request.is_secure(),
        samesite='Lax',
        path='/api/auth/',
    )


def clear_reset_cookie(response):
    response.delete_cookie(
        RESET_COOKIE_NAME,
        path='/api/auth/',
        samesite='Lax',
    )


def get_valid_reset_challenge(request, lock=False):
    cookie_value = request.COOKIES.get(RESET_COOKIE_NAME, '')
    try:
        challenge_id, token = cookie_value.split('.', 1)
        challenge_id = uuid.UUID(challenge_id)
    except (ValueError, AttributeError):
        return None

    challenges = PasswordResetChallenge.objects
    if lock:
        challenges = challenges.select_for_update()
    try:
        challenge = challenges.get(pk=challenge_id)
    except PasswordResetChallenge.DoesNotExist:
        return None

    now = timezone.now()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if (
        challenge.verified_at is None
        or challenge.consumed_at is not None
        or challenge.reset_expires_at is None
        or challenge.reset_expires_at <= now
        or not hmac.compare_digest(
            challenge.reset_authorization_hash,
            token_hash,
        )
    ):
        return None
    return challenge


@method_decorator(csrf_protect, name='dispatch')
class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_request'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user_model = get_user_model()
        user = user_model.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()
        if user is None or not user.email:
            return Response(
                {'detail': GENERIC_REQUEST_MESSAGE},
                status=status.HTTP_202_ACCEPTED,
            )

        now = timezone.now()
        PasswordResetChallenge.objects.filter(
            user=user,
            consumed_at__isnull=True,
        ).update(
            consumed_at=now,
            otp_hash='',
            reset_authorization_hash='',
        )

        code = f'{secrets.randbelow(900_000) + 100_000:06d}'
        expires_at = now + OTP_LIFETIME
        challenge_id = uuid.uuid4()
        challenge = PasswordResetChallenge.objects.create(
            id=challenge_id,
            user=user,
            otp_hash=otp_digest(challenge_id, code),
            expires_at=expires_at,
        )

        expiry_text = timezone.localtime(expires_at).strftime('%H:%M %Z')
        message = (
            f'Hello {user.get_username()},\n\n'
            f'Your password reset verification code is: {code}\n'
            f'This code expires in 5 minutes (at {expiry_text}).\n\n'
            'Do not share this code with anyone. Student Management System staff '
            'will never ask you for it.\n\n'
            'If you did not request a password reset, you can ignore this email.'
        )

        try:
            send_mail(
                subject='Student Management System - Password Reset Verification Code',
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except (OSError, smtplib.SMTPException, ValueError):
            challenge.consumed_at = timezone.now()
            challenge.otp_hash = ''
            challenge.save(update_fields=['consumed_at', 'otp_hash'])
            logger.error('Password reset email delivery failed.')

        return Response(
            {'detail': GENERIC_REQUEST_MESSAGE},
            status=status.HTTP_202_ACCEPTED,
        )


@method_decorator(csrf_protect, name='dispatch')
class VerifyOtpView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_verify'

    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        now = timezone.now()
        with transaction.atomic():
            challenge_query = PasswordResetChallenge.objects.select_for_update()
            challenge = challenge_query.filter(
                user__email__iexact=email,
                consumed_at__isnull=True,
                verified_at__isnull=True,
                expires_at__gt=now,
                attempts__lt=MAX_OTP_ATTEMPTS,
            ).order_by('-created_at').first()

            if challenge is None:
                return Response(
                    {'detail': 'The code is invalid or expired. Request a new code.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not hmac.compare_digest(
                challenge.otp_hash,
                otp_digest(challenge.pk, code),
            ):
                challenge.attempts += 1
                if challenge.attempts >= MAX_OTP_ATTEMPTS:
                    challenge.consumed_at = now
                    challenge.otp_hash = ''
                challenge.save(update_fields=['attempts', 'consumed_at', 'otp_hash'])
                return Response(
                    {'detail': 'The code is invalid or expired. Request a new code.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = secrets.token_urlsafe(32)
            challenge.verified_at = now
            challenge.otp_hash = ''
            challenge.reset_authorization_hash = hashlib.sha256(
                token.encode()
            ).hexdigest()
            challenge.reset_expires_at = now + RESET_AUTHORIZATION_LIFETIME
            challenge.save(update_fields=[
                'verified_at',
                'otp_hash',
                'reset_authorization_hash',
                'reset_expires_at',
            ])

        response = Response({'detail': 'Code verified. You may reset your password.'})
        set_reset_cookie(
            response,
            reset_cookie_value(challenge.pk, token),
            request,
            int(RESET_AUTHORIZATION_LIFETIME.total_seconds()),
        )
        return response


class ResetAuthorizationStatusView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        challenge = get_valid_reset_challenge(request)
        if challenge is None:
            return Response(
                {'detail': 'Password reset verification is required.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({'verified': True})


@method_decorator(csrf_protect, name='dispatch')
class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_finish'

    def post(self, request):
        with transaction.atomic():
            challenge = get_valid_reset_challenge(request, lock=True)
            if challenge is None:
                response = Response(
                    {'detail': 'Password reset verification has expired. Request a new code.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
                clear_reset_cookie(response)
                return response

            serializer = ResetPasswordSerializer(
                data=request.data,
                context={'user': challenge.user},
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user = challenge.user
            user.set_password(serializer.validated_data['password'])
            user.save(update_fields=['password'])
            now = timezone.now()
            PasswordResetChallenge.objects.filter(
                user=user,
                consumed_at__isnull=True,
            ).update(
                consumed_at=now,
                otp_hash='',
                reset_authorization_hash='',
            )

        response = Response({'detail': 'Password reset successfully. Please sign in.'})
        clear_reset_cookie(response)
        return response
