from django.shortcuts import render
from .models import Notificacion


def listado(request):
    return render(request, "notificaciones/listado.html", {"notificaciones": Notificacion.objects.select_related("id_usuario")})
