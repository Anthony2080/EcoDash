from django.db import models
from apps.usuarios.models import Usuario


class Notificacion(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="notificaciones", db_column="id_usuario")
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notificacion"
        ordering = ["-fecha"]

    def __str__(self):
        return f"Notificación #{self.id_notificacion}"
