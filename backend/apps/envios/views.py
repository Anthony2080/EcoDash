import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from apps.usuarios.views import get_session_context
from .forms import EnvioForm
from .models import Envio

MINUTOS_TOMADO = 30
PRECIO_MIN = 1000
PRECIO_MAX = 6000


def calcular_precio(distancia_km, peso_kg):
    try:
        precio = 1000 + float(distancia_km or 0) * 150 + float(peso_kg or 0) * 200
    except (TypeError, ValueError):
        precio = 1000
    return max(PRECIO_MIN, min(PRECIO_MAX, round(precio)))


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
        "fecha_estado": envio.fecha_estado.isoformat(),
        "fecha_entrega": envio.fecha_entrega.isoformat() if envio.fecha_entrega else None,
        "lat_origen": str(envio.lat_origen) if envio.lat_origen is not None else None,
        "lng_origen": str(envio.lng_origen) if envio.lng_origen is not None else None,
        "lat_destino": str(envio.lat_destino) if envio.lat_destino is not None else None,
        "lng_destino": str(envio.lng_destino) if envio.lng_destino is not None else None,
        "cliente_nombre": envio.id_cliente.id_usuario.nombre if hasattr(envio, "id_cliente") and envio.id_cliente else None,
        "repartidor_nombre": envio.id_repartidor.id_usuario.nombre if hasattr(envio, "id_repartidor") and envio.id_repartidor else None,
    }


def listado(request):
    contexto = get_session_context(request)
    usuario_id = request.session.get("usuario_id")
    rol = request.session.get("usuario_rol")

    if rol == "repartidor":
        from apps.repartidores.models import Repartidor
        repartidor = Repartidor.objects.get(id_usuario_id=usuario_id)
        contexto["envios"] = _envios_repartidor(repartidor.id_repartidor)
    elif rol == "cliente":
        from apps.clientes.models import Cliente
        cliente = Cliente.objects.get(id_usuario_id=usuario_id)
        contexto["envios"] = Envio.objects.filter(id_cliente_id=cliente.id_cliente).select_related(
            "id_cliente__id_usuario", "id_repartidor__id_usuario")
    else:
        contexto["envios"] = Envio.objects.none()

    return render(request, "envios/listado.html", contexto)


def _envios_repartidor(repartidor_id):
    return Envio.objects.filter(
        id_repartidor_id=repartidor_id,
        estado__in=["asignado", "retirado", "en_camino", "cancelado"],
    ).select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")


def detalle(request, id_envio):
    return render(request, "envios/detalle.html", {"envio": get_object_or_404(Envio, id_envio=id_envio)})


def crear(request):
    if not request.session.get("usuario_id"):
        return redirect("login")
    if request.session.get("usuario_rol") == "repartidor":
        return redirect("envios:listado")

    from apps.clientes.models import Cliente
    contexto = get_session_context(request)
    usuario_id = request.session.get("usuario_id")
    cliente = None
    try:
        cliente = Cliente.objects.get(id_usuario_id=usuario_id)
    except Cliente.DoesNotExist:
        pass

    formulario = EnvioForm(request.POST or None)
    if request.method == "POST":
        if formulario.is_valid() and cliente is not None:
            envio = formulario.save(commit=False)
            envio.id_cliente = cliente
            envio.precio = calcular_precio(envio.distancia_km, envio.peso_kg)
            envio.save()
            return redirect("envios:detalle", id_envio=envio.id_envio)
        elif cliente is None:
            formulario.add_error(None, "Tu cuenta no tiene un perfil de cliente. Contactá al administrador.")

    contexto["formulario"] = formulario
    return render(request, "envios/crear.html", contexto)


