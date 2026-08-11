# Personal Portfolio

Static site — HTML, CSS, and vanilla JS. No build step, no dependencies.

```
portfolio/
├── index.html              all copy and content
├── assets/
│   ├── css/styles.css      design tokens + all styling
│   ├── js/main.js          LINKS object + interactions
│   ├── img/                headshot.jpg goes here
│   └── resume/             resume.pdf goes here
└── README.md
```

## Run it locally

Double-click `index.html`. That's it.

For a local server (closer to how it behaves when deployed):

```powershell
cd portfolio
python -m http.server 8000
```

Then open http://localhost:8000

## Customize

| What to change | Where |
|---|---|
| LinkedIn, email, résumé link | `assets/js/main.js` — the `LINKS` block at the top |
| Headshot | Save as `assets/img/headshot.jpg` |
| Résumé PDF | Save as `assets/resume/resume.pdf` |
| All headings, bullets, project copy | `index.html` — search for `EDIT:` comments |
| Accent color, spacing, fonts | `assets/css/styles.css` — the token block at the top |

The accent color is defined twice — once under `[data-theme="dark"]` and once
under `[data-theme="light"]`. Change both.

## Deploy

**Netlify (fastest):** go to app.netlify.com/drop and drag the `portfolio`
folder onto the page. Live in about 10 seconds.

**GitHub Pages:** push this folder to a repo → Settings → Pages → deploy from
`main`, root. Or name the repo `<username>.github.io` for a clean URL.

**Vercel:** `npx vercel` from this folder, accept the defaults.

All three are free and support a custom domain.
