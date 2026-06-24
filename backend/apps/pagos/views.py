from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .models import Pago


def listado(request):
    return render(request, "pagos/listado.html", {"pagos": Pago.objects.select_related("id_envio")})


@require_GET
def api_listado(request):
    usuario_id = request.session.get("usuario_id")
    if not usuario_id:
        return JsonResponse({"error": "No autorizado."}, status=401)
    pagos = Pago.objects.select_related("id_envio")
    data = []
    for p in pagos:
        data.append({
            "id_pago": p.id_pago,
            "id_envio": p.id_envio_id,
            "monto": str(p.monto),
            "metodo": p.metodo,
            "estado": p.estado,
            "fecha_pago": p.fecha_pago.isoformat(),
            "transaccion_id": p.transaccion_id,
        })
    return JsonResponse(data, safe=False)
