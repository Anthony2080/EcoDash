from django.db import models
from envios.models import Envio

class Pago(models.Model):
    METODOS = (
        ('mercadopago', 'Mercado Pago'),
        ('transferencia', 'Transferencia Bancaria'),
    )
    ESTADOS_PAGO = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('reembolsado', 'Reembolsado'),
    )
    id_pago = models.AutoField(primary_key=True)
    id_envio = models.OneToOneField(Envio, on_delete=models.CASCADE, related_name='pago')
    monto = models.FloatField()
    metodo = models.CharField(max_length=20, choices=METODOS)
    estado = models.CharField(max_length=20, choices=ESTADOS_PAGO, default='pendiente')
    fecha = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)