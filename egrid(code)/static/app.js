// ============================================================
// GridMaintain — Vanilla JS Frontend
// Talks to Express/MSSQL backend at /api/*
// ============================================================

const API = '/api';

// ---- Utilities ----
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const get  = (p) => api(p);
const post = (p, body) => api(p, { method: 'POST', body });
const patch = (p, body) => api(p, { method: 'PATCH', body });
const del  = (p) => api(p, { method: 'DELETE' });

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(d) { return d ? String(d).slice(0,10) : '—'; }

// ---- Toast ----
let toastTimer;
function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = type === 'error' ? 'var(--destructive)' : 'var(--primary)';
  el.style.color = '#fff';
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ---- Modal ----
let modalSubmitHandler;
function openModal(title, bodyHTML, submitLabel, onSubmit) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-submit').textContent = submitLabel || 'Save';
  modalSubmitHandler = onSubmit;
  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal-cancel').onclick = closeModal;
document.getElementById('modal-submit').onclick = async () => {
  if (modalSubmitHandler) {
    try { await modalSubmitHandler(); closeModal(); }
    catch (e) { toast(e.message, 'error'); }
  }
};

let confirmCallback;
function openConfirm(msg, onOk) {
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = onOk;
  document.getElementById('confirm-modal').classList.add('open');
}
document.getElementById('confirm-cancel').onclick = () => document.getElementById('confirm-modal').classList.remove('open');
document.getElementById('confirm-ok').onclick = async () => {
  if (confirmCallback) { try { await confirmCallback(); } catch(e){ toast(e.message,'error'); } }
  document.getElementById('confirm-modal').classList.remove('open');
};

// ---- Dark Mode ----
let dark = localStorage.getItem('dark') === '1';
function applyDark() {
  document.body.classList.toggle('dark', dark);
  document.getElementById('sun-icon').style.display = dark ? '' : 'none';
  document.getElementById('moon-icon').style.display = dark ? 'none' : '';
}
applyDark();
document.getElementById('dark-toggle').onclick = () => { dark = !dark; localStorage.setItem('dark', dark?'1':'0'); applyDark(); };

// ---- Sidebar / Mobile ----
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
document.getElementById('menu-btn').onclick = () => { sidebar.classList.add('open'); overlay.classList.add('open'); };
overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); };

// ---- Router ----
function setPage(page) {
  document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  sidebar.classList.remove('open'); overlay.classList.remove('open');
  const pages = { dashboard, sites, units, technicians, inspections, details, components, parts, inquiries };
  const fn = pages[page] || dashboard;
  fn();
}
document.querySelectorAll('#sidebar nav a').forEach(a => {
  a.onclick = (e) => { e.preventDefault(); setPage(a.dataset.page); };
});

// ---- DASHBOARD ----
async function dashboard() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>Dashboard</h1><p>Renewable Energy Grid &amp; Maintenance Network</p></div>
    <div class="stats-grid" id="stats-grid">
      ${['Energy Sites','Power Units','Technicians','Inspections','Components','Spare Parts'].map(l=>`
        <div class="stat-card"><div class="stat-icon" style="background:var(--muted-bg)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
        </div><div><div class="stat-val" style="color:var(--muted)">—</div><div class="stat-lbl">${l}</div></div></div>`).join('')}
    </div>
    <div class="card"><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border)">
      <strong style="font-size:13px">Recent Inspections</strong>
    </div><div class="table-wrap"><table><thead><tr><th>Site</th><th>Technician</th><th>Date</th><th>Notes</th></tr></thead>
    <tbody id="recent-body"><tr><td colspan="4" class="empty-state">Loading...</td></tr></tbody></table></div></div>`;

  try {
    const [sum, recent] = await Promise.all([get('/dashboard/summary'), get('/dashboard/recent-inspections')]);
    const vals = [sum.totalSites, sum.totalPowerUnits, sum.totalTechnicians, sum.totalInspections, sum.totalComponents, sum.totalParts];
    document.querySelectorAll('#stats-grid .stat-val').forEach((el,i) => el.textContent = vals[i]);
    document.getElementById('recent-body').innerHTML = recent.length
      ? recent.map(r=>`<tr><td>${esc(r.Site_name)}</td><td class="muted">${esc(r.technicianName)}</td><td class="muted">${fmtDate(r.Inspection_Date)}</td><td class="muted">${esc(r.Notes||'—')}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty-state">No inspections recorded yet.</td></tr>';
  } catch(e) { toast(e.message,'error'); }
}

