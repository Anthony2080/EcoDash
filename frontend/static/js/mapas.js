const ORS_KEY = "";
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "&copy; <a href='https://openstreetmap.org/copyright'>OSM</a>";

/* ----- Mapa de detalle de envío ----- */
function initMapaDetalle() {
  if (typeof L === "undefined") return;
  if (!window.envioData) return;
  var d = window.envioData;
  var map = L.map("mapa-detalle").setView([-34.6037, -58.3816], 12);
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTR }).addTo(map);

  var hasOrigen = d.origen.lat != null && d.origen.lng != null;
  var hasDestino = d.destino.lat != null && d.destino.lng != null;

  if (hasOrigen) {
    L.marker([d.origen.lat, d.origen.lng]).addTo(map).bindPopup("<b>Origen</b><br>" + d.origen.dir);
  }
  if (hasDestino) {
    L.marker([d.destino.lat, d.destino.lng]).addTo(map).bindPopup("<b>Destino</b><br>" + d.destino.dir);
  }
  if (hasOrigen && hasDestino) {
    var bounds = L.latLngBounds([d.origen.lat, d.origen.lng], [d.destino.lat, d.destino.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });
    obtenerRuta(d.origen.lat + "," + d.origen.lng, d.destino.lat + "," + d.destino.lng, map);
  }
}

/* ----- Cálculo de precio ----- */
function actualizarPrecio() {
  var dist = document.getElementById("id_distancia_km");
  var peso = document.getElementById("id_peso_kg");
  var distancia = dist ? parseFloat(dist.value) || 0 : 0;
  var pesoKg = peso ? parseFloat(peso.value) || 0 : 0;
  var precio = 1000 + distancia * 150 + pesoKg * 200;
  precio = Math.max(1000, Math.min(6000, Math.round(precio)));
  var destino = document.getElementById("precio-estimado");
  if (destino) destino.textContent = "$" + precio;
}

/* ----- Mapa de creación de envío ----- */
var marcadores = { origen: null, destino: null };
var capaRuta = null;

function initMapaCrear() {
  if (typeof L === "undefined") return;
  var map = L.map("mapa-crear").setView([-34.6037, -58.3816], 12);
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTR }).addTo(map);

  var ladoActivo = "origen";
  var info = L.control({ position: "topright" });
  info.onAdd = function () {
    this._div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    this._div.style.padding = "8px 12px";
    this._div.style.background = "white";
    this._div.innerHTML = "Seleccioná <b>ORIGEN</b> (clic en el mapa o escribí la dirección y Enter)";
    return this._div;
  };
  info.addTo(map);

  var inputOrigen = document.getElementById("id_direccion_origen");
  var inputDestino = document.getElementById("id_direccion_destino");

  function actualizarFormulario() {
    var o = marcadores.origen;
    var d = marcadores.destino;
    document.getElementById("id_direccion_origen").value = o ? o.dir : "";
    document.getElementById("id_direccion_destino").value = d ? d.dir : "";
    document.getElementById("id_lat_origen").value = o ? o.lat : "";
    document.getElementById("id_lng_origen").value = o ? o.lng : "";
    document.getElementById("id_lat_destino").value = d ? d.lat : "";
    document.getElementById("id_lng_destino").value = d ? d.lng : "";
    if (o && d) {
      var dist = map.distance([o.lat, o.lng], [d.lat, d.lng]) / 1000;
      document.getElementById("id_distancia_km").value = dist.toFixed(2);
    } else {
      document.getElementById("id_distancia_km").value = "";
    }
    actualizarPrecio();
  }

  function dibujarRutaSiCompleto() {
    if (marcadores.origen && marcadores.destino) {
      if (capaRuta) map.removeLayer(capaRuta);
      obtenerRuta(marcadores.origen.lat + "," + marcadores.origen.lng,
                  marcadores.destino.lat + "," + marcadores.destino.lng, map);
    }
  }

  function colocarMarcador(lado, lat, lng, dir) {
    if (marcadores[lado] && marcadores[lado].marker) map.removeLayer(marcadores[lado].marker);
    var marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup((lado === "origen" ? "Origen" : "Destino") + ": " + dir);
    marcadores[lado] = { lat: lat, lng: lng, dir: dir, marker: marker };
    actualizarFormulario();
    dibujarRutaSiCompleto();
  }

  function limpiarLado(lado) {
    if (marcadores[lado] && marcadores[lado].marker) map.removeLayer(marcadores[lado].marker);
    marcadores[lado] = null;
    actualizarFormulario();
  }

  function conectarCampo(lado, input) {
    if (!input) return;
    input.addEventListener("focus", function () {
      ladoActivo = lado;
      info._div.innerHTML = "Seleccioná <b>" + (lado === "origen" ? "ORIGEN" : "DESTINO") +
        "</b> (clic en el mapa o escribí la dirección y Enter)";
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var dir = input.value.trim();
        if (!dir) {
          limpiarLado(lado);
          return;
        }
        geocodificarAdelante(dir, function (res) {
          if (!res) {
            alert("No se encontró la dirección.");
            return;
          }
          colocarMarcador(lado, res.lat, res.lng, res.dir);
        });
      }
    });
    input.addEventListener("input", function () {
      if (!input.value.trim() && marcadores[lado]) limpiarLado(lado);
    });
  }

  conectarCampo("origen", inputOrigen);
  conectarCampo("destino", inputDestino);

  map.on("click", function (e) {
    var latlng = e.latlng;
    geocodificar(latlng.lat, latlng.lng, function (dir) {
      colocarMarcador(ladoActivo, latlng.lat, latlng.lng, dir);
    });
  });
}

