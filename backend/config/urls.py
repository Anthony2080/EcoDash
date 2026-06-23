from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

urlpatterns = [
    path("", TemplateView.as_view(template_name="inicio.html"), name="inicio"),
    path("acceso/", TemplateView.as_view(template_name="login.html"), name="login"),
    path("panel/", TemplateView.as_view(template_name="dashboard.html"), name="dashboard"),
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
