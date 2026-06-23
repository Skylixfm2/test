const STORAGE_KEY = "petIconMakerConfigV2";
const PRESET_HISTORY_KEY = "petIconMakerPresetHistoryV1";

const DEFAULT_CONFIG = {
  modelAssetId: "",
  textureAssetId: "",
  iconMode: "pet",
  presetCategory: "ps99-normal",
  keyColor: "green",
  squareStroke: false,
  beforeAfter: false,
  canvasSize: 400,
  scale: 0.96,
  shiftX: 0,
  shiftY: 0,
  outlineSize: 5.5,
  outlineSoftness: 0.8,
  outerOutline: 0,
  strokeColor: "#000000",
  squareStrokeColor: "#000000",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  lightStrength: 25,
  lightSoftness: 70,
  shadowStrength: 0,
  shadowBlur: 18,
  glowStrength: 0,
  glowBlur: 25,
  backgroundBlur: 0,
  cornerRadius: 18,
  useTextureOverlay: true,
  transparentBackground: false,
  petPosition: {
    posX: 139.241,
    posY: 11.6,
    posZ: -0.8,
    rotX: -8,
    rotY: -208,
    rotZ: 0,
    zoomPercent: 108,
    liftX: 2,
    liftY: 6
  },
  hugePosition: {
    posX: 139.241,
    posY: 11.2,
    posZ: -0.4,
    rotX: -6,
    rotY: -198,
    rotZ: 0,
    zoomPercent: 97,
    liftX: 8,
    liftY: 94
  }
};

const KEY_COLORS = {
  green: "#3ab76a",
  blue: "#3d8dff",
  purple: "#8b5cf6",
  red: "#ff5a67",
  gold: "#f5b73f"
};

const PRESET_PAIRS = [
  { model: "rbxassetid://7487208023", texture: "rbxassetid://7487207683" },
  { model: "rbxassetid://9387212590", texture: "rbxassetid://9387212173" },
  { model: "rbxassetid://6768917255", texture: "" }
];

const ROBLOX_CAMERA_FOV = 70;

const PS99_AUTO_CAMERA = {
  pet: {
    posX: 139.241,
    posY: 11.6,
    posZ: -0.8,
    rotX: -8,
    rotY: -208,
    rotZ: 0,
    zoomPercent: 108,
    liftX: 2,
    liftY: 6
  },
  huge: {
    posX: 139.241,
    posY: 11.2,
    posZ: -0.4,
    rotX: -6,
    rotY: -198,
    rotZ: 0,
    zoomPercent: 97,
    liftX: 8,
    liftY: 94
  }
};

const MODE_RENDER_PRESETS = {
  pet: {
    scale: 1.05,
    shiftX: 0,
    shiftY: -6
  },
  huge: {
    scale: 2.45,
    shiftX: 0,
    shiftY: 0
  }
};

const state = {
  lastModelImage: null,
  lastTextureImage: null,
  lastModelId: "",
  lastTextureId: "",
  objFile: null,
  textureFile: null,
  objFileName: "",
  textureFileName: "",
  backgroundImageFile: null,
  backgroundImageName: "",
  objData: null,
  uploadedTextureImage: null,
  backgroundImage: null,
  spinAngle: 0,
  pointerDrag: null,
  userAdjustedCamera: false,
  presetHistoryCompact: false
};

