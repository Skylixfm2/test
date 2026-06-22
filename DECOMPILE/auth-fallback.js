(function () {
  const keys = [
    "lusive-customer-email",
    "lusive-customer-pseudo",
    "lusive-customer-phone",
    "lusive-email-verified",
    "lusive-phone-verified",
    "lusive-firebase-uid",
    "lusive-firebase-pending-email",
    "lusive-pending-email-code",
    "lusive-pending-phone-code"
  ];

  function resetAuth() {
    keys.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem("lusive-firebase-phone-verification");
    location.reload();
  }

  function renderFallback() {
    document.querySelectorAll("[data-gmail-auth]").forEach((container) => {
      if (container.textContent.trim()) return;
      container.innerHTML = `
        <div class="gmail-auth-copy">
          <strong>Connexion indisponible</strong>
          <span>Firebase ne s'est pas charge. Tu peux reset la session locale.</span>
        </div>
        <div class="gmail-auth-form">
          <button class="ghost-button" type="button" data-auth-reset>Deconnexion / reset</button>
          <div class="gmail-auth-error">Recharge avec Ctrl + F5 apres le reset.</div>
        </div>
      `;
      container.querySelector("[data-auth-reset]").addEventListener("click", resetAuth);
    });
  }

  window.resetLusiveAuth = resetAuth;
  window.addEventListener("load", () => setTimeout(renderFallback, 1200));
})();
