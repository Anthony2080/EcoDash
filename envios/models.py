from django.db import models
from usuarios.models import Cliente, Repartidor

class Envio(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('asignado', 'Asignado'),
        ('retirado', 'Retirado'),
        ('en_camino', 'En Camino'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    )
    id_envio = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='envios')
    id_repartidor = models.ForeignKey(Repartidor, on_delete=models.SET_NULL, null=True, blank=True, related_name='envios')
    origenGeo = models.CharField(max_length=255)
    destinoGeo = models.CharField(max_length=255)
    distanciaKm = models.FloatField()
    pesoKg = models.FloatField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    precio = models.FloatField()
    fotoEntrega = models.ImageField(upload_to='entregas/', null=True, blank=True)
    firmaDigital = models.TextField(null=True, blank=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)