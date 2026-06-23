from django import forms
from .models import Envio


class EnvioForm(forms.ModelForm):
    class Meta:
        model = Envio
        fields = ["id_cliente", "id_repartidor", "direccion_origen", "direccion_destino",
                  "distancia_km", "peso_kg", "estado", "precio"]
