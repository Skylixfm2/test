const SHARE_STORAGE_KEY = "luau-community-share";
const HISTORY_STORAGE_KEY = "luau-script-history";

const ui = {
  openPostComposer: document.getElementById("openPostComposer"),
  shareImportInput: document.getElementById("shareImportInput"),
  shareSearchInput: document.getElementById("shareSearchInput"),
  shareTitleInput: document.getElementById("shareTitleInput"),
  shareCodeInput: document.getElementById("shareCodeInput"),
  shareScript: document.getElementById("shareScript"),
  exportShare: document.getElementById("exportShare"),
  shareBoard: document.getElementById("shareBoard"),
  shareSortButtons: [...document.querySelectorAll(".share-sort-button")],
  toast: document.getElementById("toast"),
};

const state = {
  shareSearchQuery: "",
  shareSort: "latest",
};

let toastTimer = null;
const BLOCKED_WORDS = [
  "fdp", "encule", "enculé", "pute", "putain", "salope", "connard", "connasse",
  "batard", "bâtard", "nigger", "niga", "faggot", "retard", "shit", "bitch",
];

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

function downloadText(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
    output: post.output || formatLuau(post.source || ""),
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 80)));
}

function createSharePost() {
  const title = (ui.shareTitleInput.value.trim() || "Shared script");
  const source = ui.shareCodeInput.value.trim();

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: shortenMiddle(title, 72),
    fullTitle: title,
    author: "Local user",
    description: `Shared from Luau Script Reconstructor. ${source.split(/\r?\n/).length} lines.`,
    source,
    output: formatLuau(source),
    likes: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

function renderShareBoard() {
  const posts = getSharePosts()
    .filter((post) => {
      if (!state.shareSearchQuery) {
        return true;
      }

      const haystack = `${post.title || ""} ${post.fullTitle || ""}`.toLowerCase();
      return haystack.includes(state.shareSearchQuery.toLowerCase());
    })
    .sort((left, right) => {
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
    openButton.textContent = "Open in workspace";
    openButton.addEventListener("click", () => {
      saveToHistory(post);
      showToast("Post added to workspace history");
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
        return { ...entry, liked, likes: likesCount };
      });
      saveSharePosts(posts);
      renderShareBoard();
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

ui.shareScript.addEventListener("click", () => {
  if (!ui.shareCodeInput.value.trim()) {
    showToast("Write or paste some code first");
    return;
  }

  if (containsBlockedWords(ui.shareTitleInput.value) || containsBlockedWords(ui.shareCodeInput.value)) {
    showToast("This post contains blocked words");
    return;
  }

  if (!looksLikeScript(ui.shareCodeInput.value)) {
    showToast("This does not look like a Luau script");
    return;
  }

  const posts = getSharePosts();
  posts.unshift(createSharePost());
  saveSharePosts(posts.slice(0, 40));
  ui.shareCodeInput.value = "";
  renderShareBoard();
  showToast("Script shared to Community");
});

ui.exportShare.addEventListener("click", () => {
  if (!ui.shareCodeInput.value.trim()) {
    showToast("Write or paste some code first");
    return;
  }

  if (containsBlockedWords(ui.shareTitleInput.value) || containsBlockedWords(ui.shareCodeInput.value)) {
    showToast("This post contains blocked words");
    return;
  }

  if (!looksLikeScript(ui.shareCodeInput.value)) {
    showToast("This does not look like a Luau script");
    return;
  }

  const post = createSharePost();
  downloadText(`${post.fullTitle.replace(/[<>:\"/\\\\|?*]+/g, "_")}.share.json`, JSON.stringify(post, null, 2), "application/json");
});

ui.shareImportInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const post = JSON.parse(text);

    if (containsBlockedWords(post.title || "") || containsBlockedWords(post.source || "")) {
      throw new Error("blocked");
    }

    if (!looksLikeScript(typeof post.source === "string" ? post.source : "")) {
      throw new Error("not-script");
    }

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

ui.shareSearchInput.addEventListener("input", (event) => {
  state.shareSearchQuery = event.target.value.trim();
  renderShareBoard();
});

ui.shareSortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.shareSort = button.dataset.sort || "latest";
    renderShareBoard();
  });
});

ui.openPostComposer.addEventListener("click", () => {
  const composer = document.getElementById("postComposer");
  composer?.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    ui.shareCodeInput?.focus();
  }, 180);
});

renderShareBoard();
