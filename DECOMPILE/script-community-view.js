const SHARE_STORAGE_KEY = "luau-community-share";
const HISTORY_STORAGE_KEY = "luau-script-history";
const ACCOUNTS_STORAGE_KEY = "luau-community-accounts";
const SESSION_STORAGE_KEY = "luau-community-session";
const ADMIN_PIN_STORAGE_KEY = "luau-admin-pin";
const ADMIN_UNLOCK_STORAGE_KEY = "luau-admin-unlocked";
const THEME_STORAGE_KEY = "luau-script-theme";
const CUSTOMER_EMAIL_KEY = "lusive-customer-email";
const MAX_USER_ACCOUNTS = 2;

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
  shareSearchInput: document.getElementById("shareSearchInput"),
  shareBoard: document.getElementById("shareBoard"),
  shareSortButtons: [...document.querySelectorAll(".share-sort-button")],
  scriptModal: document.getElementById("scriptModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalCode: document.getElementById("modalCode"),
  copyModalCode: document.getElementById("copyModalCode"),
  closeModal: document.getElementById("closeModal"),
  accountManagerModal: document.getElementById("accountManagerModal"),
  accountManagerList: document.getElementById("accountManagerList"),
  closeAccountManager: document.getElementById("closeAccountManager"),
  toast: document.getElementById("toast"),
};

const state = {
  shareSearchQuery: "",
  shareSort: "latest",
};

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
  renderShareBoard();
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

function saveToHistory(post) {
  let history = [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    history = Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    history = [];
  }

  history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: post.fullTitle || post.title || "Shared script",
    source: post.source || "",
    output: post.output || (post.source || ""),
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 80)));
}

