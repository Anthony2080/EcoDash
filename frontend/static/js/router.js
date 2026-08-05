(function () {
  function buscarSeccion(nombre) {
    return document.querySelector('[data-seccion="' + nombre + '"]');
  }

  function mostrarError(form, mensaje, antesDe) {
    var existente = form.querySelector(".error-msg");
    if (existente) existente.remove();

    var error = document.createElement("p");
    error.className = "error-msg";
    error.textContent = mensaje;
    form.insertBefore(error, antesDe || form.firstChild);
  }

  function renderRepartidor(envios) {
    var disponibles = document.getElementById("envios-disponibles");
    var asignados = document.getElementById("envios-asignados");
    var historial = document.getElementById("envios-historial");
    if (!disponibles || !asignados || !historial) return;

    disponibles.innerHTML = "";
    asignados.innerHTML = "";
    historial.innerHTML = "";
    var nDisponibles = 0;
    var nAsignados = 0;
    var nHistorial = 0;

    envios.forEach(function (e) {
      var li = document.createElement("li");
      if (e.estadoVista === "disponible") {
        nDisponibles++;
        li.innerHTML = '<span><strong>Envío #' + e.id + '</strong><span class="tag">Disponible</span></span>'
          + '<button class="btn btn-accion btn-tomar" data-id="' + e.id + '">Tomar</button>';
        disponibles.appendChild(li);
      } else if (e.estadoVista === "tomado") {
        nAsignados++;
        li.innerHTML = '<span><strong>Envío #' + e.id + '</strong><span class="tag">Asignado</span></span>'
          + '<button class="btn btn-outline btn-cancelar" data-id="' + e.id + '">Cancelar</button>';
        asignados.appendChild(li);
      } else {
        nHistorial++;
        var etiqueta = e.estadoVista === "entregado" ? "Entregado" : "Cancelado";
        li.innerHTML = '<span><strong>Envío #' + e.id + '</strong><span class="tag">' + etiqueta + '</span></span>';
        historial.appendChild(li);
      }
    });

    if (!nDisponibles) disponibles.innerHTML = "<li>No hay envíos disponibles.</li>";
    if (!nAsignados) asignados.innerHTML = "<li>No tenés envíos asignados.</li>";
    if (!nHistorial) historial.innerHTML = "<li>No hay historial.</li>";
  }

  function cargarRepartidor() {
    API.obtenerEnvios().then(renderRepartidor).catch(function () {});
  }

  function manejarAcciones(e) {
    var tomar = e.target.closest(".btn-tomar");
    if (tomar) {
      e.preventDefault();
      API.tomarEnvio(tomar.getAttribute("data-id"))
        .then(cargarRepartidor)
        .catch(function (err) { alert(err.message); });
      return;
    }

    var cancelar = e.target.closest(".btn-cancelar");
    if (cancelar) {
      e.preventDefault();
      API.cancelarEnvio(cancelar.getAttribute("data-id"))
        .then(function () {
          if (document.getElementById("envios-disponibles")) cargarRepartidor();
          else window.location.reload();
        })
        .catch(function (err) { alert(err.message); });
      return;
    }

    var resolicitar = e.target.closest(".btn-re-solicitar");
    if (resolicitar) {
      e.preventDefault();
      API.reSolicitarEnvio(resolicitar.getAttribute("data-id"))
        .then(function () { window.location.reload(); })
        .catch(function (err) { alert(err.message); });
    }
  }

  function inicializarEnvios() {
    if (document.getElementById("envios-disponibles")) {
      cargarRepartidor();
      setInterval(cargarRepartidor, 5000);
    }
    document.addEventListener("click", manejarAcciones);
  }

  function inicializarDetalleEnvio() {}

  function inicializarPagos() {}

  function inicializarNotificaciones() {}

  function inicializarCrearEnvio() {
    var form = document.querySelector('form[data-form="crear-envio"]');
    if (!form) return;

    form.addEventListener("submit", function (e) {
      if (typeof API === "undefined" || typeof API.crearEnvio !== "function") {
        return;
      }
      e.preventDefault();

      var fd = new FormData(form);
      var datos = {
        direccion_origen: fd.get("direccion_origen"),
        direccion_destino: fd.get("direccion_destino"),
        lat_origen: fd.get("lat_origen"),
        lng_origen: fd.get("lng_origen"),
        lat_destino: fd.get("lat_destino"),
        lng_destino: fd.get("lng_destino"),
        distancia_km: fd.get("distancia_km"),
        peso_kg: fd.get("peso_kg"),
      };
      var btn = form.querySelector("button[type=submit]");
      var textoOriginal = btn ? btn.innerHTML : "";

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Guardando...";
      }

      try {
        API.crearEnvio(datos)
          .then(function (envio) {
            window.location.href = "/envios/" + envio.id + "/";
          })
          .catch(function (err) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = textoOriginal || '<i class="hgi-stroke hgi-save-01"></i> Guardar';
            }
            mostrarError(form, err.message, btn);
            alert(err.message);
          });
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = textoOriginal || '<i class="hgi-stroke hgi-save-01"></i> Guardar';
        }
        alert("Error inesperado: " + err.message);
      }
    });
  }

  if (buscarSeccion("envios")) inicializarEnvios();
  if (buscarSeccion("crear-envio")) inicializarCrearEnvio();
  if (buscarSeccion("detalle-envio")) inicializarDetalleEnvio();
  if (buscarSeccion("pagos")) inicializarPagos();
  if (buscarSeccion("notificaciones")) inicializarNotificaciones();
})();
