# DEFORMAT

An original interactive portfolio inspired by the supplied reference recording. The experience moves between dark, white, black-gallery and red scenes, with a locally generated 3D bust, moving topographic contours and an animated contact portal.

## Development

Requires Node.js 20+. No dependencies, build step, external models, fonts or services are needed.

```sh
cd /workspace/t003
npm run dev
```

The server listens on port 3000; use `PORT` to override it.

## Interactions

- Move the pointer to change the sculpture's perspective.
- In the Form section, switch between shaded surface, wireframe and particles, or rotate the object by a quarter turn.
- Expand an experiment in Work and use its action to explore that material in the sculpture.
- Use Index or footer links to navigate. The overlay supports keyboard focus cycling and Escape, and makes background content inert.
- Motion On/Off freezes continuous canvas and CSS animation. System reduced-motion preferences are respected; scrolling and explicit material/rotation controls remain available.
- The contact links open a message to `enduj@dev.com`.

Geometry is projected from 3D coordinates into Canvas 2D with perspective, depth sorting and directional shading. Rendering is capped at about 30fps with a bounded pixel ratio. Hidden tabs skip rendering; reduced motion redraws only when the scene changes. Text and navigation remain HTML even if canvas is unavailable.

## Validation

Chromium checks cover desktop/mobile rendering, 390/768/1440px overflow, all three material modes, explicit rotation, a frozen canvas with motion off, experiment expansion and navigation, inert background, Escape, contact target and reduced-motion preference. No JavaScript runtime errors were observed.

## Deployment

The workflow in `.github/workflows/pages.yml` publishes the static site when `main` is updated. The site uses relative asset paths for GitHub Pages subdirectory hosting. The intended public URL is https://ejaubashi.github.io/t003/.
