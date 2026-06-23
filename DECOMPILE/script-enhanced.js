const state = {
  files: [],
  currentIndex: -1,
};

const ui = {
  fileInput: document.getElementById("fileInput"),
  fileList: document.getElementById("fileList"),
  fileCount: document.getElementById("fileCount"),
  currentName: document.getElementById("currentName"),
  currentMeta: document.getElementById("currentMeta"),
  sourceView: document.getElementById("sourceView"),
  outputView: document.getElementById("outputView"),
  copyOutput: document.getElementById("copyOutput"),
  downloadCurrent: document.getElementById("downloadCurrent"),
  downloadAll: document.getElementById("downloadAll"),
  toast: document.getElementById("toast"),
  analysisBadge: document.getElementById("analysisBadge"),
  functionCount: document.getElementById("functionCount"),
  tableCount: document.getElementById("tableCount"),
  localCount: document.getElementById("localCount"),
  commentCount: document.getElementById("commentCount"),
  functionList: document.getElementById("functionList"),
  tableList: document.getElementById("tableList"),
};

let toastTimer = null;
let copyButtonTimer = null;
const HISTORY_STORAGE_KEY = "luau-script-history";

const LUAU_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "if", "in", "local", "nil", "not", "or", "repeat", "return", "then",
  "true", "until", "while", "continue", "type", "export",
]);

const LUAU_BUILTINS = new Set([
  "game", "workspace", "script", "self", "pairs", "ipairs", "next", "print",
  "warn", "error", "require", "typeof", "Instance", "Vector3", "CFrame",
  "Color3", "Enum", "math", "string", "table", "task",
]);

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

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pushToken(tokens, type, value) {
  if (value) {
    tokens.push({ type, value });
  }
}

function tokenizeLuau(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (/\s/.test(char)) {
      let end = index + 1;
      while (end < source.length && /\s/.test(source[end])) {
        end += 1;
      }
      pushToken(tokens, "plain", source.slice(index, end));
      index = end;
      continue;
    }

    if (char === "-" && next === "-") {
      if (source.slice(index, index + 4) === "--[[") {
        const closeIndex = source.indexOf("]]", index + 4);
        const end = closeIndex === -1 ? source.length : closeIndex + 2;
        pushToken(tokens, "comment", source.slice(index, end));
        index = end;
        continue;
      }

      const newlineIndex = source.indexOf("\n", index);
      const end = newlineIndex === -1 ? source.length : newlineIndex;
      pushToken(tokens, "comment", source.slice(index, end));
      index = end;
      continue;
    }

    if (char === "\"" || char === "'") {
      const quote = char;
      let end = index + 1;

      while (end < source.length) {
        if (source[end] === "\\" && end + 1 < source.length) {
          end += 2;
          continue;
        }

        if (source[end] === quote) {
          end += 1;
          break;
        }

        end += 1;
      }

      pushToken(tokens, "string", source.slice(index, end));
      index = end;
      continue;
    }

    if (/[0-9]/.test(char)) {
      let end = index + 1;
      while (end < source.length && /[0-9._xXa-fA-F]/.test(source[end])) {
        end += 1;
      }
      pushToken(tokens, "number", source.slice(index, end));
      index = end;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let end = index + 1;
      while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) {
        end += 1;
      }

      const word = source.slice(index, end);
      if (LUAU_KEYWORDS.has(word)) {
        pushToken(tokens, "keyword", word);
      } else if (LUAU_BUILTINS.has(word)) {
        pushToken(tokens, "builtin", word);
      } else {
        pushToken(tokens, "identifier", word);
      }
      index = end;
      continue;
    }

    pushToken(tokens, "operator", char);
    index += 1;
  }

  return tokens;
}

function highlightLuau(source) {
  return tokenizeLuau(source)
    .map((token) => {
      if (token.type === "plain") {
        return escapeHtml(token.value);
      }
      return `<span class="token-${token.type}">${escapeHtml(token.value)}</span>`;
    })
    .join("");
}

function buildSummary(content) {
  const lineCount = content.split(/\r?\n/).length;
  const functionCount = (content.match(/\bfunction\b/g) || []).length;
  const localCount = (content.match(/\blocal\b/g) || []).length;
  return `${lineCount} lines - ${functionCount} functions - ${localCount} local`;
}

