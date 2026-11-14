# Martha Iradukunda — portfolio

Live: https://martha-iradukunda-brand.netlify.app

One folder, one Netlify site: the website **and** its backend (there is no separate server to keep alive).

```
site/                     the website (built from src/ — this is what Netlify publishes)
  index, about, skills, portifolio, blogs, blog, contacts, resume, login, 404, dashboard/
  css/style.css  js/site.js  js/common.js  js/dashboard.js  img/  assets/MarthaRekeraho_Resume.pdf
src/pages, src/partials   page content + the shared menu/footer   →  npm run build
netlify/functions/api.mjs the backend: /api/* and /resume.pdf
lib/                      résumé text format, PDF maker, storage, starter content
tests/                    api.test.mjs (56 checks), site-check.mjs (browser, 60 checks)
tools/                    build, local server, résumé PDF, image optimiser
```

## What the backend does

Data is kept in **Netlify Blobs** (built into Netlify, nothing to configure).

- **Résumé** — edited in Dashboard › Résumé and published: the /resume page and the downloadable PDF (`/resume.pdf`)
  update at once. Or upload your own PDF instead.
- **Blogs** — write, edit, hide and delete articles.
- **Messages** — the contact form; read and delete them in the dashboard.
- **Skills** — the bars and soft skills on /skills.
- **Account** — only the owner signs in (`/login`); change the email and password in Dashboard › Account.

## Work on it

```
npm install
npm run build        # after changing src/pages or src/partials
npm run dev          # http://localhost:8888 (data in .data/)
npm test             # backend + browser checks
```

Deploy: push to the `ft-integration3` branch on GitHub; Netlify builds and publishes it.
