const fs = require('fs');
const path = require('path');
const TaxEngine = require('./src/calculator.js');

const cfg = JSON.parse(fs.readFileSync('config.json'));
const SITE = (process.env.SITE_URL || cfg.siteUrl || 'https://example.com').replace(/\/$/, '');
const NAME = cfg.siteName || 'TakeHomePay';
const YEAR = 2026;
const fed = JSON.parse(fs.readFileSync('data/federal.json'));
const statesData = JSON.parse(fs.readFileSync('data/states.json')).states;
const SALARIES = [50000, 60000, 75000, 100000, 150000];
const statesBySlug = {}; statesData.forEach(s => statesBySlug[s.slug] = s);
const HOURLY_RATES = [15, 18, 20, 22, 25, 30, 35, 40, 45, 50, 60, 75];
const COMPARE_ANCHORS = ['california','texas','new-york','florida','washington','illinois'];
const DIST = process.env.OUT || 'dist';

const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function rmrf(p){ if(fs.existsSync(p)){ try{ fs.rmSync(p,{recursive:true,force:true}); }catch(e){ console.warn('warn: could not clear '+p+' ('+e.code+') — writing over it'); } } }
function write(rel, html){ const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f, html); }

// ----- monetization / analytics injection -----
function headScripts() {
  let h = '';
  if (cfg.gscVerification) h += `<meta name="google-site-verification" content="${esc(cfg.gscVerification)}">\n`;
  if (cfg.ga4) h += `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(cfg.ga4)}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(cfg.ga4)}');</script>\n`;
  if (cfg.adsenseClient) h += `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.adsenseClient)}" crossorigin="anonymous"></script>\n`;
  return h;
}
function adUnit() {
  if (cfg.adsenseClient && cfg.adSlot)
    return `<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(cfg.adsenseClient)}" data-ad-slot="${esc(cfg.adSlot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`;
  return `<div class="ad">Ad slot — set "adsenseClient" and "adSlot" in config.json</div>`;
}
function cta() {
  return `<div class="cta"><b>Want to keep more of your paycheck?</b> ${esc(cfg.affiliateText||'')} <a href="${esc(cfg.affiliateUrl||'#')}" rel="sponsored nofollow">See options →</a></div>`;
}

