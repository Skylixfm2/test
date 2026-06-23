local AssetService = game:GetService("AssetService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local ContentProvider = game:GetService("ContentProvider")
local InsertService = game:GetService("InsertService")
local Selection = game:GetService("Selection")

local TOOLBAR_NAME = "Pet Icon Maker"
local BUTTON_NAME = "Open Pet Icon Maker"
local BUTTON_TOOLTIP = "Preview Roblox pet icons from MeshId and TextureId inside Studio"
local BUTTON_ICON = "rbxassetid://4458901886"
local WIDGET_ID = "PetIconMakerWidget"

local PRESETS = {
	{
		mode = "pet",
		keyColor = "Green",
		petPosition = {posX = 139.241, posY = 10.691, posZ = 0.539, rotX = 0, rotY = -180, rotZ = 0},
		hugePosition = {posX = 139.241, posY = 10.691, posZ = 0.539, rotX = 0, rotY = -180, rotZ = 0},
		render = {canvas = 400, scale = 0.96, shiftX = 0, shiftY = 0, outlineSize = 5.5, outlineSoftness = 0.8},
	},
	{
		mode = "huge",
		keyColor = "Blue",
		petPosition = {posX = -50, posY = 72, posZ = 470, rotX = -1.5, rotY = -14, rotZ = -10},
		hugePosition = {posX = -25, posY = 66, posZ = 405, rotX = -2, rotY = -9, rotZ = -4.5},
		render = {canvas = 420, scale = 1.1, shiftX = -4, shiftY = -10, outlineSize = 7.2, outlineSoftness = 1.2},
	},
	{
		mode = "pet",
		keyColor = "Purple",
		petPosition = {posX = -62, posY = 71.5, posZ = 490, rotX = 0, rotY = -10, rotZ = -14},
		hugePosition = {posX = -33, posY = 68, posZ = 420, rotX = 0, rotY = -7.2, rotZ = -3.5},
		render = {canvas = 384, scale = 0.9, shiftX = 8, shiftY = 6, outlineSize = 4.8, outlineSoftness = 0.6},
	},
}

local KEY_COLORS = {
	Green = Color3.fromRGB(58, 183, 106),
	Blue = Color3.fromRGB(61, 141, 255),
	Purple = Color3.fromRGB(139, 92, 246),
	Red = Color3.fromRGB(255, 90, 103),
	Gold = Color3.fromRGB(245, 183, 63),
}

local SETTINGS_KEY = "PetIconMaker.Settings.V2"

local toolbar = plugin:CreateToolbar(TOOLBAR_NAME)
local toolbarButton = toolbar:CreateButton(BUTTON_NAME, BUTTON_TOOLTIP, BUTTON_ICON)
toolbarButton.ClickableWhenViewportHidden = true

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	true,
	true,
	860,
	620,
	620,
	480
)

local widget = plugin:CreateDockWidgetPluginGui(WIDGET_ID, widgetInfo)
widget.Title = "Pet Icon Maker"

local currentPreviewPart = nil
local outlinePreviewPart = nil
local backdropPart = nil
local activeTab = "Pet Position"
local activePresetIndex = 1

local function normalizeAsset(value)
	local digits = string.match(value or "", "(%d+)")
	if not digits then
		return ""
	end
	return "rbxassetid://" .. digits
end

local function shortenAsset(value)
	local digits = string.match(value or "", "(%d+)")
	return digits or "none"
end

local function cloneTable(source)
	local result = {}
	for key, value in pairs(source) do
		if type(value) == "table" then
			result[key] = cloneTable(value)
		else
			result[key] = value
		end
	end
	return result
end

local function applyCorner(instance, radius)
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = instance
	return corner
end

local function createStroke(parent, color, thickness)
	local stroke = Instance.new("UIStroke")
	stroke.Parent = parent
	stroke.Color = color
	stroke.Thickness = thickness or 1
	return stroke
end

local function createCard(parent, titleText, height)
	local card = Instance.new("Frame")
	card.Parent = parent
	card.BackgroundColor3 = Color3.fromRGB(24, 27, 34)
	card.BorderSizePixel = 0
	card.AutomaticSize = Enum.AutomaticSize.Y
	card.Size = UDim2.new(1, 0, 0, height or 0)
	applyCorner(card, 18)

	local padding = Instance.new("UIPadding")
	padding.Parent = card
	padding.PaddingLeft = UDim.new(0, 14)
	padding.PaddingRight = UDim.new(0, 14)
	padding.PaddingTop = UDim.new(0, 14)
	padding.PaddingBottom = UDim.new(0, 14)

	local layout = Instance.new("UIListLayout")
	layout.Parent = card
	layout.Padding = UDim.new(0, 10)
	layout.FillDirection = Enum.FillDirection.Vertical
	layout.SortOrder = Enum.SortOrder.LayoutOrder

	local title = Instance.new("TextLabel")
	title.Parent = card
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, 0, 0, 18)
	title.Font = Enum.Font.GothamBold
	title.TextSize = 15
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.TextColor3 = Color3.fromRGB(245, 247, 250)
	title.Text = titleText

	return card, layout
end

local function createLabel(parent, text, size, color)
	local label = Instance.new("TextLabel")
	label.Parent = parent
	label.BackgroundTransparency = 1
	label.Size = UDim2.new(1, 0, 0, size or 14)
	label.Font = Enum.Font.GothamBold
	label.TextSize = 12
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextColor3 = color or Color3.fromRGB(154, 171, 255)
	label.Text = text
	return label
