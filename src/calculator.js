// Shared tax engine — runs in Node (build) and the browser (client).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaxEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  function progressiveTax(taxable, brackets) {
    if (taxable <= 0) return 0;
    var tax = 0;
    for (var i = 0; i < brackets.length; i++) {
      var lo = brackets[i][0];
      var rate = brackets[i][1];
      var hi = (i + 1 < brackets.length) ? brackets[i + 1][0] : Infinity;
      if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * rate;
      else break;
    }
    return tax;
  }

  function stateTax(base, st) {
    if (!st || st.type === 'none') return 0;
    base = Math.max(0, base - (st.stdDeduction || 0));
    if (st.type === 'flat') return base * st.rate;
    if (st.type === 'progressive') return progressiveTax(base, st.brackets);
    return 0;
  }

  var PERIODS = { annual: 1, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52 };

  // input: { gross, status:'single'|'married'|'hoh', frequency, pct401k (0..1) }
  function compute(input, fed, st) {
    var gross = Math.max(0, +input.gross || 0);
    var status = input.status || 'single';
    var pct = Math.min(0.9, Math.max(0, +input.pct401k || 0));
    var pre401k = gross * pct;

    var stdDed = fed.standardDeduction[status] || fed.standardDeduction.single;
    var fedTaxable = Math.max(0, gross - pre401k - stdDed);
    var federalTax = progressiveTax(fedTaxable, fed.brackets[status] || fed.brackets.single);

    var f = fed.fica;
    var socialSecurity = Math.min(gross, f.ssWageBase) * f.ssRate;
    var medicare = gross * f.medicareRate;
    var addlThresh = f.addlMedicareThreshold[status] || f.addlMedicareThreshold.single;
    medicare += Math.max(0, gross - addlThresh) * f.addlMedicareRate;
    var fica = socialSecurity + medicare;

    var stateBase = Math.max(0, gross - pre401k);
    var stTax = stateTax(stateBase, st);

    var totalTax = federalTax + fica + stTax;
    var takeHome = gross - totalTax - pre401k; // 401k goes to retirement, not pocket
    var periods = PERIODS[input.frequency] || 26;

    return {
      gross: gross,
      pre401k: pre401k,
      federalTax: federalTax,
      socialSecurity: socialSecurity,
      medicare: medicare,
      fica: fica,
      stateTax: stTax,
      totalTax: totalTax,
      takeHome: takeHome,
      perPaycheck: takeHome / periods,
      effectiveRate: gross > 0 ? totalTax / gross : 0,
      periods: periods
    };
  }

  return { compute: compute, progressiveTax: progressiveTax, stateTax: stateTax, PERIODS: PERIODS };
});