@csrf_exempt
def api_envios(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)

    if request.method == "GET":
        rol = request.session.get("usuario_rol")
        if rol == "repartidor":
            from apps.repartidores.models import Repartidor
            repartidor = Repartidor.objects.get(id_usuario_id=usuario_id)
            limite = timezone.now() - timezone.timedelta(minutes=MINUTOS_TOMADO)
            data = []
            historial = Envio.objects.filter(
                id_repartidor_id=repartidor.id_repartidor,
                estado__in=["entregado", "cancelado"],
            ).select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")
            for e in historial:
                item = _serializar(e)
                item["estado_vista"] = e.estado
                data.append(item)

            asignados = Envio.objects.filter(
                id_repartidor_id=repartidor.id_repartidor,
                estado__in=["asignado", "retirado", "en_camino"],
            ).select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")
            for e in asignados:
                if e.fecha_estado < limite:
                    continue
                item = _serializar(e)
                item["estado_vista"] = "tomado"
                data.append(item)

            disponibles = Envio.objects.filter(estado="pendiente").select_related("id_cliente__id_usuario", "id_repartidor__id_usuario")
            for e in disponibles:
                item = _serializar(e)
                item["estado_vista"] = "disponible"
                data.append(item)

            return JsonResponse(data, safe=False)

        from apps.clientes.models import Cliente
        try:
            cliente = Cliente.objects.get(id_usuario_id=usuario_id)
        except Cliente.DoesNotExist:
            return JsonResponse({"error": "El usuario no tiene un perfil de cliente."}, status=400)
        envios = Envio.objects.filter(id_cliente_id=cliente.id_cliente).select_related(
            "id_cliente__id_usuario", "id_repartidor__id_usuario")
        return JsonResponse([_serializar(e) for e in envios], safe=False)

    if request.method == "POST":
        if request.session.get("usuario_rol") == "repartidor":
            return JsonResponse({"error": "No autorizado."}, status=403)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        from apps.clientes.models import Cliente
        try:
            cliente = Cliente.objects.get(id_usuario_id=usuario_id)
        except Cliente.DoesNotExist:
            return JsonResponse({"error": "El usuario no tiene un perfil de cliente."}, status=400)

        requeridos = ["direccion_origen", "direccion_destino", "distancia_km", "peso_kg"]
        for campo in requeridos:
            if not data.get(campo):
                return JsonResponse({"error": f"El campo '{campo}' es obligatorio."}, status=400)

        envio = Envio.objects.create(
            id_cliente=cliente,
            direccion_origen=data["direccion_origen"],
            direccion_destino=data["direccion_destino"],
            distancia_km=data["distancia_km"],
            peso_kg=data["peso_kg"],
            precio=calcular_precio(data["distancia_km"], data["peso_kg"]),
            estado="pendiente",
            lat_origen=data.get("lat_origen") or None,
            lng_origen=data.get("lng_origen") or None,
            lat_destino=data.get("lat_destino") or None,
            lng_destino=data.get("lng_destino") or None,
        )
        return JsonResponse(_serializar(envio), status=201)

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_tomar(request, id_envio):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)
    if request.session.get("usuario_rol") != "repartidor":
        return JsonResponse({"error": "No autorizado."}, status=403)

    from apps.repartidores.models import Repartidor
    try:
        repartidor = Repartidor.objects.get(id_usuario_id=usuario_id)
    except Repartidor.DoesNotExist:
        return JsonResponse({"error": "No tiene un perfil de repartidor."}, status=400)

    envio = get_object_or_404(Envio, id_envio=id_envio)
    if envio.estado != "pendiente":
        return JsonResponse({"error": "El envío ya fue tomado."}, status=409)

    envio.id_repartidor = repartidor
    envio.estado = "asignado"
    envio._aviso = {
        "id_usuario": envio.id_cliente.id_usuario_id,
        "mensaje": f"Tu pedido #{envio.id_envio} fue tomado por {repartidor.id_usuario.nombre}.",
    }
    envio.save()
    return JsonResponse(_serializar(envio))


@csrf_exempt
def api_cancelar(request, id_envio):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)

    envio = get_object_or_404(Envio, id_envio=id_envio)
    rol = request.session.get("usuario_rol")
    if rol == "repartidor":
        from apps.repartidores.models import Repartidor
        repartidor = Repartidor.objects.get(id_usuario_id=usuario_id)
        if envio.id_repartidor_id != repartidor.id_repartidor:
            return JsonResponse({"error": "No autorizado."}, status=403)
    elif rol == "cliente":
        from apps.clientes.models import Cliente
        cliente = Cliente.objects.get(id_usuario_id=usuario_id)
        if envio.id_cliente_id != cliente.id_cliente:
            return JsonResponse({"error": "No autorizado."}, status=403)
    else:
        return JsonResponse({"error": "No autorizado."}, status=403)

    envio.estado = "cancelado"
    id_aviso = None
    mensaje = ""
    if rol == "repartidor" and envio.id_cliente_id:
        id_aviso = envio.id_cliente.id_usuario_id
        mensaje = f"El repartidor canceló tu pedido #{envio.id_envio}."
    elif rol == "cliente" and envio.id_repartidor_id:
        id_aviso = envio.id_repartidor.id_usuario_id
        mensaje = f"El cliente canceló el pedido #{envio.id_envio}."
    if id_aviso:
        envio._aviso = {"id_usuario": id_aviso, "mensaje": mensaje}
    envio.save()
    return JsonResponse(_serializar(envio))


@csrf_exempt
def api_re_solicitar(request, id_envio):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)

    from apps.clientes.models import Cliente
    try:
        cliente = Cliente.objects.get(id_usuario_id=usuario_id)
    except Cliente.DoesNotExist:
        return JsonResponse({"error": "No tiene un perfil de cliente."}, status=400)

    envio = get_object_or_404(Envio, id_envio=id_envio)
    if envio.id_cliente_id != cliente.id_cliente:
        return JsonResponse({"error": "No autorizado."}, status=403)
    if envio.estado != "cancelado":
        return JsonResponse({"error": "Solo se puede re-solicitar un envío cancelado."}, status=409)

    nuevo = Envio.objects.create(
        id_cliente=cliente,
        direccion_origen=envio.direccion_origen,
        direccion_destino=envio.direccion_destino,
        lat_origen=envio.lat_origen,
        lng_origen=envio.lng_origen,
        lat_destino=envio.lat_destino,
        lng_destino=envio.lng_destino,
        distancia_km=envio.distancia_km,
        peso_kg=envio.peso_kg,
        precio=calcular_precio(envio.distancia_km, envio.peso_kg),
        estado="pendiente",
    )
    return JsonResponse(_serializar(nuevo), status=201)


@require_GET
def api_detalle(request, id_envio):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)
    envio = get_object_or_404(Envio, id_envio=id_envio)
    return JsonResponse(_serializar(envio))