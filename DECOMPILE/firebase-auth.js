import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const CUSTOMER_EMAIL_KEY = "lusive-customer-email";
const CUSTOMER_PSEUDO_KEY = "lusive-customer-pseudo";
const EMAIL_VERIFIED_KEY = "lusive-email-verified";
const FIREBASE_UID_KEY = "lusive-firebase-uid";
const ADMIN_EMAIL = "solarydigix@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyAb7KDEVZQsCGFtwpFIx1vtjLYFArOhwMI",
  authDomain: "skylixfm-shop-df92f.firebaseapp.com",
  projectId: "skylixfm-shop-df92f",
  storageBucket: "skylixfm-shop-df92f.firebasestorage.app",
  messagingSenderId: "1023371313049",
  appId: "1:1023371313049:web:a7f59f04207483dd511d08"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

if (!localStorage.getItem(FIREBASE_UID_KEY)) {
  localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
}

function normalizeGmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidGmail(email) {
  return /^[^\s@]+@gmail\.com$/i.test(String(email || "").trim());
}

function getCustomerEmail() {
  return normalizeGmail(localStorage.getItem(CUSTOMER_EMAIL_KEY));
}

function getCustomerPseudo() {
  return String(localStorage.getItem(CUSTOMER_PSEUDO_KEY) || "").trim();
}

function isEmailVerified() {
  return localStorage.getItem(EMAIL_VERIFIED_KEY) === "true" && Boolean(getCustomerEmail()) && Boolean(localStorage.getItem(FIREBASE_UID_KEY));
}

function isFullyVerified() {
  return isEmailVerified();
}

function isAdmin() {
  return isFullyVerified() && getCustomerEmail() === ADMIN_EMAIL;
}

function updateAdminVisibility() {
  const allowed = isAdmin();
  document.body.classList.toggle("is-admin", allowed);
  document.querySelectorAll("[data-admin-only], a[href='admin.html'], a[href='adminOrders.html'], a[href='adminShop.html']").forEach((element) => {
    element.hidden = !allowed;
  });
}

function dispatchAuthChange() {
  updateAdminVisibility();
  window.dispatchEvent(new Event("gmail-auth-change"));
}

async function signInWithGoogle(pseudo) {
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, pseudo);
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

function clearCustomerEmail() {
  localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  localStorage.removeItem(CUSTOMER_PSEUDO_KEY);
  localStorage.removeItem(EMAIL_VERIFIED_KEY);
  localStorage.removeItem(FIREBASE_UID_KEY);
  signOut(auth).catch(() => {});
  dispatchAuthChange();
}

function renderGmailAuth() {
  const containers = document.querySelectorAll("[data-gmail-auth]");
  if (!containers.length) return;

  const email = getCustomerEmail();
  const pseudo = getCustomerPseudo();

  containers.forEach((container) => {
    if (isFullyVerified()) {
      const displayName = pseudo || email.split("@")[0];
      container.classList.add("is-connected");
      container.innerHTML = `
        <div class="gmail-account-chip" aria-label="Compte connecte">
          <strong>${displayName}</strong>
          <span>${email}</span>
        </div>
        <button class="ghost-button gmail-auth-logout" type="button">Deconnexion</button>
      `;

      container.querySelector(".gmail-auth-logout").addEventListener("click", () => {
        clearCustomerEmail();
        renderGmailAuth();
      });
      return;
    }

    container.classList.remove("is-connected");
    container.innerHTML = `
      <div class="gmail-auth-copy">
        <strong>Connexion Firebase</strong>
        <span>Connexion avec ton compte Google.</span>
      </div>
      <form class="gmail-auth-form">
        <input class="gmail-pseudo-input" type="text" value="${pseudo}" placeholder="Pseudo" autocomplete="nickname" maxlength="32">
        <input class="gmail-email-input" type="email" value="${email}" placeholder="Compte Google" autocomplete="email" disabled>
        <button class="gmail-send-email" type="button">Connexion Google</button>
        <div class="gmail-auth-codes"></div>
        <div class="gmail-auth-error"></div>
      </form>
    `;

    const form = container.querySelector(".gmail-auth-form");
    const pseudoInput = container.querySelector(".gmail-pseudo-input");
    const status = container.querySelector(".gmail-auth-codes");
    const error = container.querySelector(".gmail-auth-error");

    container.querySelector(".gmail-send-email").addEventListener("click", async () => {
      error.textContent = "";
      status.textContent = "";
      const nextPseudo = pseudoInput.value.trim();
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      try {
        const result = await signInWithGoogle(nextPseudo);
        if (result?.user?.email) {
          localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(result.user.email));
          localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
          localStorage.setItem(FIREBASE_UID_KEY, result.user.uid);
          status.textContent = "Compte Google connecte.";
          renderGmailAuth();
        }
      } catch (err) {
        error.textContent = `Erreur Firebase Google: ${err.code || err.message}`;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      container.querySelector(".gmail-send-email").click();
    });

  });

  updateAdminVisibility();
}

window.gmailAuth = {
  getEmail: getCustomerEmail,
  getPseudo: getCustomerPseudo,
  clearEmail: clearCustomerEmail,
  isValid: isValidGmail,
  isEmailVerified,
  isFullyVerified,
  isAdmin,
  render: renderGmailAuth
};

renderGmailAuth();
getRedirectResult(auth).catch((error) => console.warn("Firebase redirect error", error));
onAuthStateChanged(auth, (user) => {
  if (user?.email) {
    localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(user.email));
    localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
    localStorage.setItem(FIREBASE_UID_KEY, user.uid);
  } else {
    localStorage.removeItem(FIREBASE_UID_KEY);
    localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
  }
  renderGmailAuth();
  dispatchAuthChange();
});
document.addEventListener("DOMContentLoaded", () => {
  renderGmailAuth();
  updateAdminVisibility();
});
window.addEventListener("storage", () => {
  renderGmailAuth();
  updateAdminVisibility();
});
