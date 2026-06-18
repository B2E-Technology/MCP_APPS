/* ══════════════════════════════════════════════
   app.js — Standard List Page UI  v3.2
   SPA: list page  ↔  full form page (no popups)
   Depends on: config.js, api.js
   ══════════════════════════════════════════════ */

const PALETTE = ["#2563EB","#059669","#F59E0B","#7C3AED","#0891B2","#DC2626","#EC4899","#14B8A6"];

let allData      = [];
let activeFilter = "All";
let dropFilters  = {};
let editIndex    = null;   // null = create mode
let deleteIndex  = null;

/* ─────────────────────────────────────────────
   PAGE SWITCHING  (list ↔ form)
───────────────────────────────────────────── */
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");

  const bc = document.getElementById("breadcrumb");
  if (name === "list") {
    bc.style.display = "none";
    // restore header refresh btn
    renderHeaderActions();
  } else {
    bc.style.display = "flex";
  }
  window.scrollTo(0, 0);
}

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  document.title = CONFIG.title;
  loadData();
});

/* ── Load data ────────────────────────────────────────────── */
async function loadData() {
  showLoading(true);
  hideError();
  try {
    allData = await apiList();
    renderHeader();
    renderStats();
    renderCharts();
    renderHead();
    renderFilters();
    applyFilters();
  } catch (e) {
    showError(e.message);
  }
  showLoading(false);
}

/* ── Loading / Error ──────────────────────────────────────── */
function showLoading(on) {
  document.getElementById("loading").style.display = on ? "flex" : "none";
}
function showError(msg, code) {
  const box = document.getElementById("error-box");
  box.classList.add("show");
  document.getElementById("error-msg").textContent  = msg;
  document.getElementById("error-code").textContent = code ? "status: " + code : "";
}
function hideError() { document.getElementById("error-box").classList.remove("show"); }

/* ── Toast ────────────────────────────────────────────────── */
function toast(msg, cls) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = cls || "";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

