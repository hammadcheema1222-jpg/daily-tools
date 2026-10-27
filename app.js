/* Favorable Chicken – Daily tools
   No login, no server. Everything is saved on this device (localStorage)
   and the app works offline once it has been opened once.
   Use Settings > Download backup to move data to another phone. */
'use strict';

const SHOP = 'Favorable Chicken';

/* ================= tiny helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('fc.' + key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('fc.' + key, JSON.stringify(value)); window.Ops?.noteSaved(key,true); return true; }
    catch { window.Ops?.noteSaved(key,false); toast('Could not save – phone storage is full'); return false; }
  },
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* dates – always local time (the old app used UTC, which broke after midnight in summer) */
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dkey(new Date());
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const weekStart = (k) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); };
const fmtDay = (k, o = { weekday: 'short', day: 'numeric', month: 'short' }) => parseKey(k).toLocaleDateString('en-GB', o);
const fmtLong = (k) => fmtDay(k, { weekday: 'long', day: 'numeric', month: 'long' });
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function relDay(k) {
  const t = today();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  if (k === addDays(t, 1)) return 'Tomorrow';
  return fmtDay(k, { year: 'numeric' }).split(' ').pop();
}

const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[£,\s]/g, '')); return Number.isFinite(n) ? n : 0; };
const money = (n) => (n < -0.004 ? '−' : '') + '£' + Math.abs(n).toFixed(2);
const round2 = (n) => Math.round(n * 100) / 100;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hrs = (n) => (Math.round(n * 100) / 100).toString().replace(/\.0+$/, '') + 'h';

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }, text);
    document.body.append(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied'); } catch { toast('Copy failed – long-press to copy instead'); }
    ta.remove();
  }
}
function whatsapp(text) { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); }
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Downloads are generated locally. The print sheet is also a fallback for unsupported fonts.
async function printDoc(title, sub, bodyHtml, options = {}) {
  let sheet = $('#printSheet');
  if (!sheet) { sheet = h('div', { class: 'print-sheet', id: 'printSheet' }); document.body.append(sheet); }
  sheet.innerHTML = options.plain
    ? `<h2>${esc(title)}</h2><div class="psub">${esc(sub)}</div>${bodyHtml}`
    : `<header class="report-brand">${ART.hen}<div><b>${esc(SHOP)}</b><span>DAILY TOOLS / SHOP RECORDS</span></div></header><h2>${esc(title)}</h2><div class="psub">${esc(sub)}</div>${bodyHtml}<footer class="report-footer">Generated on this device · ${esc(fmtLong(today()))}</footer>`;
  try {
    if (!window.DailyPDF) throw new Error('PDF renderer unavailable');
    toast('Preparing PDF…');
    await window.DailyPDF.download(title, sub, bodyHtml, SHOP, options);
    toast('PDF downloaded');
  } catch (error) {
    console.warn('Direct PDF unavailable; opening print fallback', error);
    toast('Choose Save as PDF in the print dialog');
    window.print();
  }
}

// Illustrated header card at the top of each tab.
function banner(key, title, line, figure) {
  return h('section', { class: 'banner' },
    h('div', { class: 'txt' }, h('h1', {}, title), h('p', {}, line), figure != null ? (figure instanceof Node ? figure : h('div', { class: 'figure' }, figure)) : null),
    h('span', { html: ART[key] || '' }));
}

function dateNav(value, onChange, { step = 1, label } = {}) {
  const input = h('input', { type: 'date', value, 'aria-label': 'Pick a date', onChange: (e) => e.target.value && onChange(e.target.value) });
  return h('div', { class: 'datenav' },
    h('button', { class: 'btn', 'aria-label': 'Previous', onClick: () => onChange(addDays(value, -step)) }, '‹'),
    h('div', { class: 'datenav-mid' },
      h('div', { class: 'when' }, label ? label(value) : fmtLong(value)),
      h('div', { class: 'rel' }, step === 7 ? 'Tap to pick a week' : relDay(value)),
      input),
    h('button', { class: 'btn', 'aria-label': 'Next', onClick: () => onChange(addDays(value, step)) }, '›'));
}

/* ================= item list (shared by Order pad + Stock) ================= */
const DEFAULT_ITEMS = {
  'Drinks': ['Pepsi can', '7UP can', 'Coca-Cola can', 'Mirinda Orange can', 'Dr Pepper can', 'Mirinda Strawberry can', 'Water', 'Pepsi bottle', 'Diet Pepsi bottle', '7UP bottle', 'Tango Orange bottle', 'Fruit Shoot Orange', 'Fruit Shoot Blackcurrant'],
  'Sauce bottles': ['Ketchup Bottle', 'Mayonnaise Bottle', 'Chili Sauce', 'Burger Sauce', 'BBQ Sauce', 'Peri Sauce'],
  'Sauce cups': ['1 oz Sauce Cup', '4 oz Sauce Cup'],
  'Boxes': ['Small Burger Box', 'Large Burger Box', 'FC1 Box', 'FC3 Box', 'FC4 Box'],
  'Chips bags': ['Chips Bags (Small)', 'Chips Bags (Medium)', 'Chips Bags (Large)'],
  'Delivery & packaging': ['White Bags for Customers', 'Delivery Bags / Tags'],
  'Cold room': ['Raw Chicken (Whole)', 'Raw Wings (kg)', 'Qualiko burger fillet', 'Inner Fillet', '9 Cut Chicken', '4 Cut Chicken', '4" Burger Buns', '5" Burger Buns', 'Burger Cheese', 'Pizza Cheese', 'Tortilla Wraps', 'Lettuce', 'Onions', 'Peppers', 'Jalapenos', 'Olives', 'Sweet Corn', 'Mushrooms', 'Pineapple', 'Pepperoni', 'Lemon Dressing'],
  'Pizza & boxes': ['7" Pizza Box', '9" Pizza Box', '12" Pizza Box', 'Foil Paper for wraps', 'Foil bags for peri peri', 'Oil Base for Pans', 'Lining papers'],
  'Frozen': ['Chips (Bags)', 'Beef Burger', 'Fish Burger', 'Veggie Burger', 'Hash Brown', 'Onion Rings', 'Donuts', 'Apple Pie', 'Pizza Chicken', 'Pizza Beef', 'Nuggets', 'Chicken Steak Burger'],
  'Miscellaneous': ['Henny Penny Filter Paper', 'Salt', 'Pepper', 'Veggie Oil', 'Peri Salt', 'Bin Bags', 'Customer Tissues', 'Blue Roll', 'Cleaning Liquids', 'Cleaning Sprays'],
};
function defaultCatalog() {
  const out = []; let i = 0;
  for (const [section, names] of Object.entries(DEFAULT_ITEMS))
    for (const name of names) out.push({ id: 'd' + (i++), section, name, usual: name.startsWith('Chips Bags') ? 5 : 1 });
  return out;
}
let catalog = store.get('catalog', null);
if (!Array.isArray(catalog)) { catalog = defaultCatalog(); store.set('catalog', catalog); }
const saveCatalog = () => store.set('catalog', catalog);
const sections = () => [...new Set(catalog.map((i) => i.section))];

/* ================= DAILY SALES ================= */
const SALES_GROUPS = [
  { title: 'Sales', hint: 'From the till report', fields: [['front', 'Front'], ['delivery', 'Delivery']] },
  { title: 'Delivery platforms', fields: [['jeat', 'Just Eat'], ['uber', 'Uber Eats'], ['delivero', 'Deliveroo'], ['deliveryDrop', 'Delivery Drop'], ['pout', 'P.out']] },
  { title: 'Card machines', fields: [['dojo', 'Dojo'], ['teya', 'Teya']] },
];
const DEDUCT = ['jeat', 'uber', 'delivero', 'deliveryDrop', 'pout', 'dojo', 'teya'];
const DENOMS = [[50, '£50'], [20, '£20'], [10, '£10'], [5, '£5'], [2, '£2'], [1, '£1'], [0.5, '50p'], [0.2, '20p'], [0.1, '10p'], [0.05, '5p'], [0.02, '2p'], [0.01, '1p']];
let salesDate = Ops.businessToday();
let salesChartStyle = 'donut';

const allSales = () => store.get('sales', {});
function getRec(date) {
  const r = allSales()[date];
  return r ? { ...r } : { float: store.get('settings', {}).float ?? '' };
}
function saveRec(date, rec) {
  const all = allSales();
  const hasData = Object.entries(rec).some(([k, v]) => k !== 'float' && k !== 'denoms' && String(v ?? '').trim() !== '');
  if (hasData) all[date] = rec; else delete all[date];
  return store.set('sales', all);
}
function calc(r) {
  const total = num(r.front) + num(r.delivery);
  const ded = DEDUCT.reduce((s, k) => s + num(r[k]), 0);
  const expected = total - ded;
  const counted = String(r.cash ?? '').trim() !== '';
  const takings = num(r.cash) - num(r.float);
  const diff = round2(takings - expected);
  const status = !counted ? 'none' : Math.abs(diff) < 0.005 ? 'ok' : diff > 0 ? 'over' : 'short';
  return { total, ded, expected, counted, takings, diff, status };
}
const VERDICT = { none: 'Count the cash to see the difference', ok: 'Balanced', over: 'Over – more cash than expected', short: 'Short – cash is missing' };

