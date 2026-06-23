# Roblox Studio Pet Icon Plugin

This plugin is the correct fix for `MeshId + TextureId` previewing.

Why:

- `MeshId` is 3D geometry, not a ready-made image.
- A normal browser page cannot reliably render Roblox mesh assets like Studio does.
- Roblox Studio can load the `MeshPart`, apply `TextureID`, and show the result in a `ViewportFrame`.

## Files

- `studio-pet-icon-plugin.lua`

## What it does

- Opens a dock widget called `Pet Icon Maker`
- Lets you paste:
  - `Mesh ID`
  - `Texture ID`
  - `Render Name`
- Renders a preview inside Studio with a real `MeshPart`
- Can read the IDs from the currently selected `MeshPart`
- Can spawn a render rig into `Workspace > PetIconPreviewRigs`

## Install

1. Open Roblox Studio.
2. Open the `Plugins` tab.
3. Create a new local plugin script, or open your plugin source workflow.
4. Paste the content of:
   `studio-pet-icon-plugin.lua`
5. Save the plugin.
6. Reopen Studio if needed.

## Use

1. Open the plugin from the toolbar: `Pet Icon Maker`.
2. Paste your `MeshId`, for example:
   `rbxassetid://125716799262548`
3. Paste your `TextureId`, for example:
   `rbxassetid://114550951592429`
4. Click `Render Preview`.
5. If you want a scene object to capture manually, click `Spawn Workspace Rig`.

## Notes

- The preview is done in Studio, not in a browser.
- This is the reliable approach for mesh-based pet icons.
- Exact PNG export is not implemented here, but the plugin creates a clean preview and a workspace rig so you can capture the icon from Studio.
