# See It, Sort It, Coach It

A mobile-first behavior-basics learning activity for Granite School District instructional coaches. The complete experience runs in the browser and stores progress in session storage only—there is no account, database, or backend.

## Local setup

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```bash
npm run lint
npm run build
npm run preview
```

## Deploy to GitHub Pages

The production site is published at:

<https://jeforsdick.github.io/abc-coaching-game/>

Vite is configured with `/abc-coaching-game/` as its base path so generated asset URLs work from the repository subpath. The [GitHub Pages workflow](.github/workflows/deploy-pages.yml) runs the lint and production build checks, then publishes the `dist` directory whenever a change is pushed or merged to `main`. It can also be started manually from the Actions tab.

To enable the deployment in the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push or merge a change to `main`, or run the **Deploy to GitHub Pages** workflow manually.

No environment variables or server configuration are required. Browser history navigation is handled by the app without changing the document URL, so it remains within the GitHub Pages repository path.

The quick guide PDF is generated entirely in the participant's browser with jsPDF. Session answers are cleared when the browser session ends; participants can also choose **Try it again** on the results screen.

Direct dependency versions are pinned in `package.json`.
