const CUSTOMER_EMAIL_KEY = "lusive-customer-email";
const CUSTOMER_PSEUDO_KEY = "lusive-customer-pseudo";
const CUSTOMER_PHONE_KEY = "lusive-customer-phone";
const EMAIL_VERIFIED_KEY = "lusive-email-verified";
const PHONE_VERIFIED_KEY = "lusive-phone-verified";
const PENDING_EMAIL_CODE_KEY = "lusive-pending-email-code";
const PENDING_PHONE_CODE_KEY = "lusive-pending-phone-code";
const AUTH_API_BASE = window.AUTH_API_BASE || localStorage.getItem("lusive-auth-api-base") || "/api/auth";

function normalizeGmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidGmail(email) {
  return /^[^\s@]+@gmail\.com$/i.test(String(email || "").trim());
}

function getCustomerEmail() {
  return normalizeGmail(localStorage.getItem(CUSTOMER_EMAIL_KEY));
}

function getCustomerPhone() {
  return String(localStorage.getItem(CUSTOMER_PHONE_KEY) || "").trim();
}

function getCustomerPseudo() {
  return String(localStorage.getItem(CUSTOMER_PSEUDO_KEY) || "").trim();
}

function isEmailVerified() {
  return localStorage.getItem(EMAIL_VERIFIED_KEY) === "true" && Boolean(getCustomerEmail());
}

function isPhoneVerified() {
  return localStorage.getItem(PHONE_VERIFIED_KEY) === "true" && Boolean(getCustomerPhone());
}

function isFullyVerified() {
  return isEmailVerified() && isPhoneVerified();
}

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendBackendCode(type, destination) {
  const response = await fetch(`${AUTH_API_BASE}/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, destination })
  });
  if (!response.ok) {
    throw new Error("send_failed");
  }
  return response.json();
}

async function verifyBackendCode(type, destination, code) {
  const response = await fetch(`${AUTH_API_BASE}/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, destination, code })
  });
  if (!response.ok) {
    throw new Error("invalid_code");
  }
  return response.json();
}

function setCustomerEmail(email) {
  localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(email));
  localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
  window.dispatchEvent(new Event("gmail-auth-change"));
}

function setCustomerPhone(phone) {
  localStorage.setItem(CUSTOMER_PHONE_KEY, String(phone || "").trim());
  localStorage.setItem(PHONE_VERIFIED_KEY, "false");
  window.dispatchEvent(new Event("gmail-auth-change"));
}

function clearCustomerEmail() {
  localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  localStorage.removeItem(CUSTOMER_PSEUDO_KEY);
  localStorage.removeItem(CUSTOMER_PHONE_KEY);
  localStorage.removeItem(EMAIL_VERIFIED_KEY);
  localStorage.removeItem(PHONE_VERIFIED_KEY);
  localStorage.removeItem(PENDING_EMAIL_CODE_KEY);
  localStorage.removeItem(PENDING_PHONE_CODE_KEY);
  window.dispatchEvent(new Event("gmail-auth-change"));
}