function layout({ title, desc, canonical, jsonld, body, embed }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${canonical}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${SITE}${canonical}">
<link rel="stylesheet" href="/assets/styles.css">
${headScripts()}${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head><body>
<header class="site"><div class="wrap"><a href="/">${esc(NAME)}</a>
<nav><a href="/">Calculator</a><a href="/#states">States</a><a href="/about/">About</a></nav></div></header>
<main class="wrap">${body}</main>
<footer class="site"><div class="wrap">
<p>${esc(NAME)} provides free take-home pay estimates for ${YEAR}. Estimates only — not tax advice.</p>
<p><a href="/about/">About</a> · <a href="/privacy/">Privacy Policy</a> · <a href="/terms/">Terms</a> · <a href="/contact/">Contact</a> · <a href="/#states">All states</a></p>
<p>Sources: IRS, SSA, Tax Foundation</p>
<p>© ${YEAR} ${esc(NAME)}</p></div></footer>
<script>window.__FED__=${JSON.stringify(fed)};${embed || ''}</script>
<script src="/assets/calculator.js"></script>
<script src="/assets/app.js"></script>
</body></html>`;
}

function calcCard({ withStateSelector, defaultState, defaultSalary }) {
  const stateOptions = statesData.map(s => `<option value="${s.slug}"${s.slug===defaultState?' selected':''}>${esc(s.name)}</option>`).join('');
  return `<div class="grid">
<div class="card"><h3 style="margin-top:0">Your details</h3>
<label for="thp-salary">Annual gross salary ($)</label>
<input id="thp-salary" type="number" value="${defaultSalary||75000}" min="0" step="1000">
${withStateSelector ? `<label for="thp-state">State</label><select id="thp-state">${stateOptions}</select>` : ''}
<label for="thp-status">Filing status</label>
<select id="thp-status"><option value="single">Single</option><option value="married">Married filing jointly</option><option value="hoh">Head of household</option></select>
<label for="thp-frequency">Pay frequency</label>
<select id="thp-frequency"><option value="biweekly">Bi-weekly (26/yr)</option><option value="weekly">Weekly (52/yr)</option><option value="semimonthly">Semi-monthly (24/yr)</option><option value="monthly">Monthly (12/yr)</option><option value="annual">Annual</option></select>
<label for="thp-401k">401(k) contribution (% of gross)</label>
<input id="thp-401k" type="number" value="0" min="0" max="90" step="1">
</div>
<div class="card"><div class="result-sub">Estimated take-home pay (annual)</div>
<div class="result-big" id="r-takehome">$0</div>
<div class="result-sub"><span id="r-percheck">$0</span> per paycheck · effective tax rate <span id="r-eff">0%</span></div>
<div class="bars">
<div class="bar-row"><span>Take-home</span><div class="bar-track"><div class="bar-fill takehome" id="bar-takehome"></div></div></div>
<div class="bar-row"><span>Federal</span><div class="bar-track"><div class="bar-fill federal" id="bar-federal"></div></div></div>
<div class="bar-row"><span>FICA</span><div class="bar-track"><div class="bar-fill fica" id="bar-fica"></div></div></div>
<div class="bar-row"><span>State</span><div class="bar-track"><div class="bar-fill state" id="bar-state"></div></div></div>
</div>
<table class="breakdown">
<tr><td>Gross salary</td><td id="r-gross">$0</td></tr>
<tr><td>Federal income tax</td><td id="r-federal">$0</td></tr>
<tr><td>Social Security</td><td id="r-ss">$0</td></tr>
<tr><td>Medicare</td><td id="r-medicare">$0</td></tr>
<tr><td>State income tax</td><td id="r-state">$0</td></tr>
<tr><td>401(k) contribution</td><td id="r-401k">$0</td></tr>
<tr class="total"><td>Total tax</td><td id="r-total">$0</td></tr>
</table></div></div>`;
}

const DISC = `<div class="disclaimer"><b>Disclaimer:</b> These are ${YEAR} estimates for educational purposes, not tax or financial advice. Federal &amp; FICA figures use IRS/SSA ${YEAR} data; state figures use single-filer brackets and exclude local taxes. Your actual taxes depend on deductions, credits, and local taxes.</div>`;
function stateNote(st){ return st && st.note ? `<div class="disclaimer" style="background:#eef5ff;border-color:#cfe0f5;color:#33506e"><b>${esc(st.name)} note:</b> ${esc(st.note)}</div>` : ''; }

function faq(stateName, sample) {
  const items = [
    [`How much is take-home pay on $75,000 in ${stateName}?`, `For a single filer in ${stateName} earning $75,000 in ${YEAR}, estimated take-home pay is about ${usd(sample.takeHome)} per year (${usd(sample.perPaycheck)} bi-weekly), after federal income tax, Social Security, Medicare, and state income tax.`],
    [`What taxes are taken out of my paycheck in ${stateName}?`, `Federal income tax, Social Security (6.2% up to ${usd(fed.fica.ssWageBase)}), Medicare (1.45%), and ${stateName} state income tax where applicable.`],
    [`How is this calculated?`, `We apply ${YEAR} IRS federal brackets and the standard deduction, FICA payroll taxes, and ${stateName} state income tax rules to your gross salary.`]
  ];
  const html = `<div class="faq"><h2>Frequently asked questions</h2>${items.map(([q,a])=>`<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</div>`;
  const ld = { "@context":"https://schema.org","@type":"FAQPage","mainEntity": items.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}})) };
  return { html, ld };
}