function sevenDaySalesReport(endDate) {
  const all = allSales(); const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(endDate, -i));
  let front = 0, delivery = 0, recorded = 0;
  const rows = days.map((date) => {
    const rec = all[date];
    const label = esc(fmtDay(date, { weekday: 'short', day: 'numeric', month: 'short' }));
    if (!OpsCore.hasSales(rec)) return `<tr><td>${label}</td><td class="r">Not recorded</td><td class="r">Not recorded</td><td class="r">Not recorded</td></tr>`;
    recorded++; front += num(rec.front); delivery += num(rec.delivery);
    return `<tr><td>${label}</td><td class="r">${money(num(rec.front))}</td><td class="r">${money(num(rec.delivery))}</td><td class="r">${money(calc(rec).total)}</td></tr>`;
  }).join('');
  const period = `${fmtDay(days[0], { day: 'numeric', month: 'long', year: 'numeric' })} – ${fmtDay(endDate, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const html = `<table><thead><tr><th>Day</th><th class="r">Front</th><th class="r">Delivery</th><th class="r">Total sales</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>7-day total</td><td class="r">${money(front)}</td><td class="r">${money(delivery)}</td><td class="r">${money(front + delivery)}</td></tr></tfoot></table><p>${recorded} of 7 days have saved records. Days marked Not recorded are excluded from the totals.</p>`;
  return { period, html };
}

function salesText(date, r) {
  const c = calc(r); const lines = [`${SHOP} – Daily sales`, fmtLong(date), ''];
  for (const g of SALES_GROUPS) for (const [k, label] of g.fields) if (num(r[k])) lines.push(`${label}: ${money(num(r[k]))}`);
  lines.push('', `Total sales: ${money(c.total)}`, `Cards & platforms: ${money(c.ded)}`, `Expected cash: ${money(c.expected)}`);
  if (c.counted) {
    lines.push(`Cash counted: ${money(num(r.cash))}`);
    if (num(r.float)) lines.push(`Float kept: ${money(num(r.float))}`);
    lines.push(`Difference: ${c.diff > 0 ? '+' : ''}${money(c.diff)} (${c.status === 'ok' ? 'balanced' : c.status})`);
  }
  if (r.note) lines.push('', `Note: ${r.note}`);
  return lines.join('\n');
}

function renderSales(view) {
  const rec = getRec(salesDate);
  const save = () => { Ops.draft(rec); saveRec(salesDate, rec); refresh(); Ops.refreshClosing(); };
  const moneyInput = (key, label) => h('label', { class: 'field' }, h('span', {}, label),
    h('div', { class: 'money' }, h('input', {
      class: 'input', inputmode: 'decimal', placeholder: '0.00', value: rec[key] ?? '', autocomplete: 'off',
      onInput: (e) => { if(!Ops.inputAmount(e.target))return; rec[key] = e.target.value; save(); },
    })));

  view.append(banner('sales', 'Cash up', 'Enter the till report, count the cash, send it.'));
  view.append(dateNav(salesDate, (d) => { salesDate = d; show('sales'); }));
  Ops.closing(view,salesDate,rec);

  // result card on top: the thing you look at
  const big = h('div', { class: 'big' }); const verdict = h('div', { class: 'verdict' });
  const L = {}; const line = (key, label, strong) => h('div', { class: 'sum-line' + (strong ? ' strong' : '') }, h('span', {}, label), L[key] = h('b'));
  const result = h('section', { class: 'result', 'aria-live': 'polite' },
    h('div', { class: 'label' }, 'Cash difference'), big, verdict,
    h('div', { class: 'sum-lines' },
      line('total', 'Total sales'), line('ded', 'Cards & platforms'), line('expected', 'Expected cash', true), line('takings', 'Cash takings')));
  view.append(result);

  for (const g of SALES_GROUPS) {
    view.append(h('section', { class: 'card' }, h('h2', {}, g.title, g.hint && h('small', {}, g.hint)),
      h('div', { class: 'fields' }, g.fields.map(([k, label]) => moneyInput(k, label)))));
  }

  // cash count
  rec.denoms = rec.denoms || {};
  const denomTotal = h('b');
  const cashInput = h('input', { class: 'input', inputmode: 'decimal', placeholder: '0.00', value: rec.cash ?? '', onInput: (e) => { if(!Ops.inputAmount(e.target))return; rec.cash = e.target.value; save(); } });
  const sumDenoms = () => round2(DENOMS.reduce((s, [v]) => s + v * num(rec.denoms[v]), 0));
  view.append(h('section', { class: 'card' },
    h('h2', {}, 'Cash in the till'),
    h('div', { class: 'fields' },
      h('label', { class: 'field' }, h('span', {}, 'Cash counted'), h('div', { class: 'money' }, cashInput)),
      h('label', { class: 'field' }, h('span', {}, 'Float kept in till'), h('div', { class: 'money' }, h('input', {
        class: 'input', inputmode: 'decimal', placeholder: '0.00', value: rec.float ?? '',
        onInput: (e) => { if(!Ops.inputAmount(e.target))return; rec.float = e.target.value; save(); },
      })))),
    h('p', { class: 'hint' }, 'Float is the change you leave for tomorrow. It gets taken off the counted cash. Leave it empty if you count without the float.'),
    h('details', { class: 'count' },
      h('summary', {}, 'Count notes & coins'),
      h('div', { class: 'denoms' }, DENOMS.map(([v, label]) => h('label', { class: 'field' }, h('span', {}, label),
        h('input', { class: 'input num-input', inputmode: 'numeric', placeholder: '0', value: rec.denoms[v] ?? '',
          onInput: (e) => { if(!Ops.inputAmount(e.target,{integer:true}))return; Ops.draft(rec); rec.denoms[v] = e.target.value; saveRec(salesDate, rec); Ops.refreshClosing(); denomTotal.textContent = money(sumDenoms()); } })))),
      h('div', { class: 'row-between', style: 'padding-bottom:12px' },
        h('div', {}, 'Total ', denomTotal),
        h('button', { class: 'btn small primary', onClick: () => { rec.cash = sumDenoms().toFixed(2); cashInput.value = rec.cash; save(); toast('Cash counted set to ' + money(sumDenoms())); } }, 'Use this total')))));
  denomTotal.textContent = money(sumDenoms());

  view.append(h('section', { class: 'card' }, h('h2', {}, 'Note'),
    h('textarea', { class: 'input', placeholder: 'Why it was short or over, refunds, paid-outs…', onInput: (e) => { Ops.draft(rec); rec.note = e.target.value; saveRec(salesDate, rec); Ops.refreshClosing(); } }, rec.note || '')));

  view.append(h('div', { class: 'btn-row', style: 'margin-bottom:12px' },
    h('button', { class: 'btn whatsapp', onClick: () => whatsapp(salesText(salesDate, rec)) }, 'Send on WhatsApp'),
    h('button', { class: 'btn', onClick: () => copyText(salesText(salesDate, rec)) }, 'Copy'),
    h('button', { class: 'btn', onClick: () => {
      const c = calc(rec); const row = (l, v) => `<tr><td>${esc(l)}</td><td class="r">${money(v)}</td></tr>`;
      let body = '<table><tbody>';
      for (const g of SALES_GROUPS) for (const [k, label] of g.fields) body += row(label, num(rec[k]));
      body += row('Total sales', c.total) + row('Cards & platforms', c.ded) + row('Expected cash', c.expected);
      if (c.counted) body += row('Cash counted', num(rec.cash)) + row('Float kept', num(rec.float)) + row('Cash takings', c.takings);
      body += '</tbody>' + (c.counted ? `<tfoot><tr><td>Difference (${c.status === 'ok' ? 'balanced' : c.status})</td><td class="r">${money(c.diff)}</td></tr></tfoot>` : '') + '</table>';
      if (rec.note) body += `<p><b>Note:</b> ${esc(rec.note)}</p>`;
      printDoc('Daily sales', fmtLong(salesDate), body);
    } }, 'Download PDF'),
    h('button', { class: 'btn danger', onClick: () => { if (confirm(`Clear everything for ${fmtLong(salesDate)}? You can undo this in Records.`)) { if(Ops.trashSale(salesDate)){show('sales');toast('Day moved to Recently deleted in Records');} } } }, 'Clear day')));

  // last 7 days
  const chartBox = h('div');
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Last 7 days', h('small', {}, 'tap a day to open it')), chartBox,
    h('button', { class: 'btn primary', style: 'width:100%;margin-top:16px', onClick: () => {
      const report = sevenDaySalesReport(salesDate);
      printDoc('7-day sales', report.period, report.html);
    } }, 'Download 7-day sales PDF')));

  function drawChart() {
    const all = allSales(); const days = [];
    for (let i = 6; i >= 0; i--) days.push(addDays(salesDate, -i));
    const data = days.map((k) => ({ k, c: OpsCore.hasSales(all[k]) ? calc(all[k]) : null }));
    const max = Math.max(1, ...data.map((d) => (d.c ? d.c.total : 0)));
    const weekTotal = data.reduce((s, d) => s + (d.c ? d.c.total : 0), 0);
    const controls = h('div', { class: 'sales-chart-controls', role: 'group', 'aria-label': 'Sales chart style' },
      ['donut','bars'].map(mode => h('button', { class: 'btn small' + (salesChartStyle === mode ? ' primary' : ''),
        'aria-pressed': String(salesChartStyle === mode), onClick: () => { salesChartStyle = mode; drawChart(); } }, mode === 'donut' ? 'Donut' : 'Bars')));
    const period = h('p', { class: 'hint sales-chart-period' }, `${fmtDay(days[0], {day:'numeric',month:'short',year:'numeric'})} – ${fmtDay(salesDate, {day:'numeric',month:'short',year:'numeric'})}`);
    const recorded = data.filter(d => d.c).length;
    const completed = data.filter(d => d.c && all[d.k].closingStatus === 'completed').length;
    const caption = h('p', { class: 'hint' }, `${recorded}/7 days recorded · ${completed}/7 completed. Missing days are excluded; draft amounts are included. Use the date above to view an older period.`);
    if (salesChartStyle === 'donut') {
      const colors = ['#244f3c','#57816c','#8eaa9a','#b3bb83','#d3ab62','#b87848','#6c747b'];
      let angle = 0;
      const stops = data.filter(d => d.c && d.c.total > 0).map(d => {
        const from = angle; angle += d.c.total / weekTotal * 360;
        return `${colors[days.indexOf(d.k)]} ${from}deg ${angle}deg`;
      });
      const ring = h('div', { class: 'sales-donut', role: 'img',
        'aria-label': weekTotal > 0 ? `Recorded sales ${money(weekTotal)} across ${recorded} days. Each slice shows a day's share; amounts are listed below.` : 'No positive recorded sales in this seven-day period',
        style: `background:${weekTotal > 0 ? 'conic-gradient(' + stops.join(',') + ')' : 'var(--line)'}` },
        h('div', { class: 'sales-donut-center', 'aria-hidden': 'true' }, h('span', {}, '7-day sales'), h('b', {}, money(weekTotal)), h('small', {}, weekTotal > 0 ? 'share by day' : 'no sales to plot')));
      const list = h('div', { class: 'sales-donut-key', 'aria-label': 'Daily sales amounts and shares' }, data.map(({k,c},i) => {
        const share = weekTotal > 0 && c ? (c.total / weekTotal * 100).toFixed(1) + '%' : '—';
        const state = !c ? 'Not recorded' : all[k].closingStatus === 'completed' ? 'Completed' : 'Draft';
        return h('button', { class: 'sales-donut-day' + (k === salesDate ? ' selected' : ''),
          'aria-label': `${fmtLong(k)}: ${c ? money(c.total) + ', ' + share : 'not recorded'}, ${state}. Open day`,
          onClick: () => { salesDate = k; show('sales'); } },
          h('i', { style: `background:${colors[i]}`, 'aria-hidden': 'true' }),
          h('span', { class: 'sales-donut-date' }, h('b', {}, fmtDay(k, {weekday:'short',day:'numeric',month:'short'})), h('small', {}, state)),
          h('span', { class: 'sales-donut-value' }, h('b', {}, c ? money(c.total) : '—'), h('small', {}, share)));
      }));
      chartBox.replaceChildren(controls, period, h('div', { class: 'sales-donut-layout' }, ring, list), caption);
      return;
    }
    chartBox.replaceChildren(controls, period,
      h('div', { class: 'week' }, data.map(({ k, c }) => h('button', {
        class: 'bar' + (k === salesDate ? ' sel' : ''), 'aria-label': `${fmtLong(k)}: ${c ? money(c.total) : 'not recorded'}`,
        onClick: () => { salesDate = k; show('sales'); },
      },
      h('span', { style: 'font-size:11px;font-family:var(--num)' }, c && c.total ? '£' + Math.round(c.total) : ''),
      h('div', { class: 'fill' + (c && c.total ? ' has' : ''), style: `height:${c ? Math.max(4, (c.total / max) * 100) : 4}px` }),
      h('div', { class: 'dot ' + (c ? c.status : '') }),
      h('div', { class: 'd' }, fmtDay(k, { weekday: 'short' }).slice(0, 2))))),
      h('div', { class: 'legend' }, h('span', {}, h('i', { style: 'background:var(--sage)' }), 'Balanced'), h('span', {}, h('i', { style: 'background:var(--amber)' }), 'Over'), h('span', {}, h('i', { style: 'background:var(--ember)' }), 'Short')),
      h('div', { class: 'sum-line', style: 'margin-top:10px' }, h('span', {}, '7-day sales'), h('b', {}, money(weekTotal))), caption);
  }

  function refresh() {
    const c = calc(rec);
    result.className = 'result ' + c.status;
    big.textContent = c.counted ? (c.diff > 0 ? '+' : '') + money(c.diff) : '–';
    verdict.textContent = VERDICT[c.status];
    L.total.textContent = money(c.total); L.ded.textContent = money(c.ded);
    L.expected.textContent = money(c.expected); L.takings.textContent = c.counted ? money(c.takings) : '–';
    drawChart();
  }
  refresh();
  Ops.weekly(view,salesDate);
}

