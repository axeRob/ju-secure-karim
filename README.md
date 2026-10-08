# JU Secure — Karim

A mobile-first interactive research prototype built with React, TypeScript and Vite. Karim already understands password security: this direction prioritizes safe defaults, short contextual warnings and quick actions. It shares Emma’s dark JU Secure palette and card/navigation language, with fewer explanations and steps.

## Run

Use Node.js 22.12+ or 24.

```sh
npm ci --cache /tmp/ju-secure-npm-cache
npm run dev
```

Vite listens on port 5173 by default. Open the `/ju-secure-karim/` path printed by Vite. The interface is designed around 390 × 844 px and presents a centered app on larger screens.

```sh
npm run build       # TypeScript check and production build
npm run preview     # Serve the production build
npm run test:e2e    # Browser interaction checks
```

Browser checks use `/usr/bin/chromium` in this cloud environment. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to another installed Chromium executable, or run `npx playwright install chromium` to use Playwright’s managed browser.

## Primary research flow

1. Quick Start → **Import demo accounts**. No browser access or setup form.
2. Vault → **Fix Spotify password**.
3. Contextual warning → **Use unique password**.
4. Immediate success → **Back to vault**.

Spotify and Google initially share a fictional password. Fixing Spotify clears both reuse warnings, leaving GitHub’s weak-password issue. Security also offers direct fixes. Search, safe-account details, Generator, Settings, an empty-vault path and adding fictional accounts work independently.

## Demo boundaries

All accounts and passwords are fictional. State exists only in React memory, so refreshing starts over. There is no authentication, browser import, persistent credential storage, encryption service or connection to real websites. The generator is predictable demo logic and must never be used for real passwords. Auto-lock is a simulated preference. **Reset demo** in Settings returns to Quick Start.

## Structure

- `src/demo.ts`: fictional accounts, password generation and status derivation.
- `src/useDemo.ts`: centralized session state and vault actions.
- `src/App.tsx`: screens and shared interaction components.
- `src/styles.css`: mobile layout, product colors and responsive app shell.
- `tests/prototype.spec.ts`: browser checks for the main flow and supporting interactions.

Fonts are bundled locally; no font service or API credentials are required. This repository is separate from the Emma prototype.

## GitHub Pages

The Vite base path is `/ju-secure-karim/`. `.github/workflows/deploy-pages.yml` installs locked dependencies with Node 24, builds the app, and deploys `dist/` to GitHub Pages on every push to `main`. It can also be run manually.

In [repository Settings → Pages](https://github.com/axeRob/ju-secure-karim/settings/pages), choose **Build and deployment → Source → GitHub Actions**. A branch or `/docs` folder is not required. If the first workflow run failed before Pages was enabled, open **Actions → Deploy to GitHub Pages → Run workflow**, select `main`, and run it again.

After the workflow succeeds, the site will be available at **https://axerob.github.io/ju-secure-karim/**. No custom secrets are required; deployment uses GitHub's workflow token and OIDC permissions.
