(function () {
  var path = window.location.pathname.replace(/\/+$/, "") || "/";

  function formatearFecha(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function mostrarError(ul, msj) {
    ul.innerHTML = "<li class='error-msg'>" + msj + "</li>";
  }

  /* ─────────── ENVÍOS ─────────── */
  if (path === "/envios") {
    API.obtenerEnvios()
      .then(function (envios) {
        var ul = document.querySelector(".lista-modern");
        if (!ul) return;
        ul.innerHTML = "";
        envios.forEach(function (e) {
          var li = document.createElement("li");
          li.innerHTML =
            "<span><strong>Envío #" + e.id + '</strong> <span class="tag">' + e.estado + "</span></span>" +
            '<a href="/envios/' + e.id + '/">Ver detalle</a>';
          ul.appendChild(li);
        });
        if (envios.length === 0) ul.innerHTML = "<li>No hay envíos registrados.</li>";
      })
      .catch(function (err) {
        var ul = document.querySelector(".lista-modern");
        if (ul) mostrarError(ul, err.message);
      });
  }

  /* ─────────── NUEVO ENVÍO ─────────── */
  if (path === "/envios/crear") {
    var form = document.querySelector("form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var datos = {
        direccion_origen: fd.get("direccion_origen"),
        direccion_destino: fd.get("direccion_destino"),
        distancia_km: fd.get("distancia_km"),
        peso_kg: fd.get("peso_kg"),
        precio: fd.get("precio"),
        estado: fd.get("estado") || "pendiente",
      };
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Guardando…";
      API.crearEnvio(datos)
        .then(function (envio) {
          window.location.href = "/envios/" + envio.id + "/";
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.innerHTML = '<i class="hgi-stroke hgi-save-01"></i> Guardar';
          var existente = form.querySelector(".error-msg");
          if (existente) existente.remove();
          var div = document.createElement("p");
          div.className = "error-msg";
          div.textContent = err.message;
          form.insertBefore(div, btn);
        });
    });
  }

  /* ─────────── DETALLE ENVÍO ─────────── */
  var matchDetalle = path.match(/^\/envios\/(\d+)$/);
  if (matchDetalle) {
    API.obtenerEnvio(matchDetalle[1])
      .then(function (e) {
        var dl = document.querySelector(".dl-grid");
        if (!dl) return;
        dl.innerHTML =
          "<dt>Origen</dt><dd>" + (e.origen || "—") + "</dd>" +
          "<dt>Destino</dt><dd>" + (e.destino || "—") + "</dd>" +
          "<dt>Distancia</dt><dd>" + e.distancia + " km</dd>" +
          "<dt>Peso</dt><dd>" + e.peso + " kg</dd>" +
          "<dt>Estado</dt><dd>" + e.estado + "</dd>" +
          "<dt>Precio</dt><dd>$" + e.precio + "</dd>" +
          "<dt>Solicitado</dt><dd>" + formatearFecha(e.fecha_solicitud) + "</dd>" +
          (e.fecha_entrega ? "<dt>Entregado</dt><dd>" + formatearFecha(e.fecha_entrega) + "</dd>" : "");
      })
      .catch(function () {});
  }

  /* ─────────── PAGOS ─────────── */
  if (path === "/pagos") {
    API.obtenerPagos()
      .then(function (pagos) {
        var ul = document.querySelector(".lista-modern");
        if (!ul) return;
        ul.innerHTML = "";
        pagos.forEach(function (p) {
          var li = document.createElement("li");
          li.innerHTML =
            "<span><strong>Pago #" + p.id + '</strong> <span class="tag">' + p.estado + "</span></span>" +
            "<span>$" + p.monto + " · Envío #" + p.envio + " · " + formatearFecha(p.fecha) + "</span>";
          ul.appendChild(li);
        });
        if (pagos.length === 0) ul.innerHTML = "<li>No hay pagos registrados.</li>";
      })
      .catch(function (err) {
        var ul = document.querySelector(".lista-modern");
        if (ul) mostrarError(ul, err.message);
      });
  }

  /* ─────────── NOTIFICACIONES ─────────── */
  if (path === "/notificaciones") {
    API.obtenerNotificaciones()
      .then(function (notificaciones) {
        var ul = document.querySelector(".lista-modern");
        if (!ul) return;
        ul.innerHTML = "";
        notificaciones.forEach(function (n) {
          var li = document.createElement("li");
          li.innerHTML = "<span>" + n.mensaje + '</span> <span class="tag">' + formatearFecha(n.fecha) + "</span>";
          ul.appendChild(li);
        });
        if (notificaciones.length === 0) ul.innerHTML = "<li>No hay notificaciones.</li>";
      })
      .catch(function (err) {
        var ul = document.querySelector(".lista-modern");
        if (ul) mostrarError(ul, err.message);
      });
  }
})();
