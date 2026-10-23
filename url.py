from django.urls import path

from . import views

urlpatterns = [


path(
    "health/",
    views.health_check,
    name="health"
),

path(
    "dashboard/stats/",
    views.dashboard_stats,
    name="dashboard-stats"
),

path(
    "complaints/",
    views.complaint_list,
    name="complaint-list"
),

path(
    "complaints/create/",
    views.create_complaint,
    name="complaint-create"
),

path(
    "complaints/<int:complaint_id>/status/",
    views.update_complaint_status,
    name="complaint-status"
),

path(
    "news/",
    views.news_list,
    name="news-list"
),

path(
    "services/",
    views.service_list,
    name="service-list"
),

path(
    "tourist-places/",
    views.tourist_place_list,
    name="tourist-place-list"
),

]