function exportPost(post) {
  const blob = new Blob([JSON.stringify(post, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(post.fullTitle || post.title || "shared-script").replace(/[<>:\"/\\\\|?*]+/g, "_")}.share.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function banUser(username) {
  const accounts = getAccounts().map((account) => account.username === username ? { ...account, banned: true } : account);
  saveAccounts(accounts);
  saveSharePosts(getSharePosts().filter((entry) => entry.author !== username));

  if (getCurrentAccount().username === username) {
    setCurrentAccount("guest");
  } else {
    renderAccountBar();
    renderShareBoard();
  }
}

function unbanUser(username) {
  const accounts = getAccounts().map((account) => account.username === username ? { ...account, banned: false } : account);
  saveAccounts(accounts);
  renderAccountBar();
  renderShareBoard();
}

function renderShareBoard() {
  const currentAccount = getCurrentAccount();
  const posts = getSharePosts().filter((post) => {
    if (!state.shareSearchQuery) {
      return true;
    }
    const haystack = `${post.title || ""} ${post.fullTitle || ""}`.toLowerCase();
    return haystack.includes(state.shareSearchQuery.toLowerCase());
  }).sort((left, right) => {
    if (state.shareSort === "likes") {
      return (right.likes || 0) - (left.likes || 0) || new Date(right.createdAt) - new Date(left.createdAt);
    }
    if (state.shareSort === "title") {
      return (left.fullTitle || left.title || "").localeCompare(right.fullTitle || right.title || "", "en", { sensitivity: "base" });
    }
    return new Date(right.createdAt) - new Date(left.createdAt);
  });

  ui.shareSortButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === state.shareSort);
  });

  ui.shareBoard.innerHTML = "";
  ui.shareBoard.classList.toggle("empty-list", posts.length === 0);

  if (posts.length === 0) {
    ui.shareBoard.textContent = state.shareSearchQuery ? "No shared script matches this search." : "No shared posts yet.";
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "share-card";

    const head = document.createElement("div");
    head.className = "share-card-head";

    const identity = document.createElement("div");
    const title = document.createElement("p");
    title.className = "share-card-title";
    title.textContent = post.title || "Untitled shared post";
    title.title = post.fullTitle || post.title || "";

    const author = document.createElement("p");
    author.className = "share-card-author";
    author.textContent = `By ${post.author || "Unknown"} • ${new Date(post.createdAt).toLocaleString("en")}`;
    identity.append(title, author);

    const badge = document.createElement("span");
    badge.className = "history-pill";
    badge.textContent = "Shared";
    head.append(identity, badge);

    const description = document.createElement("p");
    description.className = "share-card-desc";
    description.textContent = post.description || "No description provided.";

    const stats = document.createElement("div");
    stats.className = "share-card-stats";
    stats.innerHTML = `<span>${(post.source || "").split(/\r?\n/).length} lines</span><span>${post.likes || 0} like${(post.likes || 0) === 1 ? "" : "s"}</span>`;

    const actions = document.createElement("div");
    actions.className = "share-card-actions";

    const openButton = document.createElement("button");
    openButton.className = "small-button";
    openButton.textContent = "Open in workspace";
    openButton.addEventListener("click", () => {
      saveToHistory(post);
      showToast("Post added to workspace history");
    });

    const viewButton = document.createElement("button");
    viewButton.className = "small-button";
    viewButton.textContent = "View script";
    viewButton.addEventListener("click", () => {
      ui.modalTitle.textContent = post.fullTitle || post.title || "Shared script";
      ui.modalCode.textContent = post.source || "";
      ui.scriptModal.hidden = false;
    });

    const likeButton = document.createElement("button");
    likeButton.className = `small-button like-button${post.liked ? " active" : ""}`;
    likeButton.textContent = post.liked ? `Unlike (${post.likes || 0})` : `Like (${post.likes || 0})`;
    likeButton.addEventListener("click", () => {
      const updated = getSharePosts().map((entry) => {
        if (entry.id !== post.id) {
          return entry;
        }
        const liked = !entry.liked;
        return { ...entry, liked, likes: Math.max(0, (entry.likes || 0) + (liked ? 1 : -1)) };
      });
      saveSharePosts(updated);
      renderShareBoard();
    });

    const exportButton = document.createElement("button");
    exportButton.className = "small-button";
    exportButton.textContent = "Export post";
    exportButton.addEventListener("click", () => exportPost(post));

    actions.append(openButton, viewButton, likeButton, exportButton);

    if (currentAccount.username && post.author && currentAccount.username === post.author) {
      const ownerDeleteButton = document.createElement("button");
      ownerDeleteButton.className = "small-button admin-button";
      ownerDeleteButton.textContent = "Delete my post";
      ownerDeleteButton.addEventListener("click", () => {
        saveSharePosts(getSharePosts().filter((entry) => entry.id !== post.id));
        renderShareBoard();
        showToast("Your post was deleted");
      });
      actions.append(ownerDeleteButton);
    }

    if (currentAccount.role === "admin") {
      const deleteButton = document.createElement("button");
      deleteButton.className = "small-button admin-button";
      deleteButton.textContent = "Delete post";
      deleteButton.addEventListener("click", () => {
        saveSharePosts(getSharePosts().filter((entry) => entry.id !== post.id));
        renderShareBoard();
        showToast("Post deleted");
      });

      const banButton = document.createElement("button");
      banButton.className = "small-button admin-button";
      banButton.textContent = `Ban ${post.author || "user"}`;
      banButton.addEventListener("click", () => {
        banUser(post.author);
        showToast(`${post.author || "User"} banned`);
      });

      const unbanButton = document.createElement("button");
      unbanButton.className = "small-button admin-button";
      unbanButton.textContent = `Unban ${post.author || "user"}`;
      unbanButton.addEventListener("click", () => {
        unbanUser(post.author);
        showToast(`${post.author || "User"} unbanned`);
      });

      actions.append(deleteButton, banButton, unbanButton);
    }

    card.append(head, description, stats, actions);
    ui.shareBoard.appendChild(card);
  });
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

ui.shareSearchInput.addEventListener("input", (event) => {
  state.shareSearchQuery = event.target.value.trim();
  renderShareBoard();
});

ui.shareSortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.shareSort = button.dataset.sort || "latest";
    button.classList.remove("clicked");
    void button.offsetWidth;
    button.classList.add("clicked");
    renderShareBoard();
  });
});

ui.toggleTheme.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

ui.closeModal.addEventListener("click", () => {
  ui.scriptModal.hidden = true;
});

ui.copyModalCode?.addEventListener("click", async () => {
  const code = ui.modalCode?.textContent || "";
  if (!code.trim()) {
    showToast("No code to copy");
    return;
  }
  await navigator.clipboard.writeText(code);
  showToast("Code copied");
});

ui.scriptModal.addEventListener("click", (event) => {
  if (event.target === ui.scriptModal) {
    ui.scriptModal.hidden = true;
  }
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
renderShareBoard();
window.addEventListener("gmail-auth-change", () => {
  renderAccountBar();
  renderShareBoard();
});
