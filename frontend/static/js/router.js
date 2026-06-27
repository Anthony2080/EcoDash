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

  function inicializarEnvios() {}

  function inicializarDetalleEnvio() {}

  function inicializarPagos() {}

  function inicializarNotificaciones() {}

  function inicializarCrearEnvio() {
    var form = document.querySelector('form[data-form="crear-envio"]');
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
      var textoOriginal = btn ? btn.innerHTML : "";

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Guardando...";
      }

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
        });
    });
  }

  if (buscarSeccion("envios")) inicializarEnvios();
  if (buscarSeccion("crear-envio")) inicializarCrearEnvio();
  if (buscarSeccion("detalle-envio")) inicializarDetalleEnvio();
  if (buscarSeccion("pagos")) inicializarPagos();
  if (buscarSeccion("notificaciones")) inicializarNotificaciones();
})();
