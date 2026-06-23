# Affiliate monetization plan — TakeHomePayHQ

Affiliate income is the main revenue lever for this site (higher value than display ads).
The CTA block on all pages links to `affiliateUrl` in `config.json` — fill it once you have an approved link, then `git push`.

## Programs to apply to (by value)

| Program | Type | Payout (approx) | How to apply |
|---|---|---|---|
| SmartAsset | Financial-advisor matching | ~$70 / lead | Their partner program (best fit; may want some traffic first) |
| Gusto | Payroll software | ~$100+ / referral | Gusto partner program (relevant to business-owner visitors) |
| QuickBooks Payroll / ADP | Payroll software | Varies | Via FlexOffers / partner programs |
| TurboTax / H&R Block / TaxSlayer | Tax software | Seasonal, high EPC | Via CJ / Impact; apply before Jan–Apr tax season |
| SoFi | Banking / loans | up to ~$1,000 / loan | Via Impact.com |
| High-yield savings / neobanks | Banking | High CPA | Via Impact / FlexOffers |

## Networks (easier approval for newer sites)

- **Impact.com** — large marketplace, many finance brands in one place. Start here.
- **FlexOffers**, **Sovrn Commerce**, **ShareASale**, **CJ (Commission Junction)**.

## Realistic expectations

Like AdSense, premium programs (SmartAsset, direct banks) often want to see some traffic.
With 0 visits at launch, start with networks (Impact/FlexOffers) and re-apply to SmartAsset once
Search Console shows impressions. Your 600+ content pages help during review.

## Impact.com — step-by-step signup

1. Go to **impact.com** → top-right **Sign up** → choose **Partner** (publisher/creator), not Brand.
2. Fill in: name, email, **website `takehomepayhq.com`**, promotional model = **Content/Website**, category = **Personal Finance**.
3. Verify your email and complete the profile (describe your audience: US workers checking take-home pay).
4. Once the account is active: open **Marketplace / Brands** → search `SoFi`, `tax`, `payroll`, `finance` → click **Apply** on each relevant program (each brand reviews separately).
5. After approval, open the program → **Create link / Get tracking link** for the brand's landing page.
6. Send that link to update `config.json` → `affiliateUrl` → `git push`. Done — it goes live on every page.

## Wiring the link

```json
// config.json
"affiliateUrl": "https://your-tracking-link-here",
"affiliateText": "Compare tax software & high-yield savings accounts"
```
Then: `npm run build` (optional local check) → `git add . && git commit -m "Add affiliate link" && git push`.

## Tip — match the offer to the page

Later you can make the CTA contextual: payroll software on `/take-home-pay/*` business-heavy pages,
tax software during tax season, savings accounts everywhere. Ask and we can split the CTA by page type.
