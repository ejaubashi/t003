# DEFORMAT

An interactive portfolio inspired by the supplied reference recording: a monochrome female sculpture travels through a dense typographic passage. Scrolling pushes the camera toward the head while the scene turns from platinum to porcelain white, before opening into the experiments gallery and red contact scene. This is an original implementation using a replacement character, not the reference site's original model.

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

`scene-source.js` uses Three.js for the female figure, neutral physical materials and antialiased surface contours, environment lighting, particles, and camera choreography. `npm run build` produces the committed `assets/scene.js`. Rebuild after editing the renderer. `app.js` controls navigation, text, scroll state and terrain. Assets are served locally; no CDN or external API is required at runtime. The GitHub Pages workflow deploys the prebuilt static files.

Character provenance and renderer licensing are recorded in `assets/MODEL-CREDITS.txt` and `assets/THREE-LICENSE.txt`.

## Interactions and accessibility

- Scroll through the sticky opening to move between the text columns and into a head close-up. Pointer movement changes perspective.
- Surface, Contours, and Particles switch how the figure is rendered. Rotate Object applies a quarter turn. Dissolve Form disperses the surface into monochrome particles; Re-form Figure brings it back. Switching materials resets dispersion.
- Drag the figure horizontally or focus its interaction area and use Left/Right arrows. Home resets the manual orientation; vertical scrolling stays native.
- Expand a selected experiment and use its action to return to that material.
- Index supports focus cycling and Escape. Background content is inert while the menu is open.
- Motion Off freezes canvas, WebGL character animation and decorative CSS animation. System reduced-motion preferences are respected. Explicit scroll, material and rotation controls remain available.
- If WebGL is unavailable, a message appears and the HTML content and navigation remain usable.
- The contact portal responds to pointer movement with nested perspective rings. Reduced motion disables the perspective response.
- Contact links use `enduj@dev.com`.

## Validation and deployment

Browser checks cover model loading, shader compilation, camera transitions, three materials, explicit rotation, reduced-motion stability, direct loading into the white scene, menu/experiment interactions, responsive widths and graceful WebGL fallback.

The public site is https://ejaubashi.github.io/t003/. Pushing `main` triggers the GitHub Pages deployment workflow. Asset URLs are relative for subdirectory hosting.

The female sculpture holds a fixed pose while the camera and figure rotate. Neutral lighting, a platinum surface and procedural contour lines replace the former rainbow material. The source model’s bow accessories have been removed for a cleaner silhouette.

To reproduce the accessory cleanup, download the credited source model and run `python scripts/prepare-figure.py /path/to/Michelle.glb assets/figure.glb`. The script checks the source SHA-256 before modifying the indexed geometry.

## Motion direction and research

The opening text recedes in depth before the camera close-up. Red 3D bars and an orbital line pass behind the sculpture, while topographic terrain rises during the white/red transitions. See [motion research and source references](docs/motion-research.md) for the recording observations, primary sources consulted and implementation decisions.
