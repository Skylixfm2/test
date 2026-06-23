const SHARE_STORAGE_KEY = "luau-community-share";
const ACCOUNTS_STORAGE_KEY = "luau-community-accounts";
const SESSION_STORAGE_KEY = "luau-community-session";
const ADMIN_PIN_STORAGE_KEY = "luau-admin-pin";
const ADMIN_UNLOCK_STORAGE_KEY = "luau-admin-unlocked";
const THEME_STORAGE_KEY = "luau-script-theme";
const POST_RATE_LIMIT_STORAGE_KEY = "luau-post-rate-limit";
const CUSTOMER_EMAIL_KEY = "lusive-customer-email";
const MAX_USER_ACCOUNTS = 2;
const POST_COOLDOWN_MS = 60 * 60 * 1000;

const ui = {
  body: document.body,
  adminNavLink: document.getElementById("adminNavLink"),
  toggleTheme: document.getElementById("toggleTheme"),
  currentAccountName: document.getElementById("currentAccountName"),
  currentAccountRole: document.getElementById("currentAccountRole"),
  loginUsernameInput: document.getElementById("loginUsernameInput"),
  loginPasswordInput: document.getElementById("loginPasswordInput"),
  loginControls: document.getElementById("loginControls"),
  loginButton: document.getElementById("loginButton"),
  logoutButton: document.getElementById("logoutButton"),
  switchAccountButton: document.getElementById("switchAccountButton"),
  createAccountGroup: document.getElementById("createAccountGroup"),
  newAccountInput: document.getElementById("newAccountInput"),
  newPasswordInput: document.getElementById("newPasswordInput"),
  createAccountButton: document.getElementById("createAccountButton"),
  adminLoginButton: document.getElementById("adminLoginButton"),
  adminGroup: document.querySelector(".account-group-admin"),
  adminHint: document.getElementById("adminHint"),
  shareImportInput: document.getElementById("shareImportInput"),
  shareTitleInput: document.getElementById("shareTitleInput"),
  shareCodeInput: document.getElementById("shareCodeInput"),
  shareScript: document.getElementById("shareScript"),
  exportShare: document.getElementById("exportShare"),
  accountManagerModal: document.getElementById("accountManagerModal"),
  accountManagerList: document.getElementById("accountManagerList"),
  closeAccountManager: document.getElementById("closeAccountManager"),
  toast: document.getElementById("toast"),
};

const BLOCKED_WORDS = [
  "fdp", "encule", "enculé", "pute", "putain", "salope", "connard", "connasse",
  "batard", "bâtard", "nigger", "niga", "faggot", "retard", "shit", "bitch",
];

let toastTimer = null;

function getAccountInitial(username) {
  return (username || "g").trim().charAt(0).toUpperCase() || "G";
}

function closeAccountManager() {
  if (ui.accountManagerModal) {
    ui.accountManagerModal.hidden = true;
  }
}

function renderAccountManager() {
  if (!ui.accountManagerList) {
    return;
  }

  const accounts = getAccounts();
  const current = getCurrentAccount();
  const entries = current ? [current, ...accounts.filter((account) => account.username !== current.username)] : accounts;
  ui.accountManagerList.innerHTML = "";

  entries.forEach((account) => {
    const card = document.createElement("div");
    card.className = "account-manager-item";

    const identity = document.createElement("div");
    identity.className = "account-manager-identity";

    const avatar = document.createElement("span");
    avatar.className = "account-manager-avatar";
    avatar.textContent = getAccountInitial(account.username);

    const meta = document.createElement("div");
    meta.className = "account-manager-meta";

    const name = document.createElement("strong");
    name.textContent = account.username;

    const status = document.createElement("span");
    status.className = "account-manager-status";
    status.textContent = current?.username === account.username ? "Active account" : account.role === "admin" ? "Admin account" : "Saved account";

    meta.appendChild(name);
    meta.appendChild(status);
    identity.appendChild(avatar);
    identity.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "account-manager-actions";

    if (current?.username === account.username) {
      const currentBadge = document.createElement("span");
      currentBadge.className = "account-manager-current";
      currentBadge.textContent = "Current";
      actions.appendChild(currentBadge);
    } else {
      const switchButton = document.createElement("button");
      switchButton.type = "button";
      switchButton.className = "ghost-button";
      switchButton.textContent = "Switch";
      switchButton.addEventListener("click", () => {
        setCurrentAccount(account.username);
        renderAccountManager();
        showToast(`Connected to ${account.username}`);
      });
      actions.appendChild(switchButton);
    }

    card.appendChild(identity);
    card.appendChild(actions);
    ui.accountManagerList.appendChild(card);
  });
}

