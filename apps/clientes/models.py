from django.db import models
from apps.usuarios.models import Usuario


class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="cliente", db_column="id_usuario")

    class Meta:
        db_table = "cliente"

    def __str__(self):
        return self.id_usuario.nombre
