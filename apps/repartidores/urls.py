from django.urls import path
from . import views

app_name = "repartidores"
urlpatterns = [path("", views.menu, name="menu")]
