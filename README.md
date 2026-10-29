# DEFORMAT

An interactive portfolio inspired by the supplied reference recording: a detailed, full-body character travels through a dense typographic passage. Scrolling pushes the camera toward the head while the scene turns from dark iridescence to white, before opening into the experiments gallery and red contact scene. This is an original implementation using a replacement character, not the reference site's original model.

## Run

Requires Node.js 20+. The production renderer is bundled and committed, so the static site and local server work without installing packages:

```sh
npm run dev
```

The server uses port 3000 by default; set `PORT` to override it.

## Edit the 3D experience

```sh
npm ci
npm run build
```

`scene-source.js` uses Three.js for the skinned character, physical thin-film material, environment lighting, particles, and camera choreography. `npm run build` produces the committed `assets/scene.js`. Rebuild after editing the renderer. `app.js` controls navigation, text, scroll state and terrain. Assets are served locally; no CDN or external API is required at runtime. The GitHub Pages workflow deploys the prebuilt static files.

Character provenance and renderer licensing are recorded in `assets/MODEL-CREDITS.txt` and `assets/THREE-LICENSE.txt`.

## Interactions and accessibility

- Scroll through the sticky opening to move between the text columns and into a head close-up. Pointer movement changes perspective.
- Surface, Structure, and Particles switch how the same animated figure is rendered. Rotate Object applies a quarter turn.
- Expand a selected experiment and use its action to return to that material.
- Index supports focus cycling and Escape. Background content is inert while the menu is open.
- Motion Off freezes canvas, WebGL character animation and decorative CSS animation. System reduced-motion preferences are respected. Explicit scroll, material and rotation controls remain available.
- If WebGL is unavailable, a message appears and the HTML content and navigation remain usable.
- Contact links use `enduj@dev.com`.

## Validation and deployment

Browser checks cover model loading, shader compilation, camera transitions, three materials, explicit rotation, reduced-motion stability, direct loading into the white scene, menu/experiment interactions, responsive widths and graceful WebGL fallback.

The public site is https://ejaubashi.github.io/t003/. Pushing `main` triggers the GitHub Pages deployment workflow. Asset URLs are relative for subdirectory hosting.