function renderGmailAuth() {
  const containers = document.querySelectorAll("[data-gmail-auth]");
  if (!containers.length) return;

  const email = getCustomerEmail();
  const pseudo = getCustomerPseudo();
  const phone = getCustomerPhone();
  const emailCode = localStorage.getItem(PENDING_EMAIL_CODE_KEY) || "";
  const phoneCode = localStorage.getItem(PENDING_PHONE_CODE_KEY) || "";
  containers.forEach((container) => {
    container.innerHTML = `
      <div class="gmail-auth-copy">
        <strong>${isFullyVerified() ? `Verifie : ${email}` : "Connexion securisee"}</strong>
        <span>Gmail + telephone obligatoires. Envoi reel via backend, demo locale si API absente.</span>
      </div>
      <form class="gmail-auth-form">
        <input class="gmail-pseudo-input" type="text" value="${pseudo}" placeholder="Pseudo" autocomplete="nickname" maxlength="32">
        <input class="gmail-email-input" type="email" value="${email}" placeholder="tonadresse@gmail.com" autocomplete="email">
        <button class="gmail-send-email" type="button">Code email</button>
        <input class="gmail-email-code" type="text" inputmode="numeric" maxlength="6" placeholder="Code Gmail">
        <input class="gmail-phone-input" type="tel" value="${phone}" placeholder="+33612345678" autocomplete="tel">
        <button class="gmail-send-phone" type="button">Code tel</button>
        <input class="gmail-phone-code" type="text" inputmode="numeric" maxlength="6" placeholder="Code securite">
        <button type="submit">Verifier</button>
        <button class="ghost-button gmail-auth-logout" type="button" ${email || phone ? "" : "hidden"}>Deconnexion</button>
        <div class="gmail-auth-codes">${emailCode ? `Code email demo : ${emailCode}` : ""}${emailCode && phoneCode ? " | " : ""}${phoneCode ? `Code tel demo : ${phoneCode}` : ""}</div>
        <div class="gmail-auth-error"></div>
      </form>
    `;

    const form = container.querySelector(".gmail-auth-form");
    const pseudoInput = container.querySelector(".gmail-pseudo-input");
    const emailInput = container.querySelector(".gmail-email-input");
    const emailCodeInput = container.querySelector(".gmail-email-code");
    const phoneInput = container.querySelector(".gmail-phone-input");
    const phoneCodeInput = container.querySelector(".gmail-phone-code");
    const error = container.querySelector(".gmail-auth-error");
    const logout = container.querySelector(".gmail-auth-logout");
    const sendEmail = container.querySelector(".gmail-send-email");
    const sendPhone = container.querySelector(".gmail-send-phone");

    sendEmail.addEventListener("click", async () => {
      const nextEmail = normalizeGmail(emailInput.value);
      const nextPseudo = pseudoInput.value.trim();
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      if (!isValidGmail(nextEmail)) {
        error.textContent = "Entre une adresse Gmail valide.";
        return;
      }
      localStorage.setItem(CUSTOMER_EMAIL_KEY, nextEmail);
      localStorage.setItem(CUSTOMER_PSEUDO_KEY, nextPseudo);
      localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
      localStorage.removeItem(PENDING_EMAIL_CODE_KEY);
      try {
        await sendBackendCode("email", nextEmail);
      } catch (_error) {
        localStorage.setItem(PENDING_EMAIL_CODE_KEY, createCode());
      }
      renderGmailAuth();
    });

    sendPhone.addEventListener("click", async () => {
      const nextPhone = phoneInput.value.trim();
      const nextPseudo = pseudoInput.value.trim();
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      if (!/^\+?\d[\d\s.-]{7,18}$/.test(nextPhone)) {
        error.textContent = "Entre un numero de telephone valide.";
        return;
      }
      localStorage.setItem(CUSTOMER_PSEUDO_KEY, nextPseudo);
      localStorage.setItem(CUSTOMER_PHONE_KEY, nextPhone);
      localStorage.setItem(PHONE_VERIFIED_KEY, "false");
      localStorage.removeItem(PENDING_PHONE_CODE_KEY);
      try {
        await sendBackendCode("phone", nextPhone);
      } catch (_error) {
        localStorage.setItem(PENDING_PHONE_CODE_KEY, createCode());
      }
      renderGmailAuth();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nextEmail = normalizeGmail(emailInput.value);
      const nextPseudo = pseudoInput.value.trim();
      const nextPhone = phoneInput.value.trim();
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      if (!isValidGmail(nextEmail)) {
        error.textContent = "Entre une adresse Gmail valide.";
        return;
      }
      if (!/^\+?\d[\d\s.-]{7,18}$/.test(nextPhone)) {
        error.textContent = "Entre un numero de telephone valide.";
        return;
      }
      try {
        const localEmailCode = localStorage.getItem(PENDING_EMAIL_CODE_KEY);
        const localPhoneCode = localStorage.getItem(PENDING_PHONE_CODE_KEY);
        if (localEmailCode) {
          if (emailCodeInput.value.trim() !== localEmailCode) throw new Error("invalid_email");
        } else {
          await verifyBackendCode("email", nextEmail, emailCodeInput.value.trim());
        }
        if (localPhoneCode) {
          if (phoneCodeInput.value.trim() !== localPhoneCode) throw new Error("invalid_phone");
        } else {
          await verifyBackendCode("phone", nextPhone, phoneCodeInput.value.trim());
        }
      } catch (_error) {
        error.textContent = "Code Gmail ou telephone incorrect.";
        return;
      }
      localStorage.setItem(CUSTOMER_EMAIL_KEY, nextEmail);
      localStorage.setItem(CUSTOMER_PSEUDO_KEY, nextPseudo);
      localStorage.setItem(CUSTOMER_PHONE_KEY, nextPhone);
      localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
      localStorage.setItem(PHONE_VERIFIED_KEY, "true");
      localStorage.removeItem(PENDING_EMAIL_CODE_KEY);
      localStorage.removeItem(PENDING_PHONE_CODE_KEY);
      renderGmailAuth();
    });

    logout.addEventListener("click", () => {
      clearCustomerEmail();
      renderGmailAuth();
    });
  });
}

window.gmailAuth = {
  getEmail: getCustomerEmail,
  getPseudo: getCustomerPseudo,
  getPhone: getCustomerPhone,
  setEmail: setCustomerEmail,
  setPhone: setCustomerPhone,
  clearEmail: clearCustomerEmail,
  isValid: isValidGmail,
  isEmailVerified,
  isPhoneVerified,
  isFullyVerified,
  render: renderGmailAuth
};

document.addEventListener("DOMContentLoaded", renderGmailAuth);
window.addEventListener("storage", renderGmailAuth);
