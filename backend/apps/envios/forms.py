from django import forms
from .models import Envio


class EnvioForm(forms.ModelForm):
    class Meta:
        model = Envio
        fields = ["direccion_origen", "direccion_destino",
                  "lat_origen", "lng_origen", "lat_destino", "lng_destino",
                  "distancia_km", "peso_kg"]
