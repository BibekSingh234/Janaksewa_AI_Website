from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User

from .models import Complaint


class ChatApiContractTests(TestCase):
    def test_chat_endpoint_returns_success_and_language(self):
        response = self.client.post(
            reverse("ai-chat"),
            data={"message": "Tell me about Janaki Mandir.", "language": "en", "history": []},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertIn("reply", payload)
        self.assertEqual(payload["language"], "en")

    def test_chat_endpoint_rejects_empty_message(self):
        response = self.client.post(
            reverse("ai-chat"),
            data={"message": "", "language": "en", "history": []},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])

    @patch("core.views.send_mail")
    def test_visit_endpoint_sends_email_notification(self, mock_send_mail):
        response = self.client.post(
            reverse("track-visit"),
            data={
                "email": "visitor@example.com",
                "page": "index.html",
                "source": "login-register",
                "user_agent": "Test Browser",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        mock_send_mail.assert_called_once()


class ComplaintAccessTests(TestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(username="citizen@example.com", email="citizen@example.com", password="safe-password")
        self.other_citizen = User.objects.create_user(username="other@example.com", email="other@example.com", password="safe-password")
        self.admin = User.objects.create_user(username="admin@example.com", email="admin@example.com", password="safe-password", is_staff=True)
        self.own_complaint = Complaint.objects.create(name="Citizen", email=self.citizen.email, category="Road", subject="Broken road", description="Needs repair")
        Complaint.objects.create(name="Other", email=self.other_citizen.email, category="Water", subject="Water leak", description="Needs repair")

    def test_citizen_only_sees_their_own_reports(self):
        self.client.force_login(self.citizen)
        response = self.client.get(reverse("my-complaints"))
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], self.own_complaint.id)

    def test_citizen_cannot_view_or_update_all_reports(self):
        self.client.force_login(self.citizen)
        self.assertEqual(self.client.get(reverse("complaint-list")).status_code, 403)
        response = self.client.patch(
            reverse("complaint-status", args=[self.own_complaint.id]),
            data={"status": "resolved"}, content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_can_update_a_report_status(self):
        self.client.force_login(self.admin)
        response = self.client.patch(
            reverse("complaint-status", args=[self.own_complaint.id]),
            data={"status": "processing"}, content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.own_complaint.refresh_from_db()
        self.assertEqual(self.own_complaint.status, "processing")
