// ==========================================
// 1. CONSTANTS DATA SEEDS & CONFIGURATIONS
// ==========================================
const storeKey = "sriratana-arts-system";

const themeDefaults = {
  default: { bg:"#f5f7fb", panel:"#ffffff", text:"#14202e", line:"#d9e2ec", primary:"#126a6f", primary2:"#0e8780", accent:"#d28722", sidebar:"#12202e", heroFrom:"#126a6f", heroTo:"#0e8780", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  royal: { bg:"#f6f3ee", panel:"#fffdf8", text:"#1f2230", line:"#ded3c2", primary:"#6d214f", primary2:"#a13664", accent:"#b8860b", sidebar:"#23182a", heroFrom:"#6d214f", heroTo:"#a13664", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  fresh: { bg:"#f3fbf6", panel:"#ffffff", text:"#10231a", line:"#cce2d4", primary:"#227447", primary2:"#3a9d63", accent:"#e0a100", sidebar:"#163826", heroFrom:"#227447", heroTo:"#3a9d63", radius:8, font:'"Segoe UI", Tahoma, sans-serif' }
};

const themeFields = {
  bg:"themeBg", panel:"themePanelColor", text:"themeText", line:"themeLine", primary:"themePrimary", primary2:"themePrimary2",
  accent:"themeAccent", sidebar:"themeSidebar", heroFrom:"themeHeroFrom", heroTo:"themeHeroTo", radius:"themeRadius", font:"themeFont"
};

const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];
const navItems = [
  ["dashboard","▦","แดชบอร์ด"],["rankings","▤","ตารางอันดับ"],["events","☰","รายการแข่งขัน"],["registration","＋","ลงทะเบียนนักเรียน"],
  ["results","✓","บันทึกผลการแข่งขัน"],["schools","⌂","จัดการโรงเรียน"],["venues","⌖","จัดการสนามแข่งขัน"],["judges","⚖","กรรมการตัดสิน"],
  ["documents","□","ตรวจเอกสาร"],["reports","◫","รายงาน"],["users","◎","จัดการผู้ใช้งาน"]
];

const defaultSchools = [
  "บ้านศรีแก้ว","บ้านหนองสังข์","บ้านพิวพวย(เสียงราษฎร์พัฒนา)","บ้านศิลาทอง","บ้านบกห้วยโนน","บ้านตระกวน","อนุบาลศรีรัตนะ","บ้านตระกาจ",
  "บ้านตาแบน","โชติพันธุ์วิทยาสามัคคี","บ้านหนองรุง","บ้านโนนแก","บ้านปุน","บ้านขนาด","บ้านหนองบัวทอง","บ้านทุ่งสว่าง","บ้านจอก(ประชาสามัคคี)",
  "บ้านสะพุง","บ้านหนองปิงโปง","บ้านจานบัว","บ้านเสื่องข้าว","บ้นกระหวัน","บ้านตูม(นพค.15 กรป.กลางอุปถัมภ์)","บ้านหนองใหญ่-ตาไทย","บ้านสลับ","บ้านตายู(อสพป.32)"
].map((name, i) => ({ id: "s"+(i+1), name, director: "ผอ."+[""][i%5]+"", phone: "00"+String(12000000+i*137).slice(0,8), medals: { gold: (i*3)%9, silver: (i*5)%7, bronze: (i*2)%8, joined: 6+(i%9) }}));

// ปรับปรุงอาร์เรย์เริ่มต้นที่ว่างเปล่าให้กระชับ ไม่ต้องใช้ .map()
const defaultVenues = [];
const defaultEvents = [];
const defaultRegistrations = [];
const defaultJudges = [];

// ==========================================
// 2. STATE GLOBAL DECLARATIONS
// ==========================================
let db = JSON.parse(localStorage.getItem(storeKey) || "null") || seed();
let currentRole = "";
let currentPage = "dashboard";
let certLogoUrl = "";
let certSignUrl = "";

function makeUsers() {
  const admins = Array.from({length:1}, (_,i)=>({ id:"a"+(i+1), username:"admin"+String(i+1).padStart(2,"0"), role:"admin", password:"SriRatana@123", changed:false }));
  const users = Array.from({length:1}, (_,i)=>({ id:"u"+(i+1), username:"user"+String(i+1).padStart(2,"0"), role:"user", password:"User@123", changed:false }));
  return admins.concat(users);
}

// ==========================================
// 3. UTILITY HELPERS
// ==========================================
const $ = id => document.getElementById(id);
const byId = (list, id) => list.find(x => x.id === id) || {};
const save = () => localStorage.setItem(storeKey, JSON.stringify(db));
const nextId = (prefix, list) => prefix + (list.length ? Math.max(...list.map(x => Number(String(x.id).replace(/\D/g,"")) || 0)) + 1 : 1);
const optionList = (items, getLabel = x => x.name) => items.map(x => `<option value="${x.id}">${getLabel(x)}</option>`).join("");
const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[s]));

