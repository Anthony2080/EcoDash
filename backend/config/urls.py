from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

from apps.envios.views import api_detalle as api_detalle_envio
from apps.envios.views import api_envios as api_envios
from apps.notificaciones.views import api_listado as api_listado_notificaciones
from apps.pagos.views import api_listado as api_listado_pagos
from apps.usuarios.views import dashboard_view, login_api, logout_api, registro_api

urlpatterns = [
    path("", TemplateView.as_view(template_name="inicio.html"), name="inicio"),
    path("acceso/", TemplateView.as_view(template_name="login.html"), name="login"),
    path("panel/", dashboard_view, name="dashboard"),
    path("api/login/", login_api, name="api_login"),
    path("api/registro/", registro_api, name="api_registro"),
    path("api/logout/", logout_api, name="api_logout"),
    path("api/envios/", api_envios, name="api_envios"),
    path("api/envios/<int:id_envio>/", api_detalle_envio, name="api_detalle_envio"),
    path("api/pagos/", api_listado_pagos, name="api_pagos"),
    path("api/notificaciones/", api_listado_notificaciones, name="api_notificaciones"),
    path("admin/", admin.site.urls),
    path("usuarios/", include("apps.usuarios.urls")),
    path("clientes/", include("apps.clientes.urls")),
    path("repartidores/", include("apps.repartidores.urls")),
    path("envios/", include("apps.envios.urls")),
    path("pagos/", include("apps.pagos.urls")),
    path("notificaciones/", include("apps.notificaciones.urls")),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
