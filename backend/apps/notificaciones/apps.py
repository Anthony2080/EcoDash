from django.apps import AppConfig


class NotificacionesConfig(AppConfig):
    name = "apps.notificaciones"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        import apps.notificaciones.signals  # noqa: F401
