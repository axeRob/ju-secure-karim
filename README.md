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

The demo starts with 12 fictional student accounts: 6 safe, 4 reused and 2 weak. Spotify and Google share one password; Discord and Netflix share another. GitHub and Reddit have weak passwords.

Fixing Spotify clears both its and Google’s reuse warnings, updating the counts to 8 safe, 2 reused and 2 weak. GitHub remains the next recommended fix. Security offers the same direct fixes.

Every account opens details with its current password masked by default, show/hide, copy and security status. Add Account prepares a unique password before saving, with the same controls and optional regeneration; the exact previewed password is saved. Search, Generator, Settings and the empty-vault path work independently.

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

The Vite base path is `/ju-secure-karim/`. `.github/workflows/deploy-pages.yml` installs locked dependencies with Node 24, builds the app, and publishes the contents of `dist/` to the root of the `gh-pages` branch on every push to `main`. It can also be run manually. The publishing action adds `.nojekyll` so GitHub serves the built files directly.

After the workflow creates `gh-pages`, open [repository Settings → Pages](https://github.com/axeRob/ju-secure-karim/settings/pages). Under **Build and deployment**, select:

- **Source:** Deploy from a branch
- **Branch:** gh-pages
- **Folder:** /(root)

Click **Save**. To publish the branch manually, open **Actions → Deploy to GitHub Pages → Run workflow**, select `main`, and run it.

After GitHub's Pages deployment succeeds, the site will be available at **https://axerob.github.io/ju-secure-karim/**. No Personal Access Token or custom secrets are required: branch publishing uses the automatically supplied `GITHUB_TOKEN` with `contents: write`.

Publishing `gh-pages` and deploying the live Pages site are separate operations. GitHub documents that commits pushed with `GITHUB_TOKEN` do not trigger a Pages build automatically. Select and save the branch source for the first deployment, and check the separate Pages deployment before assuming the live site reflects later branch updates.