end

local function createTextbox(parent, placeholder, defaultValue)
	local box = Instance.new("TextBox")
	box.Parent = parent
	box.ClearTextOnFocus = false
	box.PlaceholderText = placeholder
	box.Text = defaultValue or ""
	box.Font = Enum.Font.Gotham
	box.TextSize = 14
	box.TextXAlignment = Enum.TextXAlignment.Left
	box.TextYAlignment = Enum.TextYAlignment.Center
	box.TextColor3 = Color3.fromRGB(245, 247, 250)
	box.PlaceholderColor3 = Color3.fromRGB(130, 139, 156)
	box.BackgroundColor3 = Color3.fromRGB(35, 39, 47)
	box.BorderSizePixel = 0
	box.Size = UDim2.new(1, 0, 0, 38)
	applyCorner(box, 12)
	return box
end

local function createButton(parent, text, width, primary)
	local button = Instance.new("TextButton")
	button.Parent = parent
	button.Text = text
	button.Font = Enum.Font.GothamBold
	button.TextSize = 14
	button.TextColor3 = Color3.fromRGB(255, 255, 255)
	button.BackgroundColor3 = primary and Color3.fromRGB(67, 97, 238) or Color3.fromRGB(48, 53, 62)
	button.BorderSizePixel = 0
	button.AutoButtonColor = true
	button.Size = UDim2.new(0, width, 0, 38)
	applyCorner(button, 12)
	return button
end

local function createTabButton(parent, text)
	local button = createButton(parent, text, 140, false)
	button.BackgroundColor3 = Color3.fromRGB(33, 38, 48)
	return button
end

local function createInlineChip(parent, text, background, foreground)
	local chip = Instance.new("TextLabel")
	chip.Parent = parent
	chip.BackgroundColor3 = background
	chip.BorderSizePixel = 0
	chip.AutomaticSize = Enum.AutomaticSize.X
	chip.Size = UDim2.new(0, 0, 0, 28)
	chip.Font = Enum.Font.GothamBold
	chip.TextSize = 12
	chip.TextColor3 = foreground
	chip.Text = "  " .. text .. "  "
	applyCorner(chip, 999)
	return chip
end

local root = Instance.new("Frame")
root.Name = "Root"
root.Parent = widget
root.BackgroundColor3 = Color3.fromRGB(18, 20, 25)
root.BorderSizePixel = 0
root.Size = UDim2.fromScale(1, 1)

local rootPadding = Instance.new("UIPadding")
rootPadding.Parent = root
rootPadding.PaddingLeft = UDim.new(0, 14)
rootPadding.PaddingRight = UDim.new(0, 14)
rootPadding.PaddingTop = UDim.new(0, 14)
rootPadding.PaddingBottom = UDim.new(0, 14)

local rootLayout = Instance.new("UIListLayout")
rootLayout.Parent = root
rootLayout.Padding = UDim.new(0, 12)
rootLayout.FillDirection = Enum.FillDirection.Vertical
rootLayout.SortOrder = Enum.SortOrder.LayoutOrder

local title = Instance.new("TextLabel")
title.Parent = root
title.BackgroundTransparency = 1
title.Size = UDim2.new(1, 0, 0, 34)
title.Font = Enum.Font.GothamBlack
title.TextSize = 26
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextColor3 = Color3.fromRGB(246, 239, 229)
title.Text = "Pet Icon Maker"

local chipRow = Instance.new("Frame")
chipRow.Parent = root
chipRow.BackgroundTransparency = 1
chipRow.Size = UDim2.new(1, 0, 0, 30)

local chipLayout = Instance.new("UIListLayout")
chipLayout.Parent = chipRow
chipLayout.FillDirection = Enum.FillDirection.Horizontal
chipLayout.Padding = UDim.new(0, 8)
chipLayout.SortOrder = Enum.SortOrder.LayoutOrder

createInlineChip(chipRow, "Mesh + Texture", Color3.fromRGB(36, 45, 72), Color3.fromRGB(154, 171, 255))
createInlineChip(chipRow, "Studio Preview", Color3.fromRGB(24, 58, 44), Color3.fromRGB(127, 240, 177))
createInlineChip(chipRow, "Workspace Rig", Color3.fromRGB(74, 53, 22), Color3.fromRGB(255, 201, 107))

local subtitle = Instance.new("TextLabel")
subtitle.Parent = root
subtitle.BackgroundTransparency = 1
subtitle.AutomaticSize = Enum.AutomaticSize.Y
subtitle.Size = UDim2.new(1, 0, 0, 0)
subtitle.Font = Enum.Font.Gotham
subtitle.TextSize = 14
subtitle.TextWrapped = true
subtitle.TextXAlignment = Enum.TextXAlignment.Left
subtitle.TextYAlignment = Enum.TextYAlignment.Top
subtitle.TextColor3 = Color3.fromRGB(168, 178, 194)
subtitle.Text = "Paste a MeshId and TextureId, preview the pet in Studio, or build a workspace rig for final icon capture."

local topBarCard = createCard(root, "Toolbar")
local topBar = Instance.new("Frame")
topBar.Parent = topBarCard
topBar.BackgroundTransparency = 1
topBar.Size = UDim2.new(1, 0, 0, 86)