function statePage(st) {
  const sample = TaxEngine.compute({ gross: 75000, status: 'single', frequency: 'biweekly', pct401k: 0 }, fed, st);
  const canonical = `/take-home-pay/${st.slug}/`;
  const title = `${st.name} Take-Home Pay Calculator ${YEAR} — Paycheck After Taxes`;
  const desc = `Calculate your ${st.name} take-home pay for ${YEAR}. See your paycheck after federal, Social Security, Medicare, and ${st.name} state taxes. Free and instant.`;
  const f = faq(st.name, sample);
  const taxLine = st.type === 'none'
    ? `${st.name} has <b>no state income tax</b>, so your paycheck keeps more than in most states.`
    : `${st.name} levies a state income tax, which is included in the estimate below.`;
  const otherStates = statesData.filter(s=>s.slug!==st.slug).slice(0,12).map(s=>`<a href="/take-home-pay/${s.slug}/">${esc(s.name)}</a>`).join('');
  const salaryChips = SALARIES.map(a=>`<a href="/salary/${a}/${st.slug}/">$${a.toLocaleString()} in ${esc(st.name)}</a>`).join('');
  const jsonld = [
    { "@context":"https://schema.org","@type":"WebApplication","name":`${st.name} Take-Home Pay Calculator`,"applicationCategory":"FinanceApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0"} },
    { "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":st.name+" Take-Home Pay","item":SITE+canonical}]},
    f.ld
  ];
  const body = `
<p class="crumbs"><a href="/">Home</a> › ${esc(st.name)} take-home pay</p>
<h1>${st.name} Take-Home Pay Calculator (${YEAR})</h1>
<p class="lead">Estimate your paycheck after federal, FICA, and ${st.name} state taxes. ${st.type==='none'?'<span class="tag">No state income tax</span>':''}</p>
${calcCard({ withStateSelector:false, defaultState:st.slug, defaultSalary:75000 })}
${adUnit()}
<h2>How much is take-home pay in ${st.name}?</h2>
<p>${taxLine} For example, a single filer earning <b>$75,000</b> in ${st.name} in ${YEAR} takes home roughly <b>${usd(sample.takeHome)}</b> per year — about <b>${usd(sample.perPaycheck)}</b> per bi-weekly paycheck, an effective tax rate of <b>${(sample.effectiveRate*100).toFixed(1)}%</b>. Adjust the salary, filing status, and 401(k) above to match your situation.</p>
${cta()}
<h2>Popular salaries in ${st.name}</h2>
<div class="chips">${salaryChips}</div>
${stateNote(st)}
${f.html}
<h2>Take-home pay in other states</h2>
<div class="chips">${otherStates}</div>
${DISC}`;
  write(`take-home-pay/${st.slug}/index.html`, layout({ title, desc, canonical, jsonld, body, embed:`window.__STATE__=${JSON.stringify(st)};` }));
  return canonical;
}

function salaryPage(amount, st) {
  const sample = TaxEngine.compute({ gross: amount, status:'single', frequency:'biweekly', pct401k:0 }, fed, st);
  const canonical = `/salary/${amount}/${st.slug}/`;
  const title = `$${amount.toLocaleString()} After Taxes in ${st.name} (${YEAR}) — Take-Home Pay`;
  const desc = `What is $${amount.toLocaleString()} after taxes in ${st.name}? Estimated take-home pay is ${usd(sample.takeHome)}/yr (${usd(sample.perPaycheck)} bi-weekly) for ${YEAR}.`;
  const jsonld = [{ "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":st.name,"item":SITE+`/take-home-pay/${st.slug}/`},
      {"@type":"ListItem","position":3,"name":`$${amount} after taxes`,"item":SITE+canonical}]}];
  const others = SALARIES.filter(a=>a!==amount).map(a=>`<a href="/salary/${a}/${st.slug}/">$${a.toLocaleString()}</a>`).join('');
  const body = `
<p class="crumbs"><a href="/">Home</a> › <a href="/take-home-pay/${st.slug}/">${esc(st.name)}</a> › $${amount.toLocaleString()} after taxes</p>
<h1>$${amount.toLocaleString()} After Taxes in ${st.name} (${YEAR})</h1>
<p class="lead">A single filer earning $${amount.toLocaleString()} in ${st.name} takes home about <b>${usd(sample.takeHome)}</b> per year.</p>
${calcCard({ withStateSelector:false, defaultState:st.slug, defaultSalary:amount })}
${adUnit()}
<h2>Breakdown of $${amount.toLocaleString()} in ${st.name}</h2>
<p>Estimated federal income tax ${usd(sample.federalTax)}, Social Security ${usd(sample.socialSecurity)}, Medicare ${usd(sample.medicare)}, ${st.name} state tax ${usd(sample.stateTax)} — total tax ${usd(sample.totalTax)} (${(sample.effectiveRate*100).toFixed(1)}%). That leaves <b>${usd(sample.takeHome)}</b> take-home, or ${usd(sample.perPaycheck)} per bi-weekly paycheck.</p>
${cta()}
${stateNote(st)}
<h2>Other salaries in ${st.name}</h2>
<div class="chips">${others} <a href="/take-home-pay/${st.slug}/">All salaries →</a></div>
${DISC}`;
  write(`salary/${amount}/${st.slug}/index.html`, layout({ title, desc, canonical, jsonld, body, embed:`window.__STATE__=${JSON.stringify(st)};` }));
  return canonical;
}

