# See It, Sort It, Coach It

A mobile-first behavior-basics learning activity for Granite School District instructional coaches. The complete experience runs in the browser and stores progress in session storage only—there is no account, database, or backend.

## Local setup

Requires Node.js 20 or later.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```bash
npm run lint
npm run build
npm run preview
```

## Deploy to Vercel

1. Import this repository in Vercel.
2. Keep the detected **Vite** framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. No environment variables or server configuration are required.

The quick guide PDF is generated entirely in the participant's browser with jsPDF. Session answers are cleared when the browser session ends; participants can also choose **Try it again** on the results screen.

Dependency versions are pinned in `package.json` and `package-lock.json` so local and Vercel builds use the same toolchain.