local topBarLayout = Instance.new("UIListLayout")
topBarLayout.Parent = topBar
topBarLayout.FillDirection = Enum.FillDirection.Vertical
topBarLayout.Padding = UDim.new(0, 10)
topBarLayout.SortOrder = Enum.SortOrder.LayoutOrder

local actionsRow = Instance.new("Frame")
actionsRow.Parent = topBar
actionsRow.BackgroundTransparency = 1
actionsRow.Size = UDim2.new(1, 0, 0, 38)

local actionsRowLayout = Instance.new("UIListLayout")
actionsRowLayout.Parent = actionsRow
actionsRowLayout.FillDirection = Enum.FillDirection.Horizontal
actionsRowLayout.Padding = UDim.new(0, 8)
actionsRowLayout.SortOrder = Enum.SortOrder.LayoutOrder

local nextButton = createButton(actionsRow, "Next", 84, false)
local renderButton = createButton(actionsRow, "Render Current", 132, true)
local resetButton = createButton(actionsRow, "Reset", 84, false)
local saveButton = createButton(actionsRow, "Save Config", 104, false)
local loadButton = createButton(actionsRow, "Load Config", 104, false)

local optionsRow = Instance.new("Frame")
optionsRow.Parent = topBar
optionsRow.BackgroundTransparency = 1
optionsRow.Size = UDim2.new(1, 0, 0, 38)

local optionsRowLayout = Instance.new("UIListLayout")
optionsRowLayout.Parent = optionsRow
optionsRowLayout.FillDirection = Enum.FillDirection.Horizontal
optionsRowLayout.Padding = UDim.new(0, 10)
optionsRowLayout.SortOrder = Enum.SortOrder.LayoutOrder

local function createRadio(parent, labelText)
	local holder = Instance.new("TextButton")
	holder.Parent = parent
	holder.BackgroundTransparency = 1
	holder.Text = ""
	holder.Size = UDim2.new(0, 96, 0, 38)

	local dot = Instance.new("Frame")
	dot.Parent = holder
	dot.AnchorPoint = Vector2.new(0, 0.5)
	dot.Position = UDim2.new(0, 4, 0.5, 0)
	dot.Size = UDim2.new(0, 14, 0, 14)
	dot.BackgroundColor3 = Color3.fromRGB(20, 24, 30)
	dot.BorderSizePixel = 0
	applyCorner(dot, 999)
	createStroke(dot, Color3.fromRGB(220, 228, 242), 1)

	local fill = Instance.new("Frame")
	fill.Parent = dot
	fill.AnchorPoint = Vector2.new(0.5, 0.5)
	fill.Position = UDim2.fromScale(0.5, 0.5)
	fill.Size = UDim2.new(0, 8, 0, 8)
	fill.BackgroundColor3 = Color3.fromRGB(67, 97, 238)
	fill.BorderSizePixel = 0
	applyCorner(fill, 999)

	local label = Instance.new("TextLabel")
	label.Parent = holder
	label.BackgroundTransparency = 1
	label.Position = UDim2.new(0, 26, 0, 0)
	label.Size = UDim2.new(1, -26, 1, 0)
	label.Font = Enum.Font.Gotham
	label.TextSize = 14
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextColor3 = Color3.fromRGB(245, 247, 250)
	label.Text = labelText

	return holder, fill
end

local petModeButton, petModeFill = createRadio(optionsRow, "Pet Icon")
local hugeModeButton, hugeModeFill = createRadio(optionsRow, "Huge Icon")

local keyColorHolder = Instance.new("Frame")
keyColorHolder.Parent = optionsRow
keyColorHolder.BackgroundTransparency = 1
keyColorHolder.Size = UDim2.new(0, 178, 0, 38)

local keyColorLabel = Instance.new("TextLabel")
keyColorLabel.Parent = keyColorHolder
keyColorLabel.BackgroundTransparency = 1
keyColorLabel.Position = UDim2.new(0, 0, 0, 0)
keyColorLabel.Size = UDim2.new(0, 66, 1, 0)
keyColorLabel.Font = Enum.Font.Gotham
keyColorLabel.TextSize = 14
keyColorLabel.TextXAlignment = Enum.TextXAlignment.Left
keyColorLabel.TextColor3 = Color3.fromRGB(245, 247, 250)
keyColorLabel.Text = "Key Color:"

local keyColorButton = createButton(keyColorHolder, "Green", 104, false)
keyColorButton.Position = UDim2.new(0, 72, 0, 0)

local keyColorMenu = Instance.new("Frame")
keyColorMenu.Parent = keyColorHolder
keyColorMenu.Visible = false
keyColorMenu.Position = UDim2.new(0, 72, 0, 42)
keyColorMenu.Size = UDim2.new(0, 130, 0, 0)
keyColorMenu.AutomaticSize = Enum.AutomaticSize.Y
keyColorMenu.BackgroundColor3 = Color3.fromRGB(28, 32, 40)
keyColorMenu.BorderSizePixel = 0
keyColorMenu.ZIndex = 20
	applyCorner(keyColorMenu, 12)
createStroke(keyColorMenu, Color3.fromRGB(50, 57, 72), 1)

local keyColorMenuPadding = Instance.new("UIPadding")
keyColorMenuPadding.Parent = keyColorMenu
keyColorMenuPadding.PaddingLeft = UDim.new(0, 6)
keyColorMenuPadding.PaddingRight = UDim.new(0, 6)
keyColorMenuPadding.PaddingTop = UDim.new(0, 6)
keyColorMenuPadding.PaddingBottom = UDim.new(0, 6)

