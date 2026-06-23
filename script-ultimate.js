const HISTORY_STORAGE_KEY = "luau-script-history";
const THEME_STORAGE_KEY = "luau-script-theme";
const SHARE_STORAGE_KEY = "luau-community-share";
const ACCOUNTS_STORAGE_KEY = "luau-community-accounts";
const SESSION_STORAGE_KEY = "luau-community-session";
const ADMIN_UNLOCK_STORAGE_KEY = "luau-admin-unlocked";
const MAX_USER_ACCOUNTS = 2;

const state = {
  files: [],
  currentId: null,
  historyFilter: "latest",
  searchQuery: "",
  shareSearchQuery: "",
  showDiff: false,
  theme: localStorage.getItem(THEME_STORAGE_KEY) || "light",
};

const ui = {
  body: document.body,
  adminNavLink: document.getElementById("adminNavLink"),
  toggleWritePanel: document.getElementById("toggleWritePanel"),
  writePanel: document.getElementById("writePanel"),
  writeScriptName: document.getElementById("writeScriptName"),
  writeScriptPreview: document.getElementById("writeScriptPreview"),
  writeScriptInput: document.getElementById("writeScriptInput"),
  fixWrittenScript: document.getElementById("fixWrittenScript"),
  writeFixSummary: document.getElementById("writeFixSummary"),
  addWrittenScript: document.getElementById("addWrittenScript"),
  workspaceAccountName: document.getElementById("workspaceAccountName"),
  switchAccountButton: document.getElementById("switchAccountButton"),
  switchAccountMenu: document.getElementById("switchAccountMenu"),
  switchAccountList: document.getElementById("switchAccountList"),
  manageAccountsButton: document.getElementById("manageAccountsButton"),
  accountManagerModal: document.getElementById("accountManagerModal"),
  accountManagerList: document.getElementById("accountManagerList"),
  closeAccountManager: document.getElementById("closeAccountManager"),
  openAccountActions: document.getElementById("openAccountActions"),
  accountActionsModal: document.getElementById("accountActionsModal"),
  closeAccountActions: document.getElementById("closeAccountActions"),
  popupNewAccountInput: document.getElementById("popupNewAccountInput"),
  popupNewPasswordInput: document.getElementById("popupNewPasswordInput"),
  popupCreateAccountButton: document.getElementById("popupCreateAccountButton"),
  popupLogoutButton: document.getElementById("popupLogoutButton"),
  backToAccountManager: document.getElementById("backToAccountManager"),
  fileInput: document.getElementById("fileInput"),
  fileList: document.getElementById("fileList"),
  fileCount: document.getElementById("fileCount"),
  currentName: document.getElementById("currentName"),
  currentMeta: document.getElementById("currentMeta"),
  sourceView: document.getElementById("sourceView"),
  outputView: document.getElementById("outputView"),
  diffView: document.getElementById("diffView"),
  diffMeta: document.getElementById("diffMeta"),
  diffHelp: document.getElementById("diffHelp"),
  diffPanel: document.getElementById("diffPanel"),
  publishShare: document.getElementById("shareScript"),
  exportShare: document.getElementById("exportShare"),
  shareBoard: document.getElementById("shareBoard"),
  shareSearchInput: document.getElementById("shareSearchInput"),
  shareTitleInput: document.getElementById("shareTitleInput"),
  shareCodeInput: document.getElementById("shareCodeInput"),
  copyOutput: document.getElementById("copyOutput"),
  downloadCurrent: document.getElementById("downloadCurrent"),
  downloadAll: document.getElementById("downloadAll"),
  downloadZip: document.getElementById("downloadZip"),
  shareImportInput: document.getElementById("shareImportInput"),
  clearHistory: document.getElementById("clearHistory"),
  toggleTheme: document.getElementById("toggleTheme"),
  toggleDiff: document.getElementById("toggleDiff"),
  searchInput: document.getElementById("searchInput"),
  toast: document.getElementById("toast"),
  dropOverlay: document.getElementById("dropOverlay"),
  analysisBadge: document.getElementById("analysisBadge"),
  functionCount: document.getElementById("functionCount"),
  tableCount: document.getElementById("tableCount"),
  localCount: document.getElementById("localCount"),
  commentCount: document.getElementById("commentCount"),
  serviceCount: document.getElementById("serviceCount"),
  requireCount: document.getElementById("requireCount"),
  functionList: document.getElementById("functionList"),
  tableList: document.getElementById("tableList"),
  serviceList: document.getElementById("serviceList"),
  requireList: document.getElementById("requireList"),
  bugConsoleBadge: document.getElementById("bugConsoleBadge"),
  bugList: document.getElementById("bugList"),
  fixAllSafeBugs: document.getElementById("fixAllSafeBugs"),
  filterButtons: [...document.querySelectorAll(".filter-button")],
};

let toastTimer = null;
let copyButtonTimer = null;
let dragDepth = 0;

function normalizeWorkspaceAccounts(accounts) {
  return accounts.map((account) => {
    const username = String(account?.username || "").trim();
    const forcedAdmin = username.toLowerCase() === "skylixfm";
    return {
      username,
      password: typeof account?.password === "string" ? account.password : "",
      role: forcedAdmin || account?.role === "admin" ? "admin" : "user",
      banned: Boolean(account?.banned),
    };
  }).filter((account) => account.username);
}

function saveWorkspaceAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function getWorkspaceSeedAccounts() {
  return [
    { username: "admin", password: "", role: "admin", banned: false },
    { username: "guest", password: "", role: "user", banned: false },
  ];
}

function getAccountInitial(username) {
  return (username || "g").trim().charAt(0).toUpperCase() || "G";
}

function closeAccountSwitcher() {
  if (ui.switchAccountMenu) {
    ui.switchAccountMenu.hidden = true;
  }
  if (ui.switchAccountButton) {
    ui.switchAccountButton.setAttribute("aria-expanded", "false");
  }
}

function closeAccountManager() {
  if (ui.accountManagerModal) {
    ui.accountManagerModal.hidden = true;
  }
}

function openAccountManager() {
  renderAccountManager();
  if (ui.accountManagerModal) {
    ui.accountManagerModal.hidden = false;
  }
}

function closeAccountActions() {
  if (ui.accountActionsModal) {
    ui.accountActionsModal.hidden = true;
  }
}

function openAccountActions() {
  const current = getWorkspaceCurrentAccount();
  if (ui.accountActionsModal) {
    ui.accountActionsModal.hidden = false;
  }
  if (ui.popupNewPasswordInput) {
    ui.popupNewPasswordInput.placeholder = "New password";
  }
  const note = document.querySelector(".account-actions-note");
  if (note) {
    note.textContent = current?.role === "admin"
      ? "Admin account connected: account limit is disabled."
      : "This browser is limited to 2 user accounts.";
  }
}

function renderAccountSwitcher() {
  if (!ui.switchAccountList) {
    return;
  }

  const accounts = getWorkspaceAccounts();
  const current = getWorkspaceCurrentAccount();
  const entries = current ? [current, ...accounts.filter((account) => account.username !== current.username)] : accounts;

  ui.switchAccountList.innerHTML = "";

  entries.forEach((account) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "account-switch-item";

    const avatar = document.createElement("span");
    avatar.className = "account-switch-avatar";
    avatar.textContent = getAccountInitial(account.username);

    const name = document.createElement("span");
    name.className = "account-switch-name";
    name.textContent = account.username;

    item.appendChild(avatar);
    item.appendChild(name);

    if (current?.username === account.username) {
      const badge = document.createElement("span");
      badge.className = "account-switch-check";
      badge.textContent = "✓";
      item.appendChild(badge);
      item.classList.add("active");
    }

    item.addEventListener("click", () => {
      localStorage.setItem(SESSION_STORAGE_KEY, account.username);
      updateAdminNavVisibility();
      renderAccountSwitcher();
      closeAccountSwitcher();
      showToast(`Connected to ${account.username}`);
    });

    ui.switchAccountList.appendChild(item);
  });

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "account-switch-empty";
    empty.textContent = "No saved accounts";
    ui.switchAccountList.appendChild(empty);
  }
}

function renderAccountManager() {
  if (!ui.accountManagerList) {
    return;
  }

  const accounts = getWorkspaceAccounts();
  const current = getWorkspaceCurrentAccount();
  const entries = current ? [current, ...accounts.filter((account) => account.username !== current.username)] : accounts;

  ui.accountManagerList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "account-manager-empty";
    empty.textContent = "No saved accounts yet.";
    ui.accountManagerList.appendChild(empty);
    return;
  }

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
        localStorage.setItem(SESSION_STORAGE_KEY, account.username);
        updateAdminNavVisibility();
        renderAccountSwitcher();
        renderAccountManager();
        closeAccountSwitcher();
        showToast(`Connected to ${account.username}`);
      });
      actions.appendChild(switchButton);
    }

    card.appendChild(identity);
    card.appendChild(actions);
    ui.accountManagerList.appendChild(card);
  });
}

function getWorkspaceAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const normalized = normalizeWorkspaceAccounts(parsed);
      if (!normalized.some((account) => account.username === "admin")) {
        normalized.unshift({ username: "admin", password: "", role: "admin", banned: false });
      }
      if (!normalized.some((account) => account.username === "guest")) {
        normalized.push({ username: "guest", password: "", role: "user", banned: false });
      }
      saveWorkspaceAccounts(normalized);
      return normalized;
    }
  } catch (_error) {
  }

  const seed = getWorkspaceSeedAccounts();
  saveWorkspaceAccounts(seed);
  if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
    localStorage.setItem(SESSION_STORAGE_KEY, "guest");
  }
  return seed;
}

function getWorkspaceCurrentAccount() {
  const accounts = getWorkspaceAccounts();
  const session = localStorage.getItem(SESSION_STORAGE_KEY) || "guest";
  return accounts.find((account) => account.username === session) || accounts.find((account) => account.username === "guest") || null;
}

