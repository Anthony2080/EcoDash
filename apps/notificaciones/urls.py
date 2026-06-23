from django.urls import path
from . import views

app_name = "notificaciones"
urlpatterns = [path("", views.listado, name="listado")]
