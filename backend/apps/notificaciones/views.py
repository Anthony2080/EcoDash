from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .models import Notificacion


def listado(request):
    return render(request, "notificaciones/listado.html", {"notificaciones": Notificacion.objects.select_related("id_usuario")})


@require_GET
def api_listado(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)
    notificaciones = Notificacion.objects.filter(id_usuario_id=usuario_id).select_related("id_usuario")
    data = []
    for n in notificaciones:
        data.append({
            "id_notificacion": n.id_notificacion,
            "id_usuario": n.id_usuario_id,
            "mensaje": n.mensaje,
            "fecha": n.fecha.isoformat(),
        })
    return JsonResponse(data, safe=False)