function homePage() {
  const allStatesMap = {}; statesData.forEach(s=>allStatesMap[s.slug]=s);
  const list = statesData.map(s=>`<a href="/take-home-pay/${s.slug}/">${esc(s.name)}${s.type==='none'?' ★':''}</a>`).join('');
  const title = `Take-Home Pay Calculator ${YEAR} — Paycheck After Taxes (All 50 States)`;
  const desc = `Free ${YEAR} take-home pay calculator. Enter your salary and state to see your paycheck after federal, Social Security, Medicare, and state taxes.`;
  const jsonld = { "@context":"https://schema.org","@type":"WebApplication","name":NAME,"applicationCategory":"FinanceApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0"} };
  const body = `
<h1>Take-Home Pay Calculator (${YEAR})</h1>
<p class="lead">See your real paycheck after federal, Social Security, Medicare, and state income taxes. Pick your state, enter your salary, get instant results.</p>
${calcCard({ withStateSelector:true, defaultState:'california', defaultSalary:75000 })}
${adUnit()}
<h2 id="states">Take-home pay by state</h2>
<p>Choose your state for a dedicated calculator and breakdown. States marked ★ have no state income tax.</p>
<div class="statelist">${list}</div>
${cta()}
<h2>Salary tools &amp; comparisons</h2>
<p>Convert an hourly wage to an annual salary, or compare take-home pay between states.</p>
<div class="chips">${[15,20,25,30,40,50].map(r=>`<a href="/hourly-to-salary/${r}-per-hour/">$${r}/hour to salary</a>`).join('')}</div>
<div class="chips"><a href="/compare/california-vs-texas/">California vs Texas</a> <a href="/compare/new-york-vs-florida/">New York vs Florida</a> <a href="/compare/california-vs-washington/">California vs Washington</a> <a href="/compare/illinois-vs-texas/">Illinois vs Texas</a></div>
<h2>How the calculator works</h2>
<p>We apply ${YEAR} IRS federal income-tax brackets and the standard deduction, then FICA payroll taxes — Social Security (6.2% up to ${usd(fed.fica.ssWageBase)}) and Medicare (1.45%, plus 0.9% above ${usd(200000)}) — and finally your state's income tax. Pre-tax 401(k) contributions reduce income-tax (but not FICA).</p>
${DISC}`;
  write('index.html', layout({ title, desc, canonical:'/', jsonld, body, embed:`window.__ALLSTATES__=${JSON.stringify(allStatesMap)};window.__STATE__=${JSON.stringify(allStatesMap['california'])};` }));
}

