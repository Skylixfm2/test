import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload,
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

function normalizePseudo(pseudo) {
  return String(pseudo || "").trim().toLowerCase();
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

function isPseudoTaken(accounts, pseudo, currentEmail) {
  const nextPseudo = normalizePseudo(pseudo);
  const nextEmail = normalizeGmail(currentEmail);
  return Object.entries(accounts).some(([email, account]) => {
    return normalizeGmail(email) !== nextEmail && normalizePseudo(account?.pseudo) === nextPseudo;
  });
}

function isPseudoKnown(accounts, pseudo) {
  const nextPseudo = normalizePseudo(pseudo);
  return Object.values(accounts).some((account) => normalizePseudo(account?.pseudo) === nextPseudo);
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(String(password || ""));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signInAndRequireVerifiedEmail(email, password) {
  const normalizedEmail = normalizeGmail(email);
  let credential;

  try {
    credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    if (error.code !== "auth/user-not-found" && error.code !== "auth/invalid-credential") {
      if (error.code === "auth/operation-not-allowed") {
        throw new Error("Enable Email/Password in Firebase Authentication first.");
      }
      throw error;
    }
    credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  }

  await reload(credential.user);
  if (!credential.user.emailVerified) {
    await sendEmailVerification(credential.user, {
      url: window.location.href,
      handleCodeInApp: false
    });
    localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
    throw new Error("VERIFICATION_SENT");
  }

  return credential.user;
}

async function confirmLocalAccount(email, pseudo, passwordHash) {
  const normalizedEmail = normalizeGmail(email);
  const accounts = getLocalAccounts();
  const existing = accounts[normalizedEmail];
  const nextPseudo = String(pseudo || existing?.pseudo || normalizedEmail.split("@")[0]).trim();

  if (existing && existing.passwordHash !== passwordHash) {
    throw new Error("Wrong password for this account.");
  }
  if (!nextPseudo || nextPseudo.length < 2) {
    throw new Error("Choose a username.");
  }
  if (isPseudoTaken(accounts, nextPseudo, normalizedEmail)) {
    throw new Error("This username is already taken.");
  }

  accounts[normalizedEmail] = {
    pseudo: nextPseudo,
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
  const firebaseEmail = normalizeGmail(auth.currentUser?.email);
  return isFullyVerified() && firebaseEmail === ADMIN_EMAIL && getCustomerEmail() === ADMIN_EMAIL;
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
  const accounts = getLocalAccounts();
  const currentEmail = normalizeGmail(auth.currentUser?.email);

  if (!currentEmail && isPseudoKnown(accounts, pseudo)) {
    throw new Error("This username is already taken.");
  }

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
    const result = await signInWithPopup(auth, googleProvider);
    if (result?.user?.email) {
      const email = normalizeGmail(result.user.email);
      await confirmLocalAccount(email, pseudo, passwordHash);
      localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
      localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
      localStorage.setItem(FIREBASE_UID_KEY, result.user.uid);
      localStorage.removeItem(PENDING_ACCOUNT_KEY);
      dispatchAuthChange();
    }
    return result;
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
  const nextPseudo = String(pseudo || existing?.pseudo || normalizedEmail.split("@")[0]).trim();

  if (existing && existing.passwordHash !== passwordHash) {
    throw new Error("Wrong password for this account.");
  }
  if (!nextPseudo || nextPseudo.length < 2) {
    throw new Error("Choose a username.");
  }
  if (isPseudoTaken(accounts, nextPseudo, normalizedEmail)) {
    throw new Error("This username is already taken.");
  }

  const firebaseUser = await signInAndRequireVerifiedEmail(normalizedEmail, password);

  accounts[normalizedEmail] = {
    pseudo: nextPseudo,
    passwordHash,
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  saveLocalAccounts(accounts);

  localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizedEmail);
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, accounts[normalizedEmail].pseudo);
  localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
  localStorage.setItem(PASSWORD_OK_KEY, "true");
  localStorage.setItem(FIREBASE_UID_KEY, firebaseUser.uid);
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
        <button class="gmail-google-login" type="button">Create / sign in with Google</button>
        <div class="gmail-auth-codes"></div>
        <div class="gmail-auth-error"></div>
      </form>
    `;

    const form = container.querySelector(".gmail-auth-form");
    const pseudoInput = container.querySelector(".gmail-pseudo-input");
    const passwordInput = container.querySelector(".gmail-password-input");
    const status = container.querySelector(".gmail-auth-codes");
    const error = container.querySelector(".gmail-auth-error");

    const googleButton = container.querySelector(".gmail-google-login");

    googleButton.addEventListener("click", async () => {
      error.textContent = "";
      status.textContent = "";
      const nextPseudo = pseudoInput.value.trim();
      if (nextPseudo.length < 2) {
        error.textContent = "Choose a username.";
        return;
      }
      if (passwordInput.value.length < 6) {
        error.textContent = "Choose a password with at least 6 characters.";
        return;
      }
      try {
        googleButton.disabled = true;
        status.textContent = "Opening Google sign in...";
        await signInWithGoogle(nextPseudo, passwordInput.value);
        status.textContent = "Google account checked. Finishing sign in...";
      } catch (err) {
        error.textContent = `Google sign in error: ${err.code || err.message}`;
      } finally {
        googleButton.disabled = false;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      googleButton.click();
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
    const storedEmail = getCustomerEmail();
    if (storedEmail && storedEmail !== email) {
      localStorage.removeItem(CUSTOMER_EMAIL_KEY);
      localStorage.removeItem(CUSTOMER_PSEUDO_KEY);
      localStorage.removeItem(PASSWORD_OK_KEY);
      localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
    }
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