// ---- ENERGY SITES ----
async function sites() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>Energy Sites</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search sites..." oninput="filterTable()" /></div>
      <button class="btn btn-primary" onclick="siteForm()">+ Add Site</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Latitude</th><th>Longitude</th><th>Terrain</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="6" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  await loadSites();
}
let _sites = [];
async function loadSites() {
  _sites = await get('/energy-sites');
  renderSites(_sites);
}
function renderSites(data) {
  document.getElementById('tbody').innerHTML = data.length ? data.map(s=>`
    <tr>
      <td class="muted">${s.Site_ID}</td>
      <td><strong>${esc(s.Site_name)}</strong></td>
      <td class="muted">${Number(s.Latitude).toFixed(4)}</td>
      <td class="muted">${Number(s.longitude).toFixed(4)}</td>
      <td><span class="tag tag-green">${esc(s.Terrain_Type)}</span></td>
      <td>
        <button class="btn btn-ghost btn-icon" onclick='siteForm(${JSON.stringify(s)})'>✏️</button>
        <button class="btn btn-ghost btn-icon" onclick="deleteSite(${s.Site_ID})">🗑️</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty-state">No sites found.</td></tr>';
}
window.filterTable = function() {
  const q = document.getElementById('search')?.value.toLowerCase() || '';
  if (_sites) renderSites(_sites.filter(s=>
    s.Site_name.toLowerCase().includes(q) || s.Terrain_Type.toLowerCase().includes(q)));
};
window.siteForm = function(site = null) {
  const f = `<div class="form-row"><label>Site Name</label><input id="f-name" value="${esc(site?.Site_name||'')}" /></div>
    <div class="form-grid">
      <div class="form-row"><label>Latitude</label><input id="f-lat" type="number" step="any" value="${site?.Latitude||''}" /></div>
      <div class="form-row"><label>Longitude</label><input id="f-lng" type="number" step="any" value="${site?.longitude||''}" /></div>
    </div>
    <div class="form-row"><label>Terrain Type</label>
    <select id="f-terrain">${['Coastal','Mountainous','Plains','Desert','Forest','Offshore'].map(t=>`<option ${site?.Terrain_Type===t?'selected':''}>${t}</option>`).join('')}</select></div>`;
  openModal(site?'Edit Site':'Add Energy Site', f, site?'Update':'Create', async () => {
    const body = { Site_name: document.getElementById('f-name').value, Latitude: +document.getElementById('f-lat').value, longitude: +document.getElementById('f-lng').value, Terrain_Type: document.getElementById('f-terrain').value };
    if (site) await patch('/energy-sites/'+site.Site_ID, body); else await post('/energy-sites', body);
    toast(site?'Site updated':'Site created'); await loadSites();
  });
};
window.deleteSite = function(id) {
  openConfirm('Delete this energy site? This may affect related records.', async () => {
    await del('/energy-sites/'+id); toast('Site deleted'); await loadSites();
  });
};

// ---- POWER UNITS ----
async function units() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>Power Units</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search units..." oninput="filterUnits()" /></div>
      <button class="btn btn-primary" onclick="unitForm()">+ Add Unit</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Site</th><th>Type</th><th>Manufacturer</th><th>Max kW</th><th>Installed</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="7" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  _sites = await get('/energy-sites');
  _units = await get('/power-units');
  renderUnits(_units);
}
let _units = [];
const siteNames = () => Object.fromEntries(_sites.map(s=>[s.Site_ID, s.Site_name]));
function renderUnits(data) {
  const sm = siteNames();
  document.getElementById('tbody').innerHTML = data.length ? data.map(u=>`
    <tr><td class="muted">${u.Unit_ID}</td><td>${esc(sm[u.site_ID]||u.site_ID)}</td>
    <td><span class="tag tag-blue">${esc(u.Type)}</span></td>
    <td class="muted">${esc(u.manufacturer)}</td><td class="muted">${u.max_kilowatt_output} kW</td>
    <td class="muted">${fmtDate(u.installation_date)}</td>
    <td><button class="btn btn-ghost btn-icon" onclick='unitForm(${JSON.stringify(u)})'>✏️</button>
    <button class="btn btn-ghost btn-icon" onclick="deleteUnit(${u.Unit_ID})">🗑️</button></td></tr>`).join('')
    : '<tr><td colspan="7" class="empty-state">No units found.</td></tr>';
}
window.filterUnits = function() {
  const q = document.getElementById('search')?.value.toLowerCase() || '';
  renderUnits(_units.filter(u=>u.manufacturer.toLowerCase().includes(q)||u.Type.toLowerCase().includes(q)));
};
window.unitForm = function(unit = null) {
  const sm = siteNames();
  const siteOpts = _sites.map(s=>`<option value="${s.Site_ID}" ${unit?.site_ID===s.Site_ID?'selected':''}>${esc(s.Site_name)}</option>`).join('');
  const typeOpts = ['Wind Turbine','Solar Array','Hydroelectric','Geothermal','Biomass'].map(t=>`<option ${unit?.Type===t?'selected':''}>${t}</option>`).join('');
  const f = `<div class="form-row"><label>Energy Site</label><select id="f-site">${siteOpts}</select></div>
    <div class="form-row"><label>Unit Type</label><select id="f-type">${typeOpts}</select></div>
    <div class="form-row"><label>Manufacturer</label><input id="f-mfg" value="${esc(unit?.manufacturer||'')}" /></div>
    <div class="form-grid">
      <div class="form-row"><label>Max kW Output</label><input id="f-kw" type="number" step="any" value="${unit?.max_kilowatt_output||''}" /></div>
      <div class="form-row"><label>Installation Date</label><input id="f-date" type="date" value="${fmtDate(unit?.installation_date)}" /></div>
    </div>`;
  openModal(unit?'Edit Power Unit':'Add Power Unit', f, unit?'Update':'Create', async () => {
    const body = { site_ID: +document.getElementById('f-site').value, Type: document.getElementById('f-type').value, manufacturer: document.getElementById('f-mfg').value, max_kilowatt_output: +document.getElementById('f-kw').value, installation_date: document.getElementById('f-date').value };
    if (unit) await patch('/power-units/'+unit.Unit_ID, body); else await post('/power-units', body);
    toast(unit?'Unit updated':'Unit created'); _units = await get('/power-units'); renderUnits(_units);
  });
};
window.deleteUnit = function(id) {
  openConfirm('Delete this power unit?', async () => { await del('/power-units/'+id); toast('Unit deleted'); _units = await get('/power-units'); renderUnits(_units); });
};

// ---- TECHNICIANS ----
let _techs = [], _certs = [];
async function technicians() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>Technicians</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search..." oninput="filterTechs()" /></div>
      <button class="btn btn-primary" onclick="techForm()">+ Add Technician</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Certifications</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="5" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  [_techs, _certs] = await Promise.all([get('/technicians'), get('/certifications')]);
  renderTechs(_techs);
}
function renderTechs(data) {
  document.getElementById('tbody').innerHTML = data.length ? data.map(t=>{
    const tc = _certs.filter(c=>c.Technician_ID===t.Technician_ID);
    const tags = tc.map(c=>`<span class="tag tag-amber" style="margin-right:3px">${esc(c.Unit_Type)} <span onclick="deleteCert(${c.certification_ID})" style="cursor:pointer;opacity:.6">✕</span></span>`).join('');
    return `<tr><td class="muted">${t.Technician_ID}</td><td><strong>${esc(t.first_Name)} ${esc(t.last_Name)}</strong></td>
      <td class="muted">${esc(t.Contact_Info)}</td>
      <td>${tags}<button class="btn btn-ghost btn-icon" style="font-size:11px" onclick="addCertForm(${t.Technician_ID})">+ cert</button></td>
      <td><button class="btn btn-ghost btn-icon" onclick='techForm(${JSON.stringify(t)})'>✏️</button>
      <button class="btn btn-ghost btn-icon" onclick="deleteTech(${t.Technician_ID})">🗑️</button></td></tr>`;
  }).join('') : '<tr><td colspan="5" class="empty-state">No technicians found.</td></tr>';
}
window.filterTechs = function() {
  const q = document.getElementById('search')?.value.toLowerCase()||'';
  renderTechs(_techs.filter(t=>`${t.first_Name} ${t.last_Name} ${t.Contact_Info}`.toLowerCase().includes(q)));
};
window.techForm = function(t=null) {
  const f = `<div class="form-grid">
    <div class="form-row"><label>First Name</label><input id="f-fn" value="${esc(t?.first_Name||'')}" /></div>
    <div class="form-row"><label>Last Name</label><input id="f-ln" value="${esc(t?.last_Name||'')}" /></div>
  </div><div class="form-row"><label>Contact Info</label><input id="f-contact" value="${esc(t?.Contact_Info||'')}" maxlength="20" /></div>`;
  openModal(t?'Edit Technician':'Add Technician', f, t?'Update':'Create', async () => {
    const body = { first_Name: document.getElementById('f-fn').value, last_Name: document.getElementById('f-ln').value, Contact_Info: document.getElementById('f-contact').value };
    if (t) await patch('/technicians/'+t.Technician_ID, body); else await post('/technicians', body);
    toast(t?'Updated':'Created'); [_techs,_certs]=await Promise.all([get('/technicians'),get('/certifications')]); renderTechs(_techs);
  });
};
window.addCertForm = function(tid) {
  openModal('Add Certification','<div class="form-row"><label>Unit Type</label><input id="f-utype" placeholder="e.g. Wind Turbine" /></div>','Add', async () => {
    await post('/certifications', { Technician_ID: tid, Unit_Type: document.getElementById('f-utype').value });
    toast('Certification added'); _certs = await get('/certifications'); renderTechs(_techs);
  });
};
window.deleteCert = async function(id) {
  await del('/certifications/'+id); toast('Removed'); _certs=await get('/certifications'); renderTechs(_techs);
};
window.deleteTech = function(id) {
  openConfirm('Delete this technician?', async () => { await del('/technicians/'+id); toast('Deleted'); [_techs,_certs]=await Promise.all([get('/technicians'),get('/certifications')]); renderTechs(_techs); });
};

// ---- INSPECTIONS ----
let _rounds = [];
async function inspections() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>Inspection Rounds</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search..." oninput="filterRounds()" /></div>
      <button class="btn btn-primary" onclick="roundForm()">+ Add Round</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Site</th><th>Technician</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="6" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  [_sites, _techs, _rounds] = await Promise.all([get('/energy-sites'), get('/technicians'), get('/inspection-rounds')]);
  renderRounds(_rounds);
}
function renderRounds(data) {
  const sm = Object.fromEntries(_sites.map(s=>[s.Site_ID,s.Site_name]));
  const tm = Object.fromEntries(_techs.map(t=>[t.Technician_ID,`${t.first_Name} ${t.last_Name}`]));
  document.getElementById('tbody').innerHTML = data.length ? data.map(r=>`
    <tr><td class="muted">${r.Inspection_ID}</td><td><strong>${esc(sm[r.Site_ID]||r.Site_ID)}</strong></td>
    <td class="muted">${esc(tm[r.Technician_ID]||r.Technician_ID)}</td>
    <td class="muted">${fmtDate(r.Inspection_Date)}</td>
    <td class="muted" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.Notes||'—')}</td>
    <td><button class="btn btn-ghost btn-icon" onclick='roundForm(${JSON.stringify(r)})'>✏️</button>
    <button class="btn btn-ghost btn-icon" onclick="deleteRound(${r.Inspection_ID})">🗑️</button></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty-state">No rounds found.</td></tr>';
}
window.filterRounds = function() {
  const sm=Object.fromEntries(_sites.map(s=>[s.Site_ID,s.Site_name]));
  const tm=Object.fromEntries(_techs.map(t=>[t.Technician_ID,`${t.first_Name} ${t.last_Name}`]));
  const q=document.getElementById('search')?.value.toLowerCase()||'';
  renderRounds(_rounds.filter(r=>(sm[r.Site_ID]||'').toLowerCase().includes(q)||(tm[r.Technician_ID]||'').toLowerCase().includes(q)));
};
window.roundForm = function(r=null) {
  const sOpts = _sites.map(s=>`<option value="${s.Site_ID}" ${r?.Site_ID===s.Site_ID?'selected':''}>${esc(s.Site_name)}</option>`).join('');
  const tOpts = _techs.map(t=>`<option value="${t.Technician_ID}" ${r?.Technician_ID===t.Technician_ID?'selected':''}>${esc(t.first_Name)} ${esc(t.last_Name)}</option>`).join('');
  const f=`<div class="form-row"><label>Site</label><select id="f-site">${sOpts}</select></div>
    <div class="form-row"><label>Technician</label><select id="f-tech">${tOpts}</select></div>
    <div class="form-row"><label>Date</label><input id="f-date" type="date" value="${fmtDate(r?.Inspection_Date)}" /></div>
    <div class="form-row"><label>Notes</label><textarea id="f-notes">${esc(r?.Notes||'')}</textarea></div>`;
  openModal(r?'Edit Round':'Add Inspection Round',f,r?'Update':'Create',async()=>{
    const body={Site_ID:+document.getElementById('f-site').value,Technician_ID:+document.getElementById('f-tech').value,Inspection_Date:document.getElementById('f-date').value,Notes:document.getElementById('f-notes').value||null};
    if(r) await patch('/inspection-rounds/'+r.Inspection_ID,body); else await post('/inspection-rounds',body);
    toast(r?'Updated':'Created'); _rounds=await get('/inspection-rounds'); renderRounds(_rounds);
  });
};
window.deleteRound=function(id){openConfirm('Delete this inspection round?',async()=>{await del('/inspection-rounds/'+id);toast('Deleted');_rounds=await get('/inspection-rounds');renderRounds(_rounds);});};