function teacherCount(members) {
  const n = Number(members || 1);
  return n === 1 ? 1 : (n <= 5 ? 2 : 3);
}

function medalFromScore(score) {
  score = Number(score);
  if (score >= 80) return "เหรียญทอง";
  if (score >= 70) return "เหรียญเงิน";
  if (score >= 60) return "เหรียญทองแดง";
  return "เข้าร่วมการแข่งขัน";
}

function seed() {
  return {
    theme:"default",
    themeSettings:null,
    schools: defaultSchools,
    venues: defaultVenues,
    events: defaultEvents,
    registrations: defaultRegistrations,
    judges: defaultJudges,
    users: makeUsers(),
    certNo: 500
  };
}

// ==========================================
// 4. MAIN INITIALIZATION & ROUTING
// ==========================================
function init() {
  renderNav();
  $("nav").addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (btn) showPage(btn.dataset.page);
  });
  
  $("roleSelect").addEventListener("change", e => { 
    currentRole = e.target.value; 
    renderNav();
    const reportBtn = document.getElementById("reportBtn");
    if (reportBtn) reportBtn.disabled = false;
    render(); 
  });
  
  $("themeSelect").addEventListener("change", e => {
    db.theme = e.target.value;
    db.themeSettings = e.target.value === "custom" ? (db.themeSettings || {...themeDefaults.default}) : null;
    save();
    render();
  });
  
  $("themePanelBtn").addEventListener("click", openThemePanel);
  $("closeThemePanel").addEventListener("click", closeThemePanel);
  $("themePanel").addEventListener("click", e => { if (e.target.id === "themePanel") closeThemePanel(); });
  
  Object.values(themeFields).forEach(id => {
    if ($(id)) $(id).addEventListener("input", previewThemeSettings);
  });
  
  $("saveThemeSettings").addEventListener("click", saveThemeSettings);
  $("resetThemeSettings").addEventListener("click", resetThemeSettings);
  $("seedBtn").addEventListener("click", () => { if (confirm("คืนค่าข้อมูลตัวอย่างทั้งหมด?")) { db = seed(); save(); render(); } });
  
  bindForms();
  render();
}

function showPage(id) {
  currentPage = id;
  document.querySelectorAll(".section").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === id));
  $("pageTitle").textContent = navItems.find(x => x[0] === id)?.[2] || "ระบบการแข่งขัน";
  render();
}

// ==========================================
// 5. THEME RENDERING OPERATIONS
// ==========================================
function currentThemeSettings() {
  return db.themeSettings || themeDefaults[db.theme] || themeDefaults.default;
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || "#000000").replace("#", "");
  const value = clean.length === 3 ? clean.split("").map(x => x + x).join("") : clean;
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyThemeSettings(settings = currentThemeSettings()) {
  const root = document.documentElement.style;
  root.setProperty("--bg", settings.bg);
  root.setProperty("--panel", settings.panel);
  root.setProperty("--panel-2", hexToRgba(settings.primary, .12));
  root.setProperty("--text", settings.text);
  root.setProperty("--muted", hexToRgba(settings.text, .66));
  root.setProperty("--line", settings.line);
  root.setProperty("--primary", settings.primary);
  root.setProperty("--primary-2", settings.primary2);
  root.setProperty("--accent", settings.accent);
  root.setProperty("--sidebar", settings.sidebar);
  root.setProperty("--hero-from", hexToRgba(settings.heroFrom, .94));
  root.setProperty("--hero-to", hexToRgba(settings.heroTo, .84));
  root.setProperty("--radius", `${settings.radius}px`);
  root.setProperty("--font-main", settings.font);
}