const elements = {
  objFileInput: document.getElementById("objFileInput"),
  textureFileInput: document.getElementById("textureFileInput"),
  objFileLabel: document.getElementById("objFileLabel"),
  textureFileLabel: document.getElementById("textureFileLabel"),
  backgroundImageInput: document.getElementById("backgroundImageInput"),
  backgroundImageLabel: document.getElementById("backgroundImageLabel"),
  renderButton: document.getElementById("renderButton"),
  resetButton: document.getElementById("resetButton"),
  saveConfigButton: document.getElementById("saveConfigButton"),
  duplicatePresetButton: document.getElementById("duplicatePresetButton"),
  loadConfigInput: document.getElementById("loadConfigInput"),
  presetNameInput: document.getElementById("presetNameInput"),
  presetCategorySelect: document.getElementById("presetCategorySelect"),
  presetHistoryList: document.getElementById("presetHistoryList"),
  presetHistorySearchInput: document.getElementById("presetHistorySearchInput"),
  compactPresetHistoryButton: document.getElementById("compactPresetHistoryButton"),
  clearPresetHistoryButton: document.getElementById("clearPresetHistoryButton"),
  keyColorSelect: document.getElementById("keyColorSelect"),
  canvasSizeInput: document.getElementById("canvasSizeInput"),
  scaleInput: document.getElementById("scaleInput"),
  shiftXInput: document.getElementById("shiftXInput"),
  shiftYInput: document.getElementById("shiftYInput"),
  outlineSizeInput: document.getElementById("outlineSizeInput"),
  outlineSoftnessInput: document.getElementById("outlineSoftnessInput"),
  outlineSizeValue: document.getElementById("outlineSizeValue"),
  outlineSoftnessValue: document.getElementById("outlineSoftnessValue"),
  outerOutlineInput: document.getElementById("outerOutlineInput"),
  outerOutlineValue: document.getElementById("outerOutlineValue"),
  strokeColorInput: document.getElementById("strokeColorInput"),
  squareStrokeColorInput: document.getElementById("squareStrokeColorInput"),
  brightnessInput: document.getElementById("brightnessInput"),
  contrastInput: document.getElementById("contrastInput"),
  saturationInput: document.getElementById("saturationInput"),
  lightStrengthInput: document.getElementById("lightStrengthInput"),
  lightSoftnessInput: document.getElementById("lightSoftnessInput"),
  shadowStrengthInput: document.getElementById("shadowStrengthInput"),
  shadowBlurInput: document.getElementById("shadowBlurInput"),
  glowStrengthInput: document.getElementById("glowStrengthInput"),
  glowBlurInput: document.getElementById("glowBlurInput"),
  backgroundBlurInput: document.getElementById("backgroundBlurInput"),
  cornerRadiusInput: document.getElementById("cornerRadiusInput"),
  brightnessValue: document.getElementById("brightnessValue"),
  contrastValue: document.getElementById("contrastValue"),
  saturationValue: document.getElementById("saturationValue"),
  lightStrengthValue: document.getElementById("lightStrengthValue"),
  lightSoftnessValue: document.getElementById("lightSoftnessValue"),
  shadowStrengthValue: document.getElementById("shadowStrengthValue"),
  shadowBlurValue: document.getElementById("shadowBlurValue"),
  glowStrengthValue: document.getElementById("glowStrengthValue"),
  glowBlurValue: document.getElementById("glowBlurValue"),
  backgroundBlurValue: document.getElementById("backgroundBlurValue"),
  cornerRadiusValue: document.getElementById("cornerRadiusValue"),
  previewCanvas: document.getElementById("previewCanvas"),
  previewStage: document.getElementById("previewStage"),
  statusMessage: document.getElementById("statusMessage"),
  downloadPreviewButton: document.getElementById("downloadPreviewButton"),
  downloadOutlineOnlyButton: document.getElementById("downloadOutlineOnlyButton"),
  exportPresetCardButton: document.getElementById("exportPresetCardButton"),
  copyAssetPairButton: document.getElementById("copyAssetPairButton"),
  copyImageWithBackgroundButton: document.getElementById("copyImageWithBackgroundButton"),
  copyImageTransparentButton: document.getElementById("copyImageTransparentButton"),
  toggleSquareStrokeButton: document.getElementById("toggleSquareStrokeButton"),
  toggleBeforeAfterButton: document.getElementById("toggleBeforeAfterButton"),
  faceCenterButton: document.getElementById("faceCenterButton"),
  randomPoseButton: document.getElementById("randomPoseButton"),
  savePresetToHistoryButton: document.getElementById("savePresetToHistoryButton"),
  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmMessage: document.getElementById("confirmMessage"),
  confirmCancelButton: document.getElementById("confirmCancelButton"),
  confirmOkButton: document.getElementById("confirmOkButton"),
  modelSourceLabel: document.getElementById("modelSourceLabel"),
  textureSourceLabel: document.getElementById("textureSourceLabel"),
  showTextureOverlayInput: document.getElementById("showTextureOverlayInput"),
  transparentBackgroundInput: document.getElementById("transparentBackgroundInput"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  hugeIconToggle: document.getElementById("hugeIconToggle"),
  positionInputs: {
    pet: {
      posX: document.getElementById("petPosX"),
      posY: document.getElementById("petPosY"),
      posZ: document.getElementById("petPosZ"),
      rotX: document.getElementById("petRotX"),
      rotY: document.getElementById("petRotY"),
      rotZ: document.getElementById("petRotZ"),
      zoomPercent: document.getElementById("petZoomPercent"),
      liftX: document.getElementById("petLiftX"),
      liftY: document.getElementById("petLiftY")
    },
    huge: {
      posX: document.getElementById("petPosX"),
      posY: document.getElementById("petPosY"),
      posZ: document.getElementById("petPosZ"),
      rotX: document.getElementById("petRotX"),
      rotY: document.getElementById("petRotY"),
      rotZ: document.getElementById("petRotZ"),
      zoomPercent: document.getElementById("petZoomPercent"),
      liftX: document.getElementById("petLiftX"),
      liftY: document.getElementById("petLiftY")
    }
  },
  lookUpButton: document.getElementById("lookUpButton"),
  lookDownButton: document.getElementById("lookDownButton"),
  tiltStepInput: document.getElementById("tiltStepInput")
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setStatus(message, tone = "neutral") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.tone = tone;
}

function setPluginStatus(message, tone = "neutral") {
  if (!elements.pluginStatusMessage) return;
  elements.pluginStatusMessage.textContent = message;
  elements.pluginStatusMessage.dataset.tone = tone;
}

function isPythonServerMode() {
  return location.protocol.startsWith("http") && ["127.0.0.1", "localhost"].includes(location.hostname);
}

function hasUploadedModel() {
  return Boolean(state.objData);
}

async function checkServerHealth() {
  if (!elements.installPluginButton) return false;
  if (!isPythonServerMode()) {
    elements.installPluginButton.hidden = true;
    setPluginStatus("Public mode detected. Upload .obj + texture files here, or download the Studio plugin file separately.", "neutral");
    return false;
  }

  try {
    const response = await fetch("/api/health", { method: "GET", cache: "no-store" });
    const payload = await response.json();
    const ok = Boolean(response.ok && payload.ok);
    elements.installPluginButton.hidden = false;
    elements.installPluginButton.disabled = !ok;
    if (ok) {
      setPluginStatus("Python bridge is online. You can install the Studio plugin directly from this page.", "success");
      return true;
    }
  } catch (error) {
    // ignored
  }

  elements.installPluginButton.hidden = false;
  elements.installPluginButton.disabled = true;
  setPluginStatus("Python bridge is not reachable. Start it first, or use Download plugin file.", "warning");
  return false;
}

async function installStudioPlugin() {
  if (!elements.installPluginButton) return;
  const serverReady = await checkServerHealth();
  if (!serverReady) return;

  setPluginStatus("Installing Studio plugin...", "neutral");
  try {
    const response = await fetch("/api/install-plugin", { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Plugin install failed");
    }
    setPluginStatus(
      `Plugin installed at ${payload.installPath}. Restart Roblox Studio if it is already open.`,
      "success"
    );
  } catch (error) {
    setPluginStatus(`Plugin install failed: ${error.message}`, "error");
  }
}

function extractAssetId(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const directMatch = source.match(/(\d{4,})/);
  return directMatch ? directMatch[1] : "";
}

function buildAssetThumbnailUrl(assetId, size = 420) {
  return `https://www.roblox.com/asset-thumbnail/image?assetId=${assetId}&width=${size}&height=${size}&format=png`;
}

function resolveThumbnailUrl(assetId, size = 420) {
  if (isPythonServerMode()) {
    return `/api/thumbnail?assetId=${encodeURIComponent(assetId)}&size=${encodeURIComponent(size)}`;
  }
  return buildAssetThumbnailUrl(assetId, size);
}

function setCanvasSize(size) {
  const canvasSize = Math.max(128, Math.min(1024, Number(size) || 400));
  elements.previewCanvas.width = canvasSize;
  elements.previewCanvas.height = canvasSize;
  elements.previewStage.style.setProperty("--preview-size", `${Math.min(canvasSize, 420)}px`);
}

function syncOutlineLabels() {
  elements.outlineSizeValue.textContent = Number(elements.outlineSizeInput.value).toFixed(1);
  elements.outlineSoftnessValue.textContent = Number(elements.outlineSoftnessInput.value).toFixed(1);
  elements.outerOutlineValue.textContent = Number(elements.outerOutlineInput.value).toFixed(1);
  elements.brightnessValue.textContent = `${Math.round(Number(elements.brightnessInput.value) || 100)}%`;
  elements.contrastValue.textContent = `${Math.round(Number(elements.contrastInput.value) || 100)}%`;
  elements.saturationValue.textContent = `${Math.round(Number(elements.saturationInput.value) || 100)}%`;
  elements.lightStrengthValue.textContent = `${Math.round(Number(elements.lightStrengthInput.value) || 25)}%`;
  elements.lightSoftnessValue.textContent = `${Math.round(Number(elements.lightSoftnessInput.value) || 70)}%`;
  elements.shadowStrengthValue.textContent = `${Math.round(Number(elements.shadowStrengthInput.value) || 0)}%`;
  elements.shadowBlurValue.textContent = `${Math.round(Number(elements.shadowBlurInput.value) || 18)}%`;
  elements.glowStrengthValue.textContent = `${Math.round(Number(elements.glowStrengthInput.value) || 0)}%`;
  elements.glowBlurValue.textContent = `${Math.round(Number(elements.glowBlurInput.value) || 25)}%`;
  elements.backgroundBlurValue.textContent = `${Math.round(Number(elements.backgroundBlurInput.value) || 0)}px`;
  elements.cornerRadiusValue.textContent = `${Math.round(Number(elements.cornerRadiusInput.value) || 18)}px`;
}

function syncSquareStrokeButton(enabled = false) {
  if (!elements.toggleSquareStrokeButton) return;
  elements.toggleSquareStrokeButton.classList.toggle("is-active", Boolean(enabled));
  elements.toggleSquareStrokeButton.setAttribute("aria-pressed", enabled ? "true" : "false");
}

function syncBeforeAfterButton(enabled = false) {
  if (!elements.toggleBeforeAfterButton) return;
  elements.toggleBeforeAfterButton.classList.toggle("is-active", Boolean(enabled));
  elements.toggleBeforeAfterButton.setAttribute("aria-pressed", enabled ? "true" : "false");
}

function getCurrentConfig() {
  const iconMode = elements.hugeIconToggle?.checked ? "huge" : "pet";
  const positionSource = elements.positionInputs.pet;
  return {
    presetName: String(elements.presetNameInput.value || "").trim(),
    modelAssetId: "",
    textureAssetId: "",
    iconMode,
    presetCategory: elements.presetCategorySelect.value,
    keyColor: elements.keyColorSelect.value,
    squareStroke: elements.toggleSquareStrokeButton?.classList.contains("is-active") || false,
    beforeAfter: elements.toggleBeforeAfterButton?.classList.contains("is-active") || false,
    canvasSize: Number(elements.canvasSizeInput.value) || 400,
    scale: Number(elements.scaleInput.value) || 1,
    shiftX: Number(elements.shiftXInput.value) || 0,
    shiftY: Number(elements.shiftYInput.value) || 0,
    outlineSize: Number(elements.outlineSizeInput.value) || 0,
    outlineSoftness: Number(elements.outlineSoftnessInput.value) || 0,
    outerOutline: Number(elements.outerOutlineInput.value) || 0,
    strokeColor: elements.strokeColorInput.value || "#000000",
    squareStrokeColor: elements.squareStrokeColorInput.value || "#000000",
    brightness: Number(elements.brightnessInput.value) || 100,
    contrast: Number(elements.contrastInput.value) || 100,
    saturation: Number(elements.saturationInput.value) || 100,
    lightStrength: Number(elements.lightStrengthInput.value) || 25,
    lightSoftness: Number(elements.lightSoftnessInput.value) || 70,
    shadowStrength: Number(elements.shadowStrengthInput.value) || 0,
    shadowBlur: Number(elements.shadowBlurInput.value) || 18,
    glowStrength: Number(elements.glowStrengthInput.value) || 0,
    glowBlur: Number(elements.glowBlurInput.value) || 25,
    backgroundBlur: Number(elements.backgroundBlurInput.value) || 0,
    cornerRadius: Number(elements.cornerRadiusInput.value) || 18,
    useTextureOverlay: elements.showTextureOverlayInput.checked,
    transparentBackground: elements.transparentBackgroundInput.checked,
    petPosition: collectPositionValues("pet"),
    hugePosition: collectPositionValues("huge"),
    activePosition: {
      posX: Number(positionSource.posX.value) || 0,
      posY: Number(positionSource.posY.value) || 0,
      posZ: Number(positionSource.posZ.value) || 0,
      rotX: Number(positionSource.rotX.value) || 0,
      rotY: Number(positionSource.rotY.value) || 0,
      rotZ: Number(positionSource.rotZ.value) || 0,
      zoomPercent: Math.max(10, Number(positionSource.zoomPercent.value) || 100),
      liftX: Number(positionSource.liftX.value) || 0,
      liftY: Number(positionSource.liftY.value) || 0
    }
  };
}

function collectPositionValues(mode) {
  const inputs = elements.positionInputs[mode];
  return {
    posX: Number(inputs.posX.value) || 0,
    posY: Number(inputs.posY.value) || 0,
    posZ: Number(inputs.posZ.value) || 0,
    rotX: Number(inputs.rotX.value) || 0,
    rotY: Number(inputs.rotY.value) || 0,
    rotZ: Number(inputs.rotZ.value) || 0,
    zoomPercent: Math.max(10, Number(inputs.zoomPercent.value) || 100),
    liftX: Number(inputs.liftX.value) || 0,
    liftY: Number(inputs.liftY.value) || 0
  };
}

function getActivePositionInputGroup() {
  return elements.positionInputs.pet;
}

function formatCameraValue(value, digits = 3) {
  return String(Number(value.toFixed(digits)));
}

function getTiltStep() {
  return Math.max(0.1, Number(elements.tiltStepInput?.value) || 2);
}

function adjustTilt(direction = 1) {
  const inputs = getActivePositionInputGroup();
  const currentRotX = Number(inputs.rotX.value) || 0;
  const nextRotX = clamp(currentRotX + getTiltStep() * direction, -89, 89);
  inputs.rotX.value = formatCameraValue(nextRotX, 3);
  state.userAdjustedCamera = true;
  rerenderIfObjActive();
}

function applyAutoCameraPreset(mode) {
  const preset = PS99_AUTO_CAMERA[mode] || PS99_AUTO_CAMERA.pet;
  applyPositionValues(mode, preset);
  state.userAdjustedCamera = false;
}

function applyModeRenderPreset(mode) {
  const preset = MODE_RENDER_PRESETS[mode] || MODE_RENDER_PRESETS.pet;
  elements.scaleInput.value = preset.scale;
  elements.shiftXInput.value = preset.shiftX;
  elements.shiftYInput.value = preset.shiftY;
}

function applyConfig(config) {
  const merged = {
    ...deepClone(DEFAULT_CONFIG),
    ...config,
    petPosition: {
      ...deepClone(DEFAULT_CONFIG.petPosition),
      ...(config.petPosition || {})
    },
    hugePosition: {
      ...deepClone(DEFAULT_CONFIG.hugePosition),
      ...(config.hugePosition || {})
    }
  };

  elements.keyColorSelect.value = merged.keyColor || "green";
  elements.presetNameInput.value = merged.presetName || "";
  elements.presetCategorySelect.value = merged.presetCategory || "ps99-normal";
  syncSquareStrokeButton(Boolean(merged.squareStroke));
  syncBeforeAfterButton(Boolean(merged.beforeAfter));
  elements.canvasSizeInput.value = merged.canvasSize;
  elements.scaleInput.value = merged.scale;
  elements.shiftXInput.value = merged.shiftX;
  elements.shiftYInput.value = merged.shiftY;
  elements.outlineSizeInput.value = merged.outlineSize;
  elements.outlineSoftnessInput.value = merged.outlineSoftness;
  elements.outerOutlineInput.value = merged.outerOutline;
  elements.strokeColorInput.value = merged.strokeColor || "#000000";
  elements.squareStrokeColorInput.value = merged.squareStrokeColor || "#000000";
  elements.brightnessInput.value = merged.brightness;
  elements.contrastInput.value = merged.contrast;
  elements.saturationInput.value = merged.saturation;
  elements.lightStrengthInput.value = merged.lightStrength;
  elements.lightSoftnessInput.value = merged.lightSoftness;
  elements.shadowStrengthInput.value = merged.shadowStrength;
  elements.shadowBlurInput.value = merged.shadowBlur;
  elements.glowStrengthInput.value = merged.glowStrength;
  elements.glowBlurInput.value = merged.glowBlur;
  elements.backgroundBlurInput.value = merged.backgroundBlur;
  elements.cornerRadiusInput.value = merged.cornerRadius;
  elements.showTextureOverlayInput.checked = merged.useTextureOverlay !== false;
  elements.transparentBackgroundInput.checked = Boolean(merged.transparentBackground);
  if (elements.hugeIconToggle) {
    elements.hugeIconToggle.checked = merged.iconMode === "huge";
  }
  applyPositionValues("pet", merged.petPosition);
  setCanvasSize(merged.canvasSize);
  syncOutlineLabels();
}

function applyPositionValues(mode, values) {
  const inputs = elements.positionInputs[mode];
  Object.entries(inputs).forEach(([key, input]) => {
    input.value = values[key];
  });
}

function activateTab(tabName) {
  const availablePanels = new Set(elements.tabButtons.map((button) => button.dataset.tab));
  const safeTab = availablePanels.has(tabName) ? tabName : "pet-position";
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === safeTab);
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === safeTab);
  });
}

