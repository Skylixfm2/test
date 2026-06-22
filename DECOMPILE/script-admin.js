const SHARE_STORAGE_KEY = "luau-community-share";
const ACCOUNTS_STORAGE_KEY = "luau-community-accounts";
const SESSION_STORAGE_KEY = "luau-community-session";
const ADMIN_PIN_STORAGE_KEY = "luau-admin-pin-reset-20260622";
const ADMIN_UNLOCK_STORAGE_KEY = "luau-admin-unlocked-reset-20260622";
const ADMIN_EMAIL = "solarydigix@gmail.com";
const CUSTOMER_EMAIL_STORAGE_KEY = "lusive-customer-email";
const EMAIL_VERIFIED_STORAGE_KEY = "lusive-email-verified";
const THEME_STORAGE_KEY = "luau-script-theme";
const STORE_PRODUCTS_KEY = "lusive-store-products";
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
  adminAccessNotice: document.getElementById("adminAccessNotice"),
  adminPanel: document.getElementById("adminPanel"),
  accountCountBadge: document.getElementById("accountCountBadge"),
  postCountBadge: document.getElementById("postCountBadge"),
  productCountBadge: document.getElementById("productCountBadge"),
  adminAccountsBoard: document.getElementById("adminAccountsBoard"),
  adminPostsBoard: document.getElementById("adminPostsBoard"),
  adminProductsBoard: document.getElementById("adminProductsBoard"),
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

  const accounts = [];
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

function getDefaultProducts() {
  return [
    { id: "vip", name: "VIP Access", price: 4.99, stock: "14813 in stock", robloxLink: "https://www.roblox.com/fr/game-pass/1862510568/1000" },
    { id: "premium", name: "Premium Pack", price: 9.99, stock: "118 in stock", robloxLink: "https://www.roblox.com/fr/game-pass/1862510568/1000" },
    { id: "ultimate", name: "Ultimate Pack", price: 19.99, stock: "3 in stock", robloxLink: "https://www.roblox.com/fr/game-pass/1862510568/1000" },
    { id: "starter", name: "Starter Bundle", price: 1.65, stock: "221 in stock", robloxLink: "https://www.roblox.com/fr/game-pass/1862510568/1000" },
    { id: "codes", name: "Access Codes", price: 0.10, stock: "Out of stock", robloxLink: "https://www.roblox.com/fr/game-pass/1862510568/1000" }
  ];
}

function getStoreProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_PRODUCTS_KEY) || "null");
    if (Array.isArray(parsed) && parsed.length > 0) {
      const defaults = getDefaultProducts();
      const normalized = parsed.map((product, index) => ({
        ...defaults[index],
        ...product,
        robloxLink: product.robloxLink || defaults[index]?.robloxLink || defaults[0].robloxLink
      }));
      saveStoreProducts(normalized);
      return normalized;
    }
  } catch (_error) {
  }

  const products = getDefaultProducts();
  saveStoreProducts(products);
  return products;
}

function saveStoreProducts(products) {
  localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(products));
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

function findAccount(username) {
  return getAccounts().find((account) => account.username.toLowerCase() === String(username || "").trim().toLowerCase());
}

function getCurrentAccount() {
  return canAccessAdminPanel()
    ? { username: localStorage.getItem("lusive-customer-pseudo") || "admin", password: "", role: "admin", banned: false }
    : { username: "guest", password: "", role: "user", banned: false };
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
  renderAdminPanel();
}