/* ================= STOCK LEDGER ================= */
let stockWeek = weekStart(today());
const stockForm = { type: 'in', date: today() };
const getLedger = () => store.get('ledger', []);

function renderStock(view, embedded) {
  const ledger = getLedger();
  const end = addDays(stockWeek, 6);
  const week = ledger.filter((e) => e.date >= stockWeek && e.date <= end);
  const spend = week.filter((e) => e.type !== 'waste').reduce((s, e) => s + e.qty * e.price, 0);
  const waste = week.filter((e) => e.type === 'waste').reduce((s, e) => s + e.qty * e.price, 0);

  if (!embedded) view.append(dateNav(stockWeek, (d) => { stockWeek = weekStart(d); show(current); },
    { step: 7, label: (k) => `${fmtDay(k, { day: 'numeric', month: 'short' })} – ${fmtDay(addDays(k, 6), { day: 'numeric', month: 'short' })}` }));

  view.append(h('div', { class: 'stats' },
    h('div', { class: 'stat' }, h('div', { class: 'v' }, money(spend)), h('div', { class: 'k' }, 'Spent on deliveries')),
    h('div', { class: 'stat waste' }, h('div', { class: 'v' }, money(waste)), h('div', { class: 'k' }, 'Thrown away (waste)'))));

  // add form
  const names = catalog.map((i) => i.name);
  const suppliers = [...new Set(ledger.map((e) => e.supplier).filter(Boolean))];
  const f = {
    item: h('input', { class: 'input', list: 'itemlist', placeholder: 'Start typing…', autocomplete: 'off' }),
    qty: h('input', { class: 'input num-input', inputmode: 'decimal', placeholder: '1' }),
    price: h('input', { class: 'input', inputmode: 'decimal', placeholder: '0.00' }),
    supplier: h('input', { class: 'input', list: 'supplierlist', placeholder: 'Optional', autocomplete: 'off' }),
    unit: h('input',{class:'input',placeholder:'e.g. bags, kg, cases'}),
    date: h('input', { class: 'input', type: 'date', value: stockForm.date, onChange: (e) => { stockForm.date = e.target.value; } }),
    reason: Ops.wasteReasonInput(),
  };
  const lineTotal = h('b', {}, '£0.00');
  const updTotal = () => { lineTotal.textContent = money(num(f.qty.value || 1) * num(f.price.value)); };
  f.qty.addEventListener('input', updTotal); f.price.addEventListener('input', updTotal);
  f.item.addEventListener('change', () => {
    const last = [...ledger].reverse().find((e) => e.item.toLowerCase() === f.item.value.trim().toLowerCase());
    const known=catalog.find(i=>i.name.toLowerCase()===f.item.value.trim().toLowerCase());if(known){f.unit.value=known.unit||'';if(!f.supplier.value)f.supplier.value=known.supplier||'';}
    if (last) { if (!f.price.value) f.price.value = last.price || ''; if (!f.supplier.value && last.supplier) f.supplier.value = last.supplier; updTotal(); }
  });
  const segBtn = (val, label) => h('button', { type: 'button', 'aria-pressed': String(stockForm.type === val), onClick: () => { stockForm.type = val; show(current); } }, label);

  function add() {
    const item = f.item.value.trim();
    if (!item) { f.item.focus(); toast('Type an item name'); return; }
    if(!Ops.inputAmount(f.qty,{required:true})||!Ops.inputAmount(f.price,{required:true})){toast('Check quantity and price');return;}
    const qty = num(f.qty.value || 1); const price = num(f.price.value);
    if (qty <= 0) { f.qty.focus(); toast('Quantity must be more than 0'); return; }
    const all = getLedger();
    all.push({ id: uid(), date: f.date.value || today(), type: stockForm.type, item, qty, price, unit:f.unit.value.trim(), supplier: f.supplier.value.trim(), reason: stockForm.type==='waste'?f.reason.value:'' });
    store.set('ledger', all);
    stockWeek = weekStart(f.date.value || today());
    toast(stockForm.type === 'waste' ? 'Waste logged' : 'Delivery logged');
    if (current === 'food') foodWeek = stockWeek;
    show(current);
    $('#view input[list=itemlist]')?.focus();
  }

  view.append(h('section', { class: 'card addcard' },
    h('h2', {}, stockForm.type === 'waste' ? 'Log waste' : 'Log a delivery'),
    h('div', { class: 'seg', style: 'margin-bottom:12px' }, segBtn('in', 'Delivery in'), segBtn('waste', 'Waste')),
    h('div', { class: 'fields' },
      h('label', { class: 'field full' }, h('span', {}, 'Item'), f.item),
      h('label', { class: 'field' }, h('span', {}, 'Quantity'), f.qty),
      h('label', { class: 'field' }, h('span', {}, 'Unit'), f.unit),
      h('label', { class: 'field' }, h('span', {}, 'Price each'), h('div', { class: 'money' }, f.price)),
      h('label', { class: 'field' }, h('span', {}, 'Date'), f.date),
      h('label', { class: 'field' }, h('span', {}, 'Supplier'), f.supplier),
      stockForm.type==='waste'?h('label',{class:'field full'},h('span',{},'Waste reason'),f.reason):null),
    h('datalist', { id: 'itemlist' }, names.map((n) => h('option', { value: n }))),
    h('datalist', { id: 'supplierlist' }, suppliers.map((n) => h('option', { value: n }))),
    h('div', { class: 'row-between', style: 'margin-top:12px' },
      h('div', {}, 'Line total ', lineTotal),
      h('button', { class: 'btn primary', onClick: add }, stockForm.type === 'waste' ? 'Add waste' : 'Add delivery')),
    h('p', { class: 'hint' }, 'Last price and supplier fill in by themselves once you have logged an item before.')));

  // top items
  const byItem = {};
  week.filter((e) => e.type !== 'waste').forEach((e) => { byItem[e.item] = (byItem[e.item] || 0) + e.qty * e.price; });
  const top = Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (top.length) {
    const max = top[0][1] || 1;
    view.append(h('section', { class: 'card' }, h('h2', {}, 'Biggest spends this week'),
      h('div', { class: 'hbars' }, top.map(([n, v]) => h('div', { class: 'hb' },
        h('div', { class: 'hb-top' }, h('span', {}, n), h('b', {}, money(v))),
        h('div', { class: 'track' }, h('div', { style: `width:${Math.max(3, (v / max) * 100)}%` })))))));
  }

  // entries
  const list = h('div');
  const days = [...new Set(week.map((e) => e.date))].sort().reverse();
  if (!days.length) list.append(h('div', { class: 'empty' }, 'Nothing itemised this week.'));
  for (const d of days) {
    list.append(h('div', { class: 'day-head' }, fmtLong(d)));
    list.append(h('ul', { class: 'list' }, week.filter((e) => e.date === d).map((e) => h('li', { class: 'li' },
      h('div', { class: 'main' },
        h('div', { class: 'name' }, e.item, e.type === 'waste' && h('span', { class: 'tag' }, 'waste')),
        h('div', { class: 'meta' }, `${e.qty} × ${money(e.price)}`, e.supplier ? ` · ${e.supplier}` : '',e.reason?` · ${e.reason}`:'')),
      h('div', { class: 'amt' }, money(e.qty * e.price)),
      h('button', { class: 'x', 'aria-label': 'Delete ' + e.item, onClick: () => {
        if (!confirm(`Delete ${e.item} (${money(e.qty * e.price)})?`)) return;
        Ops.trashRecord('ledger',e); show(current);
      } }, '×')))));
  }
  const weekText = () => {
    const lines = [`${SHOP} – Stock ledger`, `Week of ${fmtLong(stockWeek)}`, ''];
    for (const d of [...days].reverse()) {
      lines.push(fmtDay(d));
      week.filter((e) => e.date === d).forEach((e) => lines.push(`• ${e.item} ${e.qty} × ${money(e.price)} = ${money(e.qty * e.price)}${e.type === 'waste' ? ' (WASTE)' : ''}${e.supplier ? ' – ' + e.supplier : ''}`));
      lines.push('');
    }
    lines.push(`Deliveries: ${money(spend)}`, `Waste: ${money(waste)}`);
    return lines.join('\n');
  };
  view.append(h('section', { class: 'card' }, h('h2', {}, 'This week', h('small', {}, `${week.length} entries`)), list,
    week.length ? h('div', { class: 'btn-row', style: 'margin-top:12px' },
      h('button', { class: 'btn whatsapp', onClick: () => whatsapp(weekText()) }, 'Send on WhatsApp'),
      h('button', { class: 'btn', onClick: () => copyText(weekText()) }, 'Copy')) : null));
}

