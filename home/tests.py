import json
import re
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import PasswordResetChallenge, Student
from .password_reset import RESET_COOKIE_NAME, otp_digest


class SessionAuthenticationApiTests(TestCase):
    frontend_origin = 'http://localhost:5173'

    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get(
            reverse('api_csrf'),
            HTTP_ORIGIN=self.frontend_origin,
        ).json()['csrfToken']

    def post_json(self, url_name, data, csrf_token=None):
        return self.client.post(
            reverse(url_name),
            data=json.dumps(data),
            content_type='application/json',
            HTTP_ORIGIN=self.frontend_origin,
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def test_registration_creates_regular_user_with_hashed_password(self):
        response = self.post_json(
            'api_register',
            {
                'username': 'studentuser',
                'email': 'student@example.com',
                'password': 'a-strong-test-password-839!',
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertNotIn('password', response.json())
        user = get_user_model().objects.get(username='studentuser')
        self.assertTrue(user.check_password('a-strong-test-password-839!'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_csrf_endpoint_allows_credentialed_react_origin(self):
        response = self.client.get(
            reverse('api_csrf'),
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Access-Control-Allow-Origin'],
            self.frontend_origin,
        )
        self.assertEqual(
            response['Access-Control-Allow-Credentials'],
            'true',
        )

    def test_registration_rejects_request_without_csrf_token(self):
        response = self.client.post(
            reverse('api_register'),
            data=json.dumps({
                'username': 'csrfuser',
                'email': 'csrf@example.com',
                'password': 'a-strong-test-password-839!',
            }),
            content_type='application/json',
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.assertEqual(response.status_code, 403)

    def test_registration_rejects_duplicate_username(self):
        get_user_model().objects.create_user(
            username='existing',
            password='another-strong-password-246!',
        )

        response = self.post_json(
            'api_register',
            {
                'username': 'existing',
                'email': 'new@example.com',
                'password': 'a-strong-test-password-839!',
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.json())

    def test_registration_rejects_weak_password(self):
        response = self.post_json(
            'api_register',
            {
                'username': 'weakpassworduser',
                'email': 'weak@example.com',
                'password': 'password',
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.json())

    def test_student_api_requires_authentication(self):
        response = self.client.get(
            reverse('student_api'),
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_dashboard_renders_logout_link(self):
        admin = get_user_model().objects.create_user(
            username='dashboard-admin',
            password='a-strong-test-password-839!',
            is_staff=True,
        )
        self.client.force_login(admin)

        response = self.client.get(reverse('admin_dashboard'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/logout/"')

    def test_user_dashboard_renders_logout_link(self):
        user = get_user_model().objects.create_user(
            username='dashboard-user',
            password='a-strong-test-password-839!',
        )
        self.client.force_login(user)

        response = self.client.get(reverse('user_dashboard'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/logout/"')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordResetApiTests(TestCase):
    frontend_origin = 'http://localhost:5173'
    email = 'reset-user@example.com'
    password = 'Old-strong-password-643!'

    def setUp(self):
        cache.clear()
        mail.outbox.clear()
        self.client = Client(enforce_csrf_checks=True)
        csrf_response = self.client.get(
            reverse('api_csrf'),
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.csrf_token = csrf_response.json()['csrfToken']
        self.user = get_user_model().objects.create_user(
            username='reset-user',
            email=self.email,
            password=self.password,
        )

    def post_json(self, route, payload, csrf_token=None):
        return self.client.post(
            reverse(route),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_ORIGIN=self.frontend_origin,
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def request_code(self, email=None):
        return self.post_json(
            'api_forgot_password',
            {'email': email or self.email},
        )

    def extract_code(self):
        self.assertEqual(len(mail.outbox), 1)
        match = re.search(r'(?<!\d)(\d{6})(?!\d)', mail.outbox[0].body)
        self.assertIsNotNone(match)
        return match.group(1)

    def verify_code(self, code, email=None):
        return self.post_json(
            'api_verify_otp',
            {'email': email or self.email, 'code': code},
        )

    def reset(self, password, confirm_password):
        return self.post_json(
            'api_reset_password',
            {'password': password, 'confirm_password': confirm_password},
        )

    def test_registered_email_sends_otp_without_returning_it(self):
        response = self.request_code()
        self.assertEqual(response.status_code, 202)
        self.assertNotIn(self.extract_code(), response.content.decode())
        self.assertEqual(
            mail.outbox[0].subject,
            'Student Management System - Password Reset Verification Code',
        )
        self.assertIn('Do not share this code', mail.outbox[0].body)
        self.assertIn('ignore this email', mail.outbox[0].body)
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        self.assertNotEqual(challenge.otp_hash, self.extract_code())

    def test_unknown_email_gets_same_generic_response(self):
        known_response = self.request_code()
        unknown_response = self.request_code('unknown@example.com')
        self.assertEqual(known_response.status_code, 202)
        self.assertEqual(unknown_response.status_code, 202)
        self.assertEqual(known_response.json(), unknown_response.json())
        self.assertEqual(len(mail.outbox), 1)

    def test_valid_otp_sets_http_only_reset_cookie_and_is_single_use(self):
        self.request_code()
        code = self.extract_code()

        response = self.verify_code(code)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(code, response.content.decode())
        self.assertTrue(response.cookies[RESET_COOKIE_NAME]['httponly'])
        self.assertNotIn('token', response.json())
        self.assertTrue(
            self.client.get(reverse('api_reset_authorization_status')).json()['verified']
        )

        reused = self.verify_code(code)
        self.assertEqual(reused.status_code, 400)

    def test_incorrect_otp_is_rejected_and_attempt_is_counted(self):
        self.request_code()
        response = self.verify_code('000000')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            PasswordResetChallenge.objects.get(user=self.user).attempts,
            1,
        )

    def test_expired_otp_is_rejected(self):
        self.request_code()
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        PasswordResetChallenge.objects.filter(pk=challenge.pk).update(
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        response = self.verify_code(self.extract_code())
        self.assertEqual(response.status_code, 400)

    def test_resending_invalidates_previous_code(self):
        self.request_code()
        old_challenge = PasswordResetChallenge.objects.get(user=self.user)
        old_code = self.extract_code()
        mail.outbox.clear()

        self.request_code()
        old_challenge.refresh_from_db()
        self.assertIsNotNone(old_challenge.consumed_at)
        new_code = self.extract_code()
        self.assertEqual(self.verify_code(old_code).status_code, 400)
        self.assertEqual(self.verify_code(new_code).status_code, 200)

    def test_fifth_incorrect_attempt_invalidates_otp(self):
        self.request_code()
        for _ in range(5):
            response = self.verify_code('000000')
        self.assertEqual(response.status_code, 400)
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        self.assertEqual(challenge.attempts, 5)
        self.assertIsNotNone(challenge.consumed_at)

    def test_request_rate_limit_is_applied(self):
        for _ in range(5):
            response = self.request_code('not-registered@example.com')
            self.assertEqual(response.status_code, 202)
        self.assertEqual(
            self.request_code('not-registered@example.com').status_code,
            429,
        )

    def test_verification_rate_limit_is_applied(self):
        self.request_code()
        for _ in range(10):
            self.verify_code('000000')
        response = self.verify_code('000000')
        self.assertEqual(response.status_code, 429)

    def test_reset_cannot_be_used_without_successful_verification(self):
        response = self.reset(
            'New-strong-password-921!',
            'New-strong-password-921!',
        )
        self.assertEqual(response.status_code, 403)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))

    def test_password_mismatch_and_weak_password_are_rejected(self):
        self.request_code()
        self.verify_code(self.extract_code())

        mismatch = self.reset(
            'New-strong-password-921!',
            'Different-strong-password-921!',
        )
        self.assertEqual(mismatch.status_code, 400)

        weak_password = self.reset('password', 'password')
        self.assertEqual(weak_password.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))

    def test_successful_reset_requires_new_password_and_consumes_authorization(self):
        self.request_code()
        self.verify_code(self.extract_code())

        new_password = 'New-strong-password-921!'
        response = self.reset(new_password, new_password)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.client.get(reverse('api_reset_authorization_status')).status_code,
            403,
        )

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(self.user.check_password(self.password))
        self.assertTrue(
            self.client.post(
                reverse('api_login'),
                data=json.dumps({
                    'username': self.user.username,
                    'password': self.password,
                }),
                content_type='application/json',
                HTTP_ORIGIN=self.frontend_origin,
                HTTP_X_CSRFTOKEN=self.csrf_token,
            ).status_code == 401
        )

    def test_smtp_failure_keeps_response_generic_and_invalidates_code(self):
        with patch('home.password_reset.send_mail', side_effect=OSError('SMTP unavailable')):
            response = self.request_code()

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json()['detail'], (
            'If an account exists for this email, a verification code will be sent.'
        ))
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        self.assertIsNotNone(challenge.consumed_at)
        self.assertEqual(challenge.otp_hash, '')

    def test_login_and_session_protect_student_api(self):
        user = get_user_model().objects.create_user(
            username='signedin',
            password='a-strong-test-password-839!',
        )

        response = self.post_json(
            'api_login',
            {'username': user.username, 'password': 'a-strong-test-password-839!'},
        )
        self.assertEqual(response.status_code, 200)
        csrf_token = response.json()['csrfToken']
        self.assertNotIn('password', response.json()['user'])

        current_user = self.client.get(
            reverse('api_current_user'),
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.json()['user']['username'], user.username)

        create_response = self.client.post(
            reverse('student_api'),
            data=json.dumps({'name': 'Ada Student', 'email': 'ada@example.com', 'age': 20}),
            content_type='application/json',
            HTTP_ORIGIN=self.frontend_origin,
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertTrue(Student.objects.filter(email='ada@example.com').exists())
        student_id = create_response.json()['id']

        detail_response = self.client.get(
            reverse('student_detail_api', args=[student_id]),
            HTTP_ORIGIN=self.frontend_origin,
        )
        self.assertEqual(detail_response.status_code, 200)

        update_response = self.client.patch(
            reverse('student_detail_api', args=[student_id]),
            data=json.dumps({'age': 21}),
            content_type='application/json',
            HTTP_ORIGIN=self.frontend_origin,
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()['age'], 21)

        delete_response = self.client.delete(
            reverse('student_detail_api', args=[student_id]),
            HTTP_ORIGIN=self.frontend_origin,
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(delete_response.status_code, 204)

        logout_response = self.post_json('api_logout', {}, csrf_token=csrf_token)
        self.assertEqual(logout_response.status_code, 200)

        self.assertEqual(
            self.client.get(reverse('student_api')).status_code,
            401,
        )

    def test_regular_user_cannot_access_django_admin(self):
        user = get_user_model().objects.create_user(
            username='regularuser',
            password='a-strong-test-password-839!',
        )
        self.client.force_login(user)

        response = self.client.get('/admin/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/admin/login/', response['Location'])

    def test_invalid_login_returns_unauthorized(self):
        response = self.post_json(
            'api_login',
            {'username': 'missing-user', 'password': 'not-the-password'},
        )
        self.assertEqual(response.status_code, 401)
