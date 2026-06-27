import json

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Usuario


def _debug_roles(*args):
    if settings.DEBUG:
        print(*args)


def get_session_context(request):
    usuario_id = request.session.get("usuario_id")
    usuario_nombre = request.session.get("usuario_nombre")
    usuario_rol = request.session.get("usuario_rol")
    return {
        "usuario_id": usuario_id,
        "usuario_nombre": usuario_nombre,
        "usuario_rol": usuario_rol,
        "user_rol": usuario_rol,
        "nombre": usuario_nombre,
    }


def _serializar_usuario(usuario):
    return {
        "id": usuario.id_usuario,
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "rol": usuario.rol,
    }


def inicio(request):
    return render(request, "paginas/acceso.html")


def dashboard_view(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return redirect("login")
    return render(request, "paginas/panel.html", get_session_context(request))


def _obtener_datos(request):
    if request.content_type and request.content_type.startswith("application/json"):
        try:
            return json.loads(request.body)
        except json.JSONDecodeError:
            return {}
    return request.POST


@csrf_exempt
@require_POST
def login_api(request):
    data = _obtener_datos(request)
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Correo electrónico y contraseña son obligatorios."}, status=400)

    try:
        usuario = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Credenciales inválidas."}, status=401)

    if not check_password(password, usuario.password):
        return JsonResponse({"error": "Credenciales inválidas."}, status=401)

    _debug_roles("LOGIN USUARIO:", usuario.email, usuario.rol)

    request.session["usuario_id"] = usuario.id_usuario
    request.session["usuario_nombre"] = usuario.nombre
    request.session["usuario_rol"] = usuario.rol
    request.session["usuario_email"] = usuario.email

    if request.content_type != "application/json":
        return redirect("dashboard")
    return JsonResponse({
        "ok": True,
        "usuario": _serializar_usuario(usuario),
    })


@csrf_exempt
@require_POST
def registro_api(request):
    data = _obtener_datos(request)
    nombre = data.get("nombre", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    telefono = data.get("telefono", "").strip()
    direccion = data.get("direccion", "").strip()
    rol = (data.get("rol") or "cliente").strip().lower()
    _debug_roles("DATA REGISTRO:", data)
    _debug_roles("ROL RECIBIDO:", rol)

    if not nombre or not email or not password:
        return JsonResponse({"error": "Nombre, correo electrónico y contraseña son obligatorios."}, status=400)

    if Usuario.objects.filter(email=email).exists():
        return JsonResponse({"error": "Ya existe un usuario con ese correo electrónico."}, status=409)

    if rol not in ("cliente", "repartidor"):
        return JsonResponse({"error": f"Rol inválido: {rol}."}, status=400)

    usuario = Usuario.objects.create(
        nombre=nombre,
        email=email,
        password=make_password(password),
        telefono=telefono,
        direccion=direccion,
        rol=rol,
    )

    if rol == "cliente":
        from apps.clientes.models import Cliente
        Cliente.objects.create(id_usuario=usuario)
    elif rol == "repartidor":
        from apps.repartidores.models import Repartidor
        Repartidor.objects.create(id_usuario=usuario)

    request.session["usuario_id"] = usuario.id_usuario
    request.session["usuario_nombre"] = usuario.nombre
    request.session["usuario_rol"] = usuario.rol
    request.session["usuario_email"] = usuario.email

    if request.content_type != "application/json":
        return redirect("dashboard")
    return JsonResponse({
        "ok": True,
        "usuario": _serializar_usuario(usuario),
    }, status=201)


def logout_api(request):
    request.session.flush()
    return redirect("login")
