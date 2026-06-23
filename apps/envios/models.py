from django.db import models
from apps.clientes.models import Cliente
from apps.repartidores.models import Repartidor


class Envio(models.Model):
    ESTADOS = (("pendiente", "Pendiente"), ("asignado", "Asignado"), ("retirado", "Retirado"),
               ("en_camino", "En camino"), ("entregado", "Entregado"), ("cancelado", "Cancelado"))
    id_envio = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="envios", db_column="id_cliente")
    id_repartidor = models.ForeignKey(Repartidor, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="envios", db_column="id_repartidor")
    direccion_origen = models.CharField(max_length=255)
    direccion_destino = models.CharField(max_length=255)
    distancia_km = models.DecimalField(max_digits=8, decimal_places=2)
    peso_kg = models.DecimalField(max_digits=8, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    foto_entrega_url = models.URLField(blank=True)
    firma_digital = models.TextField(blank=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "envio"
        ordering = ["-fecha_solicitud"]

    def __str__(self):
        return f"Envío #{self.id_envio}"