local keyColorMenuLayout = Instance.new("UIListLayout")
keyColorMenuLayout.Parent = keyColorMenu
keyColorMenuLayout.FillDirection = Enum.FillDirection.Vertical
keyColorMenuLayout.Padding = UDim.new(0, 4)
keyColorMenuLayout.SortOrder = Enum.SortOrder.LayoutOrder

local leftColumn = Instance.new("Frame")
leftColumn.Parent = root
leftColumn.BackgroundTransparency = 1
leftColumn.Size = UDim2.new(0.57, -8, 0, 0)
leftColumn.AutomaticSize = Enum.AutomaticSize.Y

local leftLayout = Instance.new("UIListLayout")
leftLayout.Parent = leftColumn
leftLayout.FillDirection = Enum.FillDirection.Vertical
leftLayout.Padding = UDim.new(0, 12)
leftLayout.SortOrder = Enum.SortOrder.LayoutOrder

local rightColumn = Instance.new("Frame")
rightColumn.Parent = root
rightColumn.BackgroundTransparency = 1
rightColumn.Size = UDim2.new(0.43, -4, 0, 0)
rightColumn.AutomaticSize = Enum.AutomaticSize.Y

local rightLayout = Instance.new("UIListLayout")
rightLayout.Parent = rightColumn
rightLayout.FillDirection = Enum.FillDirection.Vertical
rightLayout.Padding = UDim.new(0, 12)
rightLayout.SortOrder = Enum.SortOrder.LayoutOrder

local columns = Instance.new("Frame")
columns.Parent = root
columns.BackgroundTransparency = 1
columns.Size = UDim2.new(1, 0, 0, 0)
columns.AutomaticSize = Enum.AutomaticSize.Y

leftColumn.Parent = columns
rightColumn.Parent = columns
leftColumn.Position = UDim2.new(0, 0, 0, 0)
rightColumn.Position = UDim2.new(0.58, 0, 0, 0)

local assetCard = createCard(leftColumn, "Asset Inputs")

local function createField(card, labelText, placeholder, defaultValue)
	createLabel(card, labelText)
	return createTextbox(card, placeholder, defaultValue)
end

local meshInput = createField(assetCard, "Mesh ID", "rbxassetid://125716799262548", "")
local textureInput = createField(assetCard, "Texture ID", "rbxassetid://114550951592429", "")
local nameInput = createField(assetCard, "Render Name", "PetIconRender", "PetIconRender")

local helperRow = Instance.new("Frame")
helperRow.Parent = assetCard
helperRow.BackgroundTransparency = 1
helperRow.Size = UDim2.new(1, 0, 0, 38)

local helperLayout = Instance.new("UIListLayout")
helperLayout.Parent = helperRow
helperLayout.FillDirection = Enum.FillDirection.Horizontal
helperLayout.Padding = UDim.new(0, 8)
helperLayout.SortOrder = Enum.SortOrder.LayoutOrder

local useSelectionButton = createButton(helperRow, "Use Selection", 124, false)
local detectTextureButton = createButton(helperRow, "Detect Texture", 126, false)

local tabsRow = Instance.new("Frame")
tabsRow.Parent = leftColumn
tabsRow.BackgroundTransparency = 1
tabsRow.Size = UDim2.new(1, 0, 0, 38)

local tabsLayout = Instance.new("UIListLayout")
tabsLayout.Parent = tabsRow
tabsLayout.FillDirection = Enum.FillDirection.Horizontal
tabsLayout.Padding = UDim.new(0, 8)
tabsLayout.SortOrder = Enum.SortOrder.LayoutOrder

local petTabButton = createTabButton(tabsRow, "Pet Position")
local hugeTabButton = createTabButton(tabsRow, "Huge Position")
local renderTabButton = createTabButton(tabsRow, "Render Settings")

local petCard = createCard(leftColumn, "Pet Icon Position")
local hugeCard = createCard(leftColumn, "Huge Icon Position")
local renderCard = createCard(leftColumn, "Pet Icon Output")

local function createGrid(card)
	local frame = Instance.new("Frame")
	frame.Parent = card
	frame.BackgroundTransparency = 1
	frame.Size = UDim2.new(1, 0, 0, 120)
	frame.AutomaticSize = Enum.AutomaticSize.Y

	local layout = Instance.new("UIGridLayout")
	layout.Parent = frame
	layout.CellPadding = UDim2.new(0, 12, 0, 12)
	layout.CellSize = UDim2.new(0.31, 0, 0, 60)
	layout.SortOrder = Enum.SortOrder.LayoutOrder

	return frame
end

local function createNumberField(parent, labelText, defaultValue)
	local holder = Instance.new("Frame")
	holder.Parent = parent
	holder.BackgroundTransparency = 1
	holder.Size = UDim2.new(1, 0, 1, 0)

	local layout = Instance.new("UIListLayout")
	layout.Parent = holder
	layout.FillDirection = Enum.FillDirection.Vertical
	layout.Padding = UDim.new(0, 6)
	layout.SortOrder = Enum.SortOrder.LayoutOrder

	createLabel(holder, labelText)
	local box = createTextbox(holder, "", tostring(defaultValue))
	box.Text = tostring(defaultValue)
	return box
