from django.db import models

class Usuario(models.Model):
    ROLES = (("cliente", "Cliente"), ("repartidor", "Repartidor"))
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField()
    password = models.CharField(max_length=128)
    rol = models.CharField(max_length=20, choices=ROLES)

    class Meta:
        db_table = "usuario"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self):
        return f"{self.nombre} ({self.email})"
