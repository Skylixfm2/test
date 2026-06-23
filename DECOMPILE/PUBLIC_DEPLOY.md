# Public Deploy

This site is now prepared for static hosting.

## Best public workflow

Public hosting works best for:

- the Luau workspace pages
- the community/post/admin localStorage UI
- the pet icon maker using:
  - `.obj` uploads
  - `.png/.jpg/.webp` texture uploads

## Local-only features

These stay local by design:

- `Install Studio plugin`
- the Python bridge in `pet_icon_server.py`
- direct local plugin installation into Roblox Studio

On a public host, the site automatically falls back to:

- `Download plugin file`
- public `.obj + texture` preview mode

## GitHub Pages

Official docs:

- [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub Pages documentation](https://docs.github.com/en/pages)

Recommended publish flow:

1. Create a GitHub repository.
2. Upload this folder.
3. Keep:
   - `index.html`
   - `app.html`
   - `community.html`
   - `post.html`
   - `admin.html`
   - `pet-icon-maker.html`
   - CSS/JS/assets
   - `.nojekyll`
4. In GitHub Pages, publish from the default branch root.
5. Visit the generated `https://<user>.github.io/<repo>/` URL.

## Cloudflare Pages

Official docs:

- [Static HTML on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)

Use the project root as the output directory.

## Notes

- Public hosting does not make the Python bridge public automatically.
- If you want true server-side features for everyone, the Python bridge must be replaced by a real hosted backend.
