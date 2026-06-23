import os
from pathlib import Path

from dotenv import load_dotenv

from config.base_datos import ConfiguracionBaseDatos

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "")
DEBUG = os.getenv("DEBUG", "True").lower() in {"1", "true", "yes", "si"}
ALLOWED_HOSTS = [host for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host]

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "apps.usuarios.apps.UsuariosConfig",
    "apps.clientes.apps.ClientesConfig",
    "apps.repartidores.apps.RepartidoresConfig",
    "apps.envios.apps.EnviosConfig",
    "apps.pagos.apps.PagosConfig",
    "apps.notificaciones.apps.NotificacionesConfig",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR.parent / "frontend" / "templates"], "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": ConfiguracionBaseDatos().obtener_configuracion(),
}
AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = "es-ar"
TIME_ZONE = "America/Argentina/Buenos_Aires"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR.parent / "frontend" / "static"]
STATIC_ROOT = BASE_DIR.parent / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR.parent / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
