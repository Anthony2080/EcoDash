(function () {
  var formLogin = document.getElementById("formLogin");
  var formRegistro = document.getElementById("formRegistro");
  var toggleBtn = document.getElementById("toggleBtn");
  var toggleText = document.getElementById("toggleText");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var loginVisible = !formLogin.classList.contains("hidden");
      formLogin.classList.toggle("hidden", loginVisible);
      formRegistro.classList.toggle("hidden", !loginVisible);
      toggleBtn.textContent = loginVisible ? "Ingresar" : "Crear una";
      toggleText.textContent = loginVisible
        ? "¿Ya tenés cuenta?"
        : "¿No tenés cuenta?";
    });
  }

  function mostrarError(mensaje) {
    var existente = document.querySelector(".login-error");
    if (existente) existente.remove();
    var div = document.createElement("div");
    div.className = "login-error";
    div.textContent = mensaje;
    document.querySelector(".login-card").insertBefore(div, document.querySelector(".toggle-auth"));
  }

  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value;
      var password = document.getElementById("password").value;
      API.login(email, password)
        .then(function () {
          window.location.href = "/panel/";
        })
        .catch(function (err) {
          mostrarError(err.message);
        });
    });
  }

  if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
      e.preventDefault();
      var datos = {
        nombre: document.getElementById("reg-nombre").value,
        email: document.getElementById("reg-email").value,
        telefono: document.getElementById("reg-telefono").value,
        direccion: document.getElementById("reg-direccion").value,
        password: document.getElementById("reg-password").value,
      };
      API.registrar(datos)
        .then(function () {
          window.location.href = "/panel/";
        })
        .catch(function (err) {
          mostrarError(err.message);
        });
    });
  }
})();