function syncThemeControls() {
  const settings = currentThemeSettings();
  Object.entries(themeFields).forEach(([key, id]) => {
    if ($(id)) $(id).value = settings[key];
  });
}

function readThemeControls() {
  const settings = {};
  Object.entries(themeFields).forEach(([key, id]) => {
    if ($(id)) settings[key] = key === "radius" ? Number($(id).value) : $(id).value;
  });
  return settings;
}

function previewThemeSettings() { applyThemeSettings(readThemeControls()); }
function openThemePanel() { syncThemeControls(); $("themePanel").classList.add("open"); $("themePanel").setAttribute("aria-hidden", "false"); }
function closeThemePanel() { $("themePanel").classList.remove("open"); $("themePanel").setAttribute("aria-hidden", "true"); applyThemeSettings(); }

function saveThemeSettings() {
  db.theme = "custom";
  db.themeSettings = readThemeControls();
  save();
  render();
  closeThemePanel();
}

function resetThemeSettings() {
  db.theme = "default";
  db.themeSettings = null;
  save();
  render();
}

// ==========================================
// 6. MODULE RENDERERS (UI GENERATORS)
// ==========================================
function render() {
  document.body.dataset.theme = db.theme || "default";
  $("themeSelect").value = db.theme || "default";
  applyThemeSettings();
  syncThemeControls();
  
  document.querySelectorAll(".admin-only").forEach(el => el.style.display = (currentRole === "admin") ? "" : "none");
  document.querySelectorAll(".user-only").forEach(el => el.style.display = (currentRole === "user") ? "" : "none");
  
  fillSelects();
  renderDashboard();
  renderRankings();
  renderEvents();
  renderRegistrations();
  renderResults();
  renderSchools();
  renderVenues();
  renderJudges();
  renderDocuments();
  renderUsers();
  renderCertificate();
}

function renderNav() {
  const role = currentRole || "user";
  if (!$("nav")) return;
  $("nav").innerHTML = navItems
    .filter(([id]) => role === "admin" || ["dashboard", "rankings", "events", "registration", "reports"].includes(id))
    .map(([id, icon, label]) => `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${label}</span></button>`)
    .join("");
}

function fillSelects() {
  const subjectOptions = subjects.map(s => `<option>${s}</option>`).join("");
  const levelOptions = levels.map(s => `<option>${s}</option>`).join("");
  if ($("eventSubject")) $("eventSubject").innerHTML = subjectOptions;
  if ($("eventLevel")) $("eventLevel").innerHTML = levelOptions;
  if ($("eventVenue")) $("eventVenue").innerHTML = optionList(db.venues);
  if ($("regEvent")) $("regEvent").innerHTML = optionList(db.events, e => `${e.name} (${e.level})`);
  if ($("judgeEvent")) $("judgeEvent").innerHTML = optionList(db.events, e => `${e.name} (${e.level})`);
  if ($("certEvent")) $("certEvent").innerHTML = optionList(db.events, e => `${e.name} (${e.level})`);
  if ($("regSchool")) $("regSchool").innerHTML = optionList(db.schools);
  if ($("resultRegistration")) {
    $("resultRegistration").innerHTML = db.registrations.map(r => `<option value="${r.id}">${byId(db.events,r.eventId).name || "-"} - ${byId(db.schools,r.schoolId).name || "-"}</option>`).join("");
  }
}

function rankedSchools() {
  const schoolMedalMap = {};
  db.schools.forEach(s => schoolMedalMap[s.id] = { id: s.id, name: s.name, gold: 0, silver: 0, bronze: 0, joined: 0 });
  db.registrations.forEach(r => {
    if (schoolMedalMap[r.schoolId]) {
      if (r.medal === "เหรียญทอง") schoolMedalMap[r.schoolId].gold++;
      else if (r.medal === "เหรียญเงิน") schoolMedalMap[r.schoolId].silver++;
      else if (r.medal === "เหรียญทองแดง") schoolMedalMap[r.schoolId].bronze++;
      else if (r.medal === "เข้าร่วมการแข่งขัน") schoolMedalMap[r.schoolId].joined++;
    }
  });
  return Object.values(schoolMedalMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.name.localeCompare(b.name, "th"))
    .map(item => ({ id: item.id, name: item.name, medals: { gold: item.gold, silver: item.silver, bronze: item.bronze, joined: item.joined } }));
}