function aboutPage(){
  const title = `About & Methodology — ${NAME}`;
  const body = `<h1>About &amp; Methodology</h1>
<p class="lead">${esc(NAME)} gives free, instant take-home pay estimates for ${YEAR}.</p>
<h2>Data sources</h2>
<p>Federal income-tax brackets and the standard deduction come from the IRS (Revenue Procedure 2025-32, ${YEAR}). FICA rates and the Social Security wage base ($${fed.fica.ssWageBase.toLocaleString()}) come from the SSA/IRS. State income-tax rates are compiled from the Tax Foundation and state Departments of Revenue.</p>
<h2>Method</h2>
<p>Take-home pay = gross − federal income tax − Social Security − Medicare − state income tax − pre-tax 401(k). Federal and state income tax apply the standard deduction; FICA applies to gross wages. State income tax uses single-filer brackets and excludes local/municipal taxes.</p>
<div class="disclaimer"><b>Important:</b> Estimates only, not tax advice. Verify with your state's Department of Revenue or a tax professional before relying on these figures.</div>`;
  write('about/index.html', layout({ title, desc:'How the take-home pay calculator works and where the data comes from.', canonical:'/about/', body }));
}

function notFound(){
  const body = `<h1>Page not found</h1><p class="lead">That page doesn't exist. Try the <a href="/">take-home pay calculator</a> or pick your <a href="/#states">state</a>.</p>`;
  write('404.html', layout({ title:`404 — ${NAME}`, desc:'Page not found', canonical:'/404.html', body }));
}


function legalPage(slug, title, h1, sections){
  const body = `<h1>${h1}</h1>` + sections.map(([h,p])=> (h?`<h2>${h}</h2>`:'') + `<p>${p}</p>`).join('');
  write(`${slug}/index.html`, layout({ title, desc: h1 + ' — ' + NAME, canonical:`/${slug}/`, body }));
  return `/${slug}/`;
}
function privacyPage(){
  return legalPage('privacy', `Privacy Policy — ${NAME}`, 'Privacy Policy', [
    ['', `${esc(NAME)} ("we", "us") operates ${SITE}. This page explains what data we handle when you use our free take-home pay calculator.`],
    ['Information we collect', `The calculator runs entirely in your browser. Salary and other figures you enter are processed on your device and are not sent to or stored on our servers. We do not require accounts and do not collect names, emails, or payment details.`],
    ['Analytics', `We use Google Analytics 4 to understand aggregate, anonymous usage (pages viewed, country, device type). Google may set cookies for this purpose. See Google&#39;s Privacy Policy at https://policies.google.com/privacy.`],
    ['Advertising', `We may display ads through Google AdSense and other partners. Third-party vendors, including Google, use cookies to serve ads based on prior visits to this and other websites. You can opt out of personalized advertising via https://www.google.com/settings/ads.`],
    ['Affiliate links', `Some outbound links are affiliate links; we may earn a commission if you sign up or purchase, at no extra cost to you. This does not affect the calculator&#39;s results.`],
    ['Your choices', `You can disable cookies in your browser settings and opt out of Google Analytics using the Google Analytics Opt-out Browser Add-on.`],
    ['Contact', `Questions? See our Contact page.`],
  ]);
}
function termsPage(){
  return legalPage('terms', `Terms of Use — ${NAME}`, 'Terms of Use', [
    ['', `By using ${SITE} you agree to these terms.`],
    ['Estimates only — not advice', `${esc(NAME)} provides free educational estimates of take-home pay for the ${YEAR} tax year. Results are not tax, legal, or financial advice. Federal and FICA figures use IRS/SSA data; state figures use single-filer brackets and exclude local taxes. Your actual taxes depend on deductions, credits, and local rules. Verify with a qualified professional before relying on any figure.`],
    ['No warranty', `The site is provided "as is" without warranties of any kind. We do not guarantee accuracy, completeness, or availability, and are not liable for any loss arising from use of the calculator.`],
    ['Affiliate disclosure', `Some links are affiliate links and we may earn a commission. This never changes the numbers the calculator shows.`],
    ['Changes', `We may update these terms or the underlying tax data at any time, including each new tax year.`],
  ]);
}
function contactPage(){
  const body = `<h1>Contact</h1><p class="lead">Questions, corrections, or feedback about ${esc(NAME)}?</p>`+
    `<p>Email: <a href="mailto:merchant2210@gmail.com">merchant2210@gmail.com</a></p>`+
    `<p>We welcome reports of any tax-data inaccuracies so we can keep the calculator reliable.</p>`;
  write('contact/index.html', layout({ title:`Contact — ${NAME}`, desc:`Contact ${NAME}`, canonical:'/contact/', body }));
  return '/contact/';
}