function openAccountManager() {
  renderAccountManager();
  if (ui.accountManagerModal) {
    ui.accountManagerModal.hidden = false;
  }
}

function setTheme(theme) {
  ui.body.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  ui.toggleTheme.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "light";
}

function normalizeAccounts(accounts) {
  return accounts.map((account) => ({
    username: String(account.username || "").trim(),
    password: typeof account.password === "string" ? account.password : "",
    role: String(account.username || "").trim().toLowerCase() === "skylixfm" || account.role === "admin" ? "admin" : "user",
    banned: Boolean(account.banned),
  })).filter((account) => account.username);
}

function getSeedAccounts() {
  return [
    { username: "admin", password: "", role: "admin", banned: false },
    { username: "guest", password: "", role: "user", banned: false },
  ];
}

function getAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const normalized = normalizeAccounts(parsed);
      if (!normalized.some((account) => account.username === "admin")) {
        normalized.unshift({ username: "admin", password: "", role: "admin", banned: false });
      }
      if (!normalized.some((account) => account.username === "guest")) {
        normalized.push({ username: "guest", password: "", role: "user", banned: false });
      }
      saveAccounts(normalized);
      return normalized;
    }
  } catch (_error) {
  }

  const seed = getSeedAccounts();
  saveAccounts(seed);
  if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
    localStorage.setItem(SESSION_STORAGE_KEY, "guest");
  }
  return seed;
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function findAccount(username) {
  return getAccounts().find((account) => account.username.toLowerCase() === String(username || "").trim().toLowerCase());
}

function getCurrentAccount() {
  const email = window.gmailAuth?.getEmail?.() || localStorage.getItem(CUSTOMER_EMAIL_KEY) || "";
  if (email) {
    return { username: email, password: "", role: "user", banned: false };
  }
  return { username: "guest", password: "", role: "user", banned: false };
}

function isAdminUnlocked() {
  return localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "true";
}

function setAdminUnlocked(value) {
  localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, value ? "true" : "false");
}

function setCurrentAccount(username) {
  localStorage.setItem(SESSION_STORAGE_KEY, username);
  renderAccountBar();
}

function clearLoginInputs() {
  if (ui.loginUsernameInput) ui.loginUsernameInput.value = "";
  if (ui.loginPasswordInput) ui.loginPasswordInput.value = "";
}

function renderAccountBar() {
  const current = getCurrentAccount();
  const isGuest = current.username === "guest";
  const isVisibleAdmin = current.role === "admin";
  if (ui.currentAccountName) ui.currentAccountName.textContent = current.username;
  if (ui.currentAccountRole) ui.currentAccountRole.textContent = current.role;
  if (ui.adminHint) ui.adminHint.hidden = !isVisibleAdmin;
  if (ui.adminLoginButton) ui.adminLoginButton.hidden = isAdminUnlocked();
  if (ui.adminNavLink) {
    ui.adminNavLink.hidden = !isVisibleAdmin;
  }
  if (ui.loginControls) {
    ui.loginControls.hidden = !isGuest;
  }
  if (ui.logoutButton) {
    ui.logoutButton.hidden = isGuest;
  }
  if (ui.createAccountGroup) {
    ui.createAccountGroup.hidden = !isGuest;
  }
  if (ui.adminGroup) {
    ui.adminGroup.hidden = !isVisibleAdmin || isAdminUnlocked();
  }
  renderAccountManager();
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  ui.toast.classList.add("visible");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    ui.toast.classList.remove("visible");
    ui.toast.hidden = true;
  }, 2000);
}

function shortenMiddle(value, maxLength = 72) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  const keepStart = Math.ceil((maxLength - 3) / 2);
  const keepEnd = Math.floor((maxLength - 3) / 2);
  return `${value.slice(0, keepStart)}...${value.slice(value.length - keepEnd)}`;
}

