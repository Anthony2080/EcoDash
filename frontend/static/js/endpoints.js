/*
  Capa intermedia de endpoints.
  Normaliza datos desde distintos formatos de backend
  para que el frontend siempre reciba la misma estructura.
*/

const API = (() => {
  const BASE = "";

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

  function normalizarEnvio(data) {
    return {
      id: data.id_envio || data.id || data.envioId,
      origen: data.direccion_origen || data.origen || data.origenGeo || "",
      destino: data.direccion_destino || data.destino || data.destinoGeo || "",
      distancia: data.distancia_km || data.distanciaKm || data.distancia,
      peso: data.peso_kg || data.pesoKg || data.peso,
      estado: data.estado,
      precio: data.precio,
      cliente: data.id_cliente || data.cliente,
      repartidor: data.id_repartidor || data.repartidor,
      fecha_solicitud: data.fecha_solicitud || data.fechaSolicitud,
      fecha_entrega: data.fecha_entrega || data.fechaEntrega,
    };
  }

  function normalizarUsuario(data) {
    return {
      id: data.id_usuario || data.id,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      rol: data.rol,
      fecha: data.fecha_registro || data.fechaRegistro,
    };
  }

  function normalizarPago(data) {
    return {
      id: data.id_pago || data.id,
      envio: data.id_envio || data.envio,
      monto: data.monto,
      metodo: data.metodo,
      estado: data.estado,
      fecha: data.fecha_pago || data.fecha,
      transaccion: data.transaccion_id || data.transactionId,
    };
  }

  return {
    login: function (email, password) {
      return peticion("/api/login/", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password }),
      });
    },
    registrar: function (datos) {
      return peticion("/api/registro/", {
        method: "POST",
        body: JSON.stringify({ ...datos, rol: "cliente" }),
      });
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
        body: JSON.stringify(datos),
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
        return (lista || []).map(function (n) {
          return {
            id: n.id_notificacion || n.id,
            mensaje: n.mensaje,
            fecha: n.fecha,
          };
        });
      });
    },
    normalizarUsuario: normalizarUsuario,
    normalizarEnvio: normalizarEnvio,
    normalizarPago: normalizarPago,
  };
})();
