from django import forms
from .models import Repartidor


class RepartidorForm(forms.ModelForm):
    class Meta:
        model = Repartidor
        fields = ["id_usuario", "disponibilidad", "calificacion_avg"]