function saveHistory() {
  const payload = state.files.map((file) => ({
    name: file.name,
    source: file.source,
    output: file.output,
    addedAt: file.addedAt instanceof Date ? file.addedAt.toISOString() : new Date().toISOString(),
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

    state.files = parsed.map((file) => ({
      name: file.name || "Untitled",
      source: typeof file.source === "string" ? file.source : "",
      output: typeof file.output === "string" ? file.output : formatLuau(typeof file.source === "string" ? file.source : ""),
      addedAt: file.addedAt ? new Date(file.addedAt) : new Date(),
    }));

    state.currentIndex = state.files.length > 0 ? 0 : -1;
  } catch (_error) {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}

function formatHistoryTime(date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getHistoryLabel(index) {
  if (index === state.currentIndex) {
    return "Current";
  }

  if (index === 0) {
    return "Latest";
  }

  return "Recent";
}

function analyzeLuau(source) {
  const lineCount = source.split(/\r?\n/).length;
  const namedFunctionMatches = [...source.matchAll(/\b(?:local\s+)?function\s+([A-Za-z_][\w.:]*)/g)];
  const assignedFunctionMatches = [...source.matchAll(/\b(?:local\s+)?([A-Za-z_][\w.:]*)\s*=\s*function\b/g)];
  const returnedFunctionMatches = [...source.matchAll(/\breturn\s+function\b/g)];
  const tableMatches = [...source.matchAll(/\b(?:local\s+)?([A-Za-z_][\w.]*)\s*=\s*\{/g)];
  const commentCount = (source.match(/--(?!\[\[)/g) || []).length + (source.match(/--\[\[/g) || []).length;
  const locals = (source.match(/\blocal\b/g) || []).length;
  const functionNames = [
    ...namedFunctionMatches.map((match) => match[1]),
    ...assignedFunctionMatches.map((match) => match[1]),
    ...returnedFunctionMatches.map((_, index) => `anonymous_return_${index + 1}`),
  ];

  return {
    lineCount,
    functionCount: functionNames.length,
    tableCount: tableMatches.length,
    localCount: locals,
    commentCount,
    functionNames: functionNames.slice(0, 8),
    tableNames: tableMatches.map((match) => match[1]).slice(0, 8),
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

function renderAnalysis(source) {
  const analysis = analyzeLuau(source);
  ui.analysisBadge.textContent = `${analysis.lineCount} lines inspected`;
  ui.functionCount.textContent = String(analysis.functionCount);
  ui.tableCount.textContent = String(analysis.tableCount);
  ui.localCount.textContent = String(analysis.localCount);
  ui.commentCount.textContent = String(analysis.commentCount);
  renderAnalysisList(ui.functionList, analysis.functionNames, "No function detected yet.", "fn");
  renderAnalysisList(ui.tableList, analysis.tableNames, "No table detected yet.", "tbl");
}

function showToast(message) {
  if (!ui.toast) {
    return;
  }

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

function setCurrent(index) {
  state.currentIndex = index;
  render();
}

function renderFileList() {
  if (state.files.length === 0) {
    ui.fileList.className = "file-list empty";
    ui.fileList.textContent = "Add scripts to get started.";
    return;
  }

  ui.fileList.className = "file-list";
  ui.fileList.innerHTML = "";

  state.files.forEach((file, index) => {
    const button = document.createElement("button");
    button.className = `file-item${index === state.currentIndex ? " active" : ""}`;

    const entryIndex = document.createElement("span");
    entryIndex.className = "file-item-index";
    entryIndex.textContent = `#${String(index + 1).padStart(2, "0")}`;

    const name = document.createElement("span");
    name.className = "file-item-name";
    name.textContent = file.name || "Untitled";

    const meta = document.createElement("span");
    meta.className = "file-item-meta";

    const lineInfo = document.createElement("span");
    lineInfo.textContent = `${file.source.split(/\r?\n/).length} lines`;

    const pill = document.createElement("span");
    pill.className = "history-pill";
    pill.textContent = getHistoryLabel(index);

    meta.appendChild(lineInfo);
    meta.appendChild(pill);

    const time = document.createElement("span");
    time.className = "file-item-time";
    time.textContent = `Added ${formatHistoryTime(file.addedAt)}`;

    button.appendChild(name);
    button.appendChild(entryIndex);
    button.appendChild(meta);
    button.appendChild(time);
    button.addEventListener("click", () => setCurrent(index));
    ui.fileList.appendChild(button);
  });
}

function resetAnalysis() {
  ui.analysisBadge.textContent = "Waiting for a file";
  ui.functionCount.textContent = "0";
  ui.tableCount.textContent = "0";
  ui.localCount.textContent = "0";
  ui.commentCount.textContent = "0";
  renderAnalysisList(ui.functionList, [], "No function detected yet.", "fn");
  renderAnalysisList(ui.tableList, [], "No table detected yet.", "tbl");
}

function renderEditor() {
  const current = state.files[state.currentIndex];
  const hasFile = Boolean(current);

  ui.copyOutput.disabled = !hasFile;
  ui.downloadCurrent.disabled = !hasFile;
  ui.downloadAll.disabled = state.files.length === 0;
  ui.fileCount.textContent = `${state.files.length} file${state.files.length > 1 ? "s" : ""}`;

  if (!hasFile) {
    ui.currentName.textContent = "No file open";
    ui.currentMeta.textContent = "Import one or more Luau scripts.";
    ui.sourceView.textContent = "Waiting for a file...";
    ui.outputView.textContent = "The result will appear here.";
    ui.sourceView.classList.add("muted");
    ui.outputView.classList.add("muted");
    resetAnalysis();
    return;
  }

  ui.currentName.textContent = current.name;
  ui.currentMeta.textContent = buildSummary(current.source);
  ui.sourceView.classList.remove("muted");
  ui.outputView.classList.remove("muted");
  ui.sourceView.innerHTML = highlightLuau(current.source);
  ui.outputView.innerHTML = highlightLuau(current.output);
  renderAnalysis(current.source);
}

function render() {
  renderFileList();
  renderEditor();
}

async function loadFiles(fileList) {
  const entries = [];

  for (const file of fileList) {
    const source = await file.text();
    entries.push({
      name: file.name,
      source,
      output: formatLuau(source),
      addedAt: new Date(),
    });
  }

  state.files = [...entries, ...state.files];
  state.currentIndex = entries.length > 0 ? 0 : -1;
  saveHistory();
  render();
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

ui.fileInput.addEventListener("change", async (event) => {
  const { files } = event.target;
  if (!files || files.length === 0) {
    return;
  }

  await loadFiles(files);
});

ui.copyOutput.addEventListener("click", async () => {
  const current = state.files[state.currentIndex];
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
  const current = state.files[state.currentIndex];
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

loadHistory();
resetAnalysis();
render();
