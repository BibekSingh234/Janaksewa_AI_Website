from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health_check, name="health"),
    path("csrf/", views.csrf_token, name="csrf-token"),
    path("me/", views.current_user, name="current-user"),
    path("chat/", views.ai_chat, name="ai-chat"),
    path("track-visit/", views.track_visit, name="track-visit"),
    path("dashboard/stats/", views.dashboard_stats, name="dashboard-stats"),
    path("dashboard/my-stats/", views.my_dashboard_stats, name="my-dashboard-stats"),
    path("complaints/", views.complaint_list, name="complaint-list"),
    path("complaints/mine/", views.my_complaints, name="my-complaints"),
    path("complaints/create/", views.create_complaint, name="complaint-create"),
    path("complaints/<int:complaint_id>/status/", views.update_complaint_status, name="complaint-status"),
    path("contact/", views.create_contact_message, name="contact-message"),
    path("news/", views.news_list, name="news-list"),
    path("services/", views.service_list, name="service-list"),
    path("tourist-places/", views.tourist_place_list, name="tourist-place-list"),
    path("login/", views.login_user, name="login-user"),
    path("register/", views.register_user, name="register-user"),
    path("logout/", views.logout_user, name="logout-user"),
]