/* ── UUIDv7 ───────────────────────────────────────────────── */
function uuidv7() {
  const ts = Date.now().toString(16).padStart(12,"0");
  const rnd = () => Math.floor(Math.random()*16).toString(16);
  let s = ts+"7"; while(s.length<32) s+=rnd();
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20,32)}`;
}

/* ── Badge colour ─────────────────────────────────────────── */
function badgeColor(val, key) {
  if (CONFIG.badgeColors && CONFIG.badgeColors[val]) return CONFIG.badgeColors[val];
  const k    = key || (CONFIG.columns.find(c => c.type==="badge")||{}).key || CONFIG.filterKey;
  const vals = [...new Set(allData.map(r => r[k]))];
  return PALETTE[Math.max(vals.indexOf(val),0) % PALETTE.length];
}

/* ── Header ───────────────────────────────────────────────── */
function renderHeader() {
  document.getElementById("page-title").textContent    = CONFIG.title;
  document.getElementById("page-subtitle").textContent = CONFIG.subtitle || "";
  if (CONFIG.icon) document.getElementById("header-icon").textContent = CONFIG.icon;
  document.getElementById("header-meta").innerHTML =
    `<span>Updated: ${new Date().toLocaleTimeString()}</span>`;
  document.getElementById("app-header").style.display = "";
  document.getElementById("bc-home").textContent = CONFIG.title;
  renderHeaderActions();

  // table card actions
  const acts = [];
  if (CONFIG.features.export) acts.push(`<button class="btn btn-outline btn-sm" onclick="exportCSV()">⬇ Export CSV</button>`);
  if (CONFIG.features.create) acts.push(`<button class="btn btn-primary btn-sm" onclick="openCreate()">＋ New Record</button>`);
  document.getElementById("table-actions").innerHTML = acts.join("");
  document.getElementById("search-box").style.display = CONFIG.features.search ? "" : "none";
}

function renderHeaderActions() {
  document.getElementById("header-actions").innerHTML =
    CONFIG.features.refresh ? `<button class="btn-refresh" onclick="loadData()">⟳ Refresh</button>` : "";
}

/* ── Stat cards ───────────────────────────────────────────── */
function renderStats() {
  const el = document.getElementById("stats");
  if (!CONFIG.stats || !CONFIG.stats.length) { el.innerHTML=""; return; }
  el.innerHTML = CONFIG.stats.map((s,i) => {
    const n = s.filter==="*"
      ? allData.length
      : allData.filter(r => String(r[CONFIG.filterKey])===s.filter).length;
    const col = PALETTE[i % PALETTE.length];
    return `<div class="stat-card" style="--accent:${col}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${n}</div>
    </div>`;
  }).join("");
}

/* ── Charts ───────────────────────────────────────────────── */
function renderCharts() {
  const ch = CONFIG.charts;
  if (!ch) return;
  document.getElementById("charts-row").style.display = "";

  if (ch.bar) {
    const key = ch.bar.key;
    const counts = {};
    allData.forEach(r => { const v=r[key]||"—"; counts[v]=(counts[v]||0)+1; });
    const labels=Object.keys(counts), vals=Object.values(counts);
    const maxV=Math.max(...vals,1);
    document.getElementById("bar-chart-title").textContent = ch.bar.label || key;
    document.getElementById("bar-chart-wrap").innerHTML =
      `<div class="bar-chart">${labels.map((lbl,i)=>{
        const col=PALETTE[i%PALETTE.length], h=Math.round((vals[i]/maxV)*110);
        return `<div class="bar-wrap">
          <div class="bar-val">${vals[i]}</div>
          <div class="bar" style="height:${h}px;background:${col}" title="${lbl}: ${vals[i]}"></div>
          <div class="bar-label" title="${lbl}">${lbl}</div>
        </div>`;
      }).join("")}</div>`;
  }

  if (ch.donut) {
    const key=ch.donut.key;
    const counts={};
    allData.forEach(r=>{const v=r[key]||"—";counts[v]=(counts[v]||0)+1;});
    const labels=Object.keys(counts), vals=Object.values(counts);
    const total=vals.reduce((a,b)=>a+b,0)||1;
    const colors=labels.map((_,i)=>PALETTE[i%PALETTE.length]);
    document.getElementById("donut-chart-title").textContent = ch.donut.label || key;
    const cx=70,cy=70,r=54,hole=30;
    let angle=-Math.PI/2, paths="";
    vals.forEach((v,i)=>{
      const slice=(v/total)*Math.PI*2;
      const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
      angle+=slice;
      const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
      const lf=slice>Math.PI?1:0;
      const xi1=cx+hole*Math.cos(angle-slice),yi1=cy+hole*Math.sin(angle-slice);
      const xi2=cx+hole*Math.cos(angle),yi2=cy+hole*Math.sin(angle);
      paths+=`<path d="M${x1} ${y1} A${r} ${r} 0 ${lf} 1 ${x2} ${y2}
        L${xi2} ${yi2} A${hole} ${hole} 0 ${lf} 0 ${xi1} ${yi1}Z"
        fill="${colors[i]}" stroke="#fff" stroke-width="2"><title>${labels[i]}: ${v}</title></path>`;
    });
    const legend=labels.map((lbl,i)=>
      `<div class="legend-item">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        <span class="legend-label">${lbl}</span>
        <span class="legend-val">${vals[i]}</span>
      </div>`).join("");
    document.getElementById("donut-chart-wrap").innerHTML =
      `<div class="donut-wrap">
        <svg class="donut-svg" width="140" height="140" viewBox="0 0 140 140">${paths}</svg>
        <div class="donut-legend">${legend}</div>
      </div>`;
  }
}

/* ── Table head ───────────────────────────────────────────── */
function renderHead() {
  const f=CONFIG.features;
  let h=CONFIG.columns.map(c=>`<th>${c.label}</th>`).join("");
  if (f.edit||f.delete) h+=`<th class="actions-col">Actions</th>`;
  document.getElementById("thead-row").innerHTML=h;
  document.getElementById("table-title").textContent=CONFIG.title;
}

/* ── Filters ──────────────────────────────────────────────── */
function renderFilters() {
  const dd=CONFIG.filterDropdowns;
  if (dd && dd.length) {
    dd.forEach(d=>{if(!(d.key in dropFilters))dropFilters[d.key]="";});
    document.getElementById("pills").style.display="none";
    document.getElementById("filter-dropdowns").innerHTML=dd.map(d=>{
      const vals=[...new Set(allData.map(r=>r[d.key]).filter(v=>v!=null))].sort();
      const opts=[`<option value="">All ${d.label}</option>`,
        ...vals.map(v=>`<option value="${v}" ${dropFilters[d.key]===v?"selected":""}>${v}</option>`)
      ].join("");
      return `<div class="filter-group">
        <label>${d.label}</label>
        <select onchange="setDropFilter('${d.key}',this.value)">${opts}</select>
      </div>`;
    }).join("");
  } else if (CONFIG.filterKey) {
    document.getElementById("filter-dropdowns").innerHTML="";
    const el=document.getElementById("pills");
    el.style.display="";
    const vals=["All",...new Set(allData.map(r=>r[CONFIG.filterKey]).filter(v=>v!=null))];
    el.innerHTML=vals.map(v=>{
      const bg=v==="All"?"":` --pill-bg:${badgeColor(v)};`;
      return `<button class="pill ${v===activeFilter?"active":""}" style="${bg}"
        onclick="setFilter('${String(v).replace(/'/g,"\\'")}')">${v}</button>`;
    }).join("");
  }
}