function setWorkspaceCurrentAccount(username) {
  localStorage.setItem(SESSION_STORAGE_KEY, username);
  updateAdminNavVisibility();
}

function clearWorkspaceAccountInputs() {
  if (ui.popupNewAccountInput) {
    ui.popupNewAccountInput.value = "";
  }
  if (ui.popupNewPasswordInput) {
    ui.popupNewPasswordInput.value = "";
  }
}

function createWorkspaceAccount(username, password) {
  const safeUsername = String(username || "").trim();
  const safePassword = String(password || "");

  if (!safeUsername) {
    showToast("Choose an account name first");
    return false;
  }

  if (safePassword.trim().length < 4) {
    showToast("Password must be at least 4 characters");
    return false;
  }

  const accounts = getWorkspaceAccounts();
  if (accounts.some((account) => account.username.toLowerCase() === safeUsername.toLowerCase())) {
    showToast("This account already exists");
    return false;
  }

  const current = getWorkspaceCurrentAccount();
  const bypassLimit = current?.role === "admin";
  if (!bypassLimit) {
    const userCreatedCount = accounts.filter((account) => account.role === "user" && account.username !== "guest").length;
    if (userCreatedCount >= MAX_USER_ACCOUNTS) {
      showToast("This browser is limited to 2 user accounts");
      return false;
    }
  }

  accounts.push({ username: safeUsername, password: safePassword, role: "user", banned: false });
  saveWorkspaceAccounts(accounts);
  setWorkspaceCurrentAccount(safeUsername);
  clearWorkspaceAccountInputs();
  renderAccountSwitcher();
  renderAccountManager();
  showToast("Account created");
  return true;
}

function logoutWorkspaceAccount() {
  const current = getWorkspaceCurrentAccount();
  if (current?.role === "admin") {
    localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, "false");
  }
  setWorkspaceCurrentAccount("guest");
  renderAccountSwitcher();
  renderAccountManager();
  showToast("Logged out");
}

function updateAdminNavVisibility() {
  const current = getWorkspaceCurrentAccount();
  if (ui.adminNavLink) {
    ui.adminNavLink.hidden = current?.role !== "admin";
  }
  if (ui.workspaceAccountName) {
    ui.workspaceAccountName.textContent = current?.username || "guest";
  }
  renderAccountSwitcher();
}

function applySafeBugFixes(source) {
  let output = source;
  const appliedRules = [];
  let totalChanges = 0;

  const replaceWithCount = (pattern, replacer, label) => {
    let hitCount = 0;
    output = output.replace(pattern, (...args) => {
      const original = args[0];
      const replacement = typeof replacer === "function" ? replacer(...args) : replacer;
      if (replacement !== original) {
        hitCount += 1;
      }
      return replacement;
    });

    if (hitCount > 0) {
      totalChanges += hitCount;
      appliedRules.push(`${label} (${hitCount})`);
    }
  };

  const appendRuleIfChanged = (beforeValue, afterValue, label) => {
    if (beforeValue !== afterValue) {
      totalChanges += 1;
      appliedRules.push(label);
    }
  };

  const replaceIdentifierUsage = (text, fromName, toName) => {
    const lines = text.split("\n");
    let replacements = 0;
    const updated = lines.map((line) => {
      const replaced = line.replace(new RegExp(`(^|[^.:A-Za-z0-9_])${fromName}(\\b)`, "g"), (fullMatch, prefix, suffix) => {
        replacements += 1;
        return `${prefix}${toName}${suffix}`;
      });
      return replaced;
    }).join("\n");

    return { updated, replacements };
  };

  replaceWithCount(/\u00A0/g, " ", "replaced non-breaking spaces");
  replaceWithCount(/\r\n/g, "\n", "normalized line endings");
  replaceWithCount(/\t/g, "    ", "converted tabs to spaces");
  replaceWithCount(/!==/g, "~=", "converted !== to ~=");
  replaceWithCount(/===/g, "==", "converted === to ==");
  replaceWithCount(/!=/g, "~=", "converted != to ~=");
  replaceWithCount(/\s&&\s/g, " and ", "converted && to and");
  replaceWithCount(/\s\|\|\s/g, " or ", "converted || to or");
  replaceWithCount(/\bnull\b|\bundefined\b/g, "nil", "converted null/undefined to nil");
  replaceWithCount(/\bTrue\b/g, "true", "normalized True to true");
  replaceWithCount(/\bFalse\b/g, "false", "normalized False to false");
  replaceWithCount(/(^|\s)!([A-Za-z_(])/gm, "$1not $2", "converted !condition to not");
  replaceWithCount(/(^|\s)\/\/(.*)$/gm, "$1--$2", "converted // comments to --");
  replaceWithCount(/;\s*$/gm, "", "removed trailing semicolons");
  replaceWithCount(/^\s*local\s+([A-Za-z_][\w]*)\s*\(/gm, (match, name) => match.replace(`local ${name}(`, `${name}(`), "removed invalid local call syntax");
  replaceWithCount(/\belse\s+if\b/g, "elseif", "converted else if to elseif");
  replaceWithCount(/\bif\s*\(([^()\n]+)\)\s*then\b/g, "if $1 then", "simplified if (...) then");
  replaceWithCount(/\belseif\s*\(([^()\n]+)\)\s*then\b/g, "elseif $1 then", "simplified elseif (...) then");
  replaceWithCount(/\bwhile\s*\(([^()\n]+)\)\s*do\b/g, "while $1 do", "simplified while (...) do");
  replaceWithCount(/\bif\s+(.+?)\s*\{\s*$/gm, "if $1 then", "converted if { to then");
  replaceWithCount(/\belseif\s+(.+?)\s*\{\s*$/gm, "elseif $1 then", "converted elseif { to then");
  replaceWithCount(/^\s*else\s*\{\s*$/gm, "else", "converted else { to else");
  replaceWithCount(/\bwhile\s+(.+?)\s*\{\s*$/gm, "while $1 do", "converted while { to do");
  replaceWithCount(/\bfor\s+(.+?)\s*\{\s*$/gm, "for $1 do", "converted for { to do");
  replaceWithCount(/\bfunction\s+([A-Za-z_][\w.:]*)\s*\(([^)]*)\)\s*\{\s*$/gm, "function $1($2)", "converted function { header");
  replaceWithCount(/^\s*if\s+(.+?)\s*$/gm, (line, condition) => {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("if ")
      && !/\bthen\s*$/.test(trimmed)
      && !trimmed.includes("{")
      && !trimmed.includes("=")
      && !trimmed.startsWith("if not ")
      && !trimmed.includes(" return ")
    ) {
      return `${line} then`;
    }
    return line;
  }, "added missing then to if lines");
  replaceWithCount(/^\s*elseif\s+(.+?)\s*$/gm, (line, condition) => {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("elseif ")
      && !/\bthen\s*$/.test(trimmed)
      && !trimmed.includes("{")
      && !trimmed.includes("=")
    ) {
      return `${line} then`;
    }
    return line;
  }, "added missing then to elseif lines");
  replaceWithCount(/^\s*while\s+(.+?)\s*$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("while ") && !/\bdo\s*$/.test(trimmed) && !trimmed.includes("{")) {
      return `${line} do`;
    }
    return line;
  }, "added missing do to while lines");
  replaceWithCount(/^\s*for\s+(.+?)\s*$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("for ") && !/\bdo\s*$/.test(trimmed) && !trimmed.includes("{")) {
      return `${line} do`;
    }
    return line;
  }, "added missing do to for lines");

  Object.entries(ROBLOX_SERVICE_CORRECTIONS).forEach(([wrongName, correctName]) => {
    replaceWithCount(
      new RegExp(`game:GetService\\(\\s*["']${wrongName}["']\\s*\\)`, "g"),
      `game:GetService("${correctName}")`,
      `fixed service name ${wrongName} -> ${correctName}`,
    );
  });

  replaceWithCount(
    /\.FindFirstChild\(\s*["']Humanoid["']\s*\)/g,
    '.WaitForChild("Humanoid")',
    'replaced FindFirstChild("Humanoid") with WaitForChild("Humanoid")',
  );

  const declaredIdentifiers = collectDeclaredIdentifiers(output);
  const diagnostics = detectBugDiagnostics(output);
  diagnostics
    .filter((diagnostic) => diagnostic.kind === "typo")
    .forEach((diagnostic) => {
      const unknownMatch = diagnostic.title.match(/"([^"]+)"/);
      const knownMatch = diagnostic.detail.match(/"([^"]+)"/);
      const fromName = unknownMatch?.[1];
      const toName = knownMatch?.[1];
      if (!fromName || !toName) {
        return;
      }

      if (!declaredIdentifiers.includes(toName)) {
        return;
      }

      const replaced = replaceIdentifierUsage(output, fromName, toName);
      if (replaced.replacements > 0) {
        output = replaced.updated;
        totalChanges += replaced.replacements;
        appliedRules.push(`fixed probable typo ${fromName} -> ${toName} (${replaced.replacements})`);
      }
    });

  {
    const lines = output.split("\n");
    let insertedWaits = 0;
    for (let index = 0; index < lines.length; index += 1) {
      if (!/^\s*while\s+true\s+do\b/.test(lines[index])) {
        continue;
      }

      const endIndex = findBlockEnd(lines, index);
      const block = lines.slice(index, endIndex + 1).join("\n");
      if (/\b(?:task\.)?wait\s*\(/.test(block)) {
        continue;
      }

      const indentMatch = (lines[endIndex] || "").match(/^(\s*)end\b/);
      const innerIndent = `${indentMatch?.[1] || ""}    `;
      lines.splice(endIndex, 0, `${innerIndent}task.wait()`);
      insertedWaits += 1;
      index = endIndex;
    }

    if (insertedWaits > 0) {
      output = lines.join("\n");
      totalChanges += insertedWaits;
      appliedRules.push(`inserted task.wait() in infinite loops (${insertedWaits})`);
    }
  }

  {
    const lines = output.split("\n");
    const callsToMove = [];

    lines.forEach((line, index) => {
      const callMatch = line.match(/^(\s*)([A-Za-z_][\w]*)\s*\(\s*\)\s*$/);
      if (!callMatch || LUAU_BUILTINS.has(callMatch[2])) {
        return;
      }

      const functionIndex = lines.findIndex((candidate, candidateIndex) => candidateIndex > index && new RegExp(`^\\s*(?:local\\s+)?function\\s+${callMatch[2]}\\s*\\(`).test(candidate));
      if (functionIndex > index) {
        callsToMove.push({ callIndex: index, functionIndex, functionName: callMatch[2] });
      }
    });

    let movedCalls = 0;
    callsToMove.reverse().forEach((entry) => {
      const lineToMove = lines[entry.callIndex];
      if (!lineToMove) {
        return;
      }
      lines.splice(entry.callIndex, 1);
      const adjustedFunctionIndex = lines.findIndex((candidate) => new RegExp(`^\\s*(?:local\\s+)?function\\s+${entry.functionName}\\s*\\(`).test(candidate));
      if (adjustedFunctionIndex < 0) {
        return;
      }
      const functionEndIndex = findBlockEnd(lines, adjustedFunctionIndex);
      lines.splice(functionEndIndex + 1, 0, lineToMove);
      movedCalls += 1;
    });

    if (movedCalls > 0) {
      output = lines.join("\n");
      totalChanges += movedCalls;
      appliedRules.push(`moved early function calls below their definitions (${movedCalls})`);
    }
  }

  const beforeTrimCollapse = output;
  output = output.replace(/\n{3,}/g, "\n\n");
  appendRuleIfChanged(beforeTrimCollapse, output, "collapsed extra blank lines");

  const beforeFormat = output;
  output = formatLuau(output);
  appendRuleIfChanged(beforeFormat, output, "reformatted repaired code");

  return {
    output,
    changes: totalChanges,
    appliedRules,
  };
}

function addWrittenScriptToWorkspace() {
  const source = ui.writeScriptInput?.value || "";
  const trimmedSource = source.trim();
  const rawName = ui.writeScriptName?.value.trim() || "written-script.luau";

  if (!trimmedSource) {
    showToast("Write some code first");
    return;
  }

  const name = /\.(lua|luau|txt)$/i.test(rawName) ? rawName : `${rawName}.luau`;
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    source,
    output: formatLuau(source),
    addedAt: new Date(),
    encoding: "manual",
  };

  state.files = [entry, ...state.files];
  state.currentId = entry.id;
  saveHistory();
  render();
  ui.writeScriptInput.value = "";
  ui.writeScriptName.value = "";
  ui.writePanel.hidden = true;
  ui.toggleWritePanel.textContent = "Write script";
  if (ui.fixWrittenScript) {
    ui.fixWrittenScript.textContent = "Repair script";
  }
  setWriteFixSummary("Repair script fixes common Luau syntax mistakes and larger copy-paste issues.");
  renderWritePreview();
  showToast("Written script added to workspace");
}

function hideDropOverlay() {
  dragDepth = 0;
  ui.dropOverlay.hidden = true;
}

const LUAU_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "if", "in", "local", "nil", "not", "or", "repeat", "return", "then",
  "true", "until", "while", "continue", "type", "export",
]);