/* ================= FOOD SPEND (weekly docket) ================= */
let foodWeek = weekStart(today());
let itemLogOpen = false;
const FOOD_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const getFood = () => store.get('food', {});
const foodTotal = (arr) => (arr || []).reduce((s, v) => s + num(v), 0);
const weekLabel = (k) => `Week of ${fmtDay(k, { weekday: 'short', day: 'numeric', month: 'short' })}`;

function foodText(week, amounts) {
  const lines = [`${SHOP} – Food spend`, weekLabel(week), ''];
  FOOD_DAYS.forEach((d, i) => { if (num(amounts[i])) lines.push(`${fmtDay(addDays(week, i))}: ${money(num(amounts[i]))}`); });
  lines.push('', `Total: ${money(foodTotal(amounts))}`);
  return lines.join('\n');
}

function renderFood(view) {
  const amounts = (getFood()[foodWeek] || ['', '', '', '', '', '', '']).slice();
  while(amounts.length<7)amounts.push('');
  const save = () => {
    const all = getFood();
    if (amounts.some((v) => String(v).trim() !== '')) all[foodWeek] = amounts; else delete all[foodWeek];
    store.set('food', all);
  };
  const fig = h('div', { class: 'figure' });
  view.append(banner('food', 'Food spend', 'Stock bought each day, one docket per week.', fig));
  view.append(dateNav(foodWeek, (d) => { foodWeek = weekStart(d); show('food'); }, { step: 7, label: weekLabel }));

  const totalEl = h('b');
  const t = today();
  const rows = FOOD_DAYS.map((d, i) => {
    const key = addDays(foodWeek, i);
    const input = h('input', { class: 'input', inputmode: 'decimal', placeholder: '0.00', value: amounts[i] || '', autocomplete: 'off', 'aria-label': `${d} spend`,
      onInput: (e) => {
        const v = e.target.value.replace(/[£\s]/g, '');
        if (v !== '' && !/^\d*\.?\d{0,2}$/.test(v)) { e.target.value = amounts[i] || ''; return; }
        amounts[i] = v; save(); upd();
      } });
    return h('div', { class: 'drow' + (key === t ? ' today' : '') },
      h('div', { class: 'dday' }, h('b', {}, d), h('span', {}, fmtDay(key, { day: 'numeric', month: 'short' }))),
      h('div', { class: 'money' }, input));
  });
  view.append(h('section', { class: 'card docket' }, h('h2', {}, 'This week\u2019s docket'), rows,
    h('div', { class: 'docket-total' }, h('span', {}, 'Total this week'), totalEl)));

  const lastWeekEl = h('div', { class: 'v' }); const deltaEl = h('div', { class: 'delta' });
  const avgEl = h('div', { class: 'v' });
  view.append(h('div', { class: 'stats' },
    h('div', { class: 'stat' }, lastWeekEl, h('div', { class: 'k' }, 'Last week'), deltaEl),
    h('div', { class: 'stat' }, avgEl, h('div', { class: 'k' }, 'Average per day'))));

  const chartBox = h('div');
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Last 8 weeks', h('small', {}, 'tap a week to open it')), chartBox));

  view.append(h('div', { class: 'btn-row', style: 'margin-bottom:12px' },
    h('button', { class: 'btn primary', onClick: () => {
      const rowsHtml = FOOD_DAYS.map((d, i) => `<tr><td>${esc(fmtLong(addDays(foodWeek, i)))}</td><td class="r">${money(num(amounts[i]))}</td></tr>`).join('');
      printDoc('Stock food', weekLabel(foodWeek), `<table><thead><tr><th>Day</th><th class="r">Amount</th></tr></thead><tbody>${rowsHtml}</tbody><tfoot><tr><td>Total</td><td class="r">${money(foodTotal(amounts))}</td></tr></tfoot></table>`);
    } }, 'Download PDF'),
    h('button', { class: 'btn whatsapp', onClick: () => whatsapp(foodText(foodWeek, amounts)) }, 'Send on WhatsApp'),
    h('button', { class: 'btn danger', onClick: () => {
      if (!confirm(`Clear the docket for the ${weekLabel(foodWeek).toLowerCase()}?`)) return;
      const all = getFood(); delete all[foodWeek]; store.set('food', all); show('food'); toast('Week cleared');
    } }, 'Clear week')));

  // optional itemised log (deliveries & waste), same week
  const logBox = h('div', { style: 'margin-top:12px' });
  stockWeek = foodWeek;
  renderStock(logBox, true);
  view.append(h('details', { class: 'card fold', open: itemLogOpen, onToggle: (e) => { itemLogOpen = e.target.open; } },
    h('summary', {}, 'Item log \u2013 deliveries & waste'),
    h('p', { class: 'hint', style: 'margin-top:4px' }, 'Optional. Log single items when you want to see what the money went on.'),
    logBox));

  function upd() {
    const total = foodTotal(amounts);
    totalEl.textContent = money(total); fig.textContent = money(total);
    const last = foodTotal(getFood()[addDays(foodWeek, -7)]);
    lastWeekEl.textContent = money(last);
    if (last && total) {
      const pct = Math.round(((total - last) / last) * 100);
      deltaEl.className = 'delta ' + (pct > 0 ? 'up' : 'down');
      deltaEl.textContent = pct === 0 ? 'Same as last week' : `This week ${pct > 0 ? '+' : ''}${pct}%`;
    } else { deltaEl.textContent = ''; }
    const filled = amounts.filter((v) => num(v) > 0).length;
    avgEl.textContent = filled ? money(total / filled) : '\u2013';
    const all = getFood(); const weeks = [];
    for (let i = 7; i >= 0; i--) weeks.push(addDays(foodWeek, -7 * i));
    const vals = weeks.map((k) => (k === foodWeek ? total : foodTotal(all[k])));
    const max = Math.max(1, ...vals);
    chartBox.replaceChildren(h('div', { class: 'week eight' }, weeks.map((k, i) => h('button', {
      class: 'bar' + (k === foodWeek ? ' sel' : ''), 'aria-label': `${weekLabel(k)}: ${money(vals[i])}`,
      onClick: () => { foodWeek = k; show('food'); },
    },
    h('span', { class: 'v' }, vals[i] ? '\u00a3' + Math.round(vals[i]) : ''),
    h('div', { class: 'fill' + (vals[i] ? ' has' : ''), style: `height:${Math.max(4, (vals[i] / max) * 100)}px` }),
    h('div', { class: 'd' }, fmtDay(k, { day: 'numeric', month: 'numeric' }).replace('/', '.'))))));
  }
  upd();
  Ops.wasteSummary(view,foodWeek);
}

