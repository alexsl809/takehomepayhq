# Take-Home Pay Calculator — programmatic SEO site (US, 2026)

A free paycheck/take-home pay calculator that generates **308 SEO pages** from one template:
51 state pages (`/take-home-pay/<state>/`) + 255 salary×state pages (`/salary/<amount>/<state>/`),
plus an interactive client-side calculator on every page.

This is the MVP for the strategy in `paycheck_launch_plan.docx` / `paycheck_roadmap.xlsx`.

## Configure

Edit `config.json` (site name, domain, GA4 ID, AdSense IDs, affiliate link). Empty fields render safe placeholders. See `DEPLOY.md` for the full launch walkthrough.

## Quick start

```bash
# 1. Build the static site into ./dist
SITE_URL="https://yourdomain.com" npm run build

# 2. Preview locally at http://localhost:8080
npm run preview
```

No framework, no build dependencies — pure Node generator + vanilla JS. `python3` is only used for the local preview server.

## Project structure

```
data/
  federal.json     # 2026 IRS brackets, standard deduction, FICA  (VERIFIED)
  states.json      # 51 jurisdictions: none / flat / progressive   (VERIFY before launch)
src/
  calculator.js    # shared tax engine — runs in Node AND the browser
assets/
  app.js           # client calculator (live recompute on input)
  styles.css       # styling
build.js           # static site generator -> dist/ (+ sitemap.xml, robots.txt)
```

## How the tax engine works

`take-home = gross − federal income tax − Social Security − Medicare − state tax − pre-tax 401(k)`

- **Federal**: 2026 IRS brackets + standard deduction by filing status.
- **FICA**: Social Security 6.2% up to $184,500; Medicare 1.45% + 0.9% over $200k.
- **State**: `none`, `flat` (single rate), or `progressive` (brackets). Edit `data/states.json`.
- Pre-tax 401(k) lowers income-tax base, not FICA.

The same `src/calculator.js` powers both the build-time example numbers (good for SEO) and the live in-browser calculator.

## IMPORTANT — before you go live

1. **State data is verified** against Tax Foundation 2026 single-filer brackets & standard deductions (`"verified": true`). Known limitations to be aware of: (a) single-filer brackets are applied to all filing statuses — add married/HoH state brackets for full accuracy; (b) local/municipal income taxes (NYC, Maryland counties, Ohio/PA local) are NOT included; (c) a few states' credits/exemption phase-outs are approximated (see per-state `note`). Re-verify each new tax year.
2. **Set `SITE_URL`** so canonical tags and the sitemap use your real domain.
3. **Add your ad/affiliate code** at the marked slots:
   - All of this is now driven by `config.json` (GA4, AdSense client/slot, GSC token, affiliate URL) — no code edits needed.
4. **Add analytics**: drop GA4 + Search Console verification into `layout()`.

## Extending (programmatic scale)

- More salary pages: edit `SALARIES` in `build.js`.
- New page types (e.g. `hourly-to-salary`, `state-vs-state`): copy a page function in `build.js`.
- International: add country data files and a new template — same pattern.

## Deploy

- **Netlify**: connect repo; `netlify.toml` already sets `build = node build.js`, `publish = dist`.
- **Vercel / Cloudflare Pages**: build command `node build.js`, output dir `dist`.
- **Any static host**: run `npm run build` and upload `dist/`.

## Disclaimer

Estimates for education only — not tax advice. Verify state figures before relying on them.

Sources: IRS Revenue Procedure 2025-32 (2026 brackets), SSA 2026 wage base, Tax Foundation.