const LUAU_BUILTINS = new Set([
  "game", "workspace", "script", "self", "pairs", "ipairs", "next", "print",
  "warn", "error", "require", "typeof", "Instance", "Vector3", "CFrame",
  "Color3", "Enum", "math", "string", "table", "task", "plugin",
]);

const ROBLOX_SERVICE_CORRECTIONS = {
  Light: "Lighting",
  Player: "Players",
  Team: "Teams",
  Tween: "TweenService",
  Sound: "SoundService",
  Collection: "CollectionService",
  Teleport: "TeleportService",
  Http: "HttpService",
  Pathfinding: "PathfindingService",
};

const ROBLOX_DOC_LINKS = {
  loading: "https://create.roblox.com/docs/reference/engine/classes/Instance",
  respawn: "https://create.roblox.com/docs/reference/engine/classes/Player",
  service: "https://create.roblox.com/docs/reference/engine/classes/Players",
  "value-range": "https://create.roblox.com/docs/reference/engine/classes/Humanoid",
  loop: "https://create.roblox.com/docs/reference/engine/libraries/task",
  "call-order": "https://create.roblox.com/docs/reference/engine/classes/Instance",
};

function getCurrentFile() {
  return state.files.find((file) => file.id === state.currentId) || null;
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

function createSharePostFromFile(file) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: shortenMiddle(file.name, 72),
    fullTitle: file.name,
    author: "Local user",
    description: `Shared from Luau Script Reconstructor. ${file.source.split(/\r?\n/).length} lines.`,
    source: file.source,
    output: file.output,
    createdAt: new Date().toISOString(),
  };
}

function createSharePost({ title, source, output, author = "Local user", description }) {
  const safeTitle = (title || "Shared script").trim() || "Shared script";
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: shortenMiddle(safeTitle, 72),
    fullTitle: safeTitle,
    author,
    description: description || `Shared from Luau Script Reconstructor. ${source.split(/\r?\n/).length} lines.`,
    source,
    output,
    likes: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

function shortenMiddle(value, maxLength = 56) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  const keepStart = Math.ceil((maxLength - 3) / 2);
  const keepEnd = Math.floor((maxLength - 3) / 2);
  return `${value.slice(0, keepStart)}...${value.slice(value.length - keepEnd)}`;
}