function formatLuau(source) {
  return source.replace(/\r\n/g, "\n");
}

function containsBlockedWords(value) {
  const lowered = value.toLowerCase();
  return BLOCKED_WORDS.some((word) => lowered.includes(word));
}

function looksLikeScript(source) {
  const trimmed = source.trim();
  if (!trimmed || trimmed.length < 8) {
    return false;
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return false;
  }
  const codeSignals = [
    /\bfunction\b/, /\blocal\b/, /\bend\b/, /\breturn\b/, /\bif\b/, /\bthen\b/,
    /\bfor\b/, /\bwhile\b/, /\brequire\s*\(/, /game:GetService\s*\(/, /--/, /[{}()[\]=.:]/,
  ];
  const matches = codeSignals.reduce((count, pattern) => count + (pattern.test(trimmed) ? 1 : 0), 0);
  const naturalLanguageRuns = (trimmed.match(/\b(?:bonjour|salut|hello|comment|pourquoi|because|today|tomorrow|merci)\b/gi) || []).length;
  return matches >= 2 && naturalLanguageRuns < 4;
}

function getSharePosts() {
  try {
    const raw = localStorage.getItem(SHARE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveSharePosts(posts) {
  localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(posts));
}

function getCooldownMap() {
  try {
    const raw = localStorage.getItem(POST_RATE_LIMIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function saveCooldownMap(map) {
  localStorage.setItem(POST_RATE_LIMIT_STORAGE_KEY, JSON.stringify(map));
}

function getCooldownRemaining(username) {
  const map = getCooldownMap();
  const lastPost = Number(map[username]) || 0;
  return Math.max(0, POST_COOLDOWN_MS - (Date.now() - lastPost));
}

function formatRemainingTime(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

function recordPost(username) {
  const map = getCooldownMap();
  map[username] = Date.now();
  saveCooldownMap(map);
}

function isDuplicatePost(title, source, username) {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedSource = source.trim();
  return getSharePosts().some((post) =>
    post.author === username &&
    (post.fullTitle || post.title || "").trim().toLowerCase() === normalizedTitle &&
    (post.source || "").trim() === normalizedSource
  );
}

function createSharePost(title, source) {
  const current = getCurrentAccount();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: shortenMiddle(title, 72),
    fullTitle: title,
    author: current.username,
    description: `Shared from Luau Script Reconstructor. ${source.split(/\r?\n/).length} lines.`,
    source,
    output: formatLuau(source),
    likes: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

function validatePostInput(title, source) {
  const current = getCurrentAccount();
  if (!source.trim()) {
    showToast("Write or paste some code first");
    return false;
  }
  if (current.username === "guest") {
    showToast("You need a real account to post");
    return false;
  }
  if (current.banned) {
    showToast("This account is banned from posting");
    return false;
  }
  if (current.role !== "admin") {
    const remaining = getCooldownRemaining(current.username);
    if (remaining > 0) {
      showToast(`Wait ${formatRemainingTime(remaining)} before posting again`);
      return false;
    }
  }
  if (containsBlockedWords(title) || containsBlockedWords(source)) {
    showToast("This post contains blocked words");
    return false;
  }
  if (!looksLikeScript(source)) {
    showToast("This does not look like a Luau script");
    return false;
  }
  if (isDuplicatePost(title, source, current.username)) {
    showToast("Duplicate post detected");
    return false;
  }
  return true;
}

function downloadText(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleLogin() {
  const username = ui.loginUsernameInput.value.trim();
  const password = ui.loginPasswordInput.value;

  if (!username) {
    showToast("Enter a username first");
    return;
  }

  const account = findAccount(username);
  if (!account) {
    showToast("Unknown account");
    return;
  }

  if (account.username.toLowerCase() === "admin" && !isAdminUnlocked()) {
    showToast("Unlock admin mode first");
    return;
  }

  if ((account.password || "") !== password) {
    showToast("Wrong password");
    return;
  }

  setCurrentAccount(account.username);
  clearLoginInputs();
  showToast(`Logged in as ${account.username}`);
}

ui.loginButton?.addEventListener("click", handleLogin);
ui.loginPasswordInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleLogin();
  }
});

ui.logoutButton?.addEventListener("click", () => {
  if (getCurrentAccount().role === "admin") {
    setAdminUnlocked(false);
  }
  setCurrentAccount("guest");
  clearLoginInputs();
  showToast("Logged out");
});

ui.shareScript.addEventListener("click", () => {
  const title = ui.shareTitleInput.value.trim() || "Shared script";
  const source = ui.shareCodeInput.value;

  if (!validatePostInput(title, source)) {
    return;
  }

  const posts = getSharePosts();
  posts.unshift(createSharePost(title, source));
  saveSharePosts(posts.slice(0, 40));
  recordPost(getCurrentAccount().username);
  ui.shareCodeInput.value = "";
  showToast("Post published to Community");
});

ui.exportShare.addEventListener("click", () => {
  const title = ui.shareTitleInput.value.trim() || "Shared script";
  const source = ui.shareCodeInput.value;

  if (!validatePostInput(title, source)) {
    return;
  }

  const post = createSharePost(title, source);
  downloadText(`${title.replace(/[<>:\"/\\\\|?*]+/g, "_")}.share.json`, JSON.stringify(post, null, 2), "application/json");
});

ui.shareImportInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const post = JSON.parse(text);
    const source = typeof post.source === "string" ? post.source : "";
    const title = post.fullTitle || post.title || "Imported shared post";

    if (!validatePostInput(title, source)) {
      throw new Error("invalid");
    }

    const posts = getSharePosts();
    posts.unshift({
      id: post.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      title: shortenMiddle(title, 72),
      fullTitle: title,
      author: getCurrentAccount().username,
      description: post.description || `Imported shared post. ${source.split(/\r?\n/).length} lines.`,
      source,
      output: typeof post.output === "string" ? post.output : formatLuau(source),
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
    });
    saveSharePosts(posts.slice(0, 40));
    recordPost(getCurrentAccount().username);
    showToast("Shared post imported");
  } catch (_error) {
    showToast("Invalid shared post file");
  }

  ui.shareImportInput.value = "";
});

ui.createAccountButton?.addEventListener("click", () => {
  const username = ui.newAccountInput.value.trim();
  const password = ui.newPasswordInput.value;

  if (!username) {
    showToast("Choose an account name first");
    return;
  }

  if (password.trim().length < 4) {
    showToast("Password must be at least 4 characters");
    return;
  }

  const accounts = getAccounts();
  if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
    showToast("This account already exists");
    return;
  }

  const userCreatedCount = accounts.filter((account) => account.role === "user" && account.username !== "guest").length;
  if (userCreatedCount >= MAX_USER_ACCOUNTS) {
    showToast("This browser is limited to 2 user accounts");
    return;
  }

  accounts.push({ username, password, role: "user", banned: false });
  saveAccounts(accounts);
  ui.newAccountInput.value = "";
  ui.newPasswordInput.value = "";
  setCurrentAccount(username);
  showToast("Account created");
});

ui.adminLoginButton?.addEventListener("click", () => {
  const savedPin = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);

  if (!savedPin) {
    const firstPin = window.prompt("Create an admin PIN:");
    if (!firstPin || firstPin.trim().length < 4) {
      showToast("Admin PIN must be at least 4 characters");
      return;
    }

    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, firstPin.trim());
    setAdminUnlocked(true);
    setCurrentAccount("admin");
    showToast("Admin PIN created and admin unlocked");
    return;
  }

  const enteredPin = window.prompt("Enter admin PIN:");
  if (!enteredPin) {
    return;
  }

  if (enteredPin.trim() !== savedPin) {
    showToast("Wrong admin PIN");
    return;
  }

  setAdminUnlocked(true);
  setCurrentAccount("admin");
  showToast("Admin unlocked");
});

ui.switchAccountButton?.addEventListener("click", openAccountManager);
ui.closeAccountManager?.addEventListener("click", closeAccountManager);

ui.toggleTheme.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAccountManager();
  }
});

document.addEventListener("click", (event) => {
  if (ui.accountManagerModal && event.target === ui.accountManagerModal) {
    closeAccountManager();
  }
});

setTheme(getTheme());
renderAccountBar();
window.addEventListener("gmail-auth-change", renderAccountBar);
