from django.shortcuts import redirect, render

from apps.usuarios.views import get_session_context


def menu(request):
    if not request.session.get("usuario_id"):
        return redirect("login")
    return render(request, "paginas/panel.html", get_session_context(request))
