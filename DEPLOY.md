# Deploy guide — Take-Home Pay Calculator

From zero to a live, indexed, monetized site. Steps marked **(you)** need your accounts/payment and must be done by you.

## 0. Configure the site (5 min)

Edit `config.json`:

```json
{
  "siteName": "YourBrand",
  "siteUrl": "https://yourdomain.com",
  "ga4": "",            // fill after step 4
  "adsenseClient": "",  // fill after step 6 (e.g. ca-pub-1234567890123456)
  "adSlot": "",         // ad unit id from AdSense
  "gscVerification": "",// google-site-verification token from step 5
  "affiliateUrl": "#",  // your affiliate link
  "affiliateText": "Compare tax software & high-yield accounts"
}
```

Rebuild any time with `npm run build` (outputs to `dist/`).

## 1. Buy a domain **(you)**

Pick a brandable, keyword-friendly domain (e.g. *paycheckwise.com*, *takehomecalc.com*). Namecheap / Cloudflare Registrar / Porkbun. ~$10/yr. Put it in `config.json` → `siteUrl`.

## 2. Put the code in Git **(you)**

```bash
cd takehome-pay-site
git init && git add . && git commit -m "Take-home pay calculator v1"
# create a repo on GitHub, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 3. Deploy to a host **(you)** — pick one

**Cloudflare Pages (recommended — free, fast, no card):**
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
2. Build command: `node build.js` · Output dir: `dist`.
3. Deploy. Then add your custom domain under the project's *Custom domains* tab.

**Netlify:** New site from Git → it reads `netlify.toml` (`node build.js` → `dist`). Add domain under *Domain settings*.

**Vercel:** Import repo → Framework: Other → Build `node build.js` → Output `dist`.

No-Git option: run `npm run build` locally and drag the `dist/` folder onto Netlify Drop (app.netlify.com/drop).

## 4. Analytics — Google Analytics 4 **(you)**

analytics.google.com → create property → Web data stream for your domain → copy the **Measurement ID** (`G-XXXXXXX`) into `config.json` → `ga4`. Rebuild & redeploy.

## 5. Google Search Console (indexing) **(you)**

1. search.google.com/search-console → add your domain.
2. Verify (HTML-tag method): copy the token into `config.json` → `gscVerification`, rebuild, redeploy, click Verify. (Or verify via DNS at your registrar.)
3. Submit your sitemap: `https://yourdomain.com/sitemap.xml`.
4. Request indexing for the homepage; the rest gets crawled over days/weeks.

## 6. Monetization

**Display ads:**
- Start with **Google AdSense** (apply once you have content + some traffic): adsense.com → add site → after approval, create a Display ad unit → put your `ca-pub-…` in `adsenseClient` and the slot id in `adSlot`. Rebuild.
- At ~25k pageviews/mo move to **Raptive** (higher finance RPM); ~$5k/yr ad revenue unlocks **Mediavine** main.

**Affiliate (the real revenue lever):**
- Apply to finance programs (SmartAsset advisor-match ~$70/lead, SoFi, tax/payroll software). Put your link in `affiliateUrl`. The CTA block on every page uses it.

## 7. Post-launch checklist

- [ ] `config.json` has real domain, GA4, GSC token
- [ ] Site loads on the custom domain over HTTPS (auto on all 3 hosts)
- [ ] `yourdomain.com/sitemap.xml` and `/robots.txt` load
- [ ] Sitemap submitted in Search Console
- [ ] Spot-check 3–4 state pages vs a reference calculator
- [ ] AdSense + affiliate applications submitted
- [ ] Re-verify tax data each new tax year (`data/` files)

## Ongoing

- Add page types to grow the long tail (`hourly-to-salary`, `state-vs-state`) — copy a page function in `build.js`.
- Publish a few guide articles for E-E-A-T.
- Watch Search Console queries; build pages for what people actually search.