/* ----- Mapa de ruta del repartidor ----- */
function initMapaRuta() {
  if (typeof L === "undefined") return;
  var map = L.map("mapa-ruta").setView([-34.6037, -58.3816], 12);
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTR }).addTo(map);

  fetch("/api/envios/")
    .then(function (r) { return r.json(); })
    .then(function (envios) {
      var asignados = envios.filter(function (e) { return e.estado === "asignado" || e.estado === "en_camino"; });
      if (asignados.length === 0) {
        map.setView([-34.6037, -58.3816], 5);
        L.popup().setLatLng([-34.6037, -58.3816]).setContent("No hay envíos asignados hoy").openOn(map);
        return;
      }
      var puntos = [];
      asignados.forEach(function (env) {
        if (env.lat_origen && env.lng_origen) {
          L.marker([env.lat_origen, env.lng_origen]).addTo(map)
            .bindPopup("<b>Origen</b><br>" + (env.direccion_origen || ""));
          puntos.push(env.lat_origen + "," + env.lng_origen);
        }
        if (env.lat_destino && env.lng_destino) {
          L.marker([env.lat_destino, env.lng_destino]).addTo(map)
            .bindPopup("<b>Destino</b><br>" + (env.direccion_destino || ""));
          puntos.push(env.lat_destino + "," + env.lng_destino);
        }
      });
      if (puntos.length >= 2) {
        var coords = puntos.map(function (p) { return p.split(",").map(Number); });
        map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      }
    });
}

/* ----- OpenRouteService: obtener ruta ----- */
function obtenerRuta(origen, destino, map) {
  if (!ORS_KEY) return;

  var url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
  var body = JSON.stringify({
    coordinates: [
      origen.split(",").map(Number).reverse(),
      destino.split(",").map(Number).reverse(),
    ],
  });

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": ORS_KEY,
    },
    body: body,
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.features && data.features[0]) {
        var geo = data.features[0].geometry;
        var linea = L.geoJSON(geo, {
          style: { color: "#4CAF50", weight: 5, opacity: 0.8 },
        }).addTo(map);
        capaRuta = linea;
      }
    })
    .catch(function () {});
}

/* ----- Geocoding reverso con Nominatim ----- */
function geocodificar(lat, lng, callback) {
  var url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&addressdetails=1";
  fetch(url, { headers: { "Accept-Language": "es" } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      callback(data.display_name || lat + ", " + lng);
    })
    .catch(function () {
      callback(lat + ", " + lng);
    });
}

/* ----- Geocoding hacia adelante (buscar dirección por texto) ----- */
function geocodificarAdelante(direccion, callback) {
  var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(direccion);
  fetch(url, { headers: { "Accept-Language": "es" } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data[0]) {
        callback(null);
        return;
      }
      callback({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), dir: data[0].display_name });
    })
    .catch(function () {
      callback(null);
    });
}

/* ----- Inicialización automática según la página ----- */
document.addEventListener("DOMContentLoaded", function () {
  var pesoInput = document.getElementById("id_peso_kg");
  var distInput = document.getElementById("id_distancia_km");
  if (pesoInput) pesoInput.addEventListener("input", actualizarPrecio);
  if (distInput) distInput.addEventListener("input", actualizarPrecio);
  if (pesoInput || distInput) actualizarPrecio();
  if (document.getElementById("mapa-detalle")) initMapaDetalle();
  if (document.getElementById("mapa-crear")) initMapaCrear();
  if (document.getElementById("mapa-ruta")) initMapaRuta();
});