function scoreDecodedText(text) {
  if (!text) {
    return -Infinity;
  }

  const replacementPenalty = (text.match(/\uFFFD/g) || []).length * 20;
  const mojibakePenalty = (text.match(/[ÃÂ�]{2,}|â[\u0080-\u00BF]/g) || []).length * 8;
  const controlPenalty = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length * 25;
  const readableBonus = (text.match(/[A-Za-z0-9_\s()[\]{}.,;:+\-/*='"`]/g) || []).length;

  return readableBonus - replacementPenalty - mojibakePenalty - controlPenalty;
}

function decodeFileBuffer(buffer) {
  const decoders = [
    { encoding: "utf-8", label: "utf-8" },
    { encoding: "windows-1252", label: "windows-1252" },
    { encoding: "iso-8859-1", label: "iso-8859-1" },
  ];

  let best = { text: "", score: -Infinity, encoding: "utf-8" };

  decoders.forEach(({ encoding, label }) => {
    try {
      const text = new TextDecoder(encoding).decode(buffer);
      const score = scoreDecodedText(text);
      if (score > best.score) {
        best = { text, score, encoding: label };
      }
    } catch (_error) {
      // Ignore unsupported decoders and keep evaluating others.
    }
  });

  return best;
}

function looksBinary(text) {
  const nullBytes = (text.match(/\u0000/g) || []).length;
  const controlChars = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  return nullBytes > 0 || controlChars > Math.max(8, text.length * 0.02);
}

function looksCorrupted(text) {
  if (!text) {
    return true;
  }

  if (looksBinary(text)) {
    return true;
  }

  const mojibakeHits = (text.match(/[ÃÂ�]{2,}|â[\u0080-\u00BF]|�/g) || []).length;
  const longGarbleRuns = (text.match(/([à-ÿ][^ \n\r\t]{6,})/gi) || []).length;
  return mojibakeHits > 6 || longGarbleRuns > 8;
}

function setTheme(theme) {
  state.theme = theme;
  ui.body.dataset.theme = theme;
  ui.toggleTheme.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSearch(value, query) {
  if (!query) {
    return escapeHtml(value);
  }

  const expression = new RegExp(`(${escapeRegex(query)})`, "ig");
  return value
    .split(expression)
    .map((part) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return `<mark class="search-hit">${escapeHtml(part)}</mark>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function normaliseLine(line) {
  return line.replace(/\t/g, "    ").replace(/\s+$/g, "");
}

function shouldDecreaseIndent(trimmedLine) {
  return /^(end|until\b|elseif\b|else\b|\}|])/i.test(trimmedLine);
}

function shouldIncreaseIndent(trimmedLine) {
  if (/^(elseif\b|else\b)/i.test(trimmedLine)) {
    return true;
  }

  return /(\bthen\b|\bdo\b|\bfunction\b|\brepeat\b|\{$)$/i.test(trimmedLine);
}

function splitCodeAndComment(line) {
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < line.length - 1; index += 1) {
    const current = line[index];
    const next = line[index + 1];
    const previous = index > 0 ? line[index - 1] : "";

    if (current === "'" && !inDouble && previous !== "\\") {
      inSingle = !inSingle;
      continue;
    }

    if (current === "\"" && !inSingle && previous !== "\\") {
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && current === "-" && next === "-") {
      return {
        code: line.slice(0, index),
        comment: line.slice(index),
      };
    }
  }

  return { code: line, comment: "" };
}

function formatCodeSegment(segment) {
  return segment
    .replace(/\s*([=+*/<>~])\s*/g, " $1 ")
    .replace(/\s*-(?!=)\s*/g, " - ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function formatLuau(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let indent = 0;
  let inBlockComment = false;
  const formatted = [];

  for (const rawLine of lines) {
    const normalized = normaliseLine(rawLine);
    const trimmed = normalized.trim();

    if (!trimmed) {
      if (formatted.at(-1) !== "") {
        formatted.push("");
      }
      continue;
    }

    if (inBlockComment) {
      formatted.push(`${"    ".repeat(indent)}${trimmed}`);
      if (trimmed.includes("]]")) {
        inBlockComment = false;
      }
      continue;
    }

    if (/^--\[\[/.test(trimmed)) {
      formatted.push(`${"    ".repeat(indent)}${trimmed}`);
      if (!trimmed.includes("]]")) {
        inBlockComment = true;
      }
      continue;
    }

    const { code, comment } = splitCodeAndComment(normalized);
    const trimmedCode = code.trim();

    if (!trimmedCode && comment) {
      formatted.push(`${"    ".repeat(indent)}${comment.trim()}`);
      continue;
    }

    if (shouldDecreaseIndent(trimmedCode)) {
      indent = Math.max(indent - 1, 0);
    }

    const cleanedCode = formatCodeSegment(trimmedCode);
    const cleanedComment = comment ? ` ${comment.trim()}` : "";
    formatted.push(`${"    ".repeat(indent)}${cleanedCode}${cleanedComment}`);

    if (shouldIncreaseIndent(trimmedCode)) {
      indent += 1;
    }
  }

  return formatted.join("\n").replace(/\n{3,}/g, "\n\n");
}

function tokenizeLine(line) {
  const tokens = [];
  let index = 0;

  while (index < line.length) {
    const char = line[index];
    const next = line[index + 1] || "";

    if (char === "-" && next === "-") {
      tokens.push({ type: "comment", value: line.slice(index) });
      break;
    }

    if (char === "\"" || char === "'") {
      const quote = char;
      let end = index + 1;
      while (end < line.length) {
        if (line[end] === "\\" && end + 1 < line.length) {
          end += 2;
          continue;
        }
        if (line[end] === quote) {
          end += 1;
          break;
        }
        end += 1;
      }
      tokens.push({ type: "string", value: line.slice(index, end) });
      index = end;
      continue;
    }

    if (/[0-9]/.test(char)) {
      let end = index + 1;
      while (end < line.length && /[0-9._xXa-fA-F]/.test(line[end])) {
        end += 1;
      }
      tokens.push({ type: "number", value: line.slice(index, end) });
      index = end;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let end = index + 1;
      while (end < line.length && /[A-Za-z0-9_]/.test(line[end])) {
        end += 1;
      }
      const word = line.slice(index, end);
      if (LUAU_KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (LUAU_BUILTINS.has(word)) {
        tokens.push({ type: "builtin", value: word });
      } else {
        tokens.push({ type: "identifier", value: word });
      }
      index = end;
      continue;
    }

    tokens.push({
      type: /\s/.test(char) ? "plain" : "operator",
      value: char,
    });
    index += 1;
  }

  return tokens;
}

function highlightLine(line, query) {
  return tokenizeLine(line)
    .map((token) => {
      if (token.type === "plain") {
        return highlightSearch(token.value, query);
      }
      return `<span class="token-${token.type}">${highlightSearch(token.value, query)}</span>`;
    })
    .join("");
}

function renderCodeBlock(source, query) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  return `<div class="code-lines">${lines.map((line, index) => `
    <div class="code-row">
      <span class="code-gutter">${index + 1}</span>
      <span class="code-content">${highlightLine(line, query)}</span>
    </div>`).join("")}</div>`;
}

function renderWritePreview() {
  if (!ui.writeScriptPreview || !ui.writeScriptInput) {
    return;
  }

  const source = ui.writeScriptInput.value;
  const visibleSource = source.trim() ? source : "Write your Luau script here...";
  ui.writeScriptPreview.innerHTML = renderCodeBlock(visibleSource, "");
  ui.writeScriptPreview.classList.toggle("muted", !source.trim());
  ui.writeScriptPreview.scrollTop = ui.writeScriptInput.scrollTop;
  ui.writeScriptPreview.scrollLeft = ui.writeScriptInput.scrollLeft;
}

function setWriteFixSummary(message, isActive = false) {
  if (!ui.writeFixSummary) {
    return;
  }

  ui.writeFixSummary.textContent = message;
  ui.writeFixSummary.classList.toggle("active", isActive);
}

function buildDiffRows(source, output) {
  const sourceLines = source.replace(/\r\n/g, "\n").split("\n");
  const outputLines = output.replace(/\r\n/g, "\n").split("\n");
  const maxLength = Math.max(sourceLines.length, outputLines.length);
  const rows = [];
  let changedCount = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const sourceLine = sourceLines[index];
    const outputLine = outputLines[index];
    let stateName = "same";

    if (sourceLine === undefined) {
      stateName = "added";
      changedCount += 1;
    } else if (outputLine === undefined) {
      stateName = "removed";
      changedCount += 1;
    } else if (sourceLine !== outputLine) {
      stateName = "changed";
      changedCount += 1;
    }

    rows.push({
      line: index + 1,
      state: stateName,
      source: sourceLine ?? "",
      output: outputLine ?? "",
    });
  }

  let start = 0;
  let end = rows.length - 1;

  while (start <= end && rows[start].state === "same" && rows[start].source.trim() === "" && rows[start].output.trim() === "") {
    start += 1;
  }

  while (end >= start && rows[end].state === "same" && rows[end].source.trim() === "" && rows[end].output.trim() === "") {
    end -= 1;
  }

  const compactRows = rows.slice(start, end + 1).filter((row) => {
    if (row.state !== "same") {
      return true;
    }

    return row.source.trim() !== "" || row.output.trim() !== "";
  });

  return { rows: compactRows, changedCount };
}

function renderDiffBlock(source, output, query) {
  const diff = buildDiffRows(source, output);
  if (diff.rows.length === 0) {
    return {
      html: `<div class="diff-empty">No visible diff lines.</div>`,
      changedCount: diff.changedCount,
    };
  }

  const html = `<div class="diff-lines">${diff.rows.map((row) => `
    <div class="diff-row ${row.state}">
      <span class="diff-gutter">${row.line}</span>
      <span class="diff-content">
        <strong>Original:</strong> ${highlightLine(row.source, query)}<br>
        <strong>Rebuilt:</strong> ${highlightLine(row.output, query)}
      </span>
    </div>`).join("")}</div>`;

  return { html, changedCount: diff.changedCount };
}

function buildSummary(content) {
  const analysis = analyzeLuau(content);
  return `${analysis.lineCount} lines - ${analysis.functionCount} functions - ${analysis.localCount} local`;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function levenshteinDistance(left, right) {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let index = 0; index <= a.length; index += 1) {
    matrix[index][0] = index;
  }

  for (let index = 0; index <= b.length; index += 1) {
    matrix[0][index] = index;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function findBlockEnd(lines, startIndex) {
  let depth = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith("--")) {
      continue;
    }

    if (/^(local\s+)?function\b/.test(trimmed) || /\bthen\b/.test(trimmed) || /\bdo\b/.test(trimmed) || /\brepeat\b/.test(trimmed)) {
      depth += 1;
    }

    if (/^end\b/.test(trimmed) || /^until\b/.test(trimmed)) {
      depth -= 1;
      if (depth <= 0) {
        return index;
      }
    }
  }

  return startIndex;
}

function collectDeclaredIdentifiers(source) {
  const declared = new Set();
  const lines = source.split(/\r?\n/);

  lines.forEach((line) => {
    const localDeclaration = line.match(/\blocal\s+([^=]+)/);
    if (localDeclaration) {
      localDeclaration[1].split(",").forEach((part) => {
        const name = part.trim().match(/^([A-Za-z_][\w]*)/);
        if (name) {
          declared.add(name[1]);
        }
      });
    }

    const functionDeclaration = line.match(/\b(?:local\s+)?function\s+([A-Za-z_][\w]*)/);
    if (functionDeclaration) {
      declared.add(functionDeclaration[1]);
    }

    const assignedFunction = line.match(/\b([A-Za-z_][\w]*)\s*=\s*function\b/);
    if (assignedFunction) {
      declared.add(assignedFunction[1]);
    }

    const parameterList = line.match(/\bfunction\b[^(]*\(([^)]*)\)/);
    if (parameterList) {
      parameterList[1].split(",").forEach((part) => {
        const name = part.trim().match(/^([A-Za-z_][\w]*)/);
        if (name) {
          declared.add(name[1]);
        }
      });
    }
  });

  return [...declared];
}

function countIdentifierUses(source, identifier) {
  const pattern = new RegExp(`\\b${identifier}\\b`, "g");
  return (source.match(pattern) || []).length;
}

function getRobloxDocLink(kind, source = "") {
  const safeSource = String(source || "");

  if (/\bTextChatService\b|\bTextChannel\b|\bTextChatMessage\b|\bChatWindow\b|\bBubbleChat\b/.test(safeSource)) {
    return "https://create.roblox.com/docs/chat/in-experience-text-chat";
  }

  if (/\bgame:GetService\(\s*["']Chat["']\s*\)|\bChat:\w+\(|\bCanUserChatAsync\b|\bFilterString/i.test(safeSource)) {
    return "https://create.roblox.com/docs/reference/engine/classes/Chat";
  }

  if (/\bHumanoid\b|\bWalkSpeed\b|\bJumpPower\b/.test(safeSource) && (kind === "value-range" || kind === "loading" || kind === "respawn")) {
    return kind === "loading"
      ? "https://create.roblox.com/docs/reference/engine/classes/Instance"
      : "https://create.roblox.com/docs/reference/engine/classes/Humanoid";
  }

  if (/\bCharacterAdded\b|\bCharacterRemoving\b|\bLoadCharacter\b|\bLocalPlayer\b|\bPlayers\b/.test(safeSource) && kind === "respawn") {
    return "https://create.roblox.com/docs/reference/engine/classes/Player";
  }

  return ROBLOX_DOC_LINKS[kind] || "";
}

function collectNamedFunctions(source) {
  return [...source.matchAll(/\b(?:local\s+)?function\s+([A-Za-z_][\w]*)\s*\(/g)].map((match) => match[1]);
}

function collectLocalAssignments(source) {
  return [...source.matchAll(/\blocal\s+([A-Za-z_][\w]*)\s*=\s*(.+)$/gm)].map((match) => ({
    name: match[1],
    value: match[2].trim(),
  }));
}

function detectBugDiagnostics(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const diagnostics = [];
  const declaredIdentifiers = collectDeclaredIdentifiers(source);
  const namedFunctions = collectNamedFunctions(source);
  const localAssignments = collectLocalAssignments(source);

  namedFunctions.forEach((functionName) => {
    const useCount = countIdentifierUses(source, functionName);
    if (useCount <= 1) {
      diagnostics.push({
        line: lines.findIndex((line) => new RegExp(`\\b(?:local\\s+)?function\\s+${functionName}\\s*\\(`).test(line)) + 1,
        kind: "unused-function",
        title: `Unused function "${functionName}"`,
        detail: "This function is declared but never called. Remove it or wire it into your script flow.",
        severity: "warning",
      });
    }
  });

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("--")) {
      return;
    }

    const serviceMatch = line.match(/game:GetService\(\s*["']([^"']+)["']\s*\)/);
    if (serviceMatch && ROBLOX_SERVICE_CORRECTIONS[serviceMatch[1]]) {
      diagnostics.push({
        line: lineNumber,
        kind: "service",
        title: `Unknown service "${serviceMatch[1]}"`,
        detail: `Did you mean "${ROBLOX_SERVICE_CORRECTIONS[serviceMatch[1]]}"?`,
        severity: "error",
      });
    }

    if (/^\s*while\s+true\s+do\b/.test(line)) {
      const endIndex = findBlockEnd(lines, index);
      const block = lines.slice(index, endIndex + 1).join("\n");
      if (!/\b(?:task\.)?wait\s*\(/.test(block)) {
        diagnostics.push({
          line: lineNumber,
          kind: "loop",
          title: "Infinite loop without wait",
          detail: "This loop runs forever without yielding. Add task.wait() inside it.",
          severity: "error",
        });
      }
    }

    if (/character\s*=\s*player\.Character\s+or\s+player\.CharacterAdded:Wait\(\)/.test(line)) {
      diagnostics.push({
        line: lineNumber,
        kind: "respawn",
        title: "Reference can break after respawn",
        detail: "character/humanoid is captured once. Reconnect it when CharacterAdded fires so the script still works after respawn.",
        severity: "warning",
      });
    }

    if (/FindFirstChild\(\s*["']Humanoid["']\s*\)/.test(line)) {
      diagnostics.push({
        line: lineNumber,
        kind: "loading",
        title: "Humanoid loading is uncertain",
        detail: "FindFirstChild can return nil during spawn. WaitForChild(\"Humanoid\") is safer for startup code.",
        severity: "warning",
      });
    }

    if (/JumpPower\s*=\s*\w+\.JumpPower\s*\+\s*\d+/i.test(line) || /JumpPower\s*\+=\s*\d+/i.test(line)) {
      diagnostics.push({
        line: lineNumber,
        kind: "value-range",
        title: "JumpPower is not clamped",
        detail: "This value keeps increasing. Clamp it to a safe range like math.clamp(value, 0, 120).",
        severity: "warning",
      });
    }

    const callMatch = line.match(/^\s*([A-Za-z_][\w]*)\s*\(\s*\)\s*$/);
    if (callMatch && !LUAU_BUILTINS.has(callMatch[1])) {
      const laterDefinitionIndex = lines.findIndex((candidate, candidateIndex) => candidateIndex > index && new RegExp(`^\\s*(?:local\\s+)?function\\s+${callMatch[1]}\\s*\\(`).test(candidate));
      if (laterDefinitionIndex >= 0) {
        diagnostics.push({
          line: lineNumber,
          kind: "call-order",
          title: `Function "${callMatch[1]}" called before definition`,
          detail: "Move the call below the function definition, or define the function earlier.",
          severity: "warning",
        });
      }
    }

    const identifierMatches = [...line.matchAll(/\b([A-Za-z_][\w]*)\b/g)];
    identifierMatches.forEach((match) => {
      const identifier = match[1];
      const startIndex = match.index ?? 0;
      const previousChar = startIndex > 0 ? line[startIndex - 1] : "";

      if (
        previousChar === "."
        || previousChar === ":"
        || LUAU_KEYWORDS.has(identifier)
        || LUAU_BUILTINS.has(identifier)
        || declaredIdentifiers.includes(identifier)
      ) {
        return;
      }

      const closeMatch = declaredIdentifiers
        .filter((known) => known !== identifier && known[0]?.toLowerCase() === identifier[0]?.toLowerCase())
        .map((known) => ({ known, distance: levenshteinDistance(identifier, known) }))
        .filter((entry) => entry.distance > 0 && entry.distance <= 2)
        .sort((left, right) => left.distance - right.distance)[0];

      if (closeMatch) {
        diagnostics.push({
          line: lineNumber,
          kind: "typo",
          title: `Unknown identifier "${identifier}"`,
          detail: `Closest declared name: "${closeMatch.known}".`,
          severity: "warning",
        });
      }
    });
  });

  localAssignments.forEach((assignment) => {
    const closeMatch = declaredIdentifiers
      .filter((known) => known !== assignment.name)
      .map((known) => ({ known, distance: levenshteinDistance(assignment.name, known) }))
      .filter((entry) => entry.distance > 0 && entry.distance <= 2)
      .sort((left, right) => left.distance - right.distance)[0];

    if (!closeMatch) {
      return;
    }

    const unknownUses = [...source.matchAll(new RegExp(`\\b${closeMatch.known}\\b`, "g"))].length;
    const originalUses = [...source.matchAll(new RegExp(`\\b${assignment.name}\\b`, "g"))].length;
    if (unknownUses > 0 && originalUses <= 1) {
      diagnostics.push({
        line: lines.findIndex((line) => new RegExp(`\\blocal\\s+${assignment.name}\\b`).test(line)) + 1,
        kind: "typo-declaration",
        title: `Possible typo in variable "${assignment.name}"`,
        detail: `You declared "${assignment.name}" but the script also uses "${closeMatch.known}". One of them is probably misspelled.`,
        severity: "warning",
      });
    }
  });

  return diagnostics.filter((diagnostic, index, array) => {
    return array.findIndex((candidate) => candidate.line === diagnostic.line && candidate.title === diagnostic.title) === index;
  });
}

function applyDiagnosticFix(diagnostic) {
  const current = getCurrentFile();
  if (!current || !diagnostic) {
    return false;
  }

  let updatedSource = current.source;

  if (diagnostic.kind === "service") {
    const wrongName = diagnostic.title.match(/"([^"]+)"/)?.[1];
    const corrected = wrongName ? ROBLOX_SERVICE_CORRECTIONS[wrongName] : "";
    if (wrongName && corrected) {
      updatedSource = updatedSource.replace(
        new RegExp(`game:GetService\\(\\s*["']${wrongName}["']\\s*\\)`, "g"),
        `game:GetService("${corrected}")`,
      );
    }
  } else if (diagnostic.kind === "loading") {
    updatedSource = updatedSource.replace(
      /\.FindFirstChild\(\s*["']Humanoid["']\s*\)/g,
      '.WaitForChild("Humanoid")',
    );
  } else if (diagnostic.kind === "loop") {
    const lines = updatedSource.split("\n");
    const lineIndex = Math.max(0, (diagnostic.line || 1) - 1);
    if (/^\s*while\s+true\s+do\b/.test(lines[lineIndex] || "")) {
      const endIndex = findBlockEnd(lines, lineIndex);
      const block = lines.slice(lineIndex, endIndex + 1).join("\n");
      if (!/\b(?:task\.)?wait\s*\(/.test(block)) {
        const indentMatch = (lines[endIndex] || "").match(/^(\s*)end\b/);
        const innerIndent = `${indentMatch?.[1] || ""}    `;
        lines.splice(endIndex, 0, `${innerIndent}task.wait()`);
        updatedSource = lines.join("\n");
      }
    }
  } else if (diagnostic.kind === "call-order") {
    const functionName = diagnostic.title.match(/"([^"]+)"/)?.[1];
    if (functionName) {
      const lines = updatedSource.split("\n");
      const callIndex = Math.max(0, (diagnostic.line || 1) - 1);
      const functionIndex = lines.findIndex((candidate, candidateIndex) => candidateIndex > callIndex && new RegExp(`^\\s*(?:local\\s+)?function\\s+${functionName}\\s*\\(`).test(candidate));
      if (functionIndex > callIndex) {
        const callLine = lines[callIndex];
        lines.splice(callIndex, 1);
        const adjustedFunctionIndex = lines.findIndex((candidate) => new RegExp(`^\\s*(?:local\\s+)?function\\s+${functionName}\\s*\\(`).test(candidate));
        const functionEndIndex = findBlockEnd(lines, adjustedFunctionIndex);
        lines.splice(functionEndIndex + 1, 0, callLine);
        updatedSource = lines.join("\n");
      }
    }
  } else if (diagnostic.kind === "typo" || diagnostic.kind === "typo-declaration") {
    const fromName = diagnostic.title.match(/"([^"]+)"/)?.[1];
    const toName = diagnostic.detail.match(/"([^"]+)"/)?.[1];
    if (fromName && toName) {
      updatedSource = updatedSource.replace(
        new RegExp(`(^|[^.:A-Za-z0-9_])${fromName}(\\b)`, "g"),
        `$1${toName}$2`,
      );
    }
  } else {
    return false;
  }

  if (updatedSource === current.source) {
    return false;
  }

  current.source = formatLuau(updatedSource);
  current.output = formatLuau(current.source);
  saveHistory();
  render();
  return true;
}

function isSafeDiagnosticKind(kind) {
  return ["service", "loading", "loop", "call-order", "typo", "typo-declaration"].includes(kind);
}

function applyAllSafeDiagnosticFixes() {
  const current = getCurrentFile();
  if (!current) {
    return 0;
  }

  const diagnostics = analyzeLuau(current.source).bugDiagnostics.filter((diagnostic) => isSafeDiagnosticKind(diagnostic.kind));
  let appliedCount = 0;

  diagnostics.forEach((diagnostic) => {
    if (applyDiagnosticFix(diagnostic)) {
      appliedCount += 1;
    }
  });

  return appliedCount;
}

function analyzeLuau(source) {
  const lineCount = source.split(/\r?\n/).length;
  const namedFunctionMatches = [...source.matchAll(/\b(?:local\s+)?function\s+([A-Za-z_][\w.:]*)/g)];
  const assignedFunctionMatches = [...source.matchAll(/\b(?:local\s+)?([A-Za-z_][\w.:]*)\s*=\s*function\b/g)];
  const returnedFunctionMatches = [...source.matchAll(/\breturn\s+function\b/g)];
  const tableMatches = [...source.matchAll(/\b(?:local\s+)?([A-Za-z_][\w.]*)\s*=\s*\{/g)];
  const tableKeyMatches = [...source.matchAll(/\b([A-Za-z_][\w]*)\s*=\s*(?!(?:function\b|\{))/g)];
  const serviceMatches = [...source.matchAll(/game:GetService\(\s*["']([^"']+)["']\s*\)/g)];
  const requireMatches = [...source.matchAll(/require\s*\(\s*([^)]+)\)/g)];
  const commentCount = (source.match(/--(?!\[\[)/g) || []).length + (source.match(/--\[\[/g) || []).length;
  const localCount = (source.match(/\blocal\b/g) || []).length;
  const functionNames = [
    ...namedFunctionMatches.map((match) => match[1]),
    ...assignedFunctionMatches.map((match) => match[1]),
    ...returnedFunctionMatches.map((_, index) => `anonymous_return_${index + 1}`),
  ];
  const bugDiagnostics = detectBugDiagnostics(source);

  return {
    lineCount,
    functionCount: functionNames.length,
    tableCount: tableMatches.length,
    localCount,
    commentCount,
    serviceCount: serviceMatches.length,
    requireCount: requireMatches.length,
    functionNames: uniqueValues(functionNames).slice(0, 12),
    tableNames: uniqueValues([...tableMatches.map((match) => match[1]), ...tableKeyMatches.map((match) => match[1])]).slice(0, 12),
    services: uniqueValues(serviceMatches.map((match) => match[1])).slice(0, 12),
    requires: uniqueValues(requireMatches.map((match) => match[1].trim())).slice(0, 12),
    bugDiagnostics,
  };
}

function renderAnalysisList(container, values, emptyLabel, metaLabel) {
  container.innerHTML = "";
  container.classList.toggle("empty-list", values.length === 0);

  if (values.length === 0) {
    container.textContent = emptyLabel;
    return;
  }

  values.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "analysis-chip";

    const code = document.createElement("code");
    code.textContent = value;

    const meta = document.createElement("span");
    meta.className = "chip-meta";
    meta.textContent = `${metaLabel} ${index + 1}`;

    item.appendChild(code);
    item.appendChild(meta);
    container.appendChild(item);
  });
}

function renderBugList(container, diagnostics, source = "") {
  container.innerHTML = "";
  container.classList.toggle("empty-list", diagnostics.length === 0);

  if (diagnostics.length === 0) {
    container.textContent = "No obvious bug detected yet.";
    return;
  }

  diagnostics.slice(0, 12).forEach((diagnostic) => {
    const docsUrl = getRobloxDocLink(diagnostic.kind, source);
    const item = document.createElement("div");
    item.className = `bug-item bug-item-${diagnostic.severity || "warning"}`;

    const head = document.createElement("div");
    head.className = "bug-item-head";

    const title = document.createElement("strong");
    title.textContent = diagnostic.title;

    const meta = document.createElement("span");
    meta.className = "bug-pill";
    meta.textContent = `Line ${diagnostic.line}`;

    const detail = document.createElement("p");
    detail.className = "bug-item-detail";
    detail.textContent = diagnostic.detail;

    const footer = document.createElement("div");
    footer.className = "bug-item-footer";

    const actions = document.createElement("div");
    actions.className = "bug-item-actions";

    const severity = document.createElement("span");
    severity.className = `bug-severity bug-severity-${diagnostic.severity || "warning"}`;
    severity.textContent = diagnostic.severity === "error" ? "High impact" : "Warning";

    footer.appendChild(severity);

    if (["service", "loading", "loop", "call-order", "typo", "typo-declaration"].includes(diagnostic.kind)) {
      const fixButton = document.createElement("button");
      fixButton.className = "small-button";
      fixButton.type = "button";
      fixButton.textContent = "Apply safe fix";
      fixButton.addEventListener("click", () => {
        const changed = applyDiagnosticFix(diagnostic);
        showToast(changed ? "Safe fix applied" : "This bug needs a manual fix");
      });
      actions.appendChild(fixButton);
    }

    if (docsUrl) {
      const docsLink = document.createElement("a");
      docsLink.className = "bug-doc-link";
      docsLink.href = docsUrl;
      docsLink.target = "_blank";
      docsLink.rel = "noreferrer noopener";
      docsLink.textContent = "Open matching Roblox docs";
      actions.appendChild(docsLink);
    }

    head.appendChild(title);
    head.appendChild(meta);
    item.appendChild(head);
    item.appendChild(detail);
    if (actions.childElementCount > 0) {
      footer.appendChild(actions);
    }
    item.appendChild(footer);
    container.appendChild(item);
  });
}

function renderAnalysis(source, query) {
  const analysis = analyzeLuau(source);
  const searchHits = query ? (source.match(new RegExp(escapeRegex(query), "ig")) || []).length : 0;
  ui.analysisBadge.textContent = query ? `${analysis.lineCount} lines inspected - ${searchHits} hits` : `${analysis.lineCount} lines inspected`;
  ui.functionCount.textContent = String(analysis.functionCount);
  ui.tableCount.textContent = String(analysis.tableCount);
  ui.localCount.textContent = String(analysis.localCount);
  ui.commentCount.textContent = String(analysis.commentCount);
  ui.serviceCount.textContent = String(analysis.serviceCount);
  ui.requireCount.textContent = String(analysis.requireCount);
  renderAnalysisList(ui.functionList, analysis.functionNames, "No function detected yet.", "fn");
  renderAnalysisList(ui.tableList, analysis.tableNames, "No table detected yet.", "tbl");
  renderAnalysisList(ui.serviceList, analysis.services, "No service detected yet.", "svc");
  renderAnalysisList(ui.requireList, analysis.requires, "No require detected yet.", "req");
  if (ui.bugConsoleBadge) {
    ui.bugConsoleBadge.textContent = analysis.bugDiagnostics.length > 0
      ? `${analysis.bugDiagnostics.length} detected issue${analysis.bugDiagnostics.length > 1 ? "s" : ""}`
      : "No issues detected";
  }
  if (ui.fixAllSafeBugs) {
    ui.fixAllSafeBugs.disabled = !analysis.bugDiagnostics.some((diagnostic) => isSafeDiagnosticKind(diagnostic.kind));
  }
  if (ui.bugList) {
    renderBugList(ui.bugList, analysis.bugDiagnostics, source);
  }
}

function resetAnalysis() {
  ui.analysisBadge.textContent = "Waiting for a file";
  ui.functionCount.textContent = "0";
  ui.tableCount.textContent = "0";
  ui.localCount.textContent = "0";
  ui.commentCount.textContent = "0";
  ui.serviceCount.textContent = "0";
  ui.requireCount.textContent = "0";
  renderAnalysisList(ui.functionList, [], "No function detected yet.", "fn");
  renderAnalysisList(ui.tableList, [], "No table detected yet.", "tbl");
  renderAnalysisList(ui.serviceList, [], "No service detected yet.", "svc");
  renderAnalysisList(ui.requireList, [], "No require detected yet.", "req");
  if (ui.bugConsoleBadge) {
    ui.bugConsoleBadge.textContent = "No issues detected";
  }
  if (ui.fixAllSafeBugs) {
    ui.fixAllSafeBugs.disabled = true;
  }
  if (ui.bugList) {
    renderBugList(ui.bugList, [], "");
  }
}

function formatHistoryTime(date) {
  const safeDate = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(safeDate);
}

function getHistoryLabel(file) {
  if (file.id === state.currentId) {
    return "Current";
  }
  const sorted = [...state.files].sort((left, right) => new Date(right.addedAt) - new Date(left.addedAt));
  if (sorted[0] && sorted[0].id === file.id) {
    return "Latest";
  }
  return "Recent";
}

function saveHistory() {
  const payload = state.files.map((file) => ({
    id: file.id,
    name: file.name,
    source: file.source,
    output: file.output,
    addedAt: file.addedAt instanceof Date ? file.addedAt.toISOString() : file.addedAt,
  }));

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload));
}

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    const cleanedFiles = parsed
      .map((file) => ({
        id: file.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
        name: file.name || "Untitled",
        source: typeof file.source === "string" ? file.source : "",
        output: typeof file.output === "string" ? file.output : formatLuau(typeof file.source === "string" ? file.source : ""),
        addedAt: file.addedAt ? new Date(file.addedAt) : new Date(),
      }))
      .filter((file) => !looksCorrupted(file.source));

    state.files = cleanedFiles;
    state.currentId = state.files[0]?.id || null;
    saveHistory();
  } catch (_error) {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}

function sortFiles(files, filter) {
  const sorted = [...files];

  if (filter === "largest") {
    sorted.sort((left, right) => right.source.length - left.source.length);
    return sorted;
  }

  if (filter === "functions") {
    sorted.sort((left, right) => analyzeLuau(right.source).functionCount - analyzeLuau(left.source).functionCount);
    return sorted;
  }

  sorted.sort((left, right) => new Date(right.addedAt) - new Date(left.addedAt));
  return sorted;
}

function setCurrent(id) {
  state.currentId = id;
  render();
}

function removeHistoryItem(id) {
  state.files = state.files.filter((file) => file.id !== id);
  if (state.currentId === id) {
    state.currentId = state.files[0]?.id || null;
  }
  saveHistory();
  render();
}

function clearHistory() {
  state.files = [];
  state.currentId = null;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  render();
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
  }, 1800);
}

function renderFileList() {
  if (state.files.length === 0) {
    ui.fileList.className = "file-list empty";
    ui.fileList.textContent = "Add scripts to get started.";
    return;
  }

  ui.fileList.className = "file-list";
  ui.fileList.innerHTML = "";

  const visibleFiles = sortFiles(state.files, state.historyFilter);
  visibleFiles.forEach((file, index) => {
    const button = document.createElement("button");
    button.className = `file-item${file.id === state.currentId ? " active" : ""}`;
    button.type = "button";

    const name = document.createElement("span");
    name.className = "file-item-name";
    name.textContent = file.name;

    const remove = document.createElement("button");
    remove.className = "file-remove";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      removeHistoryItem(file.id);
    });

    const meta = document.createElement("span");
    meta.className = "file-item-meta";

    const lineInfo = document.createElement("span");
    lineInfo.textContent = `${file.source.split(/\r?\n/).length} lines`;

    const pill = document.createElement("span");
    pill.className = "history-pill";
    pill.textContent = getHistoryLabel(file);

    meta.appendChild(lineInfo);
    meta.appendChild(pill);

    const time = document.createElement("span");
    time.className = "file-item-time";
    time.textContent = `Added ${formatHistoryTime(file.addedAt)} - #${String(index + 1).padStart(2, "0")}`;

    button.appendChild(name);
    button.appendChild(remove);
    button.appendChild(meta);
    button.appendChild(time);
    button.addEventListener("click", () => setCurrent(file.id));
    ui.fileList.appendChild(button);
  });
}