/* ================= SHIFT LEDGER ================= */
const getStaff = () => store.get('staff', []);
const getShifts = () => store.get('shifts', []);
const getOpen = () => store.get('open', {});
const toMin = (t) => { const [a, b] = String(t || '0:0').split(':').map(Number); return a * 60 + (b || 0); };
function shiftHours(s) {
  if (!s.start || !s.end) return 0;
  let start = toMin(s.start), end = toMin(s.end);
  if (end < start) end += 1440; // past midnight; identical times are zero, not 24 hours
  return Math.max(0, (end - start - num(s.brk)) / 60);
}
let shiftTimer;
let staffOpen = null; // remembers if the Staff box is open
let period = 'week'; let customFrom = ''; let customTo = '';
const PERIODS = [['week', 'This week'], ['2weeks', 'Last 2 weeks'], ['month', 'This month'], ['custom', 'Custom']];
function periodBounds() {
  const t = today();
  if (period === 'week') { const s = weekStart(t); return [s, addDays(s, 6)]; }
  if (period === '2weeks') { const s = weekStart(addDays(t, -7)); return [s, addDays(s, 13)]; }
  if (period === 'month') { const d = parseKey(t); return [dkey(new Date(d.getFullYear(), d.getMonth(), 1)), dkey(new Date(d.getFullYear(), d.getMonth() + 1, 0))]; }
  const a = customFrom || t, b = customTo || t;
  return a <= b ? [a, b] : [b, a];
}
function updateShift(id, patch) {
  const all = getShifts(); const s = all.find((x) => x.id === id); if (!s) return;
  const message=OpsCore.shiftError({...s,...patch});if(message){toast(message);show('shifts');return;}
  Object.assign(s, patch); store.set('shifts', all); show('shifts');
}

