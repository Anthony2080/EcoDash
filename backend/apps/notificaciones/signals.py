from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.envios.models import Envio
from apps.notificaciones.models import Notificacion


@receiver(pre_save, sender=Envio)
def registrar_estado_anterior(sender, instance, **kwargs):
    """Observer: captura el estado previo para detectar transiciones reales."""
    if instance.pk:
        try:
            instance._estado_anterior = Envio.objects.get(pk=instance.pk).estado
        except Envio.DoesNotExist:
            instance._estado_anterior = None
    else:
        instance._estado_anterior = None


@receiver(post_save, sender=Envio)
def notificar_cambio_envio(sender, instance, **kwargs):
    """Observer: notifica automáticamente ante cambios de estado del envío.

    Prioridad 1: aviso explícito definido por la vista (identifica al actor,
    necesario para saber a quién avisar en una cancelación).
    Prioridad 2: aviso automático por transición a "entregado" (al cliente).
    """
    aviso = getattr(instance, "_aviso", None)
    if aviso and aviso.get("id_usuario"):
        Notificacion.objects.create(id_usuario_id=aviso["id_usuario"], mensaje=aviso["mensaje"])
        return

    anterior = getattr(instance, "_estado_anterior", None)
    if instance.estado == "entregado" and anterior != "entregado" and instance.id_cliente_id:
        Notificacion.objects.create(
            id_usuario_id=instance.id_cliente.id_usuario_id,
            mensaje=f"Tu envío #{instance.id_envio} fue entregado.",
        )
        return