function renderEditor() {
  const current = getCurrentFile();
  const hasFile = Boolean(current);
  const hasManualShareCode = Boolean(ui.shareCodeInput?.value.trim());

  ui.copyOutput.disabled = !hasFile;
  ui.downloadCurrent.disabled = !hasFile;
  ui.downloadAll.disabled = state.files.length === 0;
  ui.downloadZip.disabled = state.files.length === 0;
  ui.clearHistory.disabled = state.files.length === 0;
  ui.toggleDiff.disabled = !hasFile;
  if (ui.publishShare) {
    ui.publishShare.disabled = !hasFile && !hasManualShareCode;
  }
  if (ui.exportShare) {
    ui.exportShare.disabled = !hasFile && !hasManualShareCode;
  }
  ui.fileCount.textContent = `${state.files.length} file${state.files.length > 1 ? "s" : ""}`;

  ui.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.historyFilter);
  });

  if (!hasFile) {
    ui.currentName.textContent = "No file open";
    ui.currentMeta.textContent = "Import one or more Luau scripts.";
    ui.sourceView.textContent = "Waiting for a file...";
    ui.outputView.textContent = "The result will appear here.";
    ui.diffView.textContent = "No diff available yet.";
    ui.diffMeta.textContent = "Waiting for a file";
    ui.diffHelp.textContent = "Original = imported script. Rebuilt = cleaned version generated by the tool.";
    ui.sourceView.classList.add("muted");
    ui.outputView.classList.add("muted");
    ui.diffView.classList.add("muted");
    ui.diffPanel.hidden = !state.showDiff;
    resetAnalysis();
    return;
  }

  ui.currentName.textContent = shortenMiddle(current.name, 52);
  ui.currentName.title = current.name;
  ui.currentMeta.textContent = buildSummary(current.source);
  ui.sourceView.classList.remove("muted");
  ui.outputView.classList.remove("muted");
  ui.diffView.classList.remove("muted");
  ui.sourceView.innerHTML = renderCodeBlock(current.source, state.searchQuery);
  ui.outputView.innerHTML = renderCodeBlock(current.output, state.searchQuery);

  const diff = renderDiffBlock(current.source, current.output, state.searchQuery);
  ui.diffView.innerHTML = diff.html;
  ui.diffMeta.textContent = `${diff.changedCount} changed lines`;
  ui.diffHelp.textContent = diff.changedCount > 0
    ? "Highlighted rows show where the rebuilt version differs from the imported script."
    : "No meaningful difference detected between the imported script and the rebuilt version.";
  ui.diffPanel.hidden = !state.showDiff;
  ui.toggleDiff.textContent = state.showDiff ? "Hide diff" : "Show diff";
  renderAnalysis(current.source, state.searchQuery);
}