function hourlyPage(rate){
  const annual = rate*2080;
  const canonical = `/hourly-to-salary/${rate}-per-hour/`;
  const title = `$${rate} an Hour Is How Much a Year? (After Taxes, ${YEAR})`;
  const desc = `$${rate} an hour is $${annual.toLocaleString()} a year before taxes. See your take-home pay after federal, FICA, and state taxes with our free ${YEAR} calculator.`;
  const allStatesMap = {}; statesData.forEach(s=>allStatesMap[s.slug]=s);
  const jsonld = [{ "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
    {"@type":"ListItem","position":2,"name":`$${rate}/hour to salary`,"item":SITE+canonical}]}];
  const others = HOURLY_RATES.filter(r=>r!==rate).map(r=>`<a href="/hourly-to-salary/${r}-per-hour/">$${r}/hr</a>`).join('');
  const body = `
<p class="crumbs"><a href="/">Home</a> &#8250; $${rate} an hour to salary</p>
<h1>$${rate} an Hour Is How Much a Year?</h1>
<p class="lead">$${rate} per hour is <b>$${annual.toLocaleString()} per year</b> (40 hours/week &times; 52 weeks), before taxes.</p>
<table class="breakdown">
<tr><td>Hourly</td><td>$${rate.toLocaleString()}</td></tr>
<tr><td>Weekly (40 hrs)</td><td>$${(rate*40).toLocaleString()}</td></tr>
<tr><td>Bi-weekly</td><td>$${(rate*80).toLocaleString()}</td></tr>
<tr><td>Monthly</td><td>$${Math.round(annual/12).toLocaleString()}</td></tr>
<tr class="total"><td>Annual (gross)</td><td>$${annual.toLocaleString()}</td></tr>
</table>
${adUnit()}
<h2>$${rate} an hour after taxes</h2>
<p>Your take-home depends on your state and filing status. Use the calculator below &mdash; it&#39;s pre-filled with $${annual.toLocaleString()}.</p>
${calcCard({ withStateSelector:true, defaultState:'california', defaultSalary:annual })}
${cta()}
<h2>Other hourly rates</h2>
<div class="chips">${others}</div>
${DISC}`;
  write(`hourly-to-salary/${rate}-per-hour/index.html`, layout({ title, desc, canonical, jsonld, body, embed:`window.__ALLSTATES__=${JSON.stringify(allStatesMap)};window.__STATE__=${JSON.stringify(allStatesMap['california'])};` }));
  return canonical;
}

