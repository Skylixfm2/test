import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const CUSTOMER_EMAIL_KEY = "lusive-customer-email";
const CUSTOMER_PSEUDO_KEY = "lusive-customer-pseudo";
const CUSTOMER_PHONE_KEY = "lusive-customer-phone";
const EMAIL_VERIFIED_KEY = "lusive-email-verified";
const PHONE_VERIFIED_KEY = "lusive-phone-verified";
const FIREBASE_UID_KEY = "lusive-firebase-uid";
const FIREBASE_PENDING_EMAIL_KEY = "lusive-firebase-pending-email";
const FIREBASE_PHONE_VERIFICATION_KEY = "lusive-firebase-phone-verification";

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
let recaptchaVerifier = null;

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

function getCustomerPhone() {
  return String(localStorage.getItem(CUSTOMER_PHONE_KEY) || "").trim();
}

function isEmailVerified() {
  return localStorage.getItem(EMAIL_VERIFIED_KEY) === "true" && Boolean(getCustomerEmail()) && Boolean(localStorage.getItem(FIREBASE_UID_KEY));
}

function isPhoneVerified() {
  return localStorage.getItem(PHONE_VERIFIED_KEY) === "true" && Boolean(getCustomerPhone()) && Boolean(localStorage.getItem(FIREBASE_UID_KEY));
}

function isFullyVerified() {
  return isEmailVerified() && isPhoneVerified();
}

function dispatchAuthChange() {
  window.dispatchEvent(new Event("gmail-auth-change"));
}

function ensureRecaptcha() {
  if (!document.getElementById("firebaseRecaptcha")) {
    const holder = document.createElement("div");
    holder.id = "firebaseRecaptcha";
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.bottom = "0";
    document.body.appendChild(holder);
  }
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, "firebaseRecaptcha", { size: "invisible" });
  }
  return recaptchaVerifier;
}

async function completeEmailLinkIfNeeded() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  const email = localStorage.getItem(FIREBASE_PENDING_EMAIL_KEY) || window.prompt("Entre ton Gmail pour confirmer le lien :");
  if (!email) return;
  const credential = await signInWithEmailLink(auth, normalizeGmail(email), window.location.href);
  localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(credential.user.email));
  localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
  localStorage.setItem(FIREBASE_UID_KEY, credential.user.uid);
  localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
  history.replaceState({}, document.title, location.pathname);
  dispatchAuthChange();
}

async function sendEmailLink(email, pseudo) {
  localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(email));
  localStorage.setItem(CUSTOMER_PSEUDO_KEY, pseudo);
  localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
  localStorage.setItem(FIREBASE_PENDING_EMAIL_KEY, normalizeGmail(email));
  await sendSignInLinkToEmail(auth, normalizeGmail(email), {
    url: window.location.href.split("#")[0],
    handleCodeInApp: true
  });
}

async function sendPhoneCode(phone) {
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(phone, ensureRecaptcha());
  sessionStorage.setItem(FIREBASE_PHONE_VERIFICATION_KEY, verificationId);
}

async function verifyPhoneCode(phone, code) {
  const verificationId = sessionStorage.getItem(FIREBASE_PHONE_VERIFICATION_KEY);
  if (!verificationId) throw new Error("missing_phone_code");
  const credential = PhoneAuthProvider.credential(verificationId, code);
  if (auth.currentUser) {
    await linkWithCredential(auth.currentUser, credential).catch(async (error) => {
      if (error.code !== "auth/provider-already-linked" && error.code !== "auth/credential-already-in-use") throw error;
    });
  }
  localStorage.setItem(CUSTOMER_PHONE_KEY, phone);
  localStorage.setItem(PHONE_VERIFIED_KEY, "true");
  sessionStorage.removeItem(FIREBASE_PHONE_VERIFICATION_KEY);
}

function clearCustomerEmail() {
  localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  localStorage.removeItem(CUSTOMER_PSEUDO_KEY);
  localStorage.removeItem(CUSTOMER_PHONE_KEY);
  localStorage.removeItem(EMAIL_VERIFIED_KEY);
  localStorage.removeItem(PHONE_VERIFIED_KEY);
  localStorage.removeItem(FIREBASE_UID_KEY);
  localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
  sessionStorage.removeItem(FIREBASE_PHONE_VERIFICATION_KEY);
  signOut(auth).catch(() => {});
  dispatchAuthChange();
}