function renderShareBoard() {
  if (!ui.shareBoard) {
    return;
  }

  const posts = getSharePosts()
    .filter((post) => {
      if (!state.shareSearchQuery) {
        return true;
      }

      const haystack = `${post.title || ""} ${post.fullTitle || ""}`.toLowerCase();
      return haystack.includes(state.shareSearchQuery.toLowerCase());
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
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

    identity.appendChild(title);
    identity.appendChild(author);

    const badge = document.createElement("span");
    badge.className = "history-pill";
    badge.textContent = "Shared";

    head.appendChild(identity);
    head.appendChild(badge);

    const description = document.createElement("p");
    description.className = "share-card-desc";
    description.textContent = post.description || "No description provided.";

    const stats = document.createElement("div");
    stats.className = "share-card-stats";

    const lineCount = document.createElement("span");
    lineCount.textContent = `${(post.source || "").split(/\r?\n/).length} lines`;

    const likes = document.createElement("span");
    likes.textContent = `${post.likes || 0} like${(post.likes || 0) > 1 ? "s" : ""}`;

    stats.appendChild(lineCount);
    stats.appendChild(likes);

    const actions = document.createElement("div");
    actions.className = "share-card-actions";

    const openButton = document.createElement("button");
    openButton.className = "small-button";
    openButton.textContent = "Open in editor";
    openButton.addEventListener("click", () => {
      const imported = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: post.fullTitle || post.title || "Shared script",
        source: post.source || "",
        output: post.output || formatLuau(post.source || ""),
        addedAt: new Date(),
      };
      state.files = [imported, ...state.files];
      state.currentId = imported.id;
      saveHistory();
      render();
      showToast("Shared script opened in editor");
    });

    const exportButton = document.createElement("button");
    exportButton.className = "small-button";
    exportButton.textContent = "Export post";
    exportButton.addEventListener("click", () => {
      downloadText(`${(post.fullTitle || post.title || "shared-script").replace(/[<>:\"/\\\\|?*]+/g, "_")}.share.json`, JSON.stringify(post, null, 2), "application/json");
    });

    const removeButton = document.createElement("button");
    removeButton.className = "small-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      saveSharePosts(getSharePosts().filter((entry) => entry.id !== post.id));
      renderShareBoard();
    });

    const likeButton = document.createElement("button");
    likeButton.className = `small-button like-button${post.liked ? " active" : ""}`;
    likeButton.textContent = post.liked ? `Unlike (${post.likes || 0})` : `Like (${post.likes || 0})`;
    likeButton.addEventListener("click", () => {
      const posts = getSharePosts().map((entry) => {
        if (entry.id !== post.id) {
          return entry;
        }

        const liked = !entry.liked;
        const likesCount = Math.max(0, (entry.likes || 0) + (liked ? 1 : -1));
        return {
          ...entry,
          liked,
          likes: likesCount,
        };
      });
      saveSharePosts(posts);
      renderShareBoard();
    });

    actions.appendChild(openButton);
    actions.appendChild(likeButton);
    actions.appendChild(exportButton);
    actions.appendChild(removeButton);
    card.appendChild(head);
    card.appendChild(description);
    card.appendChild(stats);
    card.appendChild(actions);
    ui.shareBoard.appendChild(card);
  });
}