function renderShifts(view) {
  const staff = getStaff(); const open = getOpen();
  const onNow = staff.filter((p) => open[p.id]).length;
  view.append(banner('shifts', 'Shifts', onNow ? `${onNow} on shift right now` : 'Clock in, clock out, see the hours and pay.'));

  // clock board
  const board = h('div', { class: 'staff-grid' });
  if (!staff.length) board.append(h('div', { class: 'empty' }, 'Add your staff at the bottom, then tap Clock in when someone starts.'));
  for (const p of staff) {
    const since = open[p.id] ? new Date(open[p.id]) : null;
    const meta = h('div', { class: 'meta' });
    const upd = () => {
      if (!since) { meta.textContent = 'Not on shift'; return; }
      const m = Math.floor((Date.now() - since) / 60000);
      meta.textContent = `On shift since ${hhmm(since)} \u00b7 ${Math.floor(m / 60)}h ${pad(m % 60)}m`;
    };
    upd(); meta.dataset.live = '1'; meta._upd = upd;
    board.append(h('div', { class: 'staff' + (since ? ' on' : '') },
      h('div', { class: 'avatar' }, (p.name[0] || '?').toUpperCase()),
      h('div', { class: 'main' }, h('div', { class: 'name' }, p.name), meta),
      since
        ? h('button', { class: 'btn', onClick: () => clockOut(p) }, 'Clock out')
        : h('button', { class: 'btn primary', onClick: () => { const o = getOpen(); o[p.id] = new Date().toISOString(); store.set('open', o); toast(`${p.name} clocked in`); show('shifts'); } }, 'Clock in')));
  }
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Clock in / out', h('small', {}, fmtDay(today()))), board));
  clearInterval(shiftTimer);
  shiftTimer = setInterval(() => document.querySelectorAll('[data-live]').forEach((m) => m._upd && m._upd()), 30000);

  function clockOut(p) {
    const o = getOpen(); const since = new Date(o[p.id]); const now = new Date();
    const all = getShifts();
    all.push({ id: uid(), staffId: p.id, name: p.name, date: OpsCore.businessDate(since,store.get('settings',{}).cutoff||'04:00'), start: hhmm(since), end: hhmm(now), brk: 0, rate:p.rate??'' });
    delete o[p.id]; store.set('open', o); store.set('shifts', all);
    toast(`${p.name} clocked out \u2013 ${hrs((now - since) / 3600000)}`);
    show('shifts');
  }

  // pay period
  const [from, to] = periodBounds();
  const shifts = getShifts().filter((s) => s.date >= from && s.date <= to);
  const rangeText = `${fmtDay(from, { weekday: 'short', day: 'numeric', month: 'short' })} \u2013 ${fmtDay(to, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Pay period'),
    h('div', { class: 'chips' }, PERIODS.map(([key, label]) => h('button', { class: 'chip', 'aria-pressed': String(period === key), onClick: () => {
      period = key; if (key === 'custom' && !customFrom) { customFrom = addDays(today(), -13); customTo = today(); } show('shifts');
    } }, label))),
    period === 'custom' ? h('div', { class: 'fields', style: 'margin-top:10px' },
      h('label', { class: 'field' }, h('span', {}, 'From'), h('input', { class: 'input', type: 'date', value: customFrom, onChange: (e) => { customFrom = e.target.value; show('shifts'); } })),
      h('label', { class: 'field' }, h('span', {}, 'To'), h('input', { class: 'input', type: 'date', value: customTo, onChange: (e) => { customTo = e.target.value; show('shifts'); } }))) : null,
    h('p', { class: 'hint' }, rangeText)));

  const rateFor = s => s.rate??(staff.find(p=>p.id===s.staffId)||{}).rate;
  const payFor = s => shiftHours(s)*num(rateFor(s));
  const per = {};
  for (const s of shifts) { const key = s.staffId || s.name; per[key] = per[key] || { name: s.name, h: 0, pay:0, n: 0, list: [] }; per[key].h += shiftHours(s); per[key].pay += payFor(s); per[key].n++; per[key].list.push(s); }
  const rows = Object.entries(per).sort((a, b) => b[1].h - a[1].h);
  const totalH = rows.reduce((s, [, v]) => s + v.h, 0);
  const totalPay = rows.reduce((s, [, v]) => s + v.pay, 0);
  const maxH = rows.length ? rows[0][1].h || 1 : 1;

  view.append(h('div', { class: 'stats' },
    h('div', { class: 'stat' }, h('div', { class: 'v' }, hrs(totalH)), h('div', { class: 'k' }, 'Hours in period')),
    h('div', { class: 'stat' }, h('div', { class: 'v' }, totalPay ? money(totalPay) : `${shifts.length}`), h('div', { class: 'k' }, totalPay ? 'Pay (where a rate is set)' : 'Shifts logged'))));

  if (rows.length) view.append(h('section', { class: 'card' }, h('h2', {}, 'Hours by person'),
    h('div', { class: 'hbars' }, rows.map(([id, v]) => h('div', { class: 'hb' },
      h('div', { class: 'hb-top' }, h('span', {}, `${v.name} `, h('span', { class: 'muted' }, `\u00b7 ${v.n} shift${v.n > 1 ? 's' : ''}`)),
        h('b', {}, hrs(v.h), v.list.some(s=>String(rateFor(s)??'').trim()!=='') ? ` \u00b7 ${money(v.pay)}` : '')),
      h('div', { class: 'track' }, h('div', { style: `width:${Math.max(3, (v.h / maxH) * 100)}%` })))))));

  // manual add
  const sf = {
    who: h('select', { class: 'input' }, staff.map((p) => h('option', { value: p.id }, p.name))),
    date: h('input', { class: 'input', type: 'date', value: today() }),
    start: h('input', { class: 'input', type: 'time', value: '17:00' }),
    end: h('input', { class: 'input', type: 'time', value: '23:00' }),
    brk: h('input', { class: 'input num-input', inputmode: 'numeric', placeholder: '0' }),
  };
  view.append(h('details', { class: 'card fold' },
    h('summary', {}, 'Add a shift for another day'),
    staff.length ? h('div', { style: 'margin-top:12px' },
      h('div', { class: 'fields' },
        h('label', { class: 'field' }, h('span', {}, 'Who'), sf.who),
        h('label', { class: 'field' }, h('span', {}, 'Date'), sf.date),
        h('label', { class: 'field' }, h('span', {}, 'Clock in'), sf.start),
        h('label', { class: 'field' }, h('span', {}, 'Clock out'), sf.end),
        h('label', { class: 'field full' }, h('span', {}, 'Break (minutes)'), sf.brk)),
      h('button', { class: 'btn primary', style: 'width:100%;margin-top:12px', onClick: () => {
        const p = staff.find((x) => x.id === sf.who.value); if (!p || !sf.date.value) return;
        const message=OpsCore.shiftError({start:sf.start.value,end:sf.end.value,brk:sf.brk.value});if(message){Ops.error(sf.end,message);toast(message);return;}
        const all = getShifts();
        all.push({ id: uid(), staffId: p.id, name: p.name, date: sf.date.value, start: sf.start.value, end: sf.end.value, brk: num(sf.brk.value), rate:p.rate??'' });
        store.set('shifts', all); toast('Shift added'); show('shifts');
      } }, 'Add shift')) : h('p', { class: 'hint' }, 'Add staff first.')));

  // timesheet – tap a time to correct it
  const days = [...new Set(shifts.map((s) => s.date))].sort().reverse();
  const list = h('div');
  if (!days.length) list.append(h('div', { class: 'empty' }, h('span', { html: ART.hen.replace('class="hen"', 'width="56" height="56"') }), 'No shifts in this period yet.'));
  for (const d of days) {
    list.append(h('div', { class: 'day-head' }, fmtLong(d)));
    list.append(h('ul', { class: 'list' }, shifts.filter((s) => s.date === d).map((s) => h('li', { class: 'li' },
      h('div', { class: 'main' }, h('div', { class: 'name' }, s.name),
        h('div', { class: 'times' },
          h('input', { type: 'time', value: s.start || '', 'aria-label': 'Clock in time', onChange: (e) => updateShift(s.id, { start: e.target.value }) }),
          h('span', {}, '\u2013'),
          h('input', { type: 'time', value: s.end || '', 'aria-label': 'Clock out time', onChange: (e) => updateShift(s.id, { end: e.target.value }) })),
        num(s.brk) ? h('div', { class: 'meta' }, `${s.brk} min break`) : null),
      h('div', { style: 'text-align:right' }, h('div', { class: 'amt' }, hrs(shiftHours(s))),
        String(rateFor(s)??'').trim()!=='' ? h('div', { class: 'meta' }, money(payFor(s))) : null),
      h('button', { class: 'x', 'aria-label': 'Delete shift', onClick: () => {
        if (!confirm(`Delete ${s.name}'s shift on ${fmtDay(s.date)}?`)) return;
        Ops.trashRecord('shifts',s); show('shifts');
      } }, '\u00d7')))));
  }
  const periodText = () => {
    const lines = [`${SHOP} \u2013 Shifts`, rangeText, ''];
    rows.forEach(([id, v]) => lines.push(`${v.name}: ${hrs(v.h)} (${v.n} shifts)${v.list.some(s=>String(rateFor(s)??'').trim()!=='') ? ' \u2013 ' + money(v.pay) : ''}`));
    lines.push('', `Total: ${hrs(totalH)}${totalPay ? ' \u2013 ' + money(totalPay) : ''}`);
    return lines.join('\n');
  };
  const periodPdf = () => {
    let body = '';
    for (const [id, v] of rows) {
      const priced = v.list.some(s=>String(rateFor(s)??'').trim()!=='');
      body += `<h3>${esc(v.name)}</h3><table><thead><tr><th>Date</th><th>In</th><th>Out</th><th class="r">Break</th><th class="r">Hours</th>${priced ? '<th class="r">Pay</th>' : ''}</tr></thead><tbody>`;
      [...v.list].sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)).forEach((s) => {
        body += `<tr><td>${esc(fmtDay(s.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</td><td>${esc(s.start)}</td><td>${esc(s.end)}</td><td class="r">${num(s.brk) ? s.brk + 'm' : ''}</td><td class="r">${hrs(shiftHours(s))}</td>${priced ? `<td class="r">${String(rateFor(s)??'').trim()!==''?money(payFor(s)):'Not priced'}</td>` : ''}</tr>`;
      });
      body += `</tbody><tfoot><tr><td colspan="4">Total</td><td class="r">${hrs(v.h)}</td>${priced ? `<td class="r">${money(v.pay)}</td>` : ''}</tr></tfoot></table>`;
    }
    body += `<h3>All staff: ${hrs(totalH)}${totalPay ? ' \u2013 ' + money(totalPay) : ''}</h3>`;
    printDoc('Shift ledger', rangeText, body);
  };
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Timesheet', h('small', {}, 'tap a time to correct it')), list,
    shifts.length ? h('div', { class: 'btn-row', style: 'margin-top:12px' },
      h('button', { class: 'btn primary', onClick: periodPdf }, 'Download PDF'),
      h('button', { class: 'btn whatsapp', onClick: () => whatsapp(periodText()) }, 'Send on WhatsApp'),
      h('button', { class: 'btn', onClick: () => copyText(periodText()) }, 'Copy')) : null));

  // staff management
  const nm = h('input', { class: 'input', placeholder: 'Name' });
  const rt = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'Optional' });
  view.append(h('details', { class: 'card fold', open: staffOpen ?? !staff.length, onToggle: (e) => { staffOpen = e.target.open; } },
    h('summary', {}, `Staff (${staff.length})`),
    h('ul', { class: 'list', style: 'margin-top:8px' }, staff.map((p) => h('li', { class: 'li' },
      h('div', { class: 'main' }, h('div', { class: 'name' }, p.name), h('div', { class: 'meta' }, p.rate ? `${money(num(p.rate))} an hour` : 'No rate set')),
      h('button', { class: 'x', 'aria-label': 'Remove ' + p.name, onClick: () => {
        if (!confirm(`Remove ${p.name}? Their past shifts stay in the ledger.`)) return;
        const historical=getShifts().map(s=>s.staffId===p.id&&s.rate==null?{...s,rate:p.rate??''}:s);if(!store.set('shifts',historical))return;
        store.set('staff', getStaff().filter((x) => x.id !== p.id));
        const o = getOpen(); delete o[p.id]; store.set('open', o); show('shifts');
      } }, '\u00d7')))),
    h('div', { class: 'fields', style: 'margin-top:10px' },
      h('label', { class: 'field' }, h('span', {}, 'Name'), nm),
      h('label', { class: 'field' }, h('span', {}, 'Hourly rate'), h('div', { class: 'money' }, rt))),
    h('p', { class: 'hint' }, 'There is no password, so anyone with this phone can see rates. Leave rate empty to track hours only.'),
    h('button', { class: 'btn primary', style: 'width:100%;margin-top:10px', onClick: () => {
      const name = nm.value.trim(); if (!name) { nm.focus(); return; }
      if(!Ops.inputAmount(rt)){toast('Check hourly rate');return;}
      const all = getStaff(); all.push({ id: uid(), name, rate: rt.value.trim() }); store.set('staff', all);
      toast(`${name} added`); show('shifts');
    } }, 'Add staff member')));
}

