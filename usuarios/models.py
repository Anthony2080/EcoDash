from django.db import models

class Usuario(models.Model):
    ROLES = (('cliente', 'Cliente'), ('repartidor', 'Repartidor'))
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20)
    direccion = models.TextField()
    password = models.CharField(max_length=128)
    rol = models.CharField(max_length=20, choices=ROLES)
    fecha_registro = models.DateTimeField(auto_now_add=True)

class Cliente(Usuario):
    class Meta:
        proxy = False

class Repartidor(Usuario):
    disponibilidad = models.BooleanField(default=True)
    calificacion = models.FloatField(default=0.0)