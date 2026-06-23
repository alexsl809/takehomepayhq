// Client-side calculator. Reads window.__FED__, window.__STATE__, window.__STATES__.
(function () {
  var fed = window.__FED__, st = window.__STATE__;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var pct = function (n) { return (n * 100).toFixed(1) + '%'; };

  function run() {
    if (!fed) return;
    var input = {
      gross: parseFloat($('thp-salary').value) || 0,
      status: $('thp-status').value,
      frequency: $('thp-frequency').value,
      pct401k: (parseFloat($('thp-401k').value) || 0) / 100
    };
    var stateObj = st;
    var sel = $('thp-state');
    if (sel && window.__ALLSTATES__) stateObj = window.__ALLSTATES__[sel.value] || st;
    var r = TaxEngine.compute(input, fed, stateObj);

    $('r-takehome').textContent = fmt(r.takeHome);
    $('r-percheck').textContent = fmt(r.perPaycheck);
    $('r-gross').textContent = fmt(r.gross);
    $('r-federal').textContent = fmt(r.federalTax);
    $('r-ss').textContent = fmt(r.socialSecurity);
    $('r-medicare').textContent = fmt(r.medicare);
    $('r-state').textContent = fmt(r.stateTax);
    $('r-total').textContent = fmt(r.totalTax);
    $('r-eff').textContent = pct(r.effectiveRate);
    if ($('r-401k')) $('r-401k').textContent = fmt(r.pre401k);
    // bar widths
    var g = r.gross || 1;
    function bar(id, v) { var el = $(id); if (el) el.style.width = Math.min(100, v / g * 100) + '%'; }
    bar('bar-takehome', r.takeHome);
    bar('bar-federal', r.federalTax);
    bar('bar-fica', r.fica);
    bar('bar-state', r.stateTax);
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['thp-salary', 'thp-status', 'thp-frequency', 'thp-401k', 'thp-state'].forEach(function (id) {
      var el = $(id); if (el) { el.addEventListener('input', run); el.addEventListener('change', run); }
    });
    run();
  });
})();
