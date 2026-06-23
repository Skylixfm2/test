(function () {
  const keys = [
    "lusive-customer-email",
    "lusive-customer-pseudo",
    "lusive-email-verified",
    "lusive-firebase-uid"
  ];

  function resetAuth() {
    keys.forEach((key) => localStorage.removeItem(key));
    location.reload();
  }

  function renderFallback() {
    document.querySelectorAll("[data-gmail-auth]").forEach((container) => {
      if (container.textContent.trim()) return;
      container.innerHTML = `
        <div class="gmail-auth-copy">
          <strong>Sign in unavailable</strong>
          <span>Firebase did not load. You can reset the local session.</span>
        </div>
        <div class="gmail-auth-form">
          <button class="ghost-button" type="button" data-auth-reset>Sign out / reset</button>
          <div class="gmail-auth-error">Reload with Ctrl + F5 after the reset.</div>
        </div>
      `;
      container.querySelector("[data-auth-reset]").addEventListener("click", resetAuth);
    });
  }

  window.resetLusiveAuth = resetAuth;
  window.addEventListener("load", () => setTimeout(renderFallback, 1200));
})();