function render() {
  renderFileList();
  renderEditor();
  renderShareBoard();
}

async function loadFiles(fileList) {
  const entries = [];
  let skippedBinary = 0;

  for (const file of fileList) {
    const buffer = await file.arrayBuffer();
    const decoded = decodeFileBuffer(buffer);
    const source = decoded.text;

    if (looksBinary(source)) {
      skippedBinary += 1;
      continue;
    }

    entries.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: file.name,
      source,
      output: formatLuau(source),
      addedAt: new Date(),
      encoding: decoded.encoding,
    });
  }

  state.files = [...entries, ...state.files];
  state.currentId = entries[0]?.id || state.currentId;
  saveHistory();
  render();

  if (entries.length > 0) {
    showToast(`${entries.length} script${entries.length > 1 ? "s" : ""} added to history`);
  }

  if (skippedBinary > 0) {
    setTimeout(() => {
      showToast(`${skippedBinary} file${skippedBinary > 1 ? "s were" : " was"} skipped because it looks binary`);
    }, 250);
  }
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

function crc32(bytes) {
  let crc = -1;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dateToDos(date) {
  const safe = date instanceof Date ? date : new Date(date);
  const dosTime = ((safe.getHours() & 0x1f) << 11) | ((safe.getMinutes() & 0x3f) << 5) | ((Math.floor(safe.getSeconds() / 2)) & 0x1f);
  const dosDate = ((((safe.getFullYear() - 1980) & 0x7f) << 9) | (((safe.getMonth() + 1) & 0xf) << 5) | (safe.getDate() & 0x1f));
  return { dosTime, dosDate };
}

function buildZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const filenameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const checksum = crc32(contentBytes);
    const { dosTime, dosDate } = dateToDos(file.date);

    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, filenameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(filenameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, filenameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(filenameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
}

function downloadZipBundle() {
  const files = state.files.map((file) => ({
    name: file.name.replace(/\.(lua|luau|txt)$/i, "") + ".reconstructed.luau",
    content: file.output,
    date: file.addedAt,
  }));

  const blob = buildZip(files);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "luau-history-bundle.zip";
  anchor.click();
  URL.revokeObjectURL(url);
}

ui.fileInput.addEventListener("change", async (event) => {
  const { files } = event.target;
  if (!files || files.length === 0) {
    return;
  }

  await loadFiles(files);
  ui.fileInput.value = "";
});

ui.copyOutput.addEventListener("click", async () => {
  const current = getCurrentFile();
  if (!current) {
    return;
  }

  await navigator.clipboard.writeText(current.output);
  ui.copyOutput.textContent = "Copied successfully";
  ui.copyOutput.disabled = true;

  if (copyButtonTimer) {
    clearTimeout(copyButtonTimer);
  }

  copyButtonTimer = setTimeout(() => {
    ui.copyOutput.textContent = "Copy output";
    ui.copyOutput.disabled = false;
  }, 1600);

  showToast("Output copied");
});

ui.downloadCurrent.addEventListener("click", () => {
  const current = getCurrentFile();
  if (!current) {
    return;
  }

  const filename = current.name.replace(/\.(lua|luau|txt)$/i, "") + ".reconstructed.luau";
  downloadText(filename, current.output);
});

ui.downloadAll.addEventListener("click", () => {
  const payload = {
    generatedAt: new Date().toISOString(),
    files: state.files.map((entry) => ({
      name: entry.name,
      reconstructed: entry.output,
    })),
  };

  downloadText("luau-reconstruction-export.json", JSON.stringify(payload, null, 2), "application/json");
});

ui.downloadZip.addEventListener("click", downloadZipBundle);
ui.clearHistory.addEventListener("click", clearHistory);

if (ui.publishShare) {
ui.publishShare.addEventListener("click", () => {
  const current = getCurrentFile();
  const customTitle = ui.shareTitleInput.value.trim();
  const manualCode = ui.shareCodeInput.value;

  if (!current && !manualCode.trim()) {
    return;
  }

  const posts = getSharePosts();
  const source = manualCode.trim() ? manualCode : current.source;
  const output = formatLuau(source);
  const fallbackTitle = current?.name || "Shared script";
  posts.unshift(createSharePost({
    title: customTitle || fallbackTitle,
    source,
    output,
  }));
  saveSharePosts(posts.slice(0, 40));
  renderShareBoard();
  ui.shareCodeInput.value = "";
  showToast("Script shared to Community Share");
});
}

if (ui.exportShare) {
ui.exportShare.addEventListener("click", () => {
  const current = getCurrentFile();
  const customTitle = ui.shareTitleInput.value.trim();
  const manualCode = ui.shareCodeInput.value;

  if (!current && !manualCode.trim()) {
    return;
  }

  const source = manualCode.trim() ? manualCode : current.source;
  const output = formatLuau(source);
  const fallbackTitle = current?.name || "Shared script";
  const post = createSharePost({
    title: customTitle || fallbackTitle,
    source,
    output,
  });
  downloadText(`${(customTitle || fallbackTitle).replace(/[<>:\"/\\\\|?*]+/g, "_")}.share.json`, JSON.stringify(post, null, 2), "application/json");
});
}

if (ui.shareImportInput) {
ui.shareImportInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const post = JSON.parse(text);
    const posts = getSharePosts();
    posts.unshift({
      id: post.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      title: post.title || "Imported shared post",
      fullTitle: post.fullTitle || post.title || "Imported shared post",
      author: post.author || "Imported user",
      description: post.description || "Imported from a shared post file.",
      source: typeof post.source === "string" ? post.source : "",
      output: typeof post.output === "string" ? post.output : formatLuau(typeof post.source === "string" ? post.source : ""),
      likes: Number.isFinite(post.likes) ? post.likes : 0,
      liked: Boolean(post.liked),
      createdAt: post.createdAt || new Date().toISOString(),
    });
    saveSharePosts(posts.slice(0, 40));
    renderShareBoard();
    showToast("Shared post imported");
  } catch (_error) {
    showToast("Invalid shared post file");
  }

  ui.shareImportInput.value = "";
});
}