function comparePage(a, b){
  const amounts=[50000,75000,100000];
  const rows = amounts.map(amt=>{
    const ra=TaxEngine.compute({gross:amt,status:'single',frequency:'biweekly',pct401k:0},fed,a);
    const rb=TaxEngine.compute({gross:amt,status:'single',frequency:'biweekly',pct401k:0},fed,b);
    const diff=ra.takeHome-rb.takeHome;
    return {amt,ra,rb,diff,winner: diff===0?'tie':(diff>0?a.name:b.name)};
  });
  const mid=rows[1];
  const canonical=`/compare/${a.slug}-vs-${b.slug}/`;
  const title=`${a.name} vs ${b.name} Take-Home Pay (${YEAR})`;
  const desc=`Compare take-home pay in ${a.name} vs ${b.name} for ${YEAR}. On $75,000, ${mid.winner==='tie'?'both are about equal':mid.winner+' keeps about $'+Math.abs(Math.round(mid.diff)).toLocaleString()+' more per year'}.`;
  const jsonld=[{ "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
    {"@type":"ListItem","position":2,"name":`${a.name} vs ${b.name}`,"item":SITE+canonical}]}];
  const tr = rows.map(r=>`<tr><td>$${r.amt.toLocaleString()}</td><td>${usd(r.ra.takeHome)}</td><td>${usd(r.rb.takeHome)}</td><td>${r.diff>=0?'+':'-'}${usd(Math.abs(r.diff))} (${esc(r.winner)})</td></tr>`).join('');
  const body=`
<p class="crumbs"><a href="/">Home</a> &#8250; ${esc(a.name)} vs ${esc(b.name)}</p>
<h1>${a.name} vs ${b.name}: Take-Home Pay (${YEAR})</h1>
<p class="lead">On a $75,000 salary, a single filer keeps about <b>${usd(Math.abs(mid.diff))}</b> ${mid.winner==='tie'?'the same in both':'more in '+esc(mid.winner)} per year.</p>
${adUnit()}
<h2>Side-by-side comparison (take-home after taxes)</h2>
<table class="breakdown">
<tr><td><b>Gross salary</b></td><td><b>${esc(a.name)}</b></td><td><b>${esc(b.name)}</b></td><td><b>Difference</b></td></tr>
${tr}
</table>
<p>${esc(a.name)} ${a.type==='none'?'has <b>no state income tax</b>':'levies a state income tax'}; ${esc(b.name)} ${b.type==='none'?'has <b>no state income tax</b>':'levies a state income tax'}. Figures are single-filer estimates after federal, FICA, and state taxes; local taxes excluded.</p>
${cta()}
<h2>Full calculators</h2>
<div class="chips"><a href="/take-home-pay/${a.slug}/">${esc(a.name)} calculator</a> <a href="/take-home-pay/${b.slug}/">${esc(b.name)} calculator</a></div>
${DISC}`;
  write(`compare/${a.slug}-vs-${b.slug}/index.html`, layout({ title, desc, canonical, jsonld, body }));
  return canonical;
}

// ---------- Build ----------
rmrf(DIST);
fs.mkdirSync(DIST, { recursive:true });
fs.mkdirSync(path.join(DIST,'assets'), { recursive:true });
fs.copyFileSync('assets/styles.css', path.join(DIST,'assets/styles.css'));
fs.copyFileSync('assets/app.js', path.join(DIST,'assets/app.js'));
fs.copyFileSync('src/calculator.js', path.join(DIST,'assets/calculator.js'));

const urls = ['/','/about/'];
homePage(); aboutPage(); notFound();
urls.push(privacyPage(), termsPage(), contactPage());
statesData.forEach(s => urls.push(statePage(s)));
statesData.forEach(s => SALARIES.forEach(a => urls.push(salaryPage(a, s))));
HOURLY_RATES.forEach(r => urls.push(hourlyPage(r)));
const seenCmp = new Set();
COMPARE_ANCHORS.forEach(a => statesData.forEach(st => {
  if (st.slug === a) return;
  const key = [a, st.slug].sort().join('|');
  if (seenCmp.has(key)) return; seenCmp.add(key);
  urls.push(comparePage(statesBySlug[a], st));
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${SITE}${u}</loc><changefreq>monthly</changefreq></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST,'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST,'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

// ads.txt — authorized sellers (required by AdSense to protect ad revenue)
if (cfg.adsenseClient) {
  const pub = cfg.adsenseClient.replace(/^ca-/, '');
  fs.writeFileSync(path.join(DIST,'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
}// caching headers (Netlify/Cloudflare Pages)
fs.writeFileSync(path.join(DIST,'_headers'), `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  Cache-Control: public, max-age=3600\n`);

console.log('Pages generated:', urls.length, '| GA4:', cfg.ga4?'on':'off', '| AdSense:', cfg.adsenseClient?'on':'off', '| site:', SITE);