/* ================= ORDER PAD ================= */
let orderQuery = '';
let orderDate = Object.values(store.get('basket',{})).some(q=>num(q)>0)?store.get('basketDate',Ops.businessToday()):Ops.businessToday();
let editMode = false;
const getBasket = () => store.get('basket', {});
const setBasket = (b) => {if(!store.set('basket', b))return false;store.set('basketDate',orderDate);return Ops.saveDraft(orderDate,b);};
const collapsed = new Set(store.get('collapsed', []));

function orderText(basket) {
  return [`${SHOP} – Order`, fmtLong(orderDate), ...orderLines(basket)].join('\n');
}

function orderLines(basket) {
  return catalog.filter((i) => basket[i.id] > 0).map((i) => `• ${i.name} x ${basket[i.id]}${i.unit?' '+i.unit:''}`);
}

function renderOrder(view) {
  const basketBox = h('div'); const addBox = h('div'); const listBox = h('div');
  const search = h('input', {
    class: 'input', type: 'search', placeholder: 'Search or type a new item…', value: orderQuery, autocomplete: 'off',
    onInput: (e) => { orderQuery = e.target.value; drawAdd(); drawList(); },
  });
  const orderFig = h('div', { class: 'figure small' });
  view.append(banner('order', 'Order pad', 'Tap what you need. New items stay on the list.', orderFig));
  view.append(dateNav(orderDate,d=>Ops.switchOrderDate(d)));
  Ops.reminders(view);
  Ops.supplierControls(view);
  view.append(
    h('div', { class: 'search' },
      h('div', { class: 'search-wrap' }, h('span', { html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' }), search)),
    basketBox, addBox,
    h('div', { class: 'row-between', style: 'margin:4px 0 2px' },
      h('div', { class: 'muted', style: 'font-size:14px' }, editMode ? 'Change usual amounts or remove items' : 'Tap an item to add it'),
      h('button', { class: 'btn small' + (editMode ? ' primary' : ''), onClick: () => { editMode = !editMode; show('order'); } }, editMode ? 'Done editing' : 'Edit list')),
    listBox);

  function drawBasket() {
    const b = getBasket();
    const lines = catalog.filter((i) => b[i.id] > 0);
    const count = lines.length;
    orderFig.textContent = count ? `${count} item${count > 1 ? 's' : ''} in order` : '';
    let pill = $('#orderPill');
    if (count && !editMode) {
      if (!pill) { pill = h('button', { class: 'pill', id: 'orderPill', onClick: () => basketBox.scrollIntoView({ behavior: 'smooth' }) }); document.body.append(pill); }
      pill.textContent = `View order (${count})`;
    } else pill?.remove();

    if (!count) {
      const hist = store.get('orderHistory', []);
      basketBox.replaceChildren(hist.length && !editMode ? h('section', { class: 'card' },
        h('div', { class: 'row-between' },
          h('div', {}, h('div', { style: 'font-weight:600' }, 'Order is empty'), h('div', { class: 'hint', style: 'margin:0' }, `Last order: ${fmtDay(hist[0].date)} · ${hist[0].lines.length} items`)),
          h('button', { class: 'btn small', onClick: () => {
            const nb = {}; hist[0].lines.forEach(([id, q]) => { if (catalog.some((i) => i.id === id)) nb[id] = q; });
            setBasket(nb); drawBasket(); drawList(); toast('Last order loaded');
          } }, 'Repeat last order'))) : '');
      return;
    }
    basketBox.replaceChildren(h('section', { class: 'card basket' },
      h('h2', {}, 'Your order', h('small', {}, `${count} item${count > 1 ? 's' : ''}`)),
      h('ul', { class: 'list' }, lines.map((i) => h('li', { class: 'li' },
        h('div', { class: 'main' }, h('div', { class: 'name' }, i.name), h('div', { class: 'meta' }, i.section,i.unit?' · '+i.unit:'',i.supplier?' · '+i.supplier:'')),
        h('div', { class: 'stepper' },
          h('button', { 'aria-label': 'Less', onClick: () => bump(i, -1) }, '−'),
          h('span', { class: 'q' }, b[i.id]),
          h('button', { 'aria-label': 'More', onClick: () => bump(i, 1) }, '+')),
        h('button', { class: 'x', 'aria-label': 'Take off order', onClick: () => bump(i, -b[i.id]) }, '×')))),
      h('div', { class: 'btn-row', style: 'margin-top:12px' },
        h('button', { class: 'btn whatsapp', onClick: () => whatsapp(orderText(getBasket())) }, 'Send on WhatsApp'),
        h('button', { class: 'btn', onClick: () => copyText(orderText(getBasket())) }, 'Copy'),
        h('button', { class: 'btn', onClick: () => {
          const body = '<ul>' + orderLines(getBasket()).map((line) => `<li>${esc(line.slice(2))}</li>`).join('') + '</ul>';
          printDoc(`${SHOP} – Order`, fmtLong(orderDate), body, { plain: true });
        } }, 'Download PDF')),
      h('div', { class: 'btn-row', style: 'margin-top:8px' },
        h('button', { class: 'btn primary', onClick: () => {
          if(!Ops.archiveOrder(orderDate,getBasket()))return;
          if(!setBasket({})){show('order');toast('Order saved, but draft could not be cleared. Check storage.');return;} show('order'); toast('Order saved in history and cleared');
        } }, 'Order done – clear'),
        h('button', { class: 'btn danger', onClick: () => { if (confirm('Empty the order without saving?')) { setBasket({}); drawBasket(); drawList(); } } }, 'Empty'))));
  }

  function bump(item, delta) {
    const b = getBasket(); const q = Math.max(0, (b[item.id] || 0) + delta);
    if (q) b[item.id] = round2(q); else delete b[item.id];
    setBasket(b); drawBasket(); drawList();
  }

  function drawAdd() {
    const q = orderQuery.trim();
    const exact = q && catalog.some((i) => i.name.toLowerCase() === q.toLowerCase());
    if (!(q && !exact) && !editMode) { addBox.replaceChildren(); return; }
    const secs = sections();
    const nameIn = h('input', { class: 'input', value: q, placeholder: 'Item name' });
    const secSel = h('select', { class: 'input' }, secs.map((s) => h('option', { value: s, selected: s === 'Miscellaneous' }, s)), h('option', { value: '__new' }, '+ New section…'));
    const newSec = h('input', { class: 'input', placeholder: 'New section name', style: 'display:none;margin-top:8px' });
    secSel.addEventListener('change', () => { newSec.style.display = secSel.value === '__new' ? '' : 'none'; if (secSel.value === '__new') newSec.focus(); });
    const usual = h('input', { class: 'input num-input', inputmode: 'decimal', value: '1' });
    const save = (alsoOrder) => {
      const name = nameIn.value.trim(); if (!name) { nameIn.focus(); return; }
      if (catalog.some((i) => i.name.toLowerCase() === name.toLowerCase())) { toast(`${name} is already on the list`); return; }
      const section = secSel.value === '__new' ? newSec.value.trim() || 'Other' : secSel.value;
      if(!Ops.inputAmount(usual,{required:true})||num(usual.value)<=0){toast('Usual amount must be more than zero');return;}
      const item = { id: 'c' + uid(), section, name, usual: num(usual.value) || 1 };
      // put it at the end of its section so the list stays grouped
      const lastIdx = catalog.map((i) => i.section).lastIndexOf(section);
      if (lastIdx === -1) catalog.push(item); else catalog.splice(lastIdx + 1, 0, item);
      saveCatalog();
      collapsed.delete(section); store.set('collapsed', [...collapsed]);
      if (alsoOrder) { const b = getBasket(); b[item.id] = item.usual; setBasket(b); }
      orderQuery = ''; search.value = '';
      toast(alsoOrder ? `${name} added to the list and the order` : `${name} added to the list`);
      drawAdd(); drawBasket(); drawList();
    };
    addBox.replaceChildren(h('section', { class: 'card addcard' },
      h('h2', {}, q && !exact ? `“${q}” isn't on the list yet` : 'Add a new item'),
      h('div', { class: 'fields' },
        h('label', { class: 'field full' }, h('span', {}, 'Name'), nameIn),
        h('label', { class: 'field' }, h('span', {}, 'Section'), secSel, newSec),
        h('label', { class: 'field' }, h('span', {}, 'Usual amount'), usual)),
      h('p', { class: 'hint' }, 'It stays on the list for next time. Remove it with Edit list when you stop ordering it.'),
      h('div', { class: 'btn-row', style: 'margin-top:10px' },
        !editMode && h('button', { class: 'btn primary', onClick: () => save(true) }, 'Add & put in order'),
        h('button', { class: 'btn' + (editMode ? ' primary' : ''), onClick: () => save(false) }, 'Add to list only'))));
  }

  function drawList() {
    const q = orderQuery.trim().toLowerCase();
    const b = getBasket();
    const frag = [];
    for (const sec of sections()) {
      const items = catalog.filter((i) => i.section === sec && Ops.matchesSupplier(i) && (!q || i.name.toLowerCase().includes(q)));
      if (!items.length) continue;
      const isCollapsed = !q && collapsed.has(sec);
      const inOrder = items.filter((i) => b[i.id] > 0).length;
      frag.push(h('button', { class: 'section-h', 'aria-expanded': String(!isCollapsed), onClick: () => {
        if (collapsed.has(sec)) collapsed.delete(sec); else collapsed.add(sec);
        store.set('collapsed', [...collapsed]); drawList();
      } }, h('span', {}, (isCollapsed ? '▸ ' : '▾ ') + sec), h('span', { class: 'c' }, inOrder ? `${inOrder} in order · ${items.length}` : `${items.length} items`)));
      if (isCollapsed) continue;
      frag.push(h('div', { class: 'items' }, items.map((i) => editMode ? editRow(i) : itemRow(i, b[i.id]))));
    }
    if (!frag.length) frag.push(h('div', { class: 'empty' }, q ? 'No items match. Use the box above to add it.' : 'The list is empty. Add your first item above.'));
    listBox.replaceChildren(...frag);
  }

  function itemRow(i, qty) {
    return h('button', { class: 'item' + (qty ? ' in' : ''), 'data-id': i.id, onClick: (e) => {
      bump(i, i.usual);
      const row = listBox.querySelector(`[data-id="${i.id}"]`); row?.classList.add('flash');
    } },
    h('span', { class: 'nm' }, i.name,i.unit?h('small',{class:'item-unit'},i.unit):null),
    h('span', { class: 'plus' }, '+' + i.usual),
    qty ? h('span', { class: 'badge' }, qty) : null);
  }

  function editRow(i) {
    const q = h('span', { class: 'q' }, i.usual);
    const set = (v) => { i.usual = Math.max(1, round2(v)); q.textContent = i.usual; saveCatalog(); };
    return h('div', { class: 'item edit' },
      h('div',{class:'item-edit-main'},h('span', { class: 'nm' }, i.name),Ops.itemEditor(i)),
      h('div', { class: 'stepper' },
        h('button', { 'aria-label': 'Usual amount down', onClick: () => set(i.usual - 1) }, '−'),
        q,
        h('button', { 'aria-label': 'Usual amount up', onClick: () => set(i.usual + 1) }, '+')),
      h('button', { class: 'x', 'aria-label': 'Remove ' + i.name, onClick: () => {
        if (!confirm(`Remove “${i.name}” from the list? You can add it back any time.`)) return;
        catalog = catalog.filter((x) => x.id !== i.id); saveCatalog();
        const bb = getBasket(); delete bb[i.id]; setBasket(bb);
        toast(`${i.name} removed`); drawBasket(); drawList();
      } }, h('span', { html: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>' })));
  }

  drawBasket(); drawAdd(); drawList();
  Ops.orderHistory(view);
}

/* ================= SETTINGS / BACKUP ================= */
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

function openSettings() {
  const dlg = $('#settings'); const body = $('#settingsBody');
  const settings = store.get('settings', {});
  const floatIn = h('input', { class: 'input', inputmode: 'decimal', placeholder: '0.00', value: settings.float ?? '',
    onInput: (e) => { const s = store.get('settings', {}); s.float = e.target.value; store.set('settings', s); } });
  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', onChange: async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      await Ops.restoreFile(file);
    } catch (error) { toast(error.message||'That file is not a Favorable Chicken backup'); }
  } });

  body.replaceChildren(
    h('div', { class: 'row-between' }, h('h3', {}, 'Settings'), h('button', { class: 'btn small', onClick: () => dlg.close() }, 'Close')),
    h('p', { class: 'hint' }, 'Everything is saved on this phone only and works with no internet.'),
    Ops.settingsControls(),

    h('h4', {}, 'Usual cash float'),
    h('div', { class: 'money' }, floatIn),
    h('p', { class: 'hint' }, 'Filled in automatically on each new day in Daily sales.'),

    h('h4', {}, 'Backup'),
    h('p', { class: 'hint', style: 'margin-bottom:8px' }, 'Download a backup each week. Use Restore to move your data to a new phone.'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn primary', onClick: () => Ops.downloadBackup() }, 'Download backup'),
      h('button', { class: 'btn', onClick: () => fileIn.click() }, 'Restore'), fileIn),
    settings.lastBackup ? h('p', { class: 'hint' }, `Last backup: ${fmtLong(settings.lastBackup)}`) : null,

    h('h4', {}, 'Install on this phone'),
    installEvent
      ? h('button', { class: 'btn', style: 'width:100%', onClick: async () => { installEvent.prompt(); installEvent = null; dlg.close(); } }, 'Install app')
      : h('p', { class: 'hint' }, 'iPhone: Safari › Share › Add to Home Screen. Android: Chrome menu › Install app.'),

    h('h4', {}, 'Order list'),
    h('button', { class: 'btn danger', style: 'width:100%', onClick: () => {
      if (!confirm('Put the order list back to the original items? Items you added will be removed.')) return;
      catalog = defaultCatalog(); saveCatalog(); setBasket({}); dlg.close(); show(current); toast('Order list reset');
    } }, 'Reset order list to original'),

    h('h4', {}, 'Danger zone'),
    h('button', { class: 'btn danger', style: 'width:100%', onClick: () => {
      if (!confirm('Delete ALL sales, stock, shifts and orders on this phone?')) return;
      if (!confirm('Last check – this cannot be undone. Delete everything?')) return;
      Object.keys(localStorage).filter((k) => k.startsWith('fc.')).forEach((k) => localStorage.removeItem(k));
      location.reload();
    } }, 'Delete all data'),
    h('p', { class: 'hint', style: 'margin-top:16px' }, 'Daily Tools · Design & PDF edition'));
  dlg.showModal();
}
$('#settings').addEventListener('click', (e) => { if (e.target.id === 'settings') e.target.close(); });
$('#settingsBtn').addEventListener('click', openSettings);

/* ================= TABS ================= */
const ICONS = {
  sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M14.5 8.5c-.4-.9-1.2-1.4-2.3-1.4-1.6 0-2.4 1-2.4 2.3 0 1 .4 1.8.4 3 0 .8-.3 1.4-1.2 2.1h5.5M9 12h4"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11c0-3 1.5-5 4-6M16 11c0-2-1-4-3-5"/><circle cx="12" cy="4" r="1.5"/></svg>',
  shifts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  order: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/></svg>',
  records: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4"/></svg>',
};
const TABS = [
  { key: 'sales', label: 'Daily sales', sub: 'Cash up the day', render: renderSales },
  { key: 'food', label: 'Food spend', sub: 'Weekly stock food docket', render: renderFood },
  { key: 'shifts', label: 'Shifts', sub: 'Clock in, hours ledger', render: renderShifts },
  { key: 'order', label: 'Order pad', sub: 'Build the supplier order', render: renderOrder },
  { key: 'records', label: 'Records', sub: 'Search, restore and export', render: Ops.renderRecords },
];
let current = store.get('tab', 'sales');
if (current === 'stock') current = 'food';
if (!TABS.some((t) => t.key === current)) current = 'sales';

$('#henSlot').outerHTML = ART.hen;

const tabsInner = h('div', { class: 'tabs-inner' }, TABS.map((t) => h('button', { class: 'tab', 'data-tab': t.key, onClick: () => show(t.key) }, h('span', { class: 'ic', html: ICONS[t.key] }), t.label)));
$('#tabs').append(tabsInner);

function show(key) {
  const changed = key !== current;
  current = key; store.set('tab', key);
  const t = TABS.find((x) => x.key === key);
  document.querySelectorAll('.tab').forEach((b) => b.toggleAttribute('aria-current', false));
  document.querySelector(`.tab[data-tab="${key}"]`).setAttribute('aria-current', 'page');
  $('#subtitle').textContent = t.sub;
  if (key !== 'shifts') clearInterval(shiftTimer);
  if (key !== 'order') $('#orderPill')?.remove();
  const view = $('#view'); const y = window.scrollY;
  view.replaceChildren(); if(key!=='order')Ops.reminders(view); t.render(view);
  window.scrollTo(0, changed ? 0 : y);
}
Ops.mountStatus();
if(Object.values(getBasket()).some(q=>num(q)>0))Ops.saveDraft(orderDate,getBasket());
show(current);

/* ================= offline ================= */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
navigator.storage?.persist?.().catch(() => {});
