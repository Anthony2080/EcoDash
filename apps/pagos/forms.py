from django import forms
from .models import Pago


class PagoForm(forms.ModelForm):
    class Meta:
        model = Pago
        fields = ["id_envio", "monto", "metodo", "estado", "transaccion_id"]
