from django.shortcuts import get_object_or_404, redirect, render
from .forms import EnvioForm
from .models import Envio


def listado(request):
    return render(request, "envios/listado.html", {"envios": Envio.objects.select_related("id_cliente", "id_repartidor")})


def detalle(request, id_envio):
    return render(request, "envios/detalle.html", {"envio": get_object_or_404(Envio, id_envio=id_envio)})


def crear(request):
    formulario = EnvioForm(request.POST or None)
    if request.method == "POST" and formulario.is_valid():
        envio = formulario.save()
        return redirect("envios:detalle", id_envio=envio.id_envio)
    return render(request, "envios/crear.html", {"formulario": formulario})