end

local petGrid = createGrid(petCard)
local hugeGrid = createGrid(hugeCard)
local renderGrid = createGrid(renderCard)

local petInputs = {
	posX = createNumberField(petGrid, "Pos X", -59.167),
	posY = createNumberField(petGrid, "Pos Y", 73.703),
	posZ = createNumberField(petGrid, "Pos Z", 482.387),
	rotX = createNumberField(petGrid, "Rot X", -0.342),
	rotY = createNumberField(petGrid, "Rot Y", -12.585),
	rotZ = createNumberField(petGrid, "Rot Z", -12.52),
}

local hugeInputs = {
	posX = createNumberField(hugeGrid, "Pos X", -36.2),
	posY = createNumberField(hugeGrid, "Pos Y", 67.5),
	posZ = createNumberField(hugeGrid, "Pos Z", 416.9),
	rotX = createNumberField(hugeGrid, "Rot X", 0),
	rotY = createNumberField(hugeGrid, "Rot Y", -8.5),
	rotZ = createNumberField(hugeGrid, "Rot Z", -5),
}

local renderInputs = {
	canvas = createNumberField(renderGrid, "Canvas", 400),
	scale = createNumberField(renderGrid, "Scale", 0.96),
	shiftX = createNumberField(renderGrid, "Shift X", 0),
	shiftY = createNumberField(renderGrid, "Shift Y", 0),
	outlineSize = createNumberField(renderGrid, "Outline Size", 5.5),
	outlineSoftness = createNumberField(renderGrid, "Outline Softness", 0.8),
}

local previewCard = createCard(rightColumn, "Preview")
previewCard.Size = UDim2.new(1, 0, 0, 0)
previewCard.AutomaticSize = Enum.AutomaticSize.Y

local viewport = Instance.new("ViewportFrame")
viewport.Parent = previewCard
viewport.Size = UDim2.new(1, 0, 0, 330)
viewport.BackgroundColor3 = Color3.fromRGB(12, 14, 20)
viewport.BorderSizePixel = 0
viewport.Ambient = Color3.fromRGB(190, 198, 214)
viewport.LightDirection = Vector3.new(-1, -1, -0.6)
viewport.LightColor = Color3.fromRGB(255, 255, 255)
applyCorner(viewport, 16)
createStroke(viewport, Color3.fromRGB(34, 40, 54), 1)

local previewHint = Instance.new("TextLabel")
previewHint.Parent = viewport
previewHint.BackgroundTransparency = 1
previewHint.AnchorPoint = Vector2.new(0.5, 0.5)
previewHint.Position = UDim2.fromScale(0.5, 0.5)
previewHint.Size = UDim2.new(1, -40, 0, 60)
previewHint.Font = Enum.Font.GothamMedium
previewHint.TextSize = 16
previewHint.TextWrapped = true
previewHint.TextColor3 = Color3.fromRGB(116, 125, 142)
previewHint.Text = "Click Render Current to load the mesh here."

local worldModel = Instance.new("WorldModel")
worldModel.Parent = viewport

local camera = Instance.new("Camera")
camera.Parent = viewport
viewport.CurrentCamera = camera

local statusLabel = Instance.new("TextLabel")
statusLabel.Parent = previewCard
statusLabel.BackgroundColor3 = Color3.fromRGB(30, 34, 42)
statusLabel.BorderSizePixel = 0
statusLabel.AutomaticSize = Enum.AutomaticSize.Y
statusLabel.Size = UDim2.new(1, 0, 0, 0)
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextWrapped = true
statusLabel.TextSize = 13
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.TextYAlignment = Enum.TextYAlignment.Top
statusLabel.TextColor3 = Color3.fromRGB(255, 201, 107)
statusLabel.Text = "Ready. Paste a MeshId and click Render Current."
applyCorner(statusLabel, 12)

local statusPadding = Instance.new("UIPadding")
statusPadding.Parent = statusLabel
statusPadding.PaddingLeft = UDim.new(0, 12)
statusPadding.PaddingRight = UDim.new(0, 12)
statusPadding.PaddingTop = UDim.new(0, 10)
statusPadding.PaddingBottom = UDim.new(0, 10)

local function setStatus(message, color)
	statusLabel.Text = message
	statusLabel.TextColor3 = color or Color3.fromRGB(255, 201, 107)
end

local function getNumber(textBox, fallback)
	local value = tonumber(textBox.Text)
	if value == nil then
		return fallback
	end
	return value
end

local function collectSettings()
	local mode = petModeFill.Visible and "pet" or "huge"
	return {
		meshId = meshInput.Text,
		textureId = textureInput.Text,
		renderName = nameInput.Text,
		mode = mode,
		keyColor = keyColorButton.Text,
		petPosition = {
			posX = getNumber(petInputs.posX, -59.167),
			posY = getNumber(petInputs.posY, 73.703),
			posZ = getNumber(petInputs.posZ, 482.387),
			rotX = getNumber(petInputs.rotX, -0.342),
			rotY = getNumber(petInputs.rotY, -12.585),
			rotZ = getNumber(petInputs.rotZ, -12.52),
		},
		hugePosition = {
			posX = getNumber(hugeInputs.posX, -36.2),
			posY = getNumber(hugeInputs.posY, 67.5),
			posZ = getNumber(hugeInputs.posZ, 416.9),
			rotX = getNumber(hugeInputs.rotX, 0),
			rotY = getNumber(hugeInputs.rotY, -8.5),
			rotZ = getNumber(hugeInputs.rotZ, -5),
		},
		render = {
			canvas = getNumber(renderInputs.canvas, 400),
			scale = getNumber(renderInputs.scale, 0.96),
			shiftX = getNumber(renderInputs.shiftX, 0),
			shiftY = getNumber(renderInputs.shiftY, 0),
			outlineSize = getNumber(renderInputs.outlineSize, 5.5),
			outlineSoftness = getNumber(renderInputs.outlineSoftness, 0.8),
		},
	}