function setFilter(v)         { activeFilter=v; renderFilters(); applyFilters(); }
function setDropFilter(key,v) { dropFilters[key]=v; applyFilters(); }

/* ── Search + filter ──────────────────────────────────────── */
function applyFilters() {
  const q=(document.getElementById("search").value||"").toLowerCase();
  let rows=allData.map((r,i)=>({r,i}));
  if (CONFIG.filterDropdowns && CONFIG.filterDropdowns.length) {
    CONFIG.filterDropdowns.forEach(d=>{
      const sel=dropFilters[d.key]||"";
      if (sel) rows=rows.filter(x=>String(x.r[d.key])===sel);
    });
  } else if (CONFIG.filterKey && activeFilter!=="All") {
    rows=rows.filter(x=>String(x.r[CONFIG.filterKey])===activeFilter);
  }
  if (q && CONFIG.searchKeys.length)
    rows=rows.filter(x=>CONFIG.searchKeys.some(k=>String(x.r[k]??"").toLowerCase().includes(q)));
  document.getElementById("table-meta").textContent=`${rows.length} of ${allData.length} records`;
  renderTable(rows);
}

/* ── Cell renderer ────────────────────────────────────────── */
function cell(r,c) {
  const v=r[c.key];
  if (v==null||v==="") return `<td class="date">—</td>`;
  switch(c.type){
    case "code":   return `<td class="code">${v}</td>`;
    case "number": return `<td class="num">${v}</td>`;
    case "date":   return `<td class="date">${String(v).slice(0,10)}</td>`;
    case "badge": {
      const col=badgeColor(v,c.key);
      return `<td><span class="badge" style="background:${col}1A;color:${col}">${v}</span></td>`;
    }
    case "status": {
      const on=["true","active","1","yes","y"].includes(String(v).toLowerCase());
      return on
        ?`<td><span class="dot dot-on"></span><span style="font-size:12px;color:var(--success);font-weight:600">Active</span></td>`
        :`<td><span class="dot dot-off"></span><span style="font-size:12px;color:var(--danger);font-weight:600">Inactive</span></td>`;
    }
    default: return `<td>${v}</td>`;
  }
}

/* ── Table body ───────────────────────────────────────────── */
function renderTable(rows) {
  const tbody=document.getElementById("tbody");
  const f=CONFIG.features;
  const colspan=CONFIG.columns.length+((f.edit||f.delete)?1:0);
  if (!rows.length){
    tbody.innerHTML=`<tr><td colspan="${colspan}"><div class="empty">No records found</div></td></tr>`;
    return;
  }
  tbody.innerHTML=rows.map(x=>{
    let tds=CONFIG.columns.map(c=>cell(x.r,c)).join("");
    if (f.edit||f.delete){
      let acts="";
      if (f.edit)
        acts+=`<button class="icon-btn edit" title="Edit" onclick="openEdit(${x.i})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg></button>`;
      if (f.delete)
        acts+=`<button class="icon-btn del" title="Delete" onclick="openDelete(${x.i})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg></button>`;
      tds+=`<td class="actions">${acts}</td>`;
    }
    return `<tr>${tds}</tr>`;
  }).join("");
}

/* ─────────────────────────────────────────────
   FORM PAGE  (Create / Edit)
───────────────────────────────────────────── */
function formCols() { return CONFIG.columns.filter(c=>c.editable!==false); }

