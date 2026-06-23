from django.shortcuts import render
from .models import Pago


def listado(request):
    return render(request, "pagos/listado.html", {"pagos": Pago.objects.select_related("id_envio")})