end

local function applySettings(settings)
	meshInput.Text = settings.meshId or ""
	textureInput.Text = settings.textureId or ""
	nameInput.Text = settings.renderName ~= "" and settings.renderName or "PetIconRender"
	keyColorButton.Text = settings.keyColor or "Green"

	petInputs.posX.Text = tostring(settings.petPosition.posX)
	petInputs.posY.Text = tostring(settings.petPosition.posY)
	petInputs.posZ.Text = tostring(settings.petPosition.posZ)
	petInputs.rotX.Text = tostring(settings.petPosition.rotX)
	petInputs.rotY.Text = tostring(settings.petPosition.rotY)
	petInputs.rotZ.Text = tostring(settings.petPosition.rotZ)

	hugeInputs.posX.Text = tostring(settings.hugePosition.posX)
	hugeInputs.posY.Text = tostring(settings.hugePosition.posY)
	hugeInputs.posZ.Text = tostring(settings.hugePosition.posZ)
	hugeInputs.rotX.Text = tostring(settings.hugePosition.rotX)
	hugeInputs.rotY.Text = tostring(settings.hugePosition.rotY)
	hugeInputs.rotZ.Text = tostring(settings.hugePosition.rotZ)

	renderInputs.canvas.Text = tostring(settings.render.canvas)
	renderInputs.scale.Text = tostring(settings.render.scale)
	renderInputs.shiftX.Text = tostring(settings.render.shiftX)
	renderInputs.shiftY.Text = tostring(settings.render.shiftY)
	renderInputs.outlineSize.Text = tostring(settings.render.outlineSize)
	renderInputs.outlineSoftness.Text = tostring(settings.render.outlineSoftness)

	local isPet = settings.mode ~= "huge"
	petModeFill.Visible = isPet
	hugeModeFill.Visible = not isPet
end

local function clearPreview()
	for _, child in ipairs(worldModel:GetChildren()) do
		child:Destroy()
	end
	currentPreviewPart = nil
	outlinePreviewPart = nil
	backdropPart = nil
	previewHint.Visible = true
end

local function fitCameraToPart(part, settings)
	local size = part.Size
	local maxAxis = math.max(size.X, size.Y, size.Z)
	local distance = math.max(6, maxAxis * 2.4)
	local activePosition = settings.mode == "huge" and settings.hugePosition or settings.petPosition

	local shiftX = settings.render.shiftX * 0.03
	local shiftY = settings.render.shiftY * 0.03
	local yaw = math.rad(activePosition.rotY)
	local pitch = math.rad(activePosition.rotX)
	local roll = math.rad(activePosition.rotZ)

	local focus = part.Position + Vector3.new(shiftX, shiftY, 0)
	local offset = CFrame.Angles(pitch, yaw, roll):VectorToWorldSpace(Vector3.new(distance * 0.55, distance * 0.28, distance))
	camera.FieldOfView = settings.mode == "huge" and 24 or 28
	camera.CFrame = CFrame.lookAt(focus + offset, focus) * CFrame.Angles(0, 0, roll * 0.25)
end

local function createMeshPartFromAsset(meshId)
	local meshContent = Content.fromUri(meshId)

	local okAsset, meshPartOrError = pcall(function()
		return AssetService:CreateMeshPartAsync(meshContent, {
			CollisionFidelity = Enum.CollisionFidelity.Box,
			RenderFidelity = Enum.RenderFidelity.Precise,
		})
	end)

	if okAsset and typeof(meshPartOrError) == "Instance" and meshPartOrError:IsA("MeshPart") then
		return meshPartOrError
	end

	local okInsert, insertResult = pcall(function()
		return InsertService:CreateMeshPartAsync(
			meshId,
			Enum.CollisionFidelity.Box,
			Enum.RenderFidelity.Precise
		)
	end)

	if okInsert and typeof(insertResult) == "Instance" and insertResult:IsA("MeshPart") then
		return insertResult
	end

	error(("Could not create MeshPart from asset. AssetService: %s | InsertService: %s"):format(
		tostring(meshPartOrError),
		tostring(insertResult)
	))
end

local function createOutlineClone(meshPart, settings)
	local outline = meshPart:Clone()
	outline.Name = "PreviewOutline"
	outline.TextureID = ""
	outline.Color = Color3.new(0, 0, 0)
	outline.Material = Enum.Material.SmoothPlastic
	outline.Transparency = math.clamp(0.7 + settings.render.outlineSoftness * 0.04, 0.2, 0.92)
	outline.Size = meshPart.Size * (1 + settings.render.outlineSize * 0.025)
	outline.Parent = worldModel
	return outline
end