function getModePreset(config) {
  return config.iconMode === "huge"
    ? { scaleBoost: 2.1, defaultShiftY: 0 }
    : { scaleBoost: 1, defaultShiftY: 0 };
}

function getBasePositionForMode(mode) {
  return mode === "huge" ? DEFAULT_CONFIG.hugePosition : DEFAULT_CONFIG.petPosition;
}

function getAutoFrameTarget(config, size) {
  return config.iconMode === "huge"
    ? {
        width: size * 0.38,
        height: size * 0.38,
        centerX: size * 0.5,
        centerY: size * 0.5
      }
    : {
        width: size * 0.76,
        height: size * 0.8,
        centerX: size * 0.5,
        centerY: size * 0.52
      };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPreviewFrameRect(size, config = currentRenderConfig || DEFAULT_CONFIG) {
  const inset = Math.max(6, Math.round(size * 0.015));
  const radius = Math.max(0, Number(config?.cornerRadius ?? DEFAULT_CONFIG.cornerRadius) || 0);
  return {
    x: inset,
    y: inset,
    width: size - inset * 2,
    height: size - inset * 2,
    radius
  };
}

function beginRoundedRectPath(ctx, rect) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, rect.radius);
}

function clipToPreviewFrame(ctx, size, config = currentRenderConfig || DEFAULT_CONFIG) {
  const rect = getPreviewFrameRect(size, config);
  ctx.save();
  beginRoundedRectPath(ctx, rect);
  ctx.clip();
  return rect;
}

function hasTexturePreview() {
  return Boolean(state.uploadedTextureImage);
}

function getVisibleTargetBox(config, size) {
  return config.iconMode === "huge"
    ? {
        width: size * 0.42,
        height: size * 0.42,
        centerX: size * 0.5,
        centerY: size * 0.5
      }
    : {
        width: size * 0.78,
        height: size * 0.86,
        centerX: size * 0.5,
        centerY: size * 0.56
      };
}

function measureVisibleContentBox(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = pixels[index + 3];
      if (alpha < 12) continue;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const greenish = g > 120 && g > r * 1.08 && g > b * 1.04;
      if (greenish) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function projectObjPoint(point, cameraDistance) {
  const depth = cameraDistance - point.z;
  const focalLength = 1 / Math.tan((ROBLOX_CAMERA_FOV * Math.PI / 180) / 2);
  const perspective = focalLength / Math.max(0.2, depth);
  return {
    x: point.x * perspective,
    y: -point.y * perspective,
    depth
  };
}

function drawCheckerKeyBackground(ctx, size, colorValue) {
  ctx.fillStyle = colorValue;
  ctx.fillRect(0, 0, size, size);
  const shade = "rgba(255, 255, 255, 0.08)";
  const tile = Math.max(16, Math.round(size / 10));
  ctx.fillStyle = shade;
  for (let y = 0; y < size; y += tile) {
    for (let x = (Math.floor(y / tile) % 2) * tile; x < size; x += tile * 2) {
      ctx.fillRect(x, y, tile, tile);
    }
  }

}

function drawBackgroundLayer(ctx, size, config) {
  if (state.backgroundImage) {
    ctx.save();
    if ((Number(config.backgroundBlur) || 0) > 0) {
      ctx.filter = `blur(${Number(config.backgroundBlur) || 0}px)`;
    }
    ctx.drawImage(state.backgroundImage, 0, 0, size, size);
    ctx.restore();
    return;
  }

  drawCheckerKeyBackground(ctx, size, KEY_COLORS[config.keyColor] || KEY_COLORS.green);
  const blur = Number(config.backgroundBlur) || 0;
  if (blur > 0) {
    const snapshot = document.createElement("canvas");
    snapshot.width = size;
    snapshot.height = size;
    const snapshotCtx = snapshot.getContext("2d");
    snapshotCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(snapshot, 0, 0);
    ctx.restore();
  }
}

function drawSquareStrokeOverlay(ctx, size, config = currentRenderConfig || DEFAULT_CONFIG) {
  const rect = getPreviewFrameRect(size, config);
  const lineWidth = Math.max(6, Math.round(size * 0.018));
  ctx.save();
  ctx.strokeStyle = config.squareStrokeColor || "#000000";
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.roundRect(
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    rect.radius
  );
  ctx.stroke();
  ctx.restore();
}

function applyShadowAndGlow(ctx, imageCanvas, config, size) {
  const shadowStrength = (Number(config.shadowStrength) || 0) / 100;
  const glowStrength = (Number(config.glowStrength) || 0) / 100;
  if (shadowStrength <= 0 && glowStrength <= 0) return;

  const shadowBlur = Math.max(0, Number(config.shadowBlur) || 0) * 0.5;
  const glowBlur = Math.max(0, Number(config.glowBlur) || 0) * 0.55;

  if (shadowStrength > 0) {
    ctx.save();
    ctx.globalAlpha = 0.12 + shadowStrength * 0.55;
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = Math.max(2, shadowBlur);
    ctx.shadowOffsetY = Math.max(4, shadowBlur * 0.7);
    ctx.drawImage(imageCanvas, 0, 0, size, size);
    ctx.restore();
  }

  if (glowStrength > 0) {
    ctx.save();
    ctx.globalAlpha = 0.1 + glowStrength * 0.35;
    ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
    ctx.shadowBlur = Math.max(2, glowBlur);
    ctx.drawImage(imageCanvas, 0, 0, size, size);
    ctx.restore();
  }
}

function drawOutline(ctx, image, x, y, width, height, outlineSize, softness) {
  if (!outlineSize) return;
  const blur = Math.max(0.4, softness * 1.4);
  const strokeColor = currentRenderConfig?.strokeColor || "#000000";
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = outlineSize + blur;
  ctx.globalAlpha = 0.95;
  ctx.tintColor = strokeColor;
  const offsets = [
    [-outlineSize, 0], [outlineSize, 0], [0, -outlineSize], [0, outlineSize],
    [-outlineSize * 0.7, -outlineSize * 0.7], [outlineSize * 0.7, -outlineSize * 0.7],
    [-outlineSize * 0.7, outlineSize * 0.7], [outlineSize * 0.7, outlineSize * 0.7]
  ];
  offsets.forEach(([offsetX, offsetY]) => {
    ctx.drawImage(image, x + offsetX, y + offsetY, width, height);
  });
  ctx.restore();
}

function createSolidSilhouetteCanvas(sourceCanvas) {
  const silhouetteCanvas = document.createElement("canvas");
  silhouetteCanvas.width = sourceCanvas.width;
  silhouetteCanvas.height = sourceCanvas.height;
  const silhouetteCtx = silhouetteCanvas.getContext("2d");
  silhouetteCtx.clearRect(0, 0, silhouetteCanvas.width, silhouetteCanvas.height);
  silhouetteCtx.drawImage(sourceCanvas, 0, 0);
  silhouetteCtx.globalCompositeOperation = "source-in";
  silhouetteCtx.fillStyle = "#000";
  silhouetteCtx.fillRect(0, 0, silhouetteCanvas.width, silhouetteCanvas.height);
  silhouetteCtx.globalCompositeOperation = "source-over";
  return silhouetteCanvas;
}

function drawSilhouetteEdges(ctx, stageCanvas, outerOutline, softness = 0.8) {
  if (!outerOutline || outerOutline <= 0) return;

  const silhouetteCanvas = createSolidSilhouetteCanvas(stageCanvas);
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = stageCanvas.width;
  outlineCanvas.height = stageCanvas.height;
  const outlineCtx = outlineCanvas.getContext("2d");
  const radius = Math.max(1, outerOutline);
  const blur = Math.max(0, softness * 1.2);
  const steps = Math.max(12, Math.ceil(radius * 10));

  outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
  outlineCtx.save();
  outlineCtx.filter = blur > 0 ? `blur(${blur}px)` : "none";
  outlineCtx.globalAlpha = 1;

  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    outlineCtx.drawImage(silhouetteCanvas, offsetX, offsetY);
  }

  outlineCtx.restore();
  outlineCtx.globalCompositeOperation = "destination-out";
  outlineCtx.drawImage(silhouetteCanvas, 0, 0);
  outlineCtx.globalCompositeOperation = "source-over";

  ctx.drawImage(outlineCanvas, 0, 0);
}