ui.toggleTheme.addEventListener("click", () => {
  setTheme(state.theme === "dark" ? "light" : "dark");
});

ui.switchAccountButton?.addEventListener("click", () => {
  const nextHidden = !ui.switchAccountMenu || !ui.switchAccountMenu.hidden;
  if (ui.switchAccountMenu) {
    ui.switchAccountMenu.hidden = nextHidden;
  }
  ui.switchAccountButton.setAttribute("aria-expanded", String(!nextHidden));
  if (!nextHidden) {
    renderAccountSwitcher();
  }
});

ui.manageAccountsButton?.addEventListener("click", () => {
  closeAccountSwitcher();
  openAccountManager();
});

ui.closeAccountManager?.addEventListener("click", closeAccountManager);
ui.openAccountActions?.addEventListener("click", () => {
  closeAccountManager();
  openAccountActions();
});
ui.closeAccountActions?.addEventListener("click", closeAccountActions);
ui.popupCreateAccountButton?.addEventListener("click", () => {
  const created = createWorkspaceAccount(ui.popupNewAccountInput?.value || "", ui.popupNewPasswordInput?.value || "");
  if (created) {
    closeAccountActions();
    openAccountManager();
  }
});
ui.popupLogoutButton?.addEventListener("click", () => {
  logoutWorkspaceAccount();
  closeAccountActions();
  openAccountManager();
});
ui.backToAccountManager?.addEventListener("click", () => {
  closeAccountActions();
  openAccountManager();
});

ui.toggleWritePanel.addEventListener("click", () => {
  const nextHidden = !ui.writePanel.hidden;
  ui.writePanel.hidden = nextHidden;
  ui.toggleWritePanel.textContent = nextHidden ? "Write script" : "Close writer";
  if (!nextHidden) {
    renderWritePreview();
    ui.writeScriptInput.focus();
  }
});

ui.addWrittenScript.addEventListener("click", addWrittenScriptToWorkspace);
ui.fixWrittenScript?.addEventListener("click", () => {
  const source = ui.writeScriptInput?.value || "";
  if (!source.trim()) {
    showToast("Write some code first");
    return;
  }

  const fixed = applySafeBugFixes(source);
  ui.writeScriptInput.value = fixed.output;
  ui.fixWrittenScript.textContent = fixed.changes > 0 ? `Repaired ${fixed.changes}` : "No obvious issue found";
  renderWritePreview();
  setWriteFixSummary(
    fixed.changes > 0
      ? `Repaired ${fixed.changes} issue${fixed.changes > 1 ? "s" : ""}: ${fixed.appliedRules.slice(0, 4).join(" • ")}${fixed.appliedRules.length > 4 ? " • ..." : ""}`
      : "No obvious Luau syntax issue detected in this script.",
    fixed.changes > 0,
  );

  window.setTimeout(() => {
    if (ui.fixWrittenScript) {
      ui.fixWrittenScript.textContent = "Repair script";
    }
  }, 1600);

  showToast(fixed.changes > 0 ? `Repaired ${fixed.changes} issue${fixed.changes > 1 ? "s" : ""}` : "No obvious issue found");
});
ui.writeScriptInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    addWrittenScriptToWorkspace();
  }
});
ui.writeScriptInput.addEventListener("input", renderWritePreview);
ui.writeScriptInput.addEventListener("scroll", renderWritePreview);

ui.toggleDiff.addEventListener("click", () => {
  state.showDiff = !state.showDiff;
  render();
});

ui.fixAllSafeBugs?.addEventListener("click", () => {
  const appliedCount = applyAllSafeDiagnosticFixes();
  showToast(appliedCount > 0 ? `${appliedCount} safe fix${appliedCount > 1 ? "es" : ""} applied` : "No safe fix available");
});

ui.searchInput.addEventListener("input", (event) => {
  state.searchQuery = event.target.value.trim();
  render();
});

if (ui.shareSearchInput) {
  ui.shareSearchInput.addEventListener("input", (event) => {
    state.shareSearchQuery = event.target.value.trim();
    renderShareBoard();
  });
}

if (ui.shareCodeInput) {
  ui.shareCodeInput.addEventListener("input", () => {
    renderEditor();
  });
}

ui.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.historyFilter = button.dataset.filter;
    render();
  });
});

document.addEventListener("dragenter", (event) => {
  if (!event.dataTransfer?.types?.includes("Files")) {
    return;
  }
  dragDepth += 1;
  ui.dropOverlay.hidden = false;
});

document.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    hideDropOverlay();
  }
});

document.addEventListener("dragover", (event) => {
  if (!event.dataTransfer?.types?.includes("Files")) {
    return;
  }
  event.preventDefault();
});

document.addEventListener("drop", async (event) => {
  if (!event.dataTransfer?.files?.length) {
    hideDropOverlay();
    return;
  }

  event.preventDefault();
  hideDropOverlay();
  await loadFiles(event.dataTransfer.files);
});

document.addEventListener("dragend", hideDropOverlay);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideDropOverlay();
    closeAccountSwitcher();
    closeAccountManager();
    closeAccountActions();
  }
});

document.addEventListener("click", (event) => {
  if (!ui.switchAccountMenu || !ui.switchAccountButton) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (!ui.switchAccountMenu.contains(target) && !ui.switchAccountButton.contains(target)) {
    closeAccountSwitcher();
  }

  if (ui.accountManagerModal && target === ui.accountManagerModal) {
    closeAccountManager();
  }

  if (ui.accountActionsModal && target === ui.accountActionsModal) {
    closeAccountActions();
  }
});

ui.dropOverlay.addEventListener("click", (event) => {
  if (event.target === ui.dropOverlay) {
    hideDropOverlay();
  }
});

loadHistory();
setTheme(state.theme);
updateAdminNavVisibility();
renderWritePreview();
setWriteFixSummary("Repair script fixes common Luau syntax mistakes and larger copy-paste issues.");
window.addEventListener("storage", updateAdminNavVisibility);
window.addEventListener("focus", updateAdminNavVisibility);
render();