// ---- INSPECTION DETAILS ----
let _details=[];
async function details() {
  document.getElementById('content').innerHTML=`
    <div class="page-header"><h1>Inspection Details</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search..." oninput="filterDetails()" /></div>
      <button class="btn btn-primary" onclick="detailForm()">+ Add Detail</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Unit</th><th>Round</th><th>Status</th><th>Reading (kW)</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="6" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  [_units,_rounds,_details]=await Promise.all([get('/power-units'),get('/inspection-rounds'),get('/inspection-details')]);
  renderDetails(_details);
}
function statusTag(s){const m={'Operational':'tag-green','Underperforming':'tag-amber','Faulty':'tag-red','Under Maintenance':'tag-blue','Offline':'tag-gray'};return`<span class="tag ${m[s]||'tag-gray'}">${esc(s)}</span>`;}
function renderDetails(data){
  const um=Object.fromEntries(_units.map(u=>[u.Unit_ID,`${u.Type} #${u.Unit_ID}`]));
  const rm=Object.fromEntries(_rounds.map(r=>[r.Inspection_ID,`Round #${r.Inspection_ID}`]));
  document.getElementById('tbody').innerHTML=data.length?data.map(d=>`
    <tr><td class="muted">${d.Detail_ID}</td><td>${esc(um[d.Unit_ID]||d.Unit_ID)}</td>
    <td class="muted">${esc(rm[d.Inspection_ID]||d.Inspection_ID)}</td>
    <td>${statusTag(d.Status)}</td><td class="muted">${d.Current_reading}</td>
    <td><button class="btn btn-ghost btn-icon" onclick='detailForm(${JSON.stringify(d)})'>✏️</button>
    <button class="btn btn-ghost btn-icon" onclick="deleteDetail(${d.Detail_ID})">🗑️</button></td></tr>`).join('')
    :'<tr><td colspan="6" class="empty-state">No records found.</td></tr>';
}
window.filterDetails=function(){const q=document.getElementById('search')?.value.toLowerCase()||'';renderDetails(_details.filter(d=>d.Status.toLowerCase().includes(q)));};
window.detailForm=function(d=null){
  const uOpts=_units.map(u=>`<option value="${u.Unit_ID}" ${d?.Unit_ID===u.Unit_ID?'selected':''}>${esc(u.Type)} #${u.Unit_ID}</option>`).join('');
  const rOpts=_rounds.map(r=>`<option value="${r.Inspection_ID}" ${d?.Inspection_ID===r.Inspection_ID?'selected':''}>Round #${r.Inspection_ID} — ${fmtDate(r.Inspection_Date)}</option>`).join('');
  const statuses=['Operational','Underperforming','Faulty','Under Maintenance','Offline'];
  const f=`<div class="form-row"><label>Power Unit</label><select id="f-unit">${uOpts}</select></div>
    <div class="form-row"><label>Inspection Round</label><select id="f-round">${rOpts}</select></div>
    <div class="form-row"><label>Status</label><select id="f-status">${statuses.map(s=>`<option ${d?.Status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="form-row"><label>Current Reading (kW)</label><input id="f-reading" type="number" step="any" value="${d?.Current_reading||0}" /></div>`;
  openModal(d?'Edit Detail':'Add Inspection Detail',f,d?'Update':'Create',async()=>{
    const body={Unit_ID:+document.getElementById('f-unit').value,Inspection_ID:+document.getElementById('f-round').value,Status:document.getElementById('f-status').value,Current_reading:+document.getElementById('f-reading').value};
    if(d) await patch('/inspection-details/'+d.Detail_ID,body); else await post('/inspection-details',body);
    toast(d?'Updated':'Created'); _details=await get('/inspection-details'); renderDetails(_details);
  });
};
window.deleteDetail=function(id){openConfirm('Delete this inspection detail?',async()=>{await del('/inspection-details/'+id);toast('Deleted');_details=await get('/inspection-details');renderDetails(_details);});};

// ---- COMPONENTS ----
let _components=[];
async function components() {
  document.getElementById('content').innerHTML=`
    <div class="page-header"><h1>Components</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search..." oninput="filterComponents()" /></div>
      <button class="btn btn-primary" onclick="componentForm()">+ Add Component</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Serial</th><th>Unit</th><th>Detail</th><th>Replaced</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="7" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  [_units,_details,_components]=await Promise.all([get('/power-units'),get('/inspection-details'),get('/components')]);
  renderComponents(_components);
}
function renderComponents(data){
  const um=Object.fromEntries(_units.map(u=>[u.Unit_ID,`${u.Type} #${u.Unit_ID}`]));
  const dm=Object.fromEntries(_details.map(d=>[d.Detail_ID,`Detail #${d.Detail_ID}`]));
  document.getElementById('tbody').innerHTML=data.length?data.map(c=>`
    <tr><td class="muted">${c.Component_ID}</td><td><strong>${esc(c.Component_Name)}</strong></td>
    <td class="muted" style="font-family:monospace;font-size:12px">${esc(c.Serial_number)}</td>
    <td class="muted">${esc(um[c.Unit_ID]||c.Unit_ID)}</td>
    <td class="muted">${esc(dm[c.Detail_ID]||c.Detail_ID)}</td>
    <td class="muted">${fmtDate(c.Replacement_date)}</td>
    <td><button class="btn btn-ghost btn-icon" onclick='componentForm(${JSON.stringify(c)})'>✏️</button>
    <button class="btn btn-ghost btn-icon" onclick="deleteComponent(${c.Component_ID})">🗑️</button></td></tr>`).join('')
    :'<tr><td colspan="7" class="empty-state">No components found.</td></tr>';
}
window.filterComponents=function(){const q=document.getElementById('search')?.value.toLowerCase()||'';renderComponents(_components.filter(c=>c.Component_Name.toLowerCase().includes(q)||c.Serial_number.toLowerCase().includes(q)));};
window.componentForm=function(c=null){
  const uOpts=_units.map(u=>`<option value="${u.Unit_ID}" ${c?.Unit_ID===u.Unit_ID?'selected':''}>${esc(u.Type)} #${u.Unit_ID}</option>`).join('');
  const dOpts=_details.map(d=>`<option value="${d.Detail_ID}" ${c?.Detail_ID===d.Detail_ID?'selected':''}>Detail #${d.Detail_ID} — ${esc(d.Status)}</option>`).join('');
  const f=`<div class="form-row"><label>Power Unit</label><select id="f-unit">${uOpts}</select></div>
    <div class="form-row"><label>Inspection Detail</label><select id="f-detail">${dOpts}</select></div>
    <div class="form-row"><label>Component Name</label><input id="f-name" value="${esc(c?.Component_Name||'')}" /></div>
    <div class="form-row"><label>Serial Number</label><input id="f-serial" value="${esc(c?.Serial_number||'')}" /></div>
    <div class="form-row"><label>Replacement Date</label><input id="f-date" type="date" value="${fmtDate(c?.Replacement_date)}" /></div>`;
  openModal(c?'Edit Component':'Add Component',f,c?'Update':'Create',async()=>{
    const body={Unit_ID:+document.getElementById('f-unit').value,Detail_ID:+document.getElementById('f-detail').value,Component_Name:document.getElementById('f-name').value,Serial_number:document.getElementById('f-serial').value,Replacement_date:document.getElementById('f-date').value};
    if(c) await patch('/components/'+c.Component_ID,body); else await post('/components',body);
    toast(c?'Updated':'Created'); _components=await get('/components'); renderComponents(_components);
  });
};
window.deleteComponent=function(id){openConfirm('Delete this component?',async()=>{await del('/components/'+id);toast('Deleted');_components=await get('/components');renderComponents(_components);});};

// ---- PARTS ----
let _parts=[];
async function parts() {
  document.getElementById('content').innerHTML=`
    <div class="page-header"><h1>Spare Parts</h1></div>
    <div class="page-actions">
      <div class="search-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="search" placeholder="Search..." oninput="filterParts()" /></div>
      <button class="btn btn-primary" onclick="partForm()">+ Add Part</button>
    </div>
    <div class="card table-wrap"><table><thead><tr><th>ID</th><th>Part Name</th><th>Category</th><th>Component</th><th>Actions</th></tr></thead>
    <tbody id="tbody"><tr><td colspan="5" class="empty-state">Loading...</td></tr></tbody></table></div>`;
  [_components,_parts]=await Promise.all([get('/components'),get('/parts')]);
  renderParts(_parts);
}
const catTag=(c)=>{const m={Mechanical:'tag-blue',Electrical:'tag-amber',Electronic:'tag-green',Sensor:'tag-green',Structural:'tag-gray',Hydraulic:'tag-blue',Safety:'tag-red'};return`<span class="tag ${m[c]||'tag-gray'}">${esc(c)}</span>`;};
function renderParts(data){
  const cm=Object.fromEntries(_components.map(c=>[c.Component_ID,c.Component_Name]));
  document.getElementById('tbody').innerHTML=data.length?data.map(p=>`
    <tr><td class="muted">${p.Part_ID}</td><td><strong>${esc(p.Part_Name)}</strong></td>
    <td>${catTag(p.Part_category)}</td>
    <td class="muted">${esc(cm[p.Component_ID]||'Component #'+p.Component_ID)}</td>
    <td><button class="btn btn-ghost btn-icon" onclick='partForm(${JSON.stringify(p)})'>✏️</button>
    <button class="btn btn-ghost btn-icon" onclick="deletePart(${p.Part_ID})">🗑️</button></td></tr>`).join('')
    :'<tr><td colspan="5" class="empty-state">No parts found.</td></tr>';
}
window.filterParts=function(){const q=document.getElementById('search')?.value.toLowerCase()||'';renderParts(_parts.filter(p=>p.Part_Name.toLowerCase().includes(q)||p.Part_category.toLowerCase().includes(q)));};
window.partForm=function(p=null){
  const cats=['Mechanical','Electrical','Hydraulic','Electronic','Structural','Safety','Sensor','Other'];
  const cOpts=_components.map(c=>`<option value="${c.Component_ID}" ${p?.Component_ID===c.Component_ID?'selected':''}>${esc(c.Component_Name)} #${c.Component_ID}</option>`).join('');
  const f=`<div class="form-row"><label>Component</label><select id="f-comp">${cOpts}</select></div>
    <div class="form-row"><label>Part Name</label><input id="f-name" value="${esc(p?.Part_Name||'')}" /></div>
    <div class="form-row"><label>Category</label><select id="f-cat">${cats.map(c=>`<option ${p?.Part_category===c?'selected':''}>${c}</option>`).join('')}</select></div>`;
  openModal(p?'Edit Part':'Add Spare Part',f,p?'Update':'Create',async()=>{
    const body={Component_ID:+document.getElementById('f-comp').value,Part_Name:document.getElementById('f-name').value,Part_category:document.getElementById('f-cat').value};
    if(p) await patch('/parts/'+p.Part_ID,body); else await post('/parts',body);
    toast(p?'Updated':'Created'); _parts=await get('/parts'); renderParts(_parts);
  });
};
window.deletePart=function(id){openConfirm('Delete this spare part?',async()=>{await del('/parts/'+id);toast('Deleted');_parts=await get('/parts');renderParts(_parts);});};

// ---- INQUIRIES ----
async function inquiries() {
  document.getElementById('content').innerHTML=`
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
      <div><h1>Analytics &amp; Inquiries</h1><p>SQL inquiry results from the live database</p></div>
      <button class="btn btn-outline" onclick="inquiries()">↺ Refresh</button>
    </div>
    <div id="inq-container"><p style="color:var(--muted);text-align:center;padding:40px">Loading queries...</p></div>`;
  try {
    const [mfg,noInsp,topTech,noRepl,bySite,profiles]=await Promise.all([
      get('/inquiries/manufacturer-below-average'),
      get('/inquiries/sites-no-inspection'),
      get('/inquiries/top-technician'),
      get('/inquiries/units-no-replacement'),
      get('/inquiries/components-by-site'),
      get('/inquiries/technician-profiles'),
    ]);
    document.getElementById('inq-container').innerHTML=`
      ${inqSection('1. Manufacturer with Most Below-Average Readings','Which power unit manufacturer had the highest number of efficiency readings below average?',
        mfg.length?`<table><thead><tr><th>Manufacturer</th><th style="text-align:right">Below-Avg Count</th></tr></thead><tbody>${mfg.map((r,i)=>`<tr${i===0?' style="background:rgba(243,156,18,.06)"':''}><td>${i===0?'🥇 ':''}${esc(r.manufacturer)}</td><td class="muted" style="text-align:right">${r.belowAverageCount}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">No data yet.</p>')}
      ${inqSection('2. Sites With No Inspections Last Month','Energy sites that had no inspection rounds last calendar month.',
        noInsp.length?`<table><thead><tr><th>Site</th><th>Terrain</th><th>Coordinates</th></tr></thead><tbody>${noInsp.map(s=>`<tr><td>${esc(s.Site_name)}</td><td class="muted">${esc(s.Terrain_Type)}</td><td class="muted">${Number(s.Latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">All sites had inspections last month.</p>')}
      ${inqSection('3. Top Technician Last Month','Technician with the most inspections in the last calendar month.',
        topTech.length?`<table><thead><tr><th>Technician</th><th>Contact</th><th style="text-align:right">Inspections</th></tr></thead><tbody>${topTech.map((t,i)=>`<tr${i===0?' style="background:rgba(46,204,113,.06)"':''}><td>${i===0?'🏆 ':''}${esc(t.first_Name)} ${esc(t.last_Name)}</td><td class="muted">${esc(t.Contact_Info)}</td><td class="muted" style="text-align:right">${t.inspectionCount}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">No inspections last month.</p>')}
      ${inqSection('4. Power Units With No Replacements Last Month','Power units that did not require any component replacements last calendar month.',
        noRepl.length?`<table><thead><tr><th>Unit ID</th><th>Type</th><th>Manufacturer</th><th>Max kW</th></tr></thead><tbody>${noRepl.map(u=>`<tr><td class="muted">${u.Unit_ID}</td><td>${esc(u.Type)}</td><td class="muted">${esc(u.manufacturer)}</td><td class="muted">${u.max_kilowatt_output}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">All units had replacements.</p>')}
      ${inqSection('5. Components Installed Per Site Last Month','Specific components installed at each energy site last calendar month.',
        bySite.length?`<table><thead><tr><th>Site</th><th>Component</th><th>Serial</th><th>Date</th></tr></thead><tbody>${bySite.map(r=>`<tr><td>${esc(r.Site_name)}</td><td class="muted">${esc(r.Component_Name)}</td><td class="muted" style="font-family:monospace;font-size:12px">${esc(r.Serial_number)}</td><td class="muted">${fmtDate(r.Replacement_date)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">No replacements last month.</p>')}
      ${inqSection('6. Technician Profiles with Total Units Inspected','Each technician and the total number of distinct power units they have inspected.',
        profiles.length?`<table><thead><tr><th>Technician</th><th>Contact</th><th style="text-align:right">Total Units</th></tr></thead><tbody>${profiles.map(t=>`<tr><td>${esc(t.first_Name)} ${esc(t.last_Name)}</td><td class="muted">${esc(t.Contact_Info)}</td><td class="muted" style="text-align:right">${t.totalUnitsInspected}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">No data.</p>')}
    `;
  } catch(e) { toast(e.message,'error'); }
}
function inqSection(title,desc,content){
  return`<div class="section"><div class="section-head"><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="table-wrap">${content}</div></div>`;
}

// ---- INIT ----
setPage('dashboard');