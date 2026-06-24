import json

from django.contrib.auth.hashers import check_password, make_password
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Usuario


def inicio(request):
    return render(request, "usuarios/inicio.html")


def dashboard_view(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return redirect("login")
    return render(request, "dashboard.html", {
        "user_rol": request.session.get("usuario_rol"),
        "nombre": request.session.get("usuario_nombre"),
    })


def _obtener_datos(request):
    if request.content_type == "application/json":
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

    request.session["usuario_id"] = usuario.id_usuario
    request.session["usuario_nombre"] = usuario.nombre
    request.session["usuario_rol"] = usuario.rol
    request.session["usuario_email"] = usuario.email

    if request.content_type != "application/json":
        return redirect("dashboard")
    return JsonResponse({
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "rol": usuario.rol,
        "fecha_registro": usuario.fecha_registro.isoformat(),
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
    rol = data.get("rol", "cliente").strip()

    if not nombre or not email or not password:
        return JsonResponse({"error": "Nombre, correo electrónico y contraseña son obligatorios."}, status=400)

    if Usuario.objects.filter(email=email).exists():
        return JsonResponse({"error": "Ya existe un usuario con ese correo electrónico."}, status=409)

    if rol not in dict(Usuario.ROLES):
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
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "rol": usuario.rol,
        "fecha_registro": usuario.fecha_registro.isoformat(),
    }, status=201)


def logout_api(request):
    request.session.flush()
    return redirect("login")
