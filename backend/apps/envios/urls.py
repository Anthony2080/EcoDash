from django.urls import path
from . import views

app_name = "envios"
urlpatterns = [
    path("", views.listado, name="listado"),
    path("crear/", views.crear, name="crear"),
    path("<int:id_envio>/", views.detalle, name="detalle"),
    path("api/listado/", views.api_envios, name="api_listado"),
    path("api/<int:id_envio>/", views.api_envio_detalle, name="api_detalle"),
]
