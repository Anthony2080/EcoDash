import os

from django.core.exceptions import ImproperlyConfigured


class ConfiguracionBaseDatos:
    """Lee y valida la configuración MySQL sin abrir conexiones."""

    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            instancia = super().__new__(cls)
            instancia._configuracion = instancia._crear_configuracion()
            cls._instancia = instancia
        return cls._instancia

    @staticmethod
    def _crear_configuracion():
        nombre = os.getenv("DB_NAME", "").strip()
        usuario = os.getenv("DB_USER", "").strip()
        contrasena = os.getenv("DB_PASSWORD", "")
        host = os.getenv("DB_HOST", "localhost").strip() or "localhost"
        puerto_texto = os.getenv("DB_PORT", "3306").strip()

        faltantes = [
            variable
            for variable, valor in (("DB_NAME", nombre), ("DB_USER", usuario))
            if not valor
        ]
        if faltantes:
            raise ImproperlyConfigured(
                f"Faltan variables obligatorias de MySQL: {', '.join(faltantes)}."
            )

        try:
            puerto = int(puerto_texto)
        except ValueError as error:
            raise ImproperlyConfigured("DB_PORT debe ser un número entero.") from error

        if not 1 <= puerto <= 65535:
            raise ImproperlyConfigured("DB_PORT debe estar entre 1 y 65535.")

        return {
            "ENGINE": "django.db.backends.mysql",
            "NAME": nombre,
            "USER": usuario,
            "PASSWORD": contrasena,
            "HOST": host,
            "PORT": puerto,
        }

    def obtener_configuracion(self):
        return self._configuracion.copy()
