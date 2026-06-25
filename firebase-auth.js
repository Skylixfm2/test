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
const LOCAL_ACCOUNTS_KEY = "lusive-local-accounts";
const PASSWORD_OK_KEY = "lusive-password-ok";
const PENDING_ACCOUNT_KEY = "lusive-pending-account";
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

function getLocalAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(String(password || ""));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function confirmLocalAccount(email, pseudo, passwordHash) {
  const normalizedEmail = normalizeGmail(email);
  const accounts = getLocalAccounts();
  const existing = accounts[normalizedEmail];
  if (existing && existing.passwordHash !== passwordHash) {
    throw new Error("Wrong password for this account.");
  }
  accounts[normalizedEmail] = {
    pseudo: pseudo || existing?.pseudo || normalizedEmail.split("@")[0],
    passwordHash,
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  saveLocalAccounts(accounts);
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, accounts[normalizedEmail].pseudo);
  localStorage.setItem(PASSWORD_OK_KEY, "true");
}

function isEmailVerified() {
  return localStorage.getItem(EMAIL_VERIFIED_KEY) === "true"
    && localStorage.getItem(PASSWORD_OK_KEY) === "true"
    && Boolean(getCustomerEmail())
    && Boolean(localStorage.getItem(FIREBASE_UID_KEY));
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
  document.querySelectorAll("[data-admin-only], a[href='admin.html'], a[href='adminOrders.html'], a[href='adminShop.html'], a[href='adminKeys.html']").forEach((element) => {
    element.hidden = !allowed;
  });
}

function dispatchAuthChange() {
  updateAdminVisibility();
  window.dispatchEvent(new Event("gmail-auth-change"));
}

async function signInWithGoogle(pseudo, password) {
  const passwordHash = await hashPassword(password);
  localStorage.setItem(PENDING_ACCOUNT_KEY, JSON.stringify({ pseudo, passwordHash }));
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, pseudo);
  if (auth.currentUser?.email) {
    const email = normalizeGmail(auth.currentUser.email);
    await confirmLocalAccount(email, pseudo, passwordHash);
    localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
    localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
    localStorage.setItem(FIREBASE_UID_KEY, auth.currentUser.uid);
    localStorage.removeItem(PENDING_ACCOUNT_KEY);
    dispatchAuthChange();
    return { user: auth.currentUser };
  }
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

async function signInWithSiteAccount(pseudo, email, password) {
  const normalizedEmail = normalizeGmail(email);
  const passwordHash = await hashPassword(password);
  const accounts = getLocalAccounts();
  const existing = accounts[normalizedEmail];

  if (existing && existing.passwordHash !== passwordHash) {
    throw new Error("Wrong password for this account.");
  }

  accounts[normalizedEmail] = {
    pseudo: pseudo || existing?.pseudo || normalizedEmail.split("@")[0],
    passwordHash,
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  saveLocalAccounts(accounts);

  localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizedEmail);
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, accounts[normalizedEmail].pseudo);
  localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
  localStorage.setItem(PASSWORD_OK_KEY, "true");
  localStorage.setItem(FIREBASE_UID_KEY, `local-${normalizedEmail}`);
  localStorage.removeItem(PENDING_ACCOUNT_KEY);
  dispatchAuthChange();
}

function clearCustomerEmail() {
  localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  localStorage.removeItem(CUSTOMER_PSEUDO_KEY);
  localStorage.removeItem(EMAIL_VERIFIED_KEY);
  localStorage.removeItem(FIREBASE_UID_KEY);
  localStorage.removeItem(PASSWORD_OK_KEY);
  localStorage.removeItem(PENDING_ACCOUNT_KEY);
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
        <div class="gmail-account-chip" aria-label="Connected account">
          <strong>${displayName}</strong>
          <span>${email}</span>
        </div>
        <button class="ghost-button gmail-auth-logout" type="button">Sign out</button>
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
        <strong>Create / sign in</strong>
        <span>Create a site account with your email and password.</span>
      </div>
      <form class="gmail-auth-form">
        <input class="gmail-pseudo-input" type="text" value="${pseudo}" placeholder="Username" autocomplete="nickname" maxlength="32">
        <input class="gmail-password-input" type="password" placeholder="Password" autocomplete="current-password" minlength="6">
        <input class="gmail-email-input" type="email" value="${email}" placeholder="Email" autocomplete="email">
        <button class="gmail-send-email" type="button">Create / sign in</button>
        <div class="gmail-auth-codes"></div>
        <div class="gmail-auth-error"></div>
      </form>
    `;

    const form = container.querySelector(".gmail-auth-form");
    const pseudoInput = container.querySelector(".gmail-pseudo-input");
    const passwordInput = container.querySelector(".gmail-password-input");
    const emailInput = container.querySelector(".gmail-email-input");
    const status = container.querySelector(".gmail-auth-codes");
    const error = container.querySelector(".gmail-auth-error");

    container.querySelector(".gmail-send-email").addEventListener("click", async () => {
      error.textContent = "";
      status.textContent = "";
      const nextPseudo = pseudoInput.value.trim();
      const nextEmail = normalizeGmail(emailInput.value);
      if (nextPseudo.length < 2) {
        error.textContent = "Choose a username.";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(nextEmail)) {
        error.textContent = "Enter a valid email.";
        return;
      }
      if (passwordInput.value.length < 6) {
        error.textContent = "Choose a password with at least 6 characters.";
        return;
      }
      try {
        await signInWithSiteAccount(nextPseudo, nextEmail, passwordInput.value);
        status.textContent = "Account connected.";
        renderGmailAuth();
      } catch (err) {
        error.textContent = `Sign in error: ${err.code || err.message}`;
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
  if (String(localStorage.getItem(FIREBASE_UID_KEY) || "").startsWith("local-")) {
    renderGmailAuth();
    dispatchAuthChange();
    return;
  }
  if (user?.email) {
    const email = normalizeGmail(user.email);
    const pending = JSON.parse(localStorage.getItem(PENDING_ACCOUNT_KEY) || "null");
    if (pending?.passwordHash) {
      confirmLocalAccount(email, pending.pseudo, pending.passwordHash)
        .then(() => {
          localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
          localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
          localStorage.setItem(FIREBASE_UID_KEY, user.uid);
          localStorage.removeItem(PENDING_ACCOUNT_KEY);
          renderGmailAuth();
          dispatchAuthChange();
        })
        .catch(() => clearCustomerEmail());
      return;
    }
    if (localStorage.getItem(PASSWORD_OK_KEY) === "true") {
      localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
      localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
      localStorage.setItem(FIREBASE_UID_KEY, user.uid);
    } else {
      localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
    }
  } else {
    localStorage.removeItem(FIREBASE_UID_KEY);
    localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
    localStorage.removeItem(PASSWORD_OK_KEY);
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
