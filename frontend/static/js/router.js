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

  function _geocodificar(direccion, cb) {
    if (typeof window.geocodificarAdelante === "function") {
      window.geocodificarAdelante(direccion, cb);
      return;
    }
    var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(direccion);
    fetch(url, { headers: { "Accept-Language": "es" } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data[0]) { cb(null); return; }
        cb({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      })
      .catch(function () { cb(null); });
  }

  function _distanciaKm(a, b) {
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var la = a.lat * Math.PI / 180;
    var lb = b.lat * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function inicializarCrearEnvio() {
    var form = document.querySelector('form[data-form="crear-envio"]');
    if (!form) return;

    form.addEventListener("submit", function (e) {
      if (typeof API === "undefined" || typeof API.crearEnvio !== "function") {
        return;
      }
      e.preventDefault();

      var fd = new FormData(form);
      var direccion_origen = (fd.get("direccion_origen") || "").trim();
      var direccion_destino = (fd.get("direccion_destino") || "").trim();
      var distancia_km = (fd.get("distancia_km") || "").trim();
      var peso_kg = (fd.get("peso_kg") || "").trim();
      var lat_origen = fd.get("lat_origen");
      var lng_origen = fd.get("lng_origen");
      var lat_destino = fd.get("lat_destino");
      var lng_destino = fd.get("lng_destino");
      var btn = form.querySelector("button[type=submit]");
      var textoOriginal = btn ? btn.innerHTML : "";

      function mostrar(mensaje) {
        mostrarError(form, mensaje, btn);
      }

      if (!direccion_origen || !direccion_destino) {
        mostrar("Completá las direcciones de origen y destino.");
        return;
      }
      if (!peso_kg) {
        mostrar("Ingresá el peso (kg).");
        return;
      }

      function enviar() {
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Guardando...";
        }
        var datos = {
          direccion_origen: direccion_origen,
          direccion_destino: direccion_destino,
          lat_origen: lat_origen,
          lng_origen: lng_origen,
          lat_destino: lat_destino,
          lng_destino: lng_destino,
          distancia_km: distancia_km,
          peso_kg: peso_kg,
        };
        API.crearEnvio(datos)
          .then(function (envio) {
            window.location.href = "/envios/" + envio.id + "/";
          })
          .catch(function (err) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = textoOriginal || '<i class="hgi-stroke hgi-save-01"></i> Guardar';
            }
            mostrar(err.message);
            alert(err.message);
          });
      }

      if (distancia_km) {
        enviar();
        return;
      }

      if (!lat_origen || !lng_origen || !lat_destino || !lng_destino) {
        _geocodificar(direccion_origen, function (o) {
          _geocodificar(direccion_destino, function (d) {
            if (!o || !d) {
              mostrar("Seleccioná origen y destino en el mapa (o presioná Enter en cada dirección) para calcular la distancia.");
              return;
            }
            lat_origen = o.lat;
            lng_origen = o.lng;
            lat_destino = d.lat;
            lng_destino = d.lng;
            distancia_km = _distanciaKm(o, d).toFixed(2);
            var campos = {
              "id_distancia_km": distancia_km,
              "id_lat_origen": lat_origen,
              "id_lng_origen": lng_origen,
              "id_lat_destino": lat_destino,
              "id_lng_destino": lng_destino,
            };
            for (var id in campos) {
              if (document.getElementById(id)) document.getElementById(id).value = campos[id];
            }
            enviar();
          });
        });
        return;
      }
      enviar();
    });
  }

  if (buscarSeccion("envios")) inicializarEnvios();
  if (buscarSeccion("crear-envio")) inicializarCrearEnvio();
  if (buscarSeccion("detalle-envio")) inicializarDetalleEnvio();
  if (buscarSeccion("pagos")) inicializarPagos();
  if (buscarSeccion("notificaciones")) inicializarNotificaciones();
})();