local function resolveTextureId(textureId)
	if textureId ~= "" then
		return textureId
	end

	local selected = Selection:Get()
	local selectedMesh = selected[1]
	if selectedMesh and selectedMesh:IsA("MeshPart") and selectedMesh.TextureID ~= "" then
		textureInput.Text = selectedMesh.TextureID
		return selectedMesh.TextureID
	end

	return ""
end

local function buildPreview(settings)
	clearPreview()

	local meshId = normalizeAsset(settings.meshId)
	local textureId = normalizeAsset(resolveTextureId(settings.textureId))
	local meshPart = createMeshPartFromAsset(meshId)
	meshPart.Name = "PreviewPet"
	meshPart.Anchored = true
	meshPart.CanCollide = false
	meshPart.CastShadow = false
	meshPart.Material = Enum.Material.SmoothPlastic
	meshPart.Color = Color3.fromRGB(255, 255, 255)
	meshPart.Parent = worldModel

	if textureId ~= "" then
		meshPart.TextureID = textureId
	end

	local scale = math.max(0.2, settings.render.scale)
	meshPart.Size = meshPart.Size * scale
	meshPart.Position = Vector3.new(settings.render.shiftX * 0.01, settings.render.shiftY * -0.01, 0)
	meshPart.CFrame = CFrame.new(meshPart.Position) * CFrame.Angles(0, math.rad((settings.mode == "huge" and settings.hugePosition.rotY or settings.petPosition.rotY) * -1), 0)

	backdropPart = Instance.new("Part")
	backdropPart.Name = "Backdrop"
	backdropPart.Anchored = true
	backdropPart.CanCollide = false
	backdropPart.Material = Enum.Material.SmoothPlastic
	backdropPart.Color = KEY_COLORS[keyColorButton.Text] or KEY_COLORS.Green
	backdropPart.Size = Vector3.new(16, 16, 0.2)
	backdropPart.CFrame = CFrame.new(meshPart.Position + Vector3.new(0, 0, -5.4))
	backdropPart.Parent = worldModel

	outlinePreviewPart = createOutlineClone(meshPart, settings)
	currentPreviewPart = meshPart

	ContentProvider:PreloadAsync({meshPart})
	previewHint.Visible = false
	fitCameraToPart(meshPart, settings)

	local textureMessage = textureId ~= "" and ("with texture " .. shortenAsset(textureId)) or "without texture"
	setStatus(("Preview ready. Mesh %s %s."):format(shortenAsset(meshId), textureMessage), Color3.fromRGB(127, 240, 177))
end

local function buildWorkspaceRig(settings)
	local meshId = normalizeAsset(settings.meshId)
	local textureId = normalizeAsset(resolveTextureId(settings.textureId))
	local renderName = settings.renderName ~= "" and settings.renderName or "PetIconRender"

	local folder = workspace:FindFirstChild("PetIconPreviewRigs")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "PetIconPreviewRigs"
		folder.Parent = workspace
	end

	local existing = folder:FindFirstChild(renderName)
	if existing then
		existing:Destroy()
	end

	local model = Instance.new("Model")
	model.Name = renderName
	model.Parent = folder

	local meshPart = createMeshPartFromAsset(meshId)
	meshPart.Name = "PetMesh"
	meshPart.Anchored = true
	meshPart.CanCollide = false
	meshPart.Material = Enum.Material.SmoothPlastic
	meshPart.Color = Color3.fromRGB(255, 255, 255)
	if textureId ~= "" then
		meshPart.TextureID = textureId
	end
	meshPart.Size = meshPart.Size * math.max(0.2, settings.render.scale)
	meshPart.Parent = model

	local outline = createOutlineClone(meshPart, settings)
	outline.Parent = model

	local backdrop = Instance.new("Part")
	backdrop.Name = "Backdrop"
	backdrop.Anchored = true
	backdrop.CanCollide = false
	backdrop.Material = Enum.Material.SmoothPlastic
	backdrop.Color = KEY_COLORS[keyColorButton.Text] or KEY_COLORS.Green
	backdrop.Size = Vector3.new(16, 16, 0.2)
	backdrop.CFrame = CFrame.new(0, 3, -5.2)
	backdrop.Parent = model

	meshPart.CFrame = CFrame.new(settings.render.shiftX * 0.01, 3 + settings.render.shiftY * -0.01, 0)

	local cameraPart = Instance.new("Part")
	cameraPart.Name = "SuggestedCamera"
	cameraPart.Transparency = 1
	cameraPart.Anchored = true
	cameraPart.CanCollide = false
	cameraPart.Size = Vector3.new(1, 1, 1)
	cameraPart.CFrame = CFrame.lookAt(Vector3.new(3.5, 5.5, 9), Vector3.new(0, 3.2, 0))
	cameraPart.Parent = model

	model.PrimaryPart = meshPart
	Selection:Set({model})
	return model
end

local function showTab(tabName)
	activeTab = tabName
	petCard.Visible = tabName == "Pet Position"
	hugeCard.Visible = tabName == "Huge Position"
	renderCard.Visible = tabName == "Render Settings"

	petTabButton.BackgroundColor3 = tabName == "Pet Position" and Color3.fromRGB(67, 97, 238) or Color3.fromRGB(33, 38, 48)
	hugeTabButton.BackgroundColor3 = tabName == "Huge Position" and Color3.fromRGB(67, 97, 238) or Color3.fromRGB(33, 38, 48)
	renderTabButton.BackgroundColor3 = tabName == "Render Settings" and Color3.fromRGB(67, 97, 238) or Color3.fromRGB(33, 38, 48)
