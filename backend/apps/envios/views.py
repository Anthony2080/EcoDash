import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from .forms import EnvioForm
from .models import Envio


def _serializar(envio):
    return {
        "id_envio": envio.id_envio,
        "direccion_origen": envio.direccion_origen,
        "direccion_destino": envio.direccion_destino,
        "distancia_km": str(envio.distancia_km),
        "peso_kg": str(envio.peso_kg),
        "estado": envio.estado,
        "precio": str(envio.precio),
        "id_cliente": envio.id_cliente_id,
        "id_repartidor": envio.id_repartidor_id,
        "fecha_solicitud": envio.fecha_solicitud.isoformat(),
        "fecha_entrega": envio.fecha_entrega.isoformat() if envio.fecha_entrega else None,
        "cliente_nombre": envio.id_cliente.id_usuario.nombre if hasattr(envio, "id_cliente") and envio.id_cliente else None,
        "repartidor_nombre": envio.id_repartidor.id_usuario.nombre if hasattr(envio, "id_repartidor") and envio.id_repartidor else None,
    }


def listado(request):
    return render(request, "envios/listado.html", {"envios": Envio.objects.select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")})


def detalle(request, id_envio):
    return render(request, "envios/detalle.html", {"envio": get_object_or_404(Envio, id_envio=id_envio)})


def crear(request):
    formulario = EnvioForm(request.POST or None)
    if request.method == "POST" and formulario.is_valid():
        envio = formulario.save()
        return redirect("envios:detalle", id_envio=envio.id_envio)
    return render(request, "envios/crear.html", {"formulario": formulario})


@csrf_exempt
def api_envios(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)

    if request.method == "GET":
        envios = Envio.objects.select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")
        return JsonResponse([_serializar(e) for e in envios], safe=False)

    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        from apps.clientes.models import Cliente
        try:
            cliente = Cliente.objects.get(id_usuario_id=usuario_id)
        except Cliente.DoesNotExist:
            return JsonResponse({"error": "El usuario no tiene un perfil de cliente."}, status=400)

        requeridos = ["direccion_origen", "direccion_destino", "distancia_km", "peso_kg", "precio"]
        for campo in requeridos:
            if not data.get(campo):
                return JsonResponse({"error": f"El campo '{campo}' es obligatorio."}, status=400)

        envio = Envio.objects.create(
            id_cliente=cliente,
            direccion_origen=data["direccion_origen"],
            direccion_destino=data["direccion_destino"],
            distancia_km=data["distancia_km"],
            peso_kg=data["peso_kg"],
            precio=data["precio"],
            estado=data.get("estado", "pendiente"),
        )
        return JsonResponse(_serializar(envio), status=201)

    return JsonResponse({"error": "Método no permitido."}, status=405)


@require_GET
def api_detalle(request, id_envio):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)
    envio = get_object_or_404(Envio, id_envio=id_envio)
    return JsonResponse(_serializar(envio))