function clearLoginInputs() {
  if (ui.loginUsernameInput) ui.loginUsernameInput.value = "";
  if (ui.loginPasswordInput) ui.loginPasswordInput.value = "";
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

function canAccessAdminPanel() {
  return localStorage.getItem(EMAIL_VERIFIED_STORAGE_KEY) === "true"
    && String(localStorage.getItem(CUSTOMER_EMAIL_STORAGE_KEY) || "").trim().toLowerCase() === ADMIN_EMAIL;
}

function renderAccountBar() {
  const current = getCurrentAccount();
  const isGuest = current.username === "guest";
  const isVisibleAdmin = current.role === "admin";
  if (ui.currentAccountName) ui.currentAccountName.textContent = current.username;
  if (ui.currentAccountRole) ui.currentAccountRole.textContent = current.role;
  if (ui.adminHint) {
    ui.adminHint.hidden = !isVisibleAdmin;
  }
  if (ui.adminLoginButton) ui.adminLoginButton.hidden = true;
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

function banUser(username) {
  const accounts = getAccounts().map((account) => account.username === username ? { ...account, banned: true } : account);
  saveAccounts(accounts);
  saveSharePosts(getSharePosts().filter((post) => post.author !== username));
}

function unbanUser(username) {
  const accounts = getAccounts().map((account) => account.username === username ? { ...account, banned: false } : account);
  saveAccounts(accounts);
}

function deleteUser(username) {
  const remainingAccounts = getAccounts().filter((account) => account.username !== username);
  saveAccounts(remainingAccounts);
  saveSharePosts(getSharePosts().filter((post) => post.author !== username));

  if (getCurrentAccount().username === username) {
    setCurrentAccount("guest");
  }
}

function renderAdminPanel() {
  const allowed = canAccessAdminPanel();
  ui.adminAccessNotice.hidden = allowed;
  ui.adminPanel.hidden = !allowed;

  if (!allowed) {
    return;
  }

  const accounts = getAccounts();
  const posts = getSharePosts();
  const products = getStoreProducts();
  if (ui.accountCountBadge) ui.accountCountBadge.textContent = `${accounts.length} account${accounts.length === 1 ? "" : "s"}`;
  ui.postCountBadge.textContent = `${posts.length} post${posts.length === 1 ? "" : "s"}`;
  if (ui.productCountBadge) {
    ui.productCountBadge.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
  }

  if (ui.adminAccountsBoard) ui.adminAccountsBoard.innerHTML = "";
  ui.adminPostsBoard.innerHTML = "";
  if (ui.adminProductsBoard) {
    ui.adminProductsBoard.innerHTML = "";
  }
  if (ui.adminAccountsBoard) ui.adminAccountsBoard.classList.toggle("empty-list", accounts.length === 0);
  ui.adminPostsBoard.classList.toggle("empty-list", posts.length === 0);
  if (ui.adminProductsBoard) {
    ui.adminProductsBoard.classList.toggle("empty-list", products.length === 0);
  }

  if (accounts.length === 0) {
    if (ui.adminAccountsBoard) ui.adminAccountsBoard.textContent = "No accounts found.";
  } else {
    accounts.forEach((account) => {
      const card = document.createElement("article");
      card.className = "share-card";

      const head = document.createElement("div");
      head.className = "share-card-head";
      head.innerHTML = `
        <div>
          <p class="share-card-title">${account.username}</p>
          <p class="share-card-author">Role: ${account.role} • ${account.banned ? "Banned" : "Active"}</p>
        </div>
        <span class="history-pill">${account.role}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "share-card-actions";

      if (account.role !== "admin" && account.username !== "guest") {
        const banButton = document.createElement("button");
        banButton.className = "small-button admin-button";
        banButton.textContent = account.banned ? `Keep banned` : `Ban ${account.username}`;
        banButton.addEventListener("click", () => {
          banUser(account.username);
          if (getCurrentAccount().username === account.username) {
            setCurrentAccount("guest");
          } else {
            renderAdminPanel();
          }
          showToast(`${account.username} banned`);
        });

        const unbanButton = document.createElement("button");
        unbanButton.className = "small-button admin-button";
        unbanButton.textContent = `Unban ${account.username}`;
        unbanButton.addEventListener("click", () => {
          unbanUser(account.username);
          renderAdminPanel();
          showToast(`${account.username} unbanned`);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "small-button admin-button";
        deleteButton.textContent = `Delete ${account.username}`;
        deleteButton.addEventListener("click", () => {
          deleteUser(account.username);
          renderAdminPanel();
          showToast(`${account.username} deleted`);
        });

        actions.append(banButton, unbanButton, deleteButton);
      }

      card.append(head, actions);
      ui.adminAccountsBoard.appendChild(card);
    });
  }

  if (posts.length === 0) {
    ui.adminPostsBoard.textContent = "No posts found.";
  } else {
    posts.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).forEach((post) => {
      const card = document.createElement("article");
      card.className = "share-card";

      const head = document.createElement("div");
      head.className = "share-card-head";
      head.innerHTML = `
        <div>
          <p class="share-card-title">${post.title || "Untitled shared post"}</p>
          <p class="share-card-author">By ${post.author || "Unknown"} • ${new Date(post.createdAt).toLocaleString("en")}</p>
        </div>
        <span class="history-pill">${(post.source || "").split(/\r?\n/).length} lines</span>
      `;

      const description = document.createElement("p");
      description.className = "share-card-desc";
      description.textContent = post.description || "No description provided.";

      const actions = document.createElement("div");
      actions.className = "share-card-actions";

      const viewButton = document.createElement("button");
      viewButton.className = "small-button";
      viewButton.textContent = "View script";
      viewButton.addEventListener("click", () => {
        ui.modalTitle.textContent = post.fullTitle || post.title || "Shared script";
        ui.modalCode.textContent = post.source || "";
        ui.scriptModal.hidden = false;
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "small-button admin-button";
      deleteButton.textContent = "Delete post";
      deleteButton.addEventListener("click", () => {
        saveSharePosts(getSharePosts().filter((entry) => entry.id !== post.id));
        renderAdminPanel();
        showToast("Post deleted");
      });

      actions.append(viewButton, deleteButton);
      card.append(head, description, actions);
      ui.adminPostsBoard.appendChild(card);
    });
  }

  if (ui.adminProductsBoard) {
    if (products.length === 0) {
      ui.adminProductsBoard.textContent = "No products found.";
    } else {
      products.forEach((product) => {
        const card = document.createElement("article");
        card.className = "share-card";
        card.innerHTML = `
          <div class="share-card-head">
            <div>
              <p class="share-card-title">${product.name}</p>
              <p class="share-card-author">ID: ${product.id}</p>
            </div>
            <span class="history-pill">${Number(product.price || 0).toFixed(2)} EUR</span>
          </div>
          <div class="account-row">
            <input class="account-input" data-product-field="price" data-product-id="${product.id}" type="number" min="0" step="0.01" value="${product.price}">
            <input class="account-input" data-product-field="stock" data-product-id="${product.id}" type="text" value="${product.stock || ""}" placeholder="Stock">
          </div>
          <div class="account-row">
            <input class="account-input" data-product-field="robloxLink" data-product-id="${product.id}" type="url" value="${product.robloxLink || ""}" placeholder="Roblox gamepass URL">
          </div>
          <div class="share-card-actions">
            <button class="small-button" data-save-product="${product.id}" type="button">Save product</button>
          </div>
        `;
        ui.adminProductsBoard.appendChild(card);
      });
    }
  }
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

ui.adminProductsBoard?.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-product]");
  if (!saveButton) {
    return;
  }

  const productId = saveButton.dataset.saveProduct;
  const products = getStoreProducts();
  const nextProducts = products.map((product) => {
    if (product.id !== productId) {
      return product;
    }

    const priceInput = ui.adminProductsBoard.querySelector(`[data-product-id="${productId}"][data-product-field="price"]`);
    const stockInput = ui.adminProductsBoard.querySelector(`[data-product-id="${productId}"][data-product-field="stock"]`);
    const linkInput = ui.adminProductsBoard.querySelector(`[data-product-id="${productId}"][data-product-field="robloxLink"]`);

    return {
      ...product,
      price: Math.max(0, Number(priceInput?.value || 0)),
      stock: stockInput?.value.trim() || "Out of stock",
      robloxLink: linkInput?.value.trim() || "https://www.roblox.com/fr/game-pass/1862510568/1000"
    };
  });

  saveStoreProducts(nextProducts);
  renderAdminPanel();
  showToast("Product saved");
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
renderAdminPanel();
window.addEventListener("gmail-auth-change", () => {
  renderAccountBar();
  renderAdminPanel();
});
window.addEventListener("storage", () => {
  renderAccountBar();
  renderAdminPanel();
});


