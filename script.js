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
};

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

function formatLuau(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let indent = 0;
  const formatted = [];

  for (const rawLine of lines) {
    const trimmed = normaliseLine(rawLine).trim();

    if (!trimmed) {
      if (formatted.at(-1) !== "") {
        formatted.push("");
      }
      continue;
    }

    if (shouldDecreaseIndent(trimmed)) {
      indent = Math.max(indent - 1, 0);
    }

    const cleaned = trimmed
      .replace(/\s*([=+\-*/<>~])\s*/g, " $1 ")
      .replace(/\s*,\s*/g, ", ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")");

    formatted.push(`${"    ".repeat(indent)}${cleaned}`);

    if (shouldIncreaseIndent(trimmed)) {
      indent += 1;
    }
  }

  return formatted.join("\n").replace(/\n{3,}/g, "\n\n");
}

function buildSummary(content) {
  const lineCount = content.split(/\r?\n/).length;
  const functionCount = (content.match(/\bfunction\b/g) || []).length;
  const localCount = (content.match(/\blocal\b/g) || []).length;
  return `${lineCount} lines • ${functionCount} functions • ${localCount} locals`;
}

function setCurrent(index) {
  state.currentIndex = index;
  render();
}

function renderFileList() {
  if (state.files.length === 0) {
    ui.fileList.className = "file-list empty";
    ui.fileList.textContent = "Add scripts to start.";
    return;
  }

  ui.fileList.className = "file-list";
  ui.fileList.innerHTML = "";

  state.files.forEach((file, index) => {
    const button = document.createElement("button");
    button.className = `file-item${index === state.currentIndex ? " active" : ""}`;
    button.textContent = file.name;
    button.addEventListener("click", () => setCurrent(index));
    ui.fileList.appendChild(button);
  });
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
    return;
  }

  ui.currentName.textContent = current.name;
  ui.currentMeta.textContent = buildSummary(current.source);
  ui.sourceView.textContent = current.source;
  ui.outputView.textContent = current.output;
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
    });
  }

  state.files = entries;
  state.currentIndex = entries.length > 0 ? 0 : -1;
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

render();
