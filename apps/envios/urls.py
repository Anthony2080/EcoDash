from django.urls import path
from . import views

app_name = "envios"
urlpatterns = [
    path("", views.listado, name="listado"),
    path("crear/", views.crear, name="crear"),
    path("<int:id_envio>/", views.detalle, name="detalle"),
]