function renderDashboard() {
  const pending = db.registrations.filter(r => r.status === "รอตรวจ").length;
  const totalStudents = db.registrations.reduce((sum, r) => sum + Math.max(1, String(r.students).split(/\n|,/).filter(Boolean).length), 0);
  const sortedEvents = [...db.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const stats = [
    ["รายการแข่งขัน", db.events.length, `${subjects.length} กลุ่มสาระ`],
    ["นักเรียนลงทะเบียน", totalStudents, "จากฐานข้อมูลรับสมัคร"],
    ["โรงเรียน", db.schools.length, "โรงเรียนในกลุ่มศรีรัตนะ"],
    ["รอตรวจเอกสาร", pending, "รายการต้องดำเนินการ"]
  ];
  $("stats").innerHTML = stats.map(s => `<div class="card stat"><span class="label">${s[0]}</span><span class="value">${s[1]}</span><span class="note">${s[2]}</span></div>`).join("");
  $("topMedals").innerHTML = medalRows(rankedSchools().slice(0,10), true);
  
  $("todayEvents").innerHTML = table(
    ["รายการ", "กลุ่มสาระ", "ระดับ", "สนาม", "วันที่แข่งขัน"], 
    sortedEvents.map(e => [e.name, e.subject, e.level, byId(db.venues, e.venueId).name || "-", e.date])
  );
}

function medalRows(rows, compact=false) {
  return table(compact ? ["โรงเรียน","ทอง","เงิน","ทองแดง"] : ["อันดับโรงเรียน","🎖️ ทอง","🎖️ เงิน","🎖️ ทองแดง","🎖️ เข้าร่วม","รวมทั้งหมด"], rows.map((s,i) => {
    const total = s.medals.gold+s.medals.silver+s.medals.bronze+s.medals.joined;
    return compact ? [`${i+1}. ${s.name}`, s.medals.gold, s.medals.silver, s.medals.bronze] : [`${i+1}. ${s.name}`, s.medals.gold, s.medals.silver, s.medals.bronze, s.medals.joined, total];
  }));
}

function renderRankings() { $("rankingTable").innerHTML = medalRows(rankedSchools()); }

function renderEvents() {
  const q = ($("eventSearch")?.value || "").toLowerCase();
  const rows = db.events.filter(e => (`${e.name} ${e.subject}`).toLowerCase().includes(q));
  $("eventsTable").innerHTML = table(["รายการ","กลุ่มสาระ","ระดับ","ประเภท","ผู้เข้าแข่ง","ครู","วัน","สนาม","จัดการ"], rows.map(e => [
    e.name, e.subject, e.level, e.type, e.members, e.teachers, e.date, byId(db.venues,e.venueId).name || "-",
    currentRole === "admin" ? rowActions("editEvent", e.id) + rowActions("deleteEvent", e.id, true) : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderRegistrations() {
  $("registrationTable").innerHTML = table(["รายการ","โรงเรียน","นักเรียน/ทีม","ครู","เอกสาร","สถานะ","จัดการ"], db.registrations.slice().reverse().map(r => [
    byId(db.events,r.eventId).name || "-", byId(db.schools,r.schoolId).name || "-", escapeHtml(r.students), r.teacher, `${r.photo} / ${r.cert}`, statusBadge(r.status),
    (currentRole === "admin" || r.status === "รอตรวจ" || r.status === "ต้องแก้ไข") ? rowActions("editRegistration", r.id) + rowActions("deleteRegistration", r.id, true) : `<span class="badge">อนุมัติแล้ว (อ่านอย่างเดียว)</span>`
  ]));
}

// Refactor: ปรับปรุงโครงสร้างให้ใช้ฟังก์ชัน table ส่วนกลางเพื่อลดความซ้ำซ้อน
function renderResults() {
  const tableEl = $("resultsTable");
  if (!tableEl) return;
  
  const headers = ["รายการแข่งขัน", "โรงเรียน", "คะแนน", "ผลการประกวด", "อันดับ"];
  if (currentRole === "admin") headers.push("จัดการ");

  const rows = db.registrations.map(r => {
    const ev = byId(db.events, r.eventId);
    const sch = byId(db.schools, r.schoolId);
    if (!ev || !sch) return null;

    const scoreText = (r.score !== undefined && r.score !== null) ? r.score : "-";
    const medalText = r.medal || "-";
    const rankText = r.rank ? `อันดับที่ ${r.rank}` : "-";
    
    const row = [
      `<b>${ev.name}</b><br><small>${ev.level} (${ev.type})</small>`,
      sch.name,
      `<span class="badge">${scoreText}</span>`,
      `<span class="badge ${r.medal ? 'success' : ''}">${medalText}</span>`,
      rankText
    ];
    if (currentRole === "admin") {
      row.push(`<button class="btn-sm" type="button" onclick="editResult('${r.id}')">✏️ แก้ไข</button>`);
    }
    return row;
  }).filter(Boolean);

  tableEl.innerHTML = table(headers, rows);
}

function editResult(regId) {
  const r = byId(db.registrations, regId);
  if (!r) return;
  $("resultRegId").value = r.id;
  if ($("resultRegistration")) $("resultRegistration").value = r.id;
  $("resultScore").value = (r.score !== undefined && r.score !== null) ? r.score : "80";
  $("resultMedal").value = r.medal || "";
  $("resultRank").value = r.rank || "";
}

function renderSchools() {
  $("schoolsTable").innerHTML = table(["โรงเรียน","ผู้บริหาร","โทรศัพท์","จัดการ"], db.schools.map(s => [
    s.name, s.director, s.phone, currentRole === "admin" ? rowActions("editSchool", s.id) + rowActions("deleteSchool", s.id, true) : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderVenues() {
  $("venuesTable").innerHTML = table(["สนาม","ที่ตั้ง/เจ้าภาพ","ผู้ประสานงาน","จัดการ"], db.venues.map(v => [
    v.name, v.host, v.contact, currentRole === "admin" ? rowActions("editVenue", v.id) + rowActions("deleteVenue", v.id, true) : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderJudges() {
  $("judgesTable").innerHTML = table(["รายการ","ชื่อกรรมการ","คุณสมบัติ","วิทยฐานะ","โทรศัพท์","จัดการ"], db.judges.map(j => [
    byId(db.events,j.eventId).name || "-", j.name, j.role, j.rank, j.phone,
    currentRole === "admin" ? rowActions("editJudge", j.id) + rowActions("deleteJudge", j.id, true) : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderDocuments() {
  $("documentsTable").innerHTML = table(["รายการ","โรงเรียน","เอกสาร","สถานะ","ดำเนินการ"], db.registrations.map(r => [
    byId(db.events,r.eventId).name || "-", byId(db.schools,r.schoolId).name || "-", `${r.photo} / ${r.cert}`, statusBadge(r.status),
    currentRole === "admin" ? `<button class="icon" title="รับรอง" data-action="approveDoc" data-id="${r.id}">✓</button> <button class="icon danger" title="ให้แก้ไข" data-action="rejectDoc" data-id="${r.id}">!</button>` : `<span class="badge">รอ Admin</span>`
  ]));
}

function renderUsers() {
  const counts = db.users.reduce((a,u) => (a[u.role]++, a), {admin:0,user:0});
  $("usersTable").innerHTML = table([`ผู้ใช้งาน (${counts.admin} Admin / ${counts.user} User)`,"สิทธิ์","สถานะรหัสผ่าน","ดำเนินการ"], db.users.map(u => [
    u.username, u.role === "admin" ? "Admin" : "User", u.changed ? "เปลี่ยนรหัสแล้ว" : "ใช้รหัสตั้งต้น",
    currentRole === "admin" ? rowActions("editUser", u.id) + rowActions("deleteUser", u.id, true) + `<button class="secondary" data-action="resetPassword" data-id="${u.id}">Reset password</button>` : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderCertificate() {
  const event = byId(db.events, $("certEvent")?.value) || db.events[0] || {};
  const no = `ศรน-${String(new Date().getFullYear()+543).slice(2)}-${String(db.certNo || 1).padStart(5,"0")}`;
  $("certificate").innerHTML = `
    <div>
      ${certLogoUrl ? `<img src="${certLogoUrl}" alt="logo" style="width:72px;height:72px;object-fit:contain;margin:0 auto 14px;display:block">` : `<div class="seal" style="margin:0 auto 14px">ศรน</div>`}
      <h4>เกียรติบัตร</h4>
      <p>เลขทะเบียน ${no}</p>
      <p>ขอมอบให้</p>
      <div class="big">${escapeHtml($("certName")?.value || "ผู้รับเกียรติบัตร")}</div>
      <p>${escapeHtml($("certType")?.value || "นักเรียน")} ได้รับรางวัล <strong>${escapeHtml($("certAward")?.value || "เหรียญทอง")}</strong> รายการแข่งขัน ${escapeHtml(event.name || "การแข่งขันศิลปหัตถกรรมนักเรียน")}</p>
      <p>การแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 75 กลุ่มโรงเรียนศรีรัตนะ สังกัด สพป.ศรีสะเกษ เขต 4</p>
      <div class="sign-row">
	      <div>${certSignUrl ? `<img src="${certSignUrl}" alt="signature" style="width:150px;height:48px;object-fit:contain;display:block;margin:0 auto 4px">` : ""}<div class="sign-line">ประธานกลุ่มโรงเรียนศรีรัตนะ</div></div>
      </div>
    </div>`;
}

// ==========================================
// 7. COMPONENT HTML BUILDERS
// ==========================================
function table(headers, rows) {
  if (!rows.length) return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody><tr><td colspan="${headers.length}" class="empty">ยังไม่มีข้อมูล</td></tr></tbody>`;
  return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function statusBadge(status) { return `<span class="badge ${status === "รับรอง" ? "ok" : status === "ต้องแก้ไข" ? "bad" : "warn"}">${status}</span>`; }
function rowActions(action, id, danger=false) { return `<button class="${danger ? "danger" : "secondary"}" data-action="${action}" data-id="${id}">${action.startsWith("edit") ? "แก้ไข" : "ลบ"}</button> `; }

// ==========================================
// 8. DATA OPERATIONS & FORMS BINDING
// ==========================================
function bindForms() {
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "editEvent") editEvent(id);
    if (action === "deleteEvent") removeItem("events", id);
    if (action === "editSchool") editSchool(id);
    if (action === "deleteSchool") removeItem("schools", id);
    if (action === "editVenue") editVenue(id);
    if (action === "deleteVenue") removeItem("venues", id);
    if (action === "approveDoc") updateDoc(id, "รับรอง");
    if (action === "rejectDoc") updateDoc(id, "ต้องแก้ไข");
    if (action === "resetPassword") resetPassword(id);
    if (action === "editRegistration") editRegistration(id);
    if (action === "deleteRegistration") removeItem("registrations", id);
    if (action === "editJudge") editJudge(id);
    if (action === "deleteJudge") removeItem("judges", id);
    if (action === "editUser") editUser(id);
    if (action === "deleteUser") removeItem("users", id);
  });
  
  if($("eventSearch")) $("eventSearch").addEventListener("input", renderEvents);
  
  if($("eventForm")) $("eventForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("eventId").value || nextId("e", db.events);
    upsert(db.events, {
      id,
      name: $("eventName").value,
      subject: $("eventSubject").value,
      level: $("eventLevel").value,
      type: $("eventType").value,
      members: Number($("eventMembers").value),
      date: $("eventDate").value,
      venueId: $("eventVenue").value,
      teachers: teacherCount(Number($("eventMembers").value))
    });
    e.target.reset(); $("eventId").value = ""; save(); render();
  });
  
  if($("clearEvent")) $("clearEvent").addEventListener("click", () => $("eventForm").reset());
  if($("clearSchool")) $("clearSchool").addEventListener("click", () => $("schoolForm").reset());
  if($("reportBtn")) $("reportBtn").addEventListener("click", openReport);
  if($("clearUser")) $("clearUser").addEventListener("click", () => { $("userForm").reset(); if($("userId")) $("userId").value = ""; });
  
  ["certType","certName","certAward","certEvent"].forEach(id => {
    if($(id)) $(id).addEventListener("input", renderCertificate);
  });
  
  if($("certLogo")) $("certLogo").addEventListener("change", e => readImage(e.target.files[0], url => { certLogoUrl = url; renderCertificate(); }));
  if($("certSign")) $("certSign").addEventListener("change", e => readImage(e.target.files[0], url => { certSignUrl = url; renderCertificate(); }));

  if($("registrationForm")) $("registrationForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("regId")?.value || nextId("r", db.registrations);
    const oldReg = byId(db.registrations, id);
    upsert(db.registrations, {
      id,
      eventId: $("regEvent").value,
      schoolId: $("regSchool").value,
      students: $("regStudents").value,
      teacher: $("regTeacher").value,
      phone: $("regPhone").value,
      photo: $("regPhoto").files?.[0]?.name || oldReg.photo || "ยังไม่แนบ",
      cert: $("regCert").files?.[0]?.name || oldReg.cert || "ยังไม่แนบ",
      status: oldReg.status || "รอตรวจ",
      score: oldReg.score !== undefined ? oldReg.score : null,
      medal: oldReg.medal || null,
      medalApplied: oldReg.medalApplied || false
    });
    e.target.reset(); if($("regId")) $("regId").value = ""; save(); render();
  });
  
  if ($("resultForm")) {
    $("resultForm").addEventListener("submit", e => {
      e.preventDefault();
      const regId = $("resultRegId").value || $("resultRegistration").value;
      const scoreValue = $("resultScore").value;
      const score = scoreValue !== "" ? Number(scoreValue) : null;
      let medal = $("resultMedal").value;
      const rank = $("resultRank").value !== "" ? Number($("resultRank").value) : null;

      if (!medal && score !== null) medal = medalFromScore(score);

      const targetReg = byId(db.registrations, regId);
      if (!targetReg.id) return alert("ไม่พบข้อมูลการลงทะเบียนแข่งขันที่ตรงกัน");

      targetReg.score = score;
      targetReg.medal = medal;
      targetReg.rank = rank;

      save(); render(); e.target.reset(); $("resultRegId").value = "";
      alert("บันทึกคะแนนและผลการแข่งขันสำเร็จ!");
    });
  }
  
  if($("schoolForm")) $("schoolForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("schoolId").value || nextId("s", db.schools);
    upsert(db.schools, { id, name:$("schoolName").value, director:$("schoolDirector").value, phone:$("schoolPhone").value, medals: byId(db.schools,id).medals || {gold:0,silver:0,bronze:0,joined:0} });
    e.target.reset(); $("schoolId").value = ""; save(); render();
  });
  
  if($("venueForm")) $("venueForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("venueId").value || nextId("v", db.venues);
    upsert(db.venues, { id, name:$("venueName").value, host:$("venueHost").value, contact:$("venueContact").value });
    e.target.reset(); $("venueId").value = ""; save(); render();
  });
  
  if($("judgeForm")) $("judgeForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("judgeId").value || nextId("j", db.judges);
    upsert(db.judges, { id, eventId: $("judgeEvent").value, name: $("judgeName").value, role: $("judgeRole").value, rank: $("judgeRank").value, phone: $("judgePhone").value });
    e.target.reset(); $("judgeId").value = ""; save(); render();
  });
  
  if($("certForm")) $("certForm").addEventListener("submit", e => {
    e.preventDefault();
    db.certNo = (db.certNo || 1) + 1;
    save(); renderCertificate(); alert("สร้างเกียรติบัตรเรียบร้อย สามารถพิมพ์เป็น PDF ได้จากเบราว์เซอร์");
  });
  
  if($("userForm")) $("userForm").addEventListener("submit", e => {
    e.preventDefault();
    db.users.push({ id:nextId("u", db.users), username:$("userName").value, role:$("userRole").value, password:$("userPassword").value, changed:false });
    e.target.reset(); $("userPassword").value = "SriRatana@123"; save(); render();
  });
}

function upsert(list, item) { const index = list.findIndex(x => x.id === item.id); if (index >= 0) list[index] = item; else list.push(item); }
function removeItem(listName, id) {
  if (currentRole !== "admin" && listName !== "registrations") return alert("เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้");
  if (!confirm("คุณต้องการยืนยันการลบข้อมูลนี้หรือไม่?")) return;
  db[listName] = db[listName].filter(x => x.id !== id);
  save(); render();
}

function editEvent(id) { const e = byId(db.events, id); $("eventId").value = e.id; $("eventName").value = e.name; $("eventSubject").value = e.subject; $("eventLevel").value = e.level; $("eventType").value = e.type; $("eventMembers").value = e.members; $("eventDate").value = e.date; $("eventVenue").value = e.venueId; showPage("events"); }
function editSchool(id) { const s = byId(db.schools, id); $("schoolId").value = s.id; $("schoolName").value = s.name; $("schoolDirector").value = s.director; $("schoolPhone").value = s.phone; showPage("schools"); }
function editVenue(id) { const v = byId(db.venues, id); $("venueId").value = v.id; $("venueName").value = v.name; $("venueHost").value = v.host; $("venueContact").value = v.contact; showPage("venues"); }
function editUser(id) { const u = byId(db.users, id); $("userId").value = u.id; $("userName").value = u.username; $("userRole").value = u.role; $("userPassword").value = u.password; showPage("users"); }
function editJudge(id) { const j = byId(db.judges, id); $("judgeId").value = j.id; $("judgeEvent").value = j.eventId; $("judgeName").value = j.name; $("judgeRole").value = j.role; $("judgeRank").value = j.rank; $("judgePhone").value = j.phone; showPage("judges"); }

function editRegistration(id) {
  const r = byId(db.registrations, id);
  if (!$("regId")) {
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "regId";
    $("registrationForm").appendChild(hiddenInput);
  }
  $("regId").value = r.id; $("regEvent").value = r.eventId; $("regSchool").value = r.schoolId; $("regStudents").value = r.students; $("regTeacher").value = r.teacher; $("regPhone").value = r.phone;
  showPage("registration");
}

function updateDoc(id, status) {
  const r = byId(db.registrations, id);
  r.status = status;
  r.cert = status === "รับรอง" ? "แนบแล้ว" : "ต้องแก้ไข";
  save(); render();
}

function resetPassword(id) {
  const u = byId(db.users, id);
  u.password = u.role === "admin" ? "SriRatana@123" : "User@123";
  u.changed = false;
  save(); render();
  alert(`Reset password ของ ${u.username} เป็นรหัสตั้งต้นแล้ว`);
}

function readImage(file, done) { if (!file) return done(""); const reader = new FileReader(); reader.onload = () => done(reader.result); reader.readAsDataURL(file); }

// ==========================================
// 9. SECURITY & SESSION CONTROL INTERFACE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("mainLoginForm");
  const loginError = document.getElementById("loginError");

  function getAllUsers() {
    const stored = localStorage.getItem(storeKey);
    if (stored) {
      try { return JSON.parse(stored).users || makeUsers(); } catch (e) { console.error(e); }
    }
    return makeUsers();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("loginUser").value.trim();
      const passwordInput = document.getElementById("loginPassword").value;
      const foundUser = getAllUsers().find(u => u.username === usernameInput && u.password === passwordInput);
      
      if (foundUser) {
        sessionStorage.setItem("currentUser", JSON.stringify(foundUser));
        if (loginOverlay) loginOverlay.style.display = "none";
        
        const roleSelect = document.getElementById("roleSelect");
        if (roleSelect) {
          roleSelect.value = foundUser.role;
          currentRole = foundUser.role;
        }
        
        const roleBadge = document.getElementById("roleBadge");
        if (roleBadge) roleBadge.textContent = `${foundUser.username} (${foundUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
        
        renderNav();
        render();
        alert(`ยินดีต้อนรับเข้าสู่ระบบ: คุณ ${foundUser.username}`);
      } else {
        if (loginError) loginError.style.display = "block";
        document.getElementById("loginPassword").value = "";
      }
    });
  }

  const currentSessionUser = sessionStorage.getItem("currentUser");
  if (currentSessionUser && loginOverlay) {
    const user = JSON.parse(currentSessionUser);
    loginOverlay.style.display = "none";
    currentRole = user.role;
    
    setTimeout(() => {
      const roleSelect = document.getElementById("roleSelect");
      if (roleSelect) {
        roleSelect.value = user.role;
      }
      const roleBadge = document.getElementById("roleBadge");
      if (roleBadge) roleBadge.textContent = `${user.username} (${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
      renderNav();
      render();
    }, 100);
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("คุณต้องการออกจากระบบและเคลียร์สิทธิ์การเข้าใช้งานใช่หรือไม่?")) {
      sessionStorage.removeItem("currentUser");
      window.location.reload();
    }
  });
}

// เรียกให้ระบบเริ่มทำงาน
init();