function renderGmailAuth() {
  const containers = document.querySelectorAll("[data-gmail-auth]");
  if (!containers.length) return;

  const email = getCustomerEmail();
  const pseudo = getCustomerPseudo();
  const phone = getCustomerPhone();

  containers.forEach((container) => {
    container.innerHTML = `
      <div class="gmail-auth-copy">
        <strong>${isFullyVerified() ? `Verifie : ${email}` : "Connexion Firebase"}</strong>
        <span>Gmail par lien Firebase + telephone par SMS Firebase.</span>
      </div>
      <form class="gmail-auth-form">
        <input class="gmail-pseudo-input" type="text" value="${pseudo}" placeholder="Pseudo" autocomplete="nickname" maxlength="32">
        <input class="gmail-email-input" type="email" value="${email}" placeholder="tonadresse@gmail.com" autocomplete="email">
        <button class="gmail-send-email" type="button">${isEmailVerified() ? "Email OK" : "Envoyer lien email"}</button>
        <input class="gmail-phone-input" type="tel" value="${phone}" placeholder="+33612345678" autocomplete="tel">
        <button class="gmail-send-phone" type="button">${isPhoneVerified() ? "Tel OK" : "Envoyer SMS"}</button>
        <input class="gmail-phone-code" type="text" inputmode="numeric" maxlength="6" placeholder="Code SMS">
        <button type="submit">Verifier SMS</button>
        <button class="ghost-button gmail-auth-logout" type="button" ${email || phone ? "" : "hidden"}>Deconnexion</button>
        <div class="gmail-auth-codes"></div>
        <div class="gmail-auth-error"></div>
      </form>
    `;

    const form = container.querySelector(".gmail-auth-form");
    const pseudoInput = container.querySelector(".gmail-pseudo-input");
    const emailInput = container.querySelector(".gmail-email-input");
    const phoneInput = container.querySelector(".gmail-phone-input");
    const phoneCodeInput = container.querySelector(".gmail-phone-code");
    const status = container.querySelector(".gmail-auth-codes");
    const error = container.querySelector(".gmail-auth-error");

    container.querySelector(".gmail-send-email").addEventListener("click", async () => {
      error.textContent = "";
      status.textContent = "";
      const nextPseudo = pseudoInput.value.trim();
      const nextEmail = normalizeGmail(emailInput.value);
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      if (!isValidGmail(nextEmail)) {
        error.textContent = "Entre une adresse Gmail valide.";
        return;
      }
      try {
        await sendEmailLink(nextEmail, nextPseudo);
        status.textContent = "Lien envoye par email. Ouvre le lien recu pour valider.";
      } catch (err) {
        error.textContent = `Erreur Firebase email: ${err.code || err.message}`;
      }
    });

    container.querySelector(".gmail-send-phone").addEventListener("click", async () => {
      error.textContent = "";
      status.textContent = "";
      const nextPseudo = pseudoInput.value.trim();
      const nextPhone = phoneInput.value.trim();
      if (!isEmailVerified()) {
        error.textContent = "Valide d'abord le lien email.";
        return;
      }
      if (nextPseudo.length < 2) {
        error.textContent = "Choisis un pseudo.";
        return;
      }
      if (!/^\+?\d[\d\s.-]{7,18}$/.test(nextPhone)) {
        error.textContent = "Entre un numero avec indicatif, ex: +33612345678.";
        return;
      }
      try {
        localStorage.setItem(CUSTOMER_PSEUDO_KEY, nextPseudo);
        await sendPhoneCode(nextPhone);
        status.textContent = "SMS envoye. Entre le code recu.";
      } catch (err) {
        error.textContent = `Erreur Firebase SMS: ${err.code || err.message}`;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      const nextPhone = phoneInput.value.trim();
      const code = phoneCodeInput.value.trim();
      if (!isEmailVerified()) {
        error.textContent = "Valide d'abord le lien email.";
        return;
      }
      if (!code) {
        error.textContent = "Entre le code SMS.";
        return;
      }
      try {
        await verifyPhoneCode(nextPhone, code);
        status.textContent = "Telephone verifie.";
        dispatchAuthChange();
        renderGmailAuth();
      } catch (err) {
        error.textContent = `Code SMS incorrect: ${err.code || err.message}`;
      }
    });

    container.querySelector(".gmail-auth-logout").addEventListener("click", () => {
      clearCustomerEmail();
      renderGmailAuth();
    });
  });
}

window.gmailAuth = {
  getEmail: getCustomerEmail,
  getPseudo: getCustomerPseudo,
  getPhone: getCustomerPhone,
  clearEmail: clearCustomerEmail,
  isValid: isValidGmail,
  isEmailVerified,
  isPhoneVerified,
  isFullyVerified,
  render: renderGmailAuth
};

completeEmailLinkIfNeeded().catch((error) => console.warn("Firebase email link error", error));
onAuthStateChanged(auth, (user) => {
  if (user?.email) {
    localStorage.setItem(CUSTOMER_EMAIL_KEY, normalizeGmail(user.email));
    localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
    localStorage.setItem(FIREBASE_UID_KEY, user.uid);
    if (user.phoneNumber) {
      localStorage.setItem(CUSTOMER_PHONE_KEY, user.phoneNumber);
      localStorage.setItem(PHONE_VERIFIED_KEY, "true");
    } else if (!sessionStorage.getItem(FIREBASE_PHONE_VERIFICATION_KEY)) {
      localStorage.setItem(PHONE_VERIFIED_KEY, "false");
    }
  } else {
    localStorage.removeItem(FIREBASE_UID_KEY);
    localStorage.setItem(EMAIL_VERIFIED_KEY, "false");
    localStorage.setItem(PHONE_VERIFIED_KEY, "false");
  }
  renderGmailAuth();
  dispatchAuthChange();
});
document.addEventListener("DOMContentLoaded", renderGmailAuth);
window.addEventListener("storage", renderGmailAuth);
