/*
  Capa intermedia de endpoints.
  Normaliza datos desde distintos formatos de backend
  para que el frontend siempre reciba la misma estructura.
*/

const API = (() => {
  const BASE = "";

  function peticion(url, opciones = {}) {
    const config = {
      headers: { "Content-Type": "application/json", ...opciones.headers },
      ...opciones,
    };
    return fetch(BASE + url, config).then((r) => {
      if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
      return r.json().catch(() => null);
    });
  }

  /* Normalizador: unifica campos vengan como vengan */
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

  /* Endpoints públicos (placeholders) */
  return {
    login: (email, password) =>
      peticion("/api/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    registrar: (datos) =>
      peticion("/api/registro/", {
        method: "POST",
        body: JSON.stringify({ ...datos, rol: "cliente" }),
      }),
    obtenerEnvios: () =>
      peticion("/api/envios/").then((lista) =>
        (lista || []).map(normalizarEnvio)
      ),
    obtenerEnvio: (id) =>
      peticion(`/api/envios/${id}/`).then(normalizarEnvio),
    crearEnvio: (datos) =>
      peticion("/api/envios/", {
        method: "POST",
        body: JSON.stringify(datos),
      }).then(normalizarEnvio),
    obtenerPagos: () =>
      peticion("/api/pagos/").then((lista) =>
        (lista || []).map(normalizarPago)
      ),
    normalizarUsuario,
    normalizarEnvio,
    normalizarPago,
  };
})();
