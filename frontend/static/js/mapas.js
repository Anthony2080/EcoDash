const ORS_KEY = "";
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "&copy; <a href='https://openstreetmap.org/copyright'>OSM</a>";

/* ----- Mapa de detalle de envío ----- */
function initMapaDetalle() {
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

/* ----- Mapa de creación de envío ----- */
var marcadores = { origen: null, destino: null };
var capaRuta = null;

function initMapaCrear() {
  var map = L.map("mapa-crear").setView([-34.6037, -58.3816], 12);
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTR }).addTo(map);

  var paso = "origen";
  var info = L.control({ position: "topright" });
  info.onAdd = function () {
    this._div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    this._div.style.padding = "8px 12px";
    this._div.style.background = "white";
    this._div.innerHTML = "Hacé clic para marcar <b>ORIGEN</b>";
    return this._div;
  };
  info.addTo(map);

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
    }
  }

  map.on("click", function (e) {
    var latlng = e.latlng;
    geocodificar(latlng.lat, latlng.lng, function (dir) {
      if (marcadores[paso]) map.removeLayer(marcadores[paso].marker);
      var marker = L.marker(latlng).addTo(map);
      marker.bindPopup((paso === "origen" ? "Origen" : "Destino") + ": " + dir);
      marcadores[paso] = { lat: latlng.lat, lng: latlng.lng, dir: dir, marker: marker };

      if (paso === "origen") {
        paso = "destino";
        info._div.innerHTML = "Ahora hacé clic para marcar <b>DESTINO</b>";
      } else {
        paso = null;
        info._div.innerHTML = "Origen y destino seleccionados";
        if (capaRuta) map.removeLayer(capaRuta);
        obtenerRuta(latlng.lat + "," + latlng.lng, marcadores.origen.lat + "," + marcadores.origen.lng, map);
      }
      actualizarFormulario();
    });
  });
}

/* ----- Mapa de ruta del repartidor ----- */
function initMapaRuta() {
  var map = L.map("mapa-ruta").setView([-34.6037, -58.3816], 12);
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTR }).addTo(map);

  fetch("/envios/api/listado/")
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

/* ----- Inicialización automática según la página ----- */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("mapa-detalle")) initMapaDetalle();
  if (document.getElementById("mapa-crear")) initMapaCrear();
  if (document.getElementById("mapa-ruta")) initMapaRuta();
});