from django.db import models
from apps.envios.models import Envio


class Pago(models.Model):
    METODOS = (("efectivo", "Efectivo"), ("transferencia", "Transferencia"), ("mercadopago", "Mercado Pago"))
    ESTADOS = (("pendiente", "Pendiente"), ("aprobado", "Aprobado"), ("rechazado", "Rechazado"),
               ("reembolsado", "Reembolsado"))
    id_pago = models.AutoField(primary_key=True)
    id_envio = models.OneToOneField(Envio, on_delete=models.CASCADE, related_name="pago", db_column="id_envio")
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    metodo = models.CharField(max_length=20, choices=METODOS)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    fecha_pago = models.DateTimeField(auto_now_add=True)
    transaccion_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "pago"

    def __str__(self):
        return f"Pago #{self.id_pago}"