end

local function saveConfig()
	plugin:SetSetting(SETTINGS_KEY, collectSettings())
	setStatus("Config saved inside Studio plugin settings.", Color3.fromRGB(127, 240, 177))
end

local function loadConfig()
	local saved = plugin:GetSetting(SETTINGS_KEY)
	if type(saved) == "table" then
		applySettings(saved)
		setStatus("Saved config loaded.", Color3.fromRGB(127, 240, 177))
	else
		setStatus("No saved config found yet.", Color3.fromRGB(255, 201, 107))
	end
end

local function resetConfig()
	activePresetIndex = 1
	applySettings(cloneTable(PRESETS[1]))
	clearPreview()
	setStatus("Config reset to the default preset.", Color3.fromRGB(255, 201, 107))
end

local function nextPreset()
	activePresetIndex += 1
	if activePresetIndex > #PRESETS then
		activePresetIndex = 1
	end
	applySettings(cloneTable(PRESETS[activePresetIndex]))
	setStatus(("Preset %d loaded."):format(activePresetIndex), Color3.fromRGB(127, 240, 177))
end

local function renderCurrent()
	local settings = collectSettings()
	local meshId = normalizeAsset(settings.meshId)
	if meshId == "" then
		setStatus("Add a valid MeshId first.", Color3.fromRGB(255, 160, 160))
		return
	end

	local ok, errorMessage = pcall(function()
		buildPreview(settings)
	end)

	if not ok then
		setStatus("Preview failed: " .. tostring(errorMessage), Color3.fromRGB(255, 160, 160))
	end
end

local function spawnWorkspaceRig()
	local settings = collectSettings()
	local meshId = normalizeAsset(settings.meshId)
	if meshId == "" then
		setStatus("Add a valid MeshId before spawning the render rig.", Color3.fromRGB(255, 160, 160))
		return
	end

	local ok, result = pcall(function()
		ChangeHistoryService:SetWaypoint("BeforePetIconRig")
		local model = buildWorkspaceRig(settings)
		ChangeHistoryService:SetWaypoint("AfterPetIconRig")
		return model
	end)

	if ok and result then
		setStatus(("Workspace rig created: %s"):format(result:GetFullName()), Color3.fromRGB(127, 240, 177))
	else
		setStatus("Could not build workspace rig: " .. tostring(result), Color3.fromRGB(255, 160, 160))
	end
end

local function useSelection()
	local selected = Selection:Get()
	local meshPart = selected[1]
	if meshPart and meshPart:IsA("MeshPart") then
		meshInput.Text = meshPart.MeshId
		textureInput.Text = meshPart.TextureID
		nameInput.Text = meshPart.Name ~= "" and meshPart.Name or "PetIconRender"
		setStatus("Loaded MeshId and TextureId from current selection.", Color3.fromRGB(127, 240, 177))
	else
		setStatus("Select a MeshPart in Studio first.", Color3.fromRGB(255, 160, 160))
	end
end

local function detectTexture()
	local resolved = resolveTextureId(normalizeAsset(textureInput.Text))
	if resolved ~= "" then
		textureInput.Text = resolved
		setStatus(("Texture detected: %s"):format(shortenAsset(resolved)), Color3.fromRGB(127, 240, 177))
	else
		setStatus("No texture could be detected automatically. Select a MeshPart or paste the TextureId.", Color3.fromRGB(255, 201, 107))
	end
end

for keyName in pairs(KEY_COLORS) do
	local colorButton = createButton(keyColorMenu, keyName, 118, false)
	colorButton.Size = UDim2.new(1, 0, 0, 32)
	colorButton.MouseButton1Click:Connect(function()
		keyColorButton.Text = keyName
		keyColorMenu.Visible = false
	end)
end

keyColorButton.MouseButton1Click:Connect(function()
	keyColorMenu.Visible = not keyColorMenu.Visible
end)

petModeButton.MouseButton1Click:Connect(function()
	petModeFill.Visible = true
	hugeModeFill.Visible = false
end)

hugeModeButton.MouseButton1Click:Connect(function()
	petModeFill.Visible = false
	hugeModeFill.Visible = true
end)

petTabButton.MouseButton1Click:Connect(function()
	showTab("Pet Position")
end)

hugeTabButton.MouseButton1Click:Connect(function()
	showTab("Huge Position")
end)

renderTabButton.MouseButton1Click:Connect(function()
	showTab("Render Settings")
end)

nextButton.MouseButton1Click:Connect(nextPreset)
renderButton.MouseButton1Click:Connect(renderCurrent)
resetButton.MouseButton1Click:Connect(resetConfig)
saveButton.MouseButton1Click:Connect(saveConfig)
loadButton.MouseButton1Click:Connect(loadConfig)
useSelectionButton.MouseButton1Click:Connect(useSelection)
detectTextureButton.MouseButton1Click:Connect(detectTexture)
workspaceButton.MouseButton1Click:Connect(spawnWorkspaceRig)

toolbarButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

widget:GetPropertyChangedSignal("Enabled"):Connect(function()
	toolbarButton:SetActive(widget.Enabled)
end)

applySettings(cloneTable(PRESETS[1]))
showTab("Pet Position")
clearPreview()
widget.Enabled = true
toolbarButton:SetActive(true)
