from django.db import models
from apps.usuarios.models import Usuario


class Repartidor(models.Model):
    id_repartidor = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="repartidor", db_column="id_usuario")
    disponibilidad = models.BooleanField(default=True)
    calificacion_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    class Meta:
        db_table = "repartidor"

    def __str__(self):
        return self.id_usuario.nombre
