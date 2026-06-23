(function () {
  /* ---- Toggle login / registro ---- */
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
})();