function updateUploadLabels() {
  elements.objFileLabel.textContent = state.objFileName || "No OBJ selected";
  elements.textureFileLabel.textContent = state.textureFileName || "No PNG selected";
  if (elements.backgroundImageLabel) {
    elements.backgroundImageLabel.textContent = state.backgroundImageName || "No background selected";
  }
}

async function readFileText(file) {
  return await file.text();
}

function parseObj(text) {
  const vertices = [];
  const uvs = [];
  const faces = [];
  const lines = String(text || "").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("v ")) {
      const [, x, y, z] = line.split(/\s+/);
      vertices.push({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });
      continue;
    }
    if (line.startsWith("vt ")) {
      const [, u, v] = line.split(/\s+/);
      uvs.push({ u: Number(u) || 0, v: Number(v) || 0 });
      continue;
    }
    if (line.startsWith("f ")) {
      const parts = line.slice(2).trim().split(/\s+/);
      const refs = parts.map((part) => {
        const [vertexIndex, uvIndex] = part.split("/");
        return {
          vertexIndex: Number(vertexIndex) - 1,
          uvIndex: uvIndex ? Number(uvIndex) - 1 : -1
        };
      }).filter((ref) => Number.isInteger(ref.vertexIndex) && ref.vertexIndex >= 0);
      for (let i = 1; i < refs.length - 1; i += 1) {
        faces.push([refs[0], refs[i], refs[i + 1]]);
      }
    }
  }
  if (!vertices.length || !faces.length) {
    throw new Error("This OBJ file has no readable vertices/faces.");
  }
  return { vertices, uvs, faces };
}

function vectorSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function normalizeVector(v) {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function rotateVertex(vertex, rx, ry, rz) {
  let { x, y, z } = vertex;
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  let nx = x * cosY + z * sinY;
  let nz = -x * sinY + z * cosY;
  x = nx;
  z = nz;
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  let ny = y * cosX - z * sinX;
  nz = y * sinX + z * cosX;
  y = ny;
  z = nz;
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  nx = x * cosZ - y * sinZ;
  ny = x * sinZ + y * cosZ;
  return { x: nx, y: ny, z };
}

function applyCameraView(point, cameraPosition, cameraRotation) {
  const translated = {
    x: point.x - cameraPosition.x,
    y: point.y - cameraPosition.y,
    z: point.z - cameraPosition.z
  };
  return rotateVertex(
    translated,
    -cameraRotation.x,
    -cameraRotation.y,
    -cameraRotation.z
  );
}

function getUploadedTexturePattern(ctx) {
  if (!state.uploadedTextureImage) return null;
  return ctx.createPattern(state.uploadedTextureImage, "repeat");
}

function drawTexturedTriangle(ctx, image, screenPoints, uvPoints, light) {
  const [p0, p1, p2] = screenPoints;
  const [uv0, uv1, uv2] = uvPoints;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) return false;
  if (!uv0 || !uv1 || !uv2) return false;

  const sx0 = uv0.u * width;
  const sy0 = (1 - uv0.v) * height;
  const sx1 = uv1.u * width;
  const sy1 = (1 - uv1.v) * height;
  const sx2 = uv2.u * width;
  const sy2 = (1 - uv2.v) * height;

  const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (Math.abs(denom) < 0.00001) return false;

  const m11 = (p0.x * (sy1 - sy2) + p1.x * (sy2 - sy0) + p2.x * (sy0 - sy1)) / denom;
  const m12 = (p0.x * (sx2 - sx1) + p1.x * (sx0 - sx2) + p2.x * (sx1 - sx0)) / denom;
  const m21 = (p0.y * (sy1 - sy2) + p1.y * (sy2 - sy0) + p2.y * (sy0 - sy1)) / denom;
  const m22 = (p0.y * (sx2 - sx1) + p1.y * (sx0 - sx2) + p2.y * (sx1 - sx0)) / denom;
  const dx = (p0.x * (sx1 * sy2 - sx2 * sy1) + p1.x * (sx2 * sy0 - sx0 * sy2) + p2.x * (sx0 * sy1 - sx1 * sy0)) / denom;
  const dy = (p0.y * (sx1 * sy2 - sx2 * sy1) + p1.y * (sx2 * sy0 - sx0 * sy2) + p2.y * (sx0 * sy1 - sx1 * sy0)) / denom;
  const centerX = (p0.x + p1.x + p2.x) / 3;
  const centerY = (p0.y + p1.y + p2.y) / 3;
  const expand = 0.8;
  const expandedPoints = [p0, p1, p2].map((point) => {
    const vx = point.x - centerX;
    const vy = point.y - centerY;
    const length = Math.hypot(vx, vy) || 1;
    return {
      x: point.x + (vx / length) * expand,
      y: point.y + (vy / length) * expand
    };
  });
  const [ep0, ep1, ep2] = expandedPoints;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ep0.x, ep0.y);
  ctx.lineTo(ep1.x, ep1.y);
  ctx.lineTo(ep2.x, ep2.y);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(m11, m21, m12, m22, dx, dy);
  ctx.globalAlpha = 1;
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  if ((currentRenderConfig?.outlineSize || 0) <= 0) {
    return true;
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${light * 0.045})`;
  ctx.fill();
  ctx.restore();
  return true;
}

let currentRenderConfig = null;
let confirmAction = null;

function openConfirmModal(title, message, onConfirm) {
  confirmAction = onConfirm;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmModal.hidden = false;
}

function closeConfirmModal() {
  elements.confirmModal.hidden = true;
  confirmAction = null;
}

function readPresetHistory() {
  try {
    const raw = localStorage.getItem(PRESET_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writePresetHistory(history) {
  localStorage.setItem(PRESET_HISTORY_KEY, JSON.stringify(history));
}

function upsertPresetHistory(config) {
  const presetName = String(config.presetName || "").trim() || "untitled-preset";
  const storedConfig = {
    ...config,
    modelAssetId: "",
    textureAssetId: ""
  };
  const history = readPresetHistory().filter((item) => item.name !== presetName);
  history.unshift({
    name: presetName,
    savedAt: Date.now(),
    config: storedConfig
  });
  writePresetHistory(history.slice(0, 20));
  renderPresetHistory();
}

function renderPresetHistory() {
  if (!elements.presetHistoryList) return;
  const history = readPresetHistory();
  const query = (elements.presetHistorySearchInput?.value || "").trim().toLowerCase();
  const filteredHistory = !query
    ? history
    : history.filter((item) => {
        const name = String(item.name || "").toLowerCase();
        const category = String(item.config?.presetCategory || "").toLowerCase();
        return name.includes(query) || category.includes(query);
      });
  if (!history.length) {
    elements.presetHistoryList.className = "preset-history-list empty-list";
    elements.presetHistoryList.textContent = "No presets saved yet.";
    return;
  }
  if (!filteredHistory.length) {
    elements.presetHistoryList.className = "preset-history-list empty-list";
    elements.presetHistoryList.textContent = "No matching icon presets.";
    return;
  }

  elements.presetHistoryList.className = "preset-history-list";
  elements.presetHistoryList.classList.toggle("compact-mode", Boolean(state.presetHistoryCompact));
  elements.compactPresetHistoryButton?.classList.toggle("is-active", Boolean(state.presetHistoryCompact));
  elements.presetHistoryList.innerHTML = filteredHistory.map((item) => {
    const stamp = new Date(item.savedAt || Date.now()).toLocaleString();
    return `
      <article class="preset-history-card" data-preset-name="${item.name}">
        <div class="preset-history-card-top">
          <div>
            <strong>${item.name}</strong>
            <div class="preset-history-category">${item.config?.presetCategory || "ps99-normal"}</div>
          </div>
          <span>${stamp}</span>
        </div>
        <div class="preset-history-card-actions">
          <button type="button" data-action="apply" data-preset-name="${item.name}">Apply</button>
          <button type="button" data-action="duplicate" data-preset-name="${item.name}">Duplicate</button>
          <button type="button" data-action="delete" data-preset-name="${item.name}" class="ghost-delete">Remove</button>
        </div>
      </article>
    `;
  }).join("");
}

function applyHistoryPreset(name) {
  const history = readPresetHistory();
  const match = history.find((item) => item.name === name);
  if (!match) return;
  applyConfig(match.config);
  renderCurrent();
  setStatus(`Preset "${name}" applied.`, "success");
}

function deleteHistoryPreset(name) {
  const history = readPresetHistory().filter((item) => item.name !== name);
  writePresetHistory(history);
  renderPresetHistory();
  setStatus(`Preset "${name}" removed.`, "success");
}

function duplicateHistoryPreset(name) {
  const history = readPresetHistory();
  const match = history.find((item) => item.name === name);
  if (!match) return;
  const nextConfig = {
    ...match.config,
    presetName: `${name} copy`
  };
  upsertPresetHistory(nextConfig);
  elements.presetNameInput.value = nextConfig.presetName;
  setStatus(`Preset "${name}" duplicated.`, "success");
}

function applyCanvasTone(ctx, size, config) {
  const brightness = (Number(config.brightness) || 100) / 100;
  const contrast = (Number(config.contrast) || 100) / 100;
  const saturation = (Number(config.saturation) || 100) / 100;

  if (
    Math.abs(brightness - 1) < 0.001 &&
    Math.abs(contrast - 1) < 0.001 &&
    Math.abs(saturation - 1) < 0.001
  ) {
    return;
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = size;
  tempCanvas.height = size;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(ctx.canvas, 0, 0, size, size);

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  ctx.drawImage(tempCanvas, 0, 0, size, size);
  ctx.restore();
}

function renderUploadedObj(config, targetCanvas = elements.previewCanvas, updateUi = true) {
  currentRenderConfig = config;
  const ctx = targetCanvas.getContext("2d");
  const size = targetCanvas.width;
  const stageCanvas = document.createElement("canvas");
  stageCanvas.width = size;
  stageCanvas.height = size;
  const stageCtx = stageCanvas.getContext("2d");
  stageCtx.clearRect(0, 0, size, size);
  ctx.clearRect(0, 0, size, size);
  const effectCanvas = document.createElement("canvas");
  effectCanvas.width = size;
  effectCanvas.height = size;
  const effectCtx = effectCanvas.getContext("2d");

  const data = state.objData;
  if (!data) {
    throw new Error("No OBJ data loaded.");
  }

  const vertices = data.vertices.map((vertex) => ({ ...vertex }));
  const bounds = {
    minX: Math.min(...vertices.map((v) => v.x)),
    maxX: Math.max(...vertices.map((v) => v.x)),
    minY: Math.min(...vertices.map((v) => v.y)),
    maxY: Math.max(...vertices.map((v) => v.y)),
    minZ: Math.min(...vertices.map((v) => v.z)),
    maxZ: Math.max(...vertices.map((v) => v.z))
  };
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2
  };
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ) || 1;
  const preset = getModePreset(config);
  const basePosition = getBasePositionForMode(config.iconMode);
  const posDeltaX = (config.activePosition.posX || 0) - basePosition.posX;
  const posDeltaY = (config.activePosition.posY || 0) - basePosition.posY;
  const posDeltaZ = (config.activePosition.posZ || 0) - basePosition.posZ;
  const cameraRotation = {
    x: (config.activePosition.rotX || 0) * Math.PI / 180,
    y: (config.activePosition.rotY || 0) * Math.PI / 180,
    z: (config.activePosition.rotZ || 0) * Math.PI / 180
  };
  const cameraPosition = {
    x: posDeltaX * span * 0.01,
    y: posDeltaY * span * 0.01,
    z: posDeltaZ * span * 0.02
  };
  const zoomBias = Math.max(-1.2, Math.min(2, posDeltaZ * 0.008));
  const baseCameraDistance = Math.max(10.5, Math.min(30, 16.2 - zoomBias));
  const manualZoom = Math.max(0.1, (config.activePosition.zoomPercent || 100) / 100);
  const manualLiftX = Number(config.activePosition.liftX) || 0;
  const manualLiftY = Number(config.activePosition.liftY) || 0;
  const pattern = getUploadedTexturePattern(stageCtx);
  const rawTriangles = [];
  const projectedPoints = [];
  const shiftedVertices = [];

  for (const face of data.faces) {
    const a = vectorSub(vertices[face[0].vertexIndex], center);
    const b = vectorSub(vertices[face[1].vertexIndex], center);
    const c = vectorSub(vertices[face[2].vertexIndex], center);
    const ab = vectorSub(b, a);
    const ac = vectorSub(c, a);
    const normal = normalizeVector(cross(ab, ac));
    const shiftedA = applyCameraView(a, cameraPosition, cameraRotation);
    const shiftedB = applyCameraView(b, cameraPosition, cameraRotation);
    const shiftedC = applyCameraView(c, cameraPosition, cameraRotation);
    const lightStrength = (Number(config.lightStrength) || 25) / 100;
    const lightSoftness = (Number(config.lightSoftness) || 70) / 100;
    const light = Math.max(
      0.55 + lightSoftness * 0.25,
      normal.z * (0.08 + lightStrength * 0.3) + (0.78 + lightSoftness * 0.16)
    );
    const averageZ = (shiftedA.z + shiftedB.z + shiftedC.z) / 3;
    shiftedVertices.push(shiftedA, shiftedB, shiftedC);
    rawTriangles.push({
      refs: [
        face[0].vertexIndex,
        face[1].vertexIndex,
        face[2].vertexIndex
      ],
      shiftedPoints: [shiftedA, shiftedB, shiftedC],
      uvs: [
        data.uvs[face[0].uvIndex] || null,
        data.uvs[face[1].uvIndex] || null,
        data.uvs[face[2].uvIndex] || null
      ],
      averageZ,
      light
    });
  }

  const maxShiftedZ = Math.max(...shiftedVertices.map((point) => point.z));
  const cameraDistance = Math.max(baseCameraDistance, maxShiftedZ + 9.2);

  for (const triangle of rawTriangles) {
    const [shiftedA, shiftedB, shiftedC] = triangle.shiftedPoints;
    const p1 = projectObjPoint(shiftedA, cameraDistance);
    const p2 = projectObjPoint(shiftedB, cameraDistance);
    const p3 = projectObjPoint(shiftedC, cameraDistance);
    projectedPoints.push(p1, p2, p3);
    triangle.points = [p1, p2, p3];
  }

  const minX = Math.min(...projectedPoints.map((point) => point.x));
  const maxX = Math.max(...projectedPoints.map((point) => point.x));
  const minY = Math.min(...projectedPoints.map((point) => point.y));
  const maxY = Math.max(...projectedPoints.map((point) => point.y));
  const frameWidth = Math.max(0.001, maxX - minX);
  const frameHeight = Math.max(0.001, maxY - minY);
  const autoFrame = getAutoFrameTarget(config, size);
  const autoScale =
    Math.min(autoFrame.width / frameWidth, autoFrame.height / frameHeight) *
    config.scale *
    preset.scaleBoost *
    manualZoom;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const triangles = [];

  for (const triangle of rawTriangles) {
    const project = (point) => ({
      x: autoFrame.centerX + (point.x - centerX) * autoScale + config.shiftX + manualLiftX,
      y: autoFrame.centerY + (point.y - centerY) * autoScale + config.shiftY + preset.defaultShiftY - manualLiftY
    });
    triangles.push({
      refs: triangle.refs,
      points: triangle.points.map(project),
      uvs: triangle.uvs,
      averageZ: triangle.averageZ,
      light: triangle.light
    });
  }

  triangles.sort((left, right) => left.averageZ - right.averageZ);
  const textured = Boolean((pattern || state.uploadedTextureImage) && config.useTextureOverlay);
  const outlineOpacity = textured
    ? Math.max(0.04, 0.2 - config.outlineSoftness * 0.012)
    : Math.max(0.02, 0.08 - config.outlineSoftness * 0.01);
  const outlineWidth = textured
    ? Math.max(0.25, config.outlineSize * 0.11)
    : Math.max(0.12, config.outlineSize * 0.09);
  const outlineColor = config.strokeColor || "#000000";
  let finalTriangles = triangles;

  const drawTriangles = (extraScale = 1, extraShiftX = 0, extraShiftY = 0) => {
    stageCtx.clearRect(0, 0, size, size);
    finalTriangles = triangles.map((triangle) => ({
      ...triangle,
      points: triangle.points.map((point) => ({
        x: (point.x - size / 2) * extraScale + size / 2 + extraShiftX,
        y: (point.y - size / 2) * extraScale + size / 2 + extraShiftY
      }))
    }));
    for (const triangle of finalTriangles) {
      const adjustedPoints = triangle.points;
      const [p1, p2, p3] = adjustedPoints;
      const texturedTriangle = Boolean(
        textured &&
        state.uploadedTextureImage &&
        triangle.uvs[0] &&
        triangle.uvs[1] &&
        triangle.uvs[2]
      );
      stageCtx.beginPath();
      stageCtx.moveTo(p1.x, p1.y);
      stageCtx.lineTo(p2.x, p2.y);
      stageCtx.lineTo(p3.x, p3.y);
      stageCtx.closePath();

      if (texturedTriangle) {
        drawTexturedTriangle(stageCtx, state.uploadedTextureImage, adjustedPoints, triangle.uvs, triangle.light);
      } else if (pattern && config.useTextureOverlay) {
        stageCtx.save();
        stageCtx.clip();
        stageCtx.globalAlpha = 0.985;
        stageCtx.fillStyle = pattern;
        stageCtx.fillRect(0, 0, size, size);
        stageCtx.restore();
        stageCtx.fillStyle = `rgba(255,255,255,${triangle.light * 0.05})`;
        stageCtx.fill();
      } else {
        const tone = Math.round(178 + triangle.light * 34);
        stageCtx.fillStyle = `rgb(${tone}, ${tone}, ${tone})`;
        stageCtx.fill();
      }

      if (config.outlineSize > 0) {
        stageCtx.strokeStyle = outlineColor.startsWith("#")
          ? `${outlineColor}${Math.round(outlineOpacity * 255).toString(16).padStart(2, "0")}`
          : outlineColor;
        stageCtx.lineWidth = outlineWidth;
        stageCtx.stroke();
      }
    }
  };

  drawTriangles();

  const measuredBox = measureVisibleContentBox(stageCtx, size, size);
  if (measuredBox && !state.userAdjustedCamera) {
    const targetBox = getVisibleTargetBox(config, size);
    const correctionScale = clamp(
      Math.min(targetBox.width / measuredBox.width, targetBox.height / measuredBox.height),
      1,
      config.iconMode === "huge" ? 2.6 : 1.22
    );
    const correctionShiftX = targetBox.centerX - measuredBox.centerX;
    const correctionShiftY = targetBox.centerY - measuredBox.centerY;
    if (correctionScale > 1.02 || Math.abs(correctionShiftX) > 4 || Math.abs(correctionShiftY) > 4) {
      drawTriangles(correctionScale, correctionShiftX, correctionShiftY);
    }
  }

  if (!config.transparentBackground) {
    clipToPreviewFrame(ctx, size, config);
    drawBackgroundLayer(ctx, size, config);
    ctx.restore();
  } else {
    ctx.clearRect(0, 0, size, size);
  }
  clipToPreviewFrame(effectCtx, size, config);
  drawSilhouetteEdges(effectCtx, stageCanvas, config.outerOutline, config.outlineSoftness);
  effectCtx.drawImage(stageCanvas, 0, 0, size, size);
  effectCtx.restore();
  applyShadowAndGlow(ctx, effectCanvas, config, size);
  ctx.drawImage(effectCanvas, 0, 0, size, size);
  if (config.squareStroke) {
    drawSquareStrokeOverlay(ctx, size, config);
  }
  applyCanvasTone(ctx, size, config);
  if (!updateUi) {
    return;
  }
  elements.modelSourceLabel.textContent = `Uploaded OBJ • ${state.objFileName}`;
  elements.textureSourceLabel.textContent = state.textureFileName
    ? `Uploaded texture • ${state.textureFileName}`
    : "No texture uploaded";
  setStatus("Preview ready from uploaded OBJ + texture files.", "success");
}

function rerenderIfObjActive() {
  if (!hasUploadedModel()) return;
  try {
    renderUploadedObj(getCurrentConfig());
  } catch (error) {
    setStatus(`Uploaded OBJ render failed: ${error.message}`, "error");
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

function choosePrimaryImage(modelImage, textureImage) {
  return modelImage || textureImage || null;
}

async function renderCurrent() {
  const config = getCurrentConfig();
  const modelId = extractAssetId(config.modelAssetId);
  const textureId = extractAssetId(config.textureAssetId);

  if (hasUploadedModel()) {
    try {
      renderUploadedObj(config);
      return;
    } catch (error) {
      setStatus(`Uploaded OBJ render failed: ${error.message}`, "error");
      return;
    }
  }

  if (!modelId && !textureId) {
    setStatus("Enter at least one Roblox asset ID, or upload an OBJ first.", "error");
    return;
  }

  if (!isPythonServerMode()) {
    setStatus("Public mode: Roblox IDs may fail. OBJ + texture upload is the most reliable workflow here.", "warning");
  }

  setCanvasSize(config.canvasSize);
  const ctx = elements.previewCanvas.getContext("2d");
  const canvasSize = elements.previewCanvas.width;
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  const imageLayerCanvas = document.createElement("canvas");
  imageLayerCanvas.width = canvasSize;
  imageLayerCanvas.height = canvasSize;
  const imageLayerCtx = imageLayerCanvas.getContext("2d");

  if (!config.transparentBackground) {
    clipToPreviewFrame(ctx, canvasSize, config);
    drawBackgroundLayer(ctx, canvasSize, config);
    ctx.restore();
  } else {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
  }

  setStatus("Rendering pet icon preview...", "neutral");

  let modelImage = null;
  let textureImage = null;
  const loadErrors = [];

  if (modelId) {
    try {
      const modelUrl = resolveThumbnailUrl(modelId, 420);
      modelImage = await loadImage(modelUrl);
      state.lastModelId = modelId;
      state.lastModelImage = modelImage;
    } catch (error) {
      loadErrors.push("3D asset thumbnail could not be loaded.");
    }
  }

  if (textureId) {
    try {
      const textureUrl = resolveThumbnailUrl(textureId, 420);
      textureImage = await loadImage(textureUrl);
      state.lastTextureId = textureId;
      state.lastTextureImage = textureImage;
    } catch (error) {
      loadErrors.push("Texture thumbnail could not be loaded.");
    }
  }

  const primaryImage = choosePrimaryImage(modelImage, textureImage);
  if (!primaryImage) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    setStatus(
      loadErrors[0] || "Nothing could be rendered from those IDs. Use the Python server and public Roblox asset IDs.",
      "error"
    );
    updateSourceLabels(modelId, textureId, false, false);
    return;
  }

  const preset = getModePreset(config);
  const effectiveScale = config.scale * preset.scaleBoost;
  const drawWidth = canvasSize * effectiveScale;
  const drawHeight = canvasSize * effectiveScale;
  const drawX = (canvasSize - drawWidth) / 2 + config.shiftX;
  const drawY = (canvasSize - drawHeight) / 2 + config.shiftY + preset.defaultShiftY;

  clipToPreviewFrame(imageLayerCtx, canvasSize, config);
  drawOutline(imageLayerCtx, primaryImage, drawX, drawY, drawWidth, drawHeight, config.outlineSize, config.outlineSoftness);
  imageLayerCtx.drawImage(primaryImage, drawX, drawY, drawWidth, drawHeight);

  if (config.useTextureOverlay && textureImage && modelImage) {
    imageLayerCtx.save();
    imageLayerCtx.globalAlpha = 0.38;
    imageLayerCtx.globalCompositeOperation = "screen";
    imageLayerCtx.drawImage(textureImage, drawX, drawY, drawWidth, drawHeight);
    imageLayerCtx.restore();
  }
  imageLayerCtx.restore();

  if (config.beforeAfter) {
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = canvasSize;
    baseCanvas.height = canvasSize;
    const baseCtx = baseCanvas.getContext("2d");
    if (!config.transparentBackground) {
      clipToPreviewFrame(baseCtx, canvasSize, config);
      drawBackgroundLayer(baseCtx, canvasSize, { ...config, backgroundBlur: 0 });
      baseCtx.restore();
    }
    clipToPreviewFrame(baseCtx, canvasSize, config);
    baseCtx.drawImage(primaryImage, drawX, drawY, drawWidth, drawHeight);
    baseCtx.restore();

    applyShadowAndGlow(ctx, imageLayerCanvas, config, canvasSize);
    ctx.drawImage(baseCanvas, 0, 0, canvasSize / 2, canvasSize, 0, 0, canvasSize / 2, canvasSize);
    ctx.drawImage(imageLayerCanvas, canvasSize / 2, 0, canvasSize / 2, canvasSize, canvasSize / 2, 0, canvasSize / 2, canvasSize);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.stroke();
    ctx.restore();
  } else {
    applyShadowAndGlow(ctx, imageLayerCanvas, config, canvasSize);
    ctx.drawImage(imageLayerCanvas, 0, 0, canvasSize, canvasSize);
  }

  if (config.squareStroke) {
    drawSquareStrokeOverlay(ctx, canvasSize, config);
  }

  applyCanvasTone(ctx, canvasSize, config);

  updateSourceLabels(modelId, textureId, Boolean(modelImage), Boolean(textureImage));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  if (loadErrors.length) {
    setStatus(`Preview rendered with partial data. ${loadErrors.join(" ")}`, "warning");
    return;
  }

  setStatus(`Preview ready. ${config.iconMode === "huge" ? "Huge" : "Pet"} icon mode active.`, "success");
}

function updateSourceLabels(modelId, textureId, modelLoaded, textureLoaded) {
  elements.modelSourceLabel.textContent = modelId
    ? `${modelLoaded ? "Loaded" : "Missing"} • ${modelId}`
    : "No model loaded";
  elements.textureSourceLabel.textContent = textureId
    ? `${textureLoaded ? "Loaded" : "Missing"} • ${textureId}`
    : "No texture loaded";
}

function buildExportName(suffix = "pet-icon") {
  return `${(state.objFileName || suffix).replace(/\.[^.]+$/, "")}-${Date.now()}`;
}

function triggerCanvasDownload(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function renderToExportCanvas(baseConfig) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = elements.previewCanvas.width;
  exportCanvas.height = elements.previewCanvas.height;

  try {
    if (hasUploadedModel()) {
      renderUploadedObj(baseConfig, exportCanvas, false);
    } else {
      const previousCanvas = elements.previewCanvas;
      const previousTransparent = elements.transparentBackgroundInput.checked;
      try {
        elements.previewCanvas = exportCanvas;
        elements.transparentBackgroundInput.checked = Boolean(baseConfig.transparentBackground);
        await renderCurrent();
      } finally {
        elements.transparentBackgroundInput.checked = previousTransparent;
        elements.previewCanvas = previousCanvas;
      }
    }
  } finally {
    currentRenderConfig = getCurrentConfig();
  }

  return exportCanvas;
}

async function downloadCanvas() {
  try {
    const config = getCurrentConfig();
    const exportConfig = {
      ...config,
      transparentBackground: !state.backgroundImage
    };
    const canvas = await renderToExportCanvas(exportConfig);
    triggerCanvasDownload(canvas, `${buildExportName("pet-icon")}.png`);
    setStatus("PNG downloaded.", "success");
  } catch (error) {
    setStatus("The browser blocked PNG export for this preview.", "error");
  }
}

async function copyCanvasImage(mode = "with-background") {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    setStatus("Image copy is not supported in this browser.", "error");
    return;
  }

  try {
    const config = getCurrentConfig();
    const exportConfig = {
      ...config,
      transparentBackground: mode === "transparent" ? true : !state.backgroundImage
    };
    const canvas = await renderToExportCanvas(exportConfig);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      throw new Error("Clipboard image blob could not be created.");
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob
      })
    ]);
    setStatus(
      mode === "transparent" ? "Transparent image copied." : "Image with background copied.",
      "success"
    );
  } catch (error) {
    setStatus("Could not copy the image to the clipboard.", "error");
  }
}

async function downloadOutlineOnlyCanvas() {
  const config = getCurrentConfig();
  const exportConfig = {
    ...config,
    transparentBackground: true,
    squareStroke: false,
    backgroundBlur: 0,
    useTextureOverlay: config.useTextureOverlay
  };
  try {
    const canvas = await renderToExportCanvas(exportConfig);
    triggerCanvasDownload(canvas, `${buildExportName("outline-only")}.png`);
    setStatus("Outline-only export downloaded.", "success");
  } catch (error) {
    setStatus("Outline-only export failed.", "error");
  }
}

function copyAssetPair() {
  const payload = `OBJ: ${state.objFileName || "none"}\nTexture: ${state.textureFileName || "none"}`;
  navigator.clipboard.writeText(payload)
    .then(() => setStatus("Uploaded file names copied.", "success"))
    .catch(() => setStatus("Could not copy uploaded file names.", "error"));
}

function exportPresetCard() {
  saveConfigToFile();
  downloadCanvas();
  setStatus("Preset card exported as PNG + config.", "success");
}

function saveConfigToFile() {
  const config = getCurrentConfig();
  const safeName = (config.presetName || "pet-icon-preset")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName || "pet-icon-preset"}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  upsertPresetHistory({ ...config, presetName: config.presetName || safeName });
  setStatus(`Preset saved as ${safeName || "pet-icon-preset"}.json`, "success");
}

function savePresetToHistory() {
  const config = getCurrentConfig();
  const presetName = String(config.presetName || "").trim();
  if (!presetName) {
    setStatus("Choose a preset name first.", "warning");
    return;
  }
  upsertPresetHistory(config);
  setStatus(`Parameters saved to history as "${presetName}".`, "success");
}

function duplicatePreset() {
  const currentName = String(elements.presetNameInput.value || "").trim() || "preset";
  elements.presetNameInput.value = `${currentName} copy`;
  savePresetToHistory();
}

function loadConfigFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!parsed.presetName && file?.name) {
        parsed.presetName = String(file.name).replace(/\.json$/i, "");
      }
      applyConfig(parsed);
      renderCurrent();
      setStatus("Preset loaded.", "success");
    } catch (error) {
      setStatus("That config file could not be loaded.", "error");
    }
  };
  reader.readAsText(file);
}

function resetToDefaults() {
  applyConfig(DEFAULT_CONFIG);
  applyAutoCameraPreset("pet");
  applyModeRenderPreset("pet");
  localStorage.removeItem(STORAGE_KEY);
  state.lastModelImage = null;
  state.lastTextureImage = null;
  state.objFile = null;
  state.textureFile = null;
  state.objFileName = "";
  state.textureFileName = "";
  state.backgroundImageFile = null;
  state.backgroundImageName = "";
  state.objData = null;
  state.uploadedTextureImage = null;
  state.backgroundImage = null;
  state.spinAngle = 0;
  state.pointerDrag = null;
  updateUploadLabels();
  updateSourceLabels("", "", false, false);
  const ctx = elements.previewCanvas.getContext("2d");
  ctx.clearRect(0, 0, elements.previewCanvas.width, elements.previewCanvas.height);
  setStatus("Config reset. Upload an OBJ and texture, then render again.", "neutral");
}

function restoreSavedConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    applyConfig(DEFAULT_CONFIG);
    updateSourceLabels("", "", false, false);
    return;
  }
  try {
    applyConfig(JSON.parse(raw));
    updateSourceLabels("", "", false, false);
  } catch (error) {
    applyConfig(DEFAULT_CONFIG);
    updateSourceLabels("", "", false, false);
  }
}

function handleObjUpload(file) {
  state.objFile = file || null;
  state.objFileName = file?.name || "";
  state.objData = null;
  updateUploadLabels();
  if (!file) return;
  readFileText(file)
    .then((text) => {
      state.objData = parseObj(text);
      const currentMode = elements.hugeIconToggle?.checked ? "huge" : "pet";
      applyAutoCameraPreset(currentMode);
      applyModeRenderPreset(currentMode);
      setStatus("OBJ uploaded. Auto PS99 camera applied. Drag to adjust if needed.", "success");
    })
    .catch((error) => {
      state.objFile = null;
      state.objFileName = "";
      state.objData = null;
      updateUploadLabels();
      setStatus(`OBJ upload failed: ${error.message}`, "error");
    });
}

function handleTextureUpload(file) {
  state.textureFile = file || null;
  state.textureFileName = file?.name || "";
  state.uploadedTextureImage = null;
  updateUploadLabels();
  if (!file) return;
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    state.uploadedTextureImage = image;
    setStatus("Texture uploaded. Click Render Current to apply it.", "success");
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    state.textureFile = null;
    state.textureFileName = "";
    state.uploadedTextureImage = null;
    updateUploadLabels();
    setStatus("Texture upload failed. Use a valid PNG or JPG image.", "error");
  };
  image.src = imageUrl;
}

function handleBackgroundImageUpload(file) {
  state.backgroundImageFile = file || null;
  state.backgroundImageName = file?.name || "";
  if (elements.backgroundImageLabel) {
    elements.backgroundImageLabel.textContent = state.backgroundImageName || "No background selected";
  }
  state.backgroundImage = null;
  if (!file) {
    renderCurrent();
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    state.backgroundImage = image;
    setStatus("Background image uploaded.", "success");
    renderCurrent();
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    state.backgroundImageFile = null;
    state.backgroundImageName = "";
    state.backgroundImage = null;
    if (elements.backgroundImageLabel) {
      elements.backgroundImageLabel.textContent = "No background selected";
    }
    setStatus("Background image upload failed.", "error");
  };
  image.src = imageUrl;
}

function centerFace() {
  if (!hasUploadedModel()) return;
  const inputs = getActivePositionInputGroup();
  inputs.liftX.value = "0";
  inputs.liftY.value = elements.hugeIconToggle?.checked ? "94" : "0";
  inputs.zoomPercent.value = elements.hugeIconToggle?.checked ? "120" : "100";
  state.userAdjustedCamera = false;
  rerenderIfObjActive();
  setStatus("Face center applied.", "success");
}

function applyRandomPose() {
  const inputs = getActivePositionInputGroup();
  const base = elements.hugeIconToggle?.checked ? DEFAULT_CONFIG.hugePosition : DEFAULT_CONFIG.petPosition;
  inputs.rotX.value = formatCameraValue(base.rotX + (Math.random() * 10 - 5), 3);
  inputs.rotY.value = formatCameraValue(base.rotY + (Math.random() * 18 - 9), 3);
  inputs.rotZ.value = formatCameraValue(base.rotZ + (Math.random() * 8 - 4), 3);
  state.userAdjustedCamera = true;
  rerenderIfObjActive();
  setStatus("Random pose applied.", "success");
}

function initTabs() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
}

function initInputs() {
  [
    elements.canvasSizeInput,
    elements.scaleInput,
    elements.shiftXInput,
    elements.shiftYInput,
    elements.keyColorSelect,
    elements.presetCategorySelect,
    elements.strokeColorInput,
    elements.squareStrokeColorInput,
    elements.showTextureOverlayInput,
    elements.transparentBackgroundInput
  ].forEach((input) => {
    input.addEventListener("input", () => {
      if (input === elements.canvasSizeInput) {
        setCanvasSize(input.value);
      }
      renderCurrent();
    });
  });

  elements.hugeIconToggle?.addEventListener("change", () => {
    const mode = elements.hugeIconToggle.checked ? "huge" : "pet";
    applyAutoCameraPreset(mode);
    applyModeRenderPreset(mode);
    activateTab("pet-position");
    renderCurrent();
  });

  [elements.outlineSizeInput, elements.outlineSoftnessInput, elements.outerOutlineInput].forEach((input) => {
    input.addEventListener("input", () => {
      syncOutlineLabels();
      renderCurrent();
    });
  });

  [
    elements.brightnessInput,
    elements.contrastInput,
    elements.saturationInput,
    elements.lightStrengthInput,
    elements.lightSoftnessInput,
    elements.shadowStrengthInput,
    elements.shadowBlurInput,
    elements.glowStrengthInput,
    elements.glowBlurInput,
    elements.backgroundBlurInput,
    elements.cornerRadiusInput
  ].forEach((input) => {
    input.addEventListener("input", () => {
      syncOutlineLabels();
      renderCurrent();
    });
  });

  Array.from(new Set(Object.values(elements.positionInputs.pet))).forEach((input) => {
    input.addEventListener("input", () => {
      state.userAdjustedCamera = true;
      renderCurrent();
    });
  });

  elements.presetHistoryList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const name = button.dataset.presetName;
    if (!name) return;
    if (button.dataset.action === "apply") {
      applyHistoryPreset(name);
    } else if (button.dataset.action === "duplicate") {
      duplicateHistoryPreset(name);
    } else if (button.dataset.action === "delete") {
      openConfirmModal(
        "Remove preset?",
        `Are you sure you want to remove "${name}" from icon preset history?`,
        () => deleteHistoryPreset(name)
      );
    }
  });

  elements.clearPresetHistoryButton?.addEventListener("click", () => {
    openConfirmModal(
      "Clear preset history?",
      "Are you sure you want to clear all saved icon parameter presets?",
      () => {
        writePresetHistory([]);
        renderPresetHistory();
        setStatus("Preset history cleared.", "success");
      }
    );
  });

  elements.presetHistorySearchInput?.addEventListener("input", () => {
    renderPresetHistory();
  });

  elements.compactPresetHistoryButton?.addEventListener("click", () => {
    state.presetHistoryCompact = !state.presetHistoryCompact;
    renderPresetHistory();
  });
}

function initPreviewControls() {
  const startDrag = (event) => {
    if (!hasUploadedModel()) return;
    event.preventDefault();
    const inputs = getActivePositionInputGroup();
    state.pointerDrag = {
      startX: event.clientX,
      startY: event.clientY,
      baseRotX: Number(inputs.rotX.value) || 0,
      baseRotY: Number(inputs.rotY.value) || 0,
      basePosX: Number(inputs.posX.value) || 0,
      basePosY: Number(inputs.posY.value) || 0,
      basePosZ: Number(inputs.posZ.value) || 0,
      fine: event.altKey,
      mode: event.shiftKey ? "pan" : "orbit"
    };
    elements.previewCanvas.style.cursor = state.pointerDrag.mode === "pan" ? "grabbing" : "grabbing";
  };

  const moveDrag = (event) => {
    if (!state.pointerDrag) return;
    event.preventDefault();
    const deltaX = event.clientX - state.pointerDrag.startX;
    const deltaY = event.clientY - state.pointerDrag.startY;
    const inputs = getActivePositionInputGroup();
    const orbitSpeedX = state.pointerDrag.fine ? 0.08 : 0.18;
    const orbitSpeedY = state.pointerDrag.fine ? 0.06 : 0.14;
    const panSpeed = state.pointerDrag.fine ? 0.08 : 0.14;
    if (state.pointerDrag.mode === "pan") {
      inputs.posX.value = formatCameraValue(state.pointerDrag.basePosX + deltaX * panSpeed, 3);
      inputs.posY.value = formatCameraValue(state.pointerDrag.basePosY - deltaY * panSpeed, 3);
    } else {
      inputs.rotY.value = formatCameraValue(state.pointerDrag.baseRotY + deltaX * orbitSpeedX, 3);
      inputs.rotX.value = formatCameraValue(clamp(state.pointerDrag.baseRotX + deltaY * orbitSpeedY, -89, 89), 3);
    }
    state.userAdjustedCamera = true;
    rerenderIfObjActive();
  };

  const endDrag = () => {
    state.pointerDrag = null;
    elements.previewCanvas.style.cursor = hasUploadedModel() ? "grab" : "default";
  };

  elements.previewCanvas.addEventListener("pointerdown", startDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  elements.previewCanvas.addEventListener("wheel", (event) => {
    if (!hasUploadedModel()) return;
    event.preventDefault();
    const inputs = getActivePositionInputGroup();
    if (event.altKey) {
      const currentRotX = Number(inputs.rotX.value) || 0;
      const direction = event.deltaY > 0 ? getTiltStep() : -getTiltStep();
      inputs.rotX.value = formatCameraValue(clamp(currentRotX + direction, -89, 89), 3);
      state.userAdjustedCamera = true;
      rerenderIfObjActive();
      return;
    }
    const currentPosZ = Number(inputs.posZ.value) || 0;
    const direction = event.deltaY > 0 ? 2.2 : -2.2;
    inputs.posZ.value = formatCameraValue(currentPosZ + direction, 3);
    state.userAdjustedCamera = true;
    rerenderIfObjActive();
  }, { passive: false });
  elements.previewCanvas.addEventListener("contextmenu", (event) => {
    if (hasUploadedModel()) {
      event.preventDefault();
    }
  });
  elements.previewCanvas.style.cursor = "default";
}

elements.renderButton.addEventListener("click", renderCurrent);
elements.downloadPreviewButton.addEventListener("click", downloadCanvas);
elements.downloadOutlineOnlyButton?.addEventListener("click", downloadOutlineOnlyCanvas);
elements.exportPresetCardButton?.addEventListener("click", exportPresetCard);
elements.copyAssetPairButton.addEventListener("click", copyAssetPair);
elements.copyImageWithBackgroundButton?.addEventListener("click", () => copyCanvasImage("with-background"));
elements.copyImageTransparentButton?.addEventListener("click", () => copyCanvasImage("transparent"));
elements.toggleSquareStrokeButton?.addEventListener("click", () => {
  const next = !elements.toggleSquareStrokeButton.classList.contains("is-active");
  syncSquareStrokeButton(next);
  renderCurrent();
});
elements.toggleBeforeAfterButton?.addEventListener("click", () => {
  const next = !elements.toggleBeforeAfterButton.classList.contains("is-active");
  syncBeforeAfterButton(next);
  renderCurrent();
});
elements.faceCenterButton?.addEventListener("click", centerFace);
elements.randomPoseButton?.addEventListener("click", applyRandomPose);
elements.lookUpButton?.addEventListener("click", () => adjustTilt(-1));
elements.lookDownButton?.addEventListener("click", () => adjustTilt(1));
elements.savePresetToHistoryButton.addEventListener("click", savePresetToHistory);
elements.saveConfigButton.addEventListener("click", saveConfigToFile);
elements.duplicatePresetButton?.addEventListener("click", duplicatePreset);
elements.loadConfigInput.addEventListener("change", (event) => loadConfigFromFile(event.target.files?.[0]));
elements.objFileInput.addEventListener("change", (event) => handleObjUpload(event.target.files?.[0]));
elements.textureFileInput.addEventListener("change", (event) => handleTextureUpload(event.target.files?.[0]));
elements.backgroundImageInput?.addEventListener("change", (event) => handleBackgroundImageUpload(event.target.files?.[0]));
elements.resetButton.addEventListener("click", resetToDefaults);
elements.confirmCancelButton?.addEventListener("click", closeConfirmModal);
elements.confirmOkButton?.addEventListener("click", () => {
  const action = confirmAction;
  closeConfirmModal();
  if (typeof action === "function") {
    action();
  }
});
elements.confirmModal?.addEventListener("click", (event) => {
  if (event.target === elements.confirmModal) {
    closeConfirmModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.confirmModal?.hidden) {
    closeConfirmModal();
  }
  if (!hasUploadedModel()) return;
  const inputs = getActivePositionInputGroup();
  const step = event.shiftKey ? 8 : 3;
  if (event.key === "ArrowLeft") {
    inputs.liftX.value = String((Number(inputs.liftX.value) || 0) - step);
    rerenderIfObjActive();
  } else if (event.key === "ArrowRight") {
    inputs.liftX.value = String((Number(inputs.liftX.value) || 0) + step);
    rerenderIfObjActive();
  } else if (event.key === "ArrowUp") {
    inputs.liftY.value = String((Number(inputs.liftY.value) || 0) + step);
    rerenderIfObjActive();
  } else if (event.key === "ArrowDown") {
    inputs.liftY.value = String((Number(inputs.liftY.value) || 0) - step);
    rerenderIfObjActive();
  } else if (event.key === "+" || event.key === "=") {
    inputs.zoomPercent.value = String((Number(inputs.zoomPercent.value) || 100) + 5);
    rerenderIfObjActive();
  } else if (event.key === "-") {
    inputs.zoomPercent.value = String((Number(inputs.zoomPercent.value) || 100) - 5);
    rerenderIfObjActive();
  }
});

restoreSavedConfig();
applyAutoCameraPreset("pet");
initTabs();
initInputs();
initPreviewControls();
syncOutlineLabels();
renderPresetHistory();
setCanvasSize(elements.canvasSizeInput.value);
updateUploadLabels();
activateTab("pet-position");
setStatus(
  "Upload an OBJ and texture for the best PS99 preview.",
  "neutral"
);
