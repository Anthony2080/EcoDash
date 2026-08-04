from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .forms import EnvioForm
from .models import Envio
from .serializers import EnvioSerializer


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


@api_view(["GET"])
def api_envios(request):
    envios = Envio.objects.select_related("id_cliente__id_usuario", "id_repartidor__id_usuario").all()
    serializer = EnvioSerializer(envios, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def api_envio_detalle(request, id_envio):
    envio = get_object_or_404(Envio, id_envio=id_envio)
    serializer = EnvioSerializer(envio)
    return Response(serializer.data)