function openCreate() {
  editIndex = null;
  buildFormPage("New Record", "Fill in the details below to create a new record.", {});
  showPage("form");
}

function openEdit(i) {
  editIndex = i;
  const rec = allData[i];
  // label from first searchKey or id
  const lbl = CONFIG.searchKeys.map(k=>rec[k]).filter(Boolean).join(" · ") || rec[CONFIG.idKey] || "";
  buildFormPage("Edit Record", `Editing: ${lbl}`, rec);
  showPage("form");
}

function buildFormPage(title, sub, rec) {
  document.getElementById("form-page-title").textContent = title;
  document.getElementById("form-page-sub").textContent   = sub;
  document.getElementById("bc-current").textContent      = title;

  const cols = formCols();
  // Pair up fields into 2-col rows where both are simple inputs
  // (select/textarea stay full-width)
  const html = [];
  let i = 0;
  while (i < cols.length) {
    const c = cols[i];
    const isSimple = c => !c.options && c.type !== "textarea";
    // try to pair with next
    if (isSimple(c) && i+1 < cols.length && isSimple(cols[i+1])) {
      html.push(`<div class="field-row">${fieldHTML(c,rec)}${fieldHTML(cols[i+1],rec)}</div>`);
      i += 2;
    } else {
      html.push(fieldHTML(c, rec));
      i += 1;
    }
  }
  document.getElementById("form-fields").innerHTML = html.join("");
}

function fieldHTML(c, rec) {
  const val = rec[c.key] ?? "";
  const req = c.required ? '<span class="req"> *</span>' : "";
  if (c.options) {
    const opts = c.options.map(o=>
      `<option value="${o}" ${String(val)===String(o)?"selected":""}>${o}</option>`
    ).join("");
    return `<div class="field">
      <label>${c.label}${req}</label>
      <select id="fld-${c.key}"><option value="">— select —</option>${opts}</select>
    </div>`;
  }
  const itype = c.type==="number"?"number": c.type==="date"?"date":"text";
  return `<div class="field">
    <label>${c.label}${req}</label>
    <input type="${itype}" id="fld-${c.key}" value="${String(val).replace(/"/g,"&quot;")}">
    ${c.type==="code"?'<div class="hint">System code — auto-generated if left blank</div>':""}
  </div>`;
}

async function saveForm() {
  const base = editIndex===null ? {} : {...allData[editIndex]};
  for (const c of formCols()) {
    const el = document.getElementById("fld-"+c.key);
    if (!el) continue;
    const v = el.value.trim();
    if (c.required && !v) { toast(c.label+" is required","err"); return; }
    base[c.key] = v;
  }
  const btn = document.getElementById("form-save");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    if (editIndex===null) {
      await apiCreate(base);
      toast("Record created successfully","ok");
    } else {
      await apiUpdate(base[CONFIG.idKey], base);
      toast("Record updated successfully","ok");
    }
    showPage("list");
    await loadData();
  } catch(e) { toast(e.message,"err"); }
  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Save Record`;
}

/* ─────────────────────────────────────────────
   DELETE  (small modal — irreversible confirm)
───────────────────────────────────────────── */
function openDelete(i) {
  deleteIndex = i;
  const r   = allData[i];
  const lbl = CONFIG.searchKeys.map(k=>r[k]).filter(Boolean).join(" · ") || r[CONFIG.idKey] || "";
  document.getElementById("del-label").textContent = lbl;
  document.getElementById("del-modal").style.display = "flex";
}
function closeDelModal() {
  document.getElementById("del-modal").style.display = "none";
}
async function confirmDelete() {
  const btn = document.getElementById("del-confirm");
  btn.disabled = true;
  try {
    await apiDelete(allData[deleteIndex][CONFIG.idKey]);
    toast("Record deleted","ok");
    closeDelModal();
    await loadData();
  } catch(e) { toast(e.message,"err"); }
  btn.disabled = false;
}

/* ── Export CSV ───────────────────────────────────────────── */
function exportCSV() {
  const cols=CONFIG.columns.map(c=>c.key);
  const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const csv=[cols.join(","),...allData.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n");
  const a=document.createElement("a");
  a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download=CONFIG.csvName; a.click();
}
