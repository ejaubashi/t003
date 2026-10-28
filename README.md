# DEFORMAT

A responsive typographic landing page with an interactive type playground, expandable principles, and an accessible navigation overlay. This is an original first pass; visual parity with the requested reference has not been verified because network policy blocked access to it.

## Run

Requires Node.js 20 or later. No installation or external services required.

```sh
cd /workspace/t003
npm run dev
```

The server listens on port 3000. Set `PORT` to override it.

## Customize

Change `SITE_NAME` at the top of `app.js` to replace the name throughout the page. Update the fallback brand text, title and description in `index.html` for search engines and browsers without JavaScript. Replace both `hello@example.com` links with your email before publishing. Styles are in `style.css`.

All artwork is generated with HTML and CSS. No reference-site assets, fonts, or source code are included.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the static website on pushes to `main`. It publishes only `index.html`, `style.css`, `app.js`, and `assets/`; the Node server is only for local development.

To enable publishing, open the repository's **Settings → Pages**, select **GitHub Actions** as the build source, and rerun **Deploy DEFORMAT to GitHub Pages** from the Actions tab.

The expected URL, once the deployment succeeds, is `https://ejaubashi.github.io/t003/`.
