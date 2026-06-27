/*
  Adaptador temporal por desalineacion entre SQL, modelos Django y contrato API.
  Ver frontend/NOTA_TECNICA_BACKEND_DB.md.

  Este archivo solo llama APIs, prepara payloads y normaliza respuestas.
  No debe renderizar HTML ni decidir reglas de negocio definitivas.
*/

const API = (() => {
  const BASE = "";

  function valor(data, nombres, fallback) {
    for (var i = 0; i < nombres.length; i += 1) {
      var nombre = nombres[i];
      if (data && data[nombre] !== undefined && data[nombre] !== null && data[nombre] !== "") {
        return data[nombre];
      }
    }
    return fallback;
  }

  function csrfToken() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  }

  function peticion(url, opciones = {}) {
    var metodo = (opciones.method || "GET").toUpperCase();
    var cabeceras = { "Content-Type": "application/json" };
    if (metodo !== "GET" && metodo !== "HEAD") {
      cabeceras["X-CSRFToken"] = csrfToken();
    }
    var config = {
      method: metodo,
      headers: cabeceras,
      credentials: "include",
    };
    if (opciones.body) config.body = opciones.body;
    return fetch(BASE + url, config).then(async (r) => {
      if (!r.ok) {
        let mensaje = "Error " + r.status;
        try {
          var cuerpo = await r.json();
          if (cuerpo && cuerpo.error) mensaje = cuerpo.error;
        } catch (_) {
          mensaje = "Error " + r.status + ": " + r.statusText;
        }
        throw new Error(mensaje);
      }
      return r.json().catch(function () { return null; });
    });
  }

  function normalizarRegistroEntrada(datos) {
    var payload = {
      nombre: valor(datos, ["nombre", "name", "nombreCompleto"], ""),
      email: valor(datos, ["email", "correo", "correo_electronico"], ""),
      telefono: valor(datos, ["telefono", "tel", "phone"], ""),
      direccion: valor(datos, ["direccion", "address"], ""),
      password: valor(datos, ["password", "contrasena", "contraseña"], ""),
      // Fallback temporal hasta que el flujo de roles quede definido por backend/producto.
      rol: valor(datos, ["rol"], "cliente"),
    };
    console.log("PAYLOAD NORMALIZADO REGISTRO:", payload);
    return payload;
  }

  function normalizarEnvioEntrada(datos) {
    return {
      direccion_origen: valor(datos, ["direccion_origen", "origen", "origenGeo"], ""),
      direccion_destino: valor(datos, ["direccion_destino", "destino", "destinoGeo"], ""),
      distancia_km: valor(datos, ["distancia_km", "distanciaKm", "distancia"], ""),
      peso_kg: valor(datos, ["peso_kg", "pesoKg", "peso"], ""),
      precio: valor(datos, ["precio", "monto"], ""),
      estado: valor(datos, ["estado"], "pendiente"),
    };
  }

  function normalizarEnvio(data) {
    var id = valor(data, ["id_envio", "id", "envioId"], null);
    var origen = valor(data, ["direccion_origen", "origen", "origenGeo"], "");
    var destino = valor(data, ["direccion_destino", "destino", "destinoGeo"], "");
    var distanciaKm = valor(data, ["distancia_km", "distanciaKm", "distancia"], "");
    var pesoKg = valor(data, ["peso_kg", "pesoKg", "peso"], "");
    var fechaSolicitud = valor(data, ["fecha_solicitud", "fechaSolicitud"], null);
    var fechaEntrega = valor(data, ["fecha_entrega", "fechaEntrega"], null);
    var envio = {
      id: id,
      origen: origen,
      destino: destino,
      distanciaKm: distanciaKm,
      pesoKg: pesoKg,
      estado: valor(data, ["estado"], ""),
      precio: valor(data, ["precio"], ""),
      fechaSolicitud: fechaSolicitud,
      fechaEntrega: fechaEntrega,
      clienteId: valor(data, ["id_cliente", "cliente", "clienteId"], null),
      repartidorId: valor(data, ["id_repartidor", "repartidor", "repartidorId"], null),
    };

    // Alias de compatibilidad para codigo existente durante la transicion.
    envio.distancia = envio.distanciaKm;
    envio.peso = envio.pesoKg;
    envio.fecha_solicitud = envio.fechaSolicitud;
    envio.fecha_entrega = envio.fechaEntrega;
    return envio;
  }

  function normalizarUsuario(data) {
    var usuario = data && data.usuario ? data.usuario : data;
    return {
      id: valor(usuario, ["id_usuario", "id", "usuarioId"], null),
      nombre: valor(usuario, ["nombre", "name"], ""),
      email: valor(usuario, ["email", "correo"], ""),
      telefono: valor(usuario, ["telefono", "phone"], ""),
      direccion: valor(usuario, ["direccion", "address"], ""),
      rol: valor(usuario, ["rol"], ""),
      fecha: valor(usuario, ["fecha_registro", "fechaRegistro", "fecha"], null),
    };
  }

  function normalizarPago(data) {
    var envioId = valor(data, ["id_envio", "envio", "envioId"], null);
    var transaccionId = valor(data, ["transaction_id", "transaccion_id", "transaccionId"], "");
    var pago = {
      id: valor(data, ["id_pago", "id", "pagoId"], null),
      envioId: envioId,
      monto: valor(data, ["monto"], ""),
      metodo: valor(data, ["metodo"], ""),
      estado: valor(data, ["estado"], ""),
      fecha: valor(data, ["fecha_pago", "fecha"], null),
      transaccionId: transaccionId,
    };

    pago.envio = pago.envioId;
    pago.transaccion = pago.transaccionId;
    return pago;
  }

  function normalizarNotificacion(data) {
    return {
      id: valor(data, ["id_notificacion", "id", "notificacionId"], null),
      usuarioId: valor(data, ["id_usuario", "usuario", "usuarioId"], null),
      mensaje: valor(data, ["mensaje"], ""),
      fecha: valor(data, ["fecha"], null),
    };
  }

  return {
    login: function (email, password) {
      return peticion("/api/login/", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password }),
      }).then(normalizarUsuario);
    },
    registrar: function (datos) {
      return peticion("/api/registro/", {
        method: "POST",
        body: JSON.stringify(normalizarRegistroEntrada(datos)),
      }).then(normalizarUsuario);
    },
    obtenerEnvios: function () {
      return peticion("/api/envios/").then(function (lista) {
        return (lista || []).map(normalizarEnvio);
      });
    },
    obtenerEnvio: function (id) {
      return peticion("/api/envios/" + id + "/").then(normalizarEnvio);
    },
    crearEnvio: function (datos) {
      return peticion("/api/envios/", {
        method: "POST",
        body: JSON.stringify(normalizarEnvioEntrada(datos)),
      }).then(normalizarEnvio);
    },
    obtenerPagos: function () {
      return peticion("/api/pagos/").then(function (lista) {
        return (lista || []).map(normalizarPago);
      });
    },
    logout: function () {
      return peticion("/api/logout/", { method: "POST" });
    },
    obtenerNotificaciones: function () {
      return peticion("/api/notificaciones/").then(function (lista) {
        return (lista || []).map(normalizarNotificacion);
      });
    },
    normalizarRegistroEntrada: normalizarRegistroEntrada,
    normalizarEnvioEntrada: normalizarEnvioEntrada,
    normalizarUsuario: normalizarUsuario,
    normalizarEnvio: normalizarEnvio,
    normalizarPago: normalizarPago,
    normalizarNotificacion: normalizarNotificacion,
  };
})();
