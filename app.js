// =========================================================================
// 1. CONSTANTS & GLOBAL CONFIGURATION
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzbKaf7c2VtfcNuIU1G0yOTFb3jqmA6d241wIwfgfBCIwkWPS21C1SHnB-SWK1axh1-CA/exec";
const storeKey = "sriratana-arts-system";
const THEME_STORE_KEY = "custom-theme-settings";
const today = new Date().toISOString().slice(0, 10);

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

// STATE GLOBAL
let localDatabase = {};
let db = JSON.parse(localStorage.getItem(storeKey) || "null") || seed();
let currentRole = "";
let currentPage = "dashboard";
let certLogoUrl = "", certSignUrl = "", certBgUrl = "";

// HELPER FUNCTIONS
const $ = id => document.getElementById(id);
const byId = (list, id) => list.find(x => x.id === id) || {};
const save = () => localStorage.setItem(storeKey, JSON.stringify(db));
const nextId = (prefix, list) => prefix + (list.length ? Math.max(...list.map(x => Number(String(x.id).replace(/\D/g,"")) || 0)) + 1 : 1);
const optionList = (items, getLabel = x => x.name) => items.map(x => `<option value="${x.id}">${getLabel(x)}</option>`).join("");
const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[s]));

function teacherCount(members) {
  const n = Number(members || 1);
  return n === 1 ? 1 : n <= 5 ? 2 : 3;
}

function medalFromScore(score) {
  score = Number(score);
  return score >= 80 ? "เหรียญทอง" : score >= 70 ? "เหรียญเงิน" : score >= 60 ? "เหรียญทองแดง" : "เข้าร่วมการแข่งขัน";
}

function makeUsers() {
  return [
    { id:"a1", username:"admin01", role:"admin", password:"SriRatana@123", changed:false },
    { id:"u1", username:"user01", role:"user", password:"User@123", changed:false }
  ];
}

function seed() {
  return {
    theme: "default",
    themeSettings: null,
    schools: defaultSchools,
    venues: [],
    events: [],
    registrations: [],
    judges: [],
    users: makeUsers(),
    certNo: 500
  };
}
// =========================================================================
// GENERIC FORM HANDLER (แก้ไขปัญหา Form Reset ก่อนเซฟเสร็จ)
// =========================================================================
function handleFormSubmit(formId, config) {
  const form = $(formId);
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const idField = config.idPrefix + "Id";
    const existingId = $(idField)?.value;
    const id = existingId || nextId(config.idPrefix, db[config.listName]);
    const actionType = existingId ? "update" : "insert";

    const item = config.buildItem(id, existingId);
    
    // อัปเดต Cache ในเครื่องทันทีเพื่อให้ UI ไม่อืด
    upsert(db[config.listName], item);
    save();

    // แสดงสถานะกำลังบันทึกที่ปุ่ม Submit (ป้องกันการกดซ้ำ)
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "⏳ กำลังบันทึกข้อมูล...";
    }

    const rowData = config.buildRowData(item);

    // ส่งข้อมูลไปยัง Google Sheets และรอจนกว่าจะสำเร็จ
    await saveToDatabase(config.listName, actionType, rowData, () => {
      if (typeof config.onSuccess === "function") {
        config.onSuccess();
      } else {
        render();
      }

      // ล้างค่าฟอร์มหลังจากบันทึกไปยัง Google Sheets สำเร็จเรียบร้อยแล้วเท่านั้น
      form.reset();
      if ($(idField)) $(idField).value = "";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
      }

      if (config.successMsg) alert(config.successMsg);
    });
  });
}

// =========================================================================
// 2. API & DATABASE SYNC
// =========================================================================
async function fetchDatabase(callback) {
  try {
    const response = await fetch(API_URL, { method: "GET" });
    const result = await response.json();
    
    if (result.status === "success") {
      localDatabase = result.db || {};
      const currentLocalTheme = localStorage.getItem("sriratana-arts-theme") || "default";
      
      db = { ...db, ...localDatabase }; 
      if (!db.theme || db.theme === "0" || db.theme === 0) {
        db.theme = currentLocalTheme !== "0" ? currentLocalTheme : "default";
      }
      
      localStorage.setItem("sriratana-arts-theme", db.theme);
      document.documentElement.setAttribute("data-theme", db.theme);
      save();

      if (typeof callback === "function") callback(db);
    }
  } catch (error) {
    console.error("❌ ไม่สามารถเชื่อมต่อกับ Google Sheets API ได้:", error);
  }
}

async function saveToDatabase(sheetName, action, rowData, successCallback) {
  // 1. อัปเดตข้อมูลในหน่วยความจำชั่วคราวบนเครื่องก่อน
  updateLocalCache(sheetName, action, rowData);
  if (typeof successCallback === "function") successCallback(db);

  try {
    // 2. ส่ง Request แบบ POST โดยไม่ใส่ mode: "no-cors"
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ sheetName, action, data: rowData })
    });
    console.log(`📤 ส่งคำสั่ง ${action} ไปยังแท็บ ${sheetName} เรียบร้อยแล้ว`);
  } catch (error) {
    console.error("❌ ไม่สามารถบันทึกข้อมูลไปยัง Google Sheet ได้:", error);
  }
}

function updateLocalCache(sheetName, action, rowData) {
  if (!localDatabase[sheetName]) localDatabase[sheetName] = [];
  const targetId = rowData[0];

  if (action === "insert") {
    localDatabase[sheetName].push(rowData); 
  } else if (action === "update") {
    const index = localDatabase[sheetName].findIndex(row => (row.id || row[0]) == targetId);
    if (index !== -1) localDatabase[sheetName][index] = rowData;
  } else if (action === "delete") {
    localDatabase[sheetName] = localDatabase[sheetName].filter(row => (row.id || row[0]) != targetId);
  }
}

async function backupSystemToGoogleSheet() {
  const backupBtn = $("backupBtn");
  if(backupBtn) backupBtn.innerText = "⏳ กำลังส่งข้อมูล...";
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_all", db })
    });
    alert("💾 สำรองข้อมูลระบบเข้าสู่ Google Sheet เรียบร้อยแล้ว!");
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการสำรองข้อมูล");
  } finally {
    if(backupBtn) backupBtn.innerText = "💾 สำรองข้อมูลระบบ(Google Sheet)";
  }
}

function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (confirm("คุณต้องการนำเข้าข้อมูลนี้ใช่หรือไม่? ข้อมูลเดิมจะถูกเขียนทับ")) {
        db = importedData;
        save();
        
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import_json", db })
        });
        
        alert("📤 นำเข้าข้อมูลระบบและซิงค์ไปยัง Google Sheet สำเร็จ!");
        render();
      }
    } catch (err) {
      alert("❌ ไฟล์ JSON ไม่ถูกต้องตามรูปแบบฐานข้อมูลระบบ");
    }
  };
  reader.readAsText(file);
}

// =========================================================================
// REALTIME SYNC (หยุด Sync ชั่วคราวหากกำลังพิมพ์ฟอร์มอยู่)
// =========================================================================
function initRealtimeSync(renderUIFunction) {
  fetchDatabase(renderUIFunction);
  
  setInterval(() => {
    // เช็คว่าผู้ใช้กำลังพิมพ์อยู่ใน input, select, textarea หรือไม่
    const activeEl = document.activeElement;
    const isUserTyping = activeEl && (
      activeEl.tagName === "INPUT" || 
      activeEl.tagName === "SELECT" || 
      activeEl.tagName === "TEXTAREA"
    );

    // ถ้าผู้ใช้ไม่ได้พิมพ์ฟอร์มค้างไว้ ให้ทำการ Sync ข้อมูลตามปกติ
    if (!isUserTyping) {
      fetchDatabase(renderUIFunction);
    }
  }, 12000); // 12 วินาที
}

// =========================================================================
// 3. THEME MANAGEMENT
// =========================================================================
function currentThemeSettings() {
  const savedTheme = localStorage.getItem(THEME_STORE_KEY);
  if (savedTheme) {
    try { return JSON.parse(savedTheme); } catch (e) {}
  }
  return themeDefaults.default;
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || "#000000").replace("#", "");
  const value = clean.length === 3 ? clean.split("").map(x => x + x).join("") : clean;
  const num = parseInt(value, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
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
  Object.entries(themeFields).forEach(([key, id]) => { if ($(id)) $(id).value = settings[key]; });
}

function readThemeControls() {
  const settings = {};
  Object.entries(themeFields).forEach(([key, id]) => {
    settings[key] = key === "radius" ? Number($(id).value) : $(id).value;
  });
  return settings;
}

function openThemePanel() {
  syncThemeControls();
  $("themePanel").classList.add("open");
  $("themePanel").setAttribute("aria-hidden", "false");
}

function closeThemePanel() {
  $("themePanel").classList.remove("open");
  $("themePanel").setAttribute("aria-hidden", "true");
  applyThemeSettings();
}

function saveThemeSettings() {
  const settings = readThemeControls();
  localStorage.setItem(THEME_STORE_KEY, JSON.stringify(settings));
  applyThemeSettings(settings);
  closeThemePanel();
}

function resetThemeSettings() {
  if (confirm("ต้องการรีเซ็ตโทนสีกลับไปเป็นค่าเริ่มต้นของระบบหรือไม่?")) {
    localStorage.removeItem(THEME_STORE_KEY);
    applyThemeSettings();
    syncThemeControls();
    closeThemePanel();
  }
}

// =========================================================================
// 4. UI RENDERERS & COMPONENTS
// =========================================================================
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

// =========================================================================
// FILL SELECTS (ป้องกันการ Reset ค่า Option ขณะกรอกฟอร์ม)
// =========================================================================
function fillSelects() {
  const activeEl = document.activeElement; // เช็คว่าผู้ใช้งานกำลังโฟกัสที่ช่องไหนอยู่

  if ($("eventSubject")) $("eventSubject").innerHTML = subjects.map(s => `<option>${s}</option>`).join("");
  if ($("eventLevel")) $("eventLevel").innerHTML = levels.map(s => `<option>${s}</option>`).join("");
  if ($("eventVenue")) $("eventVenue").innerHTML = optionList(db.venues);

  // อัปเดต regEvent เฉพาะเมื่อผู้ใช้ไม่ได้กำลังคลิก/เลือกช่องนี้อยู่
  if ($("regEvent") && activeEl !== $("regEvent")) {
    const currentRegVal = $("regEvent").value;
    $("regEvent").innerHTML = optionList(db.events, e => `${e.name} (${e.level})`);
    if (currentRegVal) $("regEvent").value = currentRegVal; // รักษาค่าเดิมไว้
  }

  ["judgeEvent", "certEvent"].forEach(id => {
    if ($(id) && activeEl !== $(id)) {
      const curVal = $(id).value;
      $(id).innerHTML = optionList(db.events, e => `${e.name} (${e.level})`);
      if (curVal) $(id).value = curVal;
    }
  });

  // อัปเดต regSchool เฉพาะเมื่อผู้ใช้ไม่ได้กำลังเลือกช่องนี้อยู่
  if ($("regSchool") && activeEl !== $("regSchool")) {
    const currentSchoolVal = $("regSchool").value;
    $("regSchool").innerHTML = optionList(db.schools);
    if (currentSchoolVal) $("regSchool").value = currentSchoolVal; // รักษาค่าเดิมไว้
  }

  if ($("resultRegistration") && activeEl !== $("resultRegistration")) {
    $("resultRegistration").innerHTML = db.registrations.map(r => 
      `<option value="${r.id}">${byId(db.events, r.eventId).name || "-"} - ${byId(db.schools, r.schoolId).name || "-"}</option>`
    ).join("");
  }
}

function rankedSchools() {
  const schoolMedalMap = {};
  
  // 1. ตั้งค่าเริ่มต้นให้กับทุกโรงเรียน
  db.schools.forEach(s => { 
    schoolMedalMap[s.id] = { id: s.id, name: s.name, gold: 0, silver: 0, bronze: 0, joined: 0 }; 
  });

  // 2. รวบรวมสถิติเหรียญรางวัลจากผลการลงทะเบียนแข่งขัน
  db.registrations.forEach(r => {
    if (schoolMedalMap[r.schoolId]) {
      if (r.medal === "เหรียญทอง") schoolMedalMap[r.schoolId].gold++;
      else if (r.medal === "เหรียญเงิน") schoolMedalMap[r.schoolId].silver++;
      else if (r.medal === "เหรียญทองแดง") schoolMedalMap[r.schoolId].bronze++;
      else if (r.medal === "เข้าร่วมการแข่งขัน") schoolMedalMap[r.schoolId].joined++;
    }
  });

  // 3. เรียงลำดับจากมากไปน้อย: ทอง -> เงิน -> ทองแดง -> รวมเหรียญทั้งหมด -> ชื่อโรงเรียน
  return Object.values(schoolMedalMap).sort((a, b) => {
    const totalA = a.gold + a.silver + a.bronze + a.joined;
    const totalB = b.gold + b.silver + b.bronze + b.joined;

    return (
      b.gold - a.gold ||             // 1. เทียบเหรียญทอง
      b.silver - a.silver ||         // 2. เทียบเหรียญเงิน
      b.bronze - a.bronze ||         // 3. เทียบเหรียญทองแดง
      totalB - totalA ||             // 4. เทียบจำนวนเหรียญรวมทั้งหมด
      a.name.localeCompare(b.name, "th") // 5. เรียงตามชื่อโรงเรียน (ภาษาไทย)
    );
  }).map(item => ({
    id: item.id,
    name: item.name,
    medals: { gold: item.gold, silver: item.silver, bronze: item.bronze, joined: item.joined }
  }));
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
  $("topMedals").innerHTML = medalRows(rankedSchools().slice(0, 10), true);
  
  $("todayEvents").innerHTML = table(
    ["รายการ", "กลุ่มสาระ", "ระดับ", "สนาม", "วันที่แข่งขัน"], 
    sortedEvents.map(e => [e.name, e.subject, e.level, byId(db.venues, e.venueId).name || "-", e.date])
  );
}

function medalRows(rows, compact=false) {
  return table(compact ? ["โรงเรียน","ทอง","เงิน","ทองแดง"] : ["อันดับโรงเรียน","🎖️🎖️🎖️ ทอง","🎖️🎖️ เงิน","🎖️ ทองแดง","🎖️เข้าร่วม","รวมทั้งหมด"], rows.map((s,i) => {
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
    byId(db.events,r.eventId).name || "-", 
    byId(db.schools,r.schoolId).name || "-", 
    escapeHtml(r.students), 
    r.teacher,
    `${r.photo} / ${r.cert}`, 
    statusBadge(r.status),
    (currentRole === "admin" || r.status === "รอตรวจ" || r.status === "ต้องแก้ไข") 
      ? rowActions("editRegistration", r.id) + rowActions("deleteRegistration", r.id, true) 
      : `<span class="badge">อนุมัติแล้ว (อ่านอย่างเดียว)</span>`
  ]));
}
// =========================================================================
// RENDER RESULTS (แก้ไขปุ่ม ให้ส่ง data-id ตรงกับ Cell)
// =========================================================================
function renderResults() {
  const tableEl = $("resultsTable");
  if (!tableEl) return;

  let html = `<thead><tr><th>รายการแข่งขัน</th><th>โรงเรียน</th><th>คะแนน</th><th>ผลการประกวด</th><th>อันดับ</th><th class="admin-only">จัดการ</th></tr></thead><tbody>`;

  (db.registrations || []).forEach(r => {
    const ev = byId(db.events, r.eventId);
    const sch = byId(db.schools, r.schoolId);
    if (!ev || !sch) return;

    html += `<tr>
      <td><b>${escapeHtml(ev.name)}</b><br><small>${escapeHtml(ev.level)} (${escapeHtml(ev.type)})</small></td>
      <td>${escapeHtml(sch.name)}</td>
      <td><span class="badge">${r.score ?? "-"}</span></td>
      <td><span class="badge ${r.medal ? 'success' : ''}">${r.medal || "-"}</span></td>
      <td>${r.rank ? `อันดับที่ ${r.rank}` : "-"}</td>
      <td class="admin-only">
        <!-- เพิ่ม data-action และ data-id เพื่อส่งค่า ID ของ Cell นี้ไปประมวลผล -->
        <button class="secondary btn-sm" data-action="editResult" data-id="${r.id}">✏️ แก้ไข</button>
      </td>
    </tr>`;
  });

  html += "</tbody>";
  tableEl.innerHTML = html;
}

// =========================================================================
// EDIT RESULT (ดึงข้อมูลจริงมาใส่ในฟอร์มเพื่อแก้ไข)
// =========================================================================
// =========================================================================
// EDIT RESULT (ดึงข้อมูลจาก Cell/Row นั้นๆ หยอดใส่ใน Form)
// =========================================================================
function editResult(regId) {
  // 1. ค้นหาข้อมูลการลงทะเบียนจาก Array ตาม ID ที่กดจากตาราง
  const r = db.registrations.find(x => String(x.id) === String(regId));
  if (!r) {
    alert("❌ ไม่พบข้อมูลการลงทะเบียนนี้");
    return;
  }

  // 2. สะท้อนข้อมูลจาก Cell นั้นไปป้อนลงในช่อง Form
  if ($("resultRegId")) $("resultRegId").value = r.id;
  if ($("resultRegistration")) $("resultRegistration").value = r.id;
  if ($("resultScore")) $("resultScore").value = (r.score !== null && r.score !== undefined) ? r.score : "";
  if ($("resultMedal")) $("resultMedal").value = r.medal || "";
  if ($("resultRank")) $("resultRank").value = (r.rank !== null && r.rank !== undefined) ? r.rank : "";

  // 3. เลื่อนหน้าจอลงมาที่ฟอร์มเพื่อบันทึก
  const resultFormEl = $("resultForm");
  if (resultFormEl) {
    resultFormEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
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
    currentRole === "admin" ? 
      rowActions("editUser", u.id) + rowActions("deleteUser", u.id, true) + `<button class="secondary" data-action="resetPassword" data-id="${u.id}">Reset password</button>` 
      : `<span class="badge">อ่านอย่างเดียว</span>`
  ]));
}

function renderCertificate() {
  const event = byId(db.events, $("certEvent")?.value) || db.events[0] || {};
  const no = `ศรน-${String(new Date().getFullYear()+543).slice(0)}-${String(db.certNo || 1).padStart(5,"0")}`;
  $("certificate").innerHTML = `
    <div>
      ${certLogoUrl ? `<img src="${certLogoUrl}" alt="logo" style="width:72px;height:72px;object-fit:contain;margin:0 auto 14px;display:block">` : `<div class="seal" style="margin:0 auto 14px">ศรน</div>`}
      <h4>เกียรติบัตร</h4>
      <p>เลขทะเบียน ${no}</p>
      <p>ขอมอบให้</p>
      <div class="big">${escapeHtml($("certName")?.value || "ผู้รับเกียรติบัตร")}</div>
      <p>${escapeHtml($("certType")?.value || "นักเรียน")} ได้รับรางวัล <strong>${escapeHtml($("certAward")?.value || "เหรียญทอง")}</strong>
      รายการแข่งขัน ${escapeHtml(event.name || "การแข่งขันศิลปหัตถกรรมนักเรียน")}</p>
      <p>การแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 75 กลุ่มโรงเรียนศรีรัตนะ สังกัด สพป.ศรีสะเกษ เขต 4</p>
      <div class="sign-row">
        <div>
          ${certSignUrl ? `<img src="${certSignUrl}" alt="signature" style="width:150px;height:48px;object-fit:contain;display:block;margin:0 auto 4px">` : ""}
          <div class="sign-line">ประธานกลุ่มโรงเรียนศรีรัตนะ</div>
        </div>
      </div>
    </div>`;
}

function table(headers, rows) {
  if (!rows.length) return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody><tr><td colspan="${headers.length}" class="empty">ยังไม่มีข้อมูล</td></tr></tbody>`;
  return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

function statusBadge(status) {
  return `<span class="badge ${status === "รับรอง" ? "ok" : status === "ต้องแก้ไข" ? "bad" : "warn"}">${status}</span>`;
}

function rowActions(action, id, danger=false) {
  return `<button class="${danger ? "danger" : "secondary"}" data-action="${action}" data-id="${id}">${action.startsWith("edit") ? "แก้ไข" : "ลบ"}</button> `;
}

// =========================================================================
// 5. EVENT BINDING & ACTIONS
// =========================================================================
function bindForms() {
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "editEvent") editEvent(id);
    if (action === "editResult") editResult(id);	
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
  
  if ($("eventSearch")) $("eventSearch").addEventListener("input", renderEvents);

if ($("eventForm")) {
    $("eventForm").addEventListener("submit", e => {
      e.preventDefault();
      
      // 1. ระบุ ID และตรวจสอบว่าเป็น Insert หรือ Update
      const id = $("eventId").value || nextId("e", db.events);
      const actionType = $("eventId").value ? "update" : "insert";

      // 2. คำนวณจำนวนครูผู้ฝึกสอนและสร้างวัตถุข้อมูลรายการแข่งขัน
      const membersCount = Number($("eventMembers").value);
      const item = {
        id,
        name: $("eventName").value,
        subject: $("eventSubject").value,
        level: $("eventLevel").value,
        type: $("eventType").value,
        members: membersCount,
        date: $("eventDate").value,
        venueId: $("eventVenue").value,
        teachers: teacherCount(membersCount)
      };

      // 3. อัปเดตข้อมูลลงใน Local State / LocalStorage
      upsert(db.events, item);
      save();

      // 4. ส่งข้อมูลไปยัง Google Sheet ทันทีผ่าน saveToDatabase (แท็บ events)
      const rowData = [
        item.id, 
        item.name, 
        item.subject, 
        item.level, 
        item.type, 
        item.members, 
        item.teachers, 
        item.date, 
        item.venueId
      ];
      saveToDatabase("events", actionType, rowData, render);

      // 5. ล้างค่าในฟอร์มและแจ้งเตือนผู้ใช้
      e.target.reset();
      $("eventId").value = "";
      alert("บันทึกข้อมูลรายการแข่งขันเรียบร้อยแล้ว!");
    });
  }

  if ($("clearEvent")) $("clearEvent").addEventListener("click", () => $("eventForm").reset());
  if ($("clearSchool")) $("clearSchool").addEventListener("click", () => $("schoolForm").reset());
  if ($("reportBtn")) $("reportBtn").addEventListener("click", openReport);
  if ($("clearUser")) $("clearUser").addEventListener("click", () => {
    $("userForm").reset();
    if ($("userId")) $("userId").value = "";
  });

  ["certType","certName","certAward","certEvent"].forEach(id => {
    if ($(id)) $(id).addEventListener("input", renderCertificate);
  });
  
  if ($("certLogo")) $("certLogo").addEventListener("change", e => readImage(e.target.files[0], url => { certLogoUrl = url; renderCertificate(); }));
  if ($("certSign")) $("certSign").addEventListener("change", e => readImage(e.target.files[0], url => { certSignUrl = url; renderCertificate(); }));

if ($("registrationForm")) {
    $("registrationForm").addEventListener("submit", e => {
      e.preventDefault();
      const id = $("regId")?.value || nextId("r", db.registrations);
      const oldReg = byId(db.registrations, id);

      // 1. สร้าง Object ข้อมูลรายการลงทะเบียนล่าสุด
      const item = {
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
        rank: oldReg.rank || null
      };

      // 2. อัปเดตข้อมูลเข้า Local State และ LocalStorage
      upsert(db.registrations, item);
      save();

      // 3. ส่งข้อมูลไป Google Sheet โดยไม่ต้อง pass ฟังก์ชัน callback (เพื่อไม่ให้ re-render ทั่วทั้งหน้า)
      const rowData = [item.id, item.eventId, item.schoolId, item.students, item.teacher, item.phone, item.photo, item.cert, item.status, item.score, item.medal, item.rank];
      saveToDatabase("registrations", $("regId")?.value ? "update" : "insert", rowData);

      // 4. อัปเดตเฉพาะตาราง "รายการลงทะเบียนล่าสุด" โดยตรงทันที
      renderRegistrations();

      // 5. เคลียร์เฉพาะค่าในฟอร์ม ไม่ส่งกระทบต่อจุดอื่น
      e.target.reset();
      if ($("regId")) $("regId").value = "";

      alert("ลงทะเบียนนักเรียนเรียบร้อยแล้ว!");
    });
  }

// =========================================================================
// RESULT FORM SUBMIT (บันทึกและส่งสะท้อนไปยัง Google Sheet)
// =========================================================================
if ($("resultForm")) {
  $("resultForm").addEventListener("submit", async e => {
    e.preventDefault();
    
    // ดึง ID จาก Hidden Input หรือจาก Dropdown Select
    const regId = $("resultRegId")?.value || $("resultRegistration")?.value;
    const targetReg = db.registrations.find(x => String(x.id) === String(regId));

    if (!targetReg || !targetReg.id) {
      alert("❌ ไม่พบรายการแข่งขันที่ต้องการบันทึกคะแนน");
      return;
    }

    const scoreValue = $("resultScore").value;
    const score = scoreValue !== "" ? Number(scoreValue) : null;
    const medal = $("resultMedal").value || (score !== null ? medalFromScore(score) : null);
    const rank = $("resultRank").value !== "" ? Number($("resultRank").value) : null;

    // อัปเดตค่าใน Memory
    targetReg.score = score;
    targetReg.medal = medal;
    targetReg.rank = rank;
    save(); // บันทึกลง LocalStorage

    // ล็อกปุ่มเพื่อป้องกันการกดซ้ำระหว่างส่งไป Google Sheet
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "⏳ กำลังบันทึกไปยัง Google Sheet...";
    }

    // จัดเรียงโครงสร้างข้อมูลแถว (rowData) ให้ตรงกับโครงสร้างคอลัมน์ใน Google Sheet
    // [0:id, 1:eventId, 2:schoolId, 3:students, 4:teacher, 5:phone, 6:photo, 7:cert, 8:status, 9:score, 10:medal, 11:rank]
    const rowData = [
      targetReg.id,
      targetReg.eventId,
      targetReg.schoolId,
      targetReg.students,
      targetReg.teacher,
      targetReg.phone,
      targetReg.photo || "ยังไม่แนบ",
      targetReg.cert || "ยังไม่แนบ",
      targetReg.status || "รอตรวจ",
      targetReg.score,
      targetReg.medal,
      targetReg.rank
    ];

    // ส่งคำสั่ง 'update' ไปยังแท็บ registrations ใน Google Sheet
    await saveToDatabase("registrations", "update", rowData, () => {
      render(); // อัปเดต UI หน้าเว็บ
      e.target.reset();
      if ($("resultRegId")) $("resultRegId").value = "";
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
      }
      
      alert("✅ บันทึกผลคะแนนและอัปเดตลง Google Sheet เรียบร้อยแล้ว!");
    });
  });
}

if ($("schoolForm")) {
    $("schoolForm").addEventListener("submit", e => {
      e.preventDefault();
      
      // 1. ระบุ ID และตรวจสอบว่าเป็น Insert หรือ Update
      const id = $("schoolId").value || nextId("s", db.schools);
      const actionType = $("schoolId").value ? "update" : "insert";

      // 2. ดึงข้อมูลเหรียญเดิม (ถ้ามี) หรือตั้งค่าเริ่มต้น
      const existingSchool = byId(db.schools, id);
      const medals = existingSchool.medals || { gold: 0, silver: 0, bronze: 0, joined: 0 };

      // 3. สร้างวัตถุข้อมูลโรงเรียน
      const item = {
        id,
        name: $("schoolName").value,
        director: $("schoolDirector").value,
        phone: $("schoolPhone").value,
        medals: medals
      };

      // 4. อัปเดตข้อมูลลงใน Local State / LocalStorage
      upsert(db.schools, item);
      save();

      // 5. ส่งข้อมูลไปยัง Google Sheet ทันทีผ่าน saveToDatabase (แท็บ schools)
      const rowData = [item.id, item.name, item.director, item.phone];
      saveToDatabase("schools", actionType, rowData, render);

      // 6. ล้างค่าในฟอร์มและแจ้งเตือนผู้ใช้
      e.target.reset();
      $("schoolId").value = "";
      alert("บันทึกข้อมูลโรงเรียนเรียบร้อยแล้ว!");
    });
  }

if ($("venueForm")) {
    $("venueForm").addEventListener("submit", e => {
      e.preventDefault();
      
      // 1. ระบุ ID และตรวจสอบว่าเป็น Insert หรือ Update
      const id = $("venueId").value || nextId("v", db.venues);
      const actionType = $("venueId").value ? "update" : "insert";

      // 2. สร้างวัตถุข้อมูลสนามแข่งขัน
      const item = { 
        id, 
        name: $("venueName").value, 
        host: $("venueHost").value, 
        contact: $("venueContact").value 
      };

      // 3. อัปเดตข้อมูลลงใน Local State / LocalStorage
      upsert(db.venues, item);
      save();

      // 4. ส่งข้อมูลไปยัง Google Sheet ทันทีผ่าน saveToDatabase
      const rowData = [item.id, item.name, item.host, item.contact];
      saveToDatabase("venues", actionType, rowData, render);

      // 5. ล้างค่าในฟอร์มและแจ้งเตือนผู้ใช้
      e.target.reset(); 
      $("venueId").value = ""; 
      alert("บันทึกข้อมูลสนามแข่งขันเรียบร้อยแล้ว!");
    });
  }

  if ($("judgeForm")) {
    $("judgeForm").addEventListener("submit", e => {
      e.preventDefault();
      const id = $("judgeId").value || nextId("j", db.judges);
      const actionType = $("judgeId").value ? "update" : "insert";

      const item = { id, eventId: $("judgeEvent").value, name: $("judgeName").value, role: $("judgeRole").value, rank: $("judgeRank").value, phone: $("judgePhone").value };
      upsert(db.judges, item);
      save();

      const rowData = [item.id, item.eventId, item.name, item.role, item.rank, item.phone];
      saveToDatabase("judges", actionType, rowData, render);

      e.target.reset();
      $("judgeId").value = ""; 
      alert("ส่งข้อมูลการสมัครกรรมการเรียบร้อยแล้ว!");
    });
  }

  if ($("certForm")) {
    $("certForm").addEventListener("submit", e => {
      e.preventDefault();
      db.certNo = (db.certNo || 1) + 1;
      save(); renderCertificate(); alert("สร้างเกียรติบัตรและเลขทะเบียนเรียบร้อย");
    });
  }

  if ($("userForm")) {
    $("userForm").addEventListener("submit", e => {
      e.preventDefault();
      db.users.push({ id:nextId("u", db.users), username:$("userName").value, role:$("userRole").value, password:$("userPassword").value, changed:false });
      e.target.reset(); $("userPassword").value = "SriRatana@123"; save(); render();
    });
  }
}

function upsert(list, item) {
  const index = list.findIndex(x => x.id === item.id);
  if (index >= 0) list[index] = item; else list.push(item);
}

function removeItem(listName, id) {
  if (currentRole !== "admin" && listName !== "registrations") {
    return alert("เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้");
  }
  if (!confirm("คุณต้องการยืนยันการลบข้อมูลนี้หรือไม่?")) return;

  saveToDatabase(listName, "delete", [id], () => {
    db[listName] = db[listName].filter(x => x.id !== id);
    save();
    render();
  });
}

function editEvent(id) {
  const e = byId(db.events, id);
  $("eventId").value = e.id; $("eventName").value = e.name; $("eventSubject").value = e.subject; $("eventLevel").value = e.level; $("eventType").value = e.type; $("eventMembers").value = e.members; $("eventDate").value = e.date; $("eventVenue").value = e.venueId;
  showPage("events");
}

function editSchool(id) {
  const s = byId(db.schools, id);
  $("schoolId").value = s.id; $("schoolName").value = s.name; $("schoolDirector").value = s.director; $("schoolPhone").value = s.phone;
  showPage("schools");
}

function editVenue(id) {
  const v = byId(db.venues, id);
  $("venueId").value = v.id; $("venueName").value = v.name; $("venueHost").value = v.host; $("venueContact").value = v.contact;
  showPage("venues");
}

function editJudge(id) {
  const j = byId(db.judges, id);
  $("judgeId").value = j.id; $("judgeEvent").value = j.eventId; $("judgeName").value = j.name; $("judgeRole").value = j.role; $("judgeRank").value = j.rank; $("judgePhone").value = j.phone;
  showPage("judges");
}

function editUser(id) {
  const u = byId(db.users, id);
  $("userId").value = u.id; $("userName").value = u.username; $("userRole").value = u.role; $("userPassword").value = u.password;
  showPage("users");
}

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
  if (status === "รับรอง") r.cert = "แนบแล้ว";
  if (status === "ต้องแก้ไข") r.cert = "ต้องแก้ไข";
  save(); render();
}

function resetPassword(id) {
  const u = byId(db.users, id);
  u.password = u.role === "admin" ? "SriRatana@123" : "User@123";
  u.changed = false;
  save(); render();
  alert(`Reset password ของ ${u.username} เป็นรหัสตั้งต้นแล้ว`);
}

function readImage(file, done) {
  if (!file) return done("");
  const reader = new FileReader();
  reader.onload = () => done(reader.result);
  reader.readAsDataURL(file);
}

function showPage(id) {
  currentPage = id;
  document.querySelectorAll(".section").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === id));
  $("pageTitle").textContent = navItems.find(x => x[0] === id)?.[2] || "ระบบการแข่งขัน";
  render();
}

function openReport() {
  const registrationsData = JSON.stringify(db.registrations);
  const eventsData = JSON.stringify(db.events);
  const schoolsData = JSON.stringify(db.schools);

  let reportModal = document.getElementById("reportModal");
  if (!reportModal) {
    reportModal = document.createElement("div");
    reportModal.id = "reportModal";
    reportModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 99999; display: flex;
      flex-direction: column; justify-content: center; align-items: center;
      padding: 10px; box-sizing: border-box;
    `;
    document.body.appendChild(reportModal);
  }

  reportModal.innerHTML = `
    <div style="background: #fff; width: 100%; max-width: 900px; height: 90vh; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden;">
      <div class="no-print" style="padding: 12px 16px; background: #f5f7fb; border-bottom: 1px solid #d9e2ec; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <label for="viewSelect" style="font-weight: bold; font-size: 14px;">รูปแบบ:</label>
        <select id="viewSelect" style="padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
          <option value="event">แยกตามรายการแข่งขัน</option>
          <option value="school">แยกตามรายโรงเรียน</option>
          <option value="winner">ตัวแทนกลุ่ม (คะแนนสูงสุด)</option>
        </select>
        <button onclick="window.print()" style="padding: 6px 12px; background: #126a6f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🖨️ พิมพ์/บันทึก PDF</button>
        <button onclick="document.getElementById('reportModal').style.display='none'" style="padding: 6px 12px; background: #b83d45; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: auto;">✕ ปิด</button>
      </div>
      
      <div id="reportPrintArea" style="padding: 20px; overflow-y: auto; flex: 1;">
        <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 18px;">
          <div style="width: 50px; height: 50px; border: 2px solid #126a6f; display: grid; place-items: center; color: #126a6f; font-weight: bold; font-size: 24px;">ศ</div>
          <div>
            <h2 id="reportTitle" style="margin: 0; font-size: 18px;">รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน</h2>
            <p style="margin: 4px 0 0; color: #666; font-size: 12px;">กลุ่มโรงเรียนศรีรัตนะ สังกัด สพป.ศรีสะเกษ เขต 4</p>
          </div>
        </div>
        <table id="reportTable" style="width: 100%; border-collapse: collapse; font-size: 13px;"></table>
      </div>
    </div>
    
    <style>
      #reportTable th, #reportTable td { border: 1px solid #cfd8e3; padding: 8px; text-align: left; }
      #reportTable th { background: #eef3f8; font-weight: bold; }
      @media print {
        body * { visibility: hidden; }
        #reportPrintArea, #reportPrintArea * { visibility: visible; }
        #reportPrintArea { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; }
        .no-print { display: none !important; }
      }
    </style>
  `;

  reportModal.style.display = "flex";

  const regData = JSON.parse(registrationsData);
  const eventData = JSON.parse(eventsData);
  const schoolData = JSON.parse(schoolsData);

  function renderTable() {
    const mode = document.getElementById("viewSelect").value;
    const table = document.getElementById("reportTable");
    const title = document.getElementById("reportTitle");
    let html = "";
    let items = [...regData];

    if (mode === "school") {
      title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (แยกตามรายโรงเรียน)";
      items.sort((a, b) => (byId(schoolData, a.schoolId).name || "").localeCompare(byId(schoolData, b.schoolId).name || "", "th"));
      html += '<thead><tr><th>โรงเรียน</th><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>ผู้เข้าแข่งขัน</th><th>คะแนน</th><th>ผลรางวัล</th></tr></thead><tbody>';
      items.forEach(r => {
        const ev = byId(eventData, r.eventId);
        const sch = byId(schoolData, r.schoolId);
        html += `<tr><td><b>${escapeHtml(sch.name)}</b></td><td>${escapeHtml(ev.name)}</td><td>${escapeHtml(ev.subject)}</td><td>${escapeHtml(r.students)}</td><td>${r.score ?? "-"}</td><td>${escapeHtml(r.medal || r.status)}</td></tr>`;
      });
    } else if (mode === "winner") {
      title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (ตัวแทนกลุ่ม - คะแนนสูงสุด)";
      const winnersMap = {};
      items.forEach(r => {
        const currentScore = parseFloat(r.score) || 0;
        if (!winnersMap[r.eventId] || currentScore > (parseFloat(winnersMap[r.eventId].score) || 0)) {
          winnersMap[r.eventId] = r;
        }
      });
      const filteredItems = Object.values(winnersMap);
      filteredItems.sort((a, b) => (byId(eventData, a.eventId).name || "").localeCompare(byId(eventData, b.eventId).name || "", "th"));
      html += '<thead><tr><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>โรงเรียน (ตัวแทนกลุ่ม)</th><th>ผู้เข้าแข่งขัน</th><th>คะแนนสูงสุด</th><th>ผลรางวัล</th></tr></thead><tbody>';
      filteredItems.forEach(r => {
        const ev = byId(eventData, r.eventId);
        const sch = byId(schoolData, r.schoolId);
        html += `<tr><td><b>${escapeHtml(ev.name)}</b></td><td>${escapeHtml(ev.subject)}</td><td><b style="color:#126a6f;">★ ${escapeHtml(sch.name)}</b></td><td>${escapeHtml(r.students)}</td><td>${r.score ?? "-"}</td><td>${escapeHtml(r.medal || r.status)}</td></tr>`;
      });
    } else {
      title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (แยกตามรายการแข่งขัน)";
      items.sort((a, b) => (byId(eventData, a.eventId).name || "").localeCompare(byId(eventData, b.eventId).name || "", "th"));
      html += '<thead><tr><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>โรงเรียน</th><th>ผู้เข้าแข่งขัน</th><th>คะแนน</th><th>ผลรางวัล</th></tr></thead><tbody>';
      items.forEach(r => {
        const ev = byId(eventData, r.eventId);
        const sch = byId(schoolData, r.schoolId);
        html += `<tr><td><b>${escapeHtml(ev.name)}</b></td><td>${escapeHtml(ev.subject)}</td><td>${escapeHtml(sch.name)}</td><td>${escapeHtml(r.students)}</td><td>${r.score ?? "-"}</td><td>${escapeHtml(r.medal || r.status)}</td></tr>`;
      });
    }
    html += "</tbody>";
    table.innerHTML = html;
  }

  document.getElementById("viewSelect").addEventListener("change", renderTable);
  renderTable();
}

// =========================================================================
// 6. INITIALIZATION & LOGIN MANAGEMENT
// =========================================================================
function init() {
  $("nav").innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${label}</span></button>`).join("");
  
  $("nav").addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (btn) showPage(btn.dataset.page);
  });

  $("roleSelect").addEventListener("change", e => { 
    currentRole = e.target.value; 
    renderNav();
    render(); 
  });

  $("themeSelect").addEventListener("change", e => {
    db.theme = e.target.value;
    save();
    render();
  });

  $("themePanelBtn").addEventListener("click", openThemePanel);
  $("closeThemePanel").addEventListener("click", closeThemePanel);
  $("saveThemeSettings").addEventListener("click", saveThemeSettings);
  $("resetThemeSettings").addEventListener("click", resetThemeSettings);
  $("seedBtn").addEventListener("click", () => { if (confirm("คืนค่าข้อมูลตัวอย่างทั้งหมด?")) { db = seed(); save(); render(); } });

  bindForms();
  initRealtimeSync(render);
}

function renderNav() {
  const role = $("roleSelect")?.value || "user";
  const nav = $("nav");
  if (!nav) return;

  nav.innerHTML = navItems
    .filter(([id]) => role === "admin" || ["dashboard", "rankings", "events", "registration", "judges", "reports"].includes(id))
    .map(([id, icon, title]) => `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${title}</span></button>`)
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  const loginOverlay = $("loginOverlay");
  const loginForm = $("mainLoginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const userVal = $("loginUser").value.trim();
      const passVal = $("loginPassword").value;
      const foundUser = (db.users || []).find(u => u.username === userVal && u.password === passVal);

      if (foundUser) {
        sessionStorage.setItem("currentUser", JSON.stringify(foundUser));
        if (loginOverlay) loginOverlay.style.display = "none";
        
        currentRole = foundUser.role;
        if ($("roleSelect")) $("roleSelect").value = foundUser.role;
        if ($("roleBadge")) $("roleBadge").textContent = `${foundUser.username} (${foundUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
        
        renderNav();
        render();
      } else {
        if ($("loginError")) $("loginError").style.display = "block";
      }
    });
  }

  const currentSessionUser = sessionStorage.getItem("currentUser");
  if (currentSessionUser && loginOverlay) {
    const user = JSON.parse(currentSessionUser);
    loginOverlay.style.display = "none";
    currentRole = user.role;
    if ($("roleSelect")) $("roleSelect").value = user.role;
    if ($("roleBadge")) $("roleBadge").textContent = `${user.username} (${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
    renderNav();
  }

  if ($("logoutBtn")) {
    $("logoutBtn").addEventListener("click", () => {
      if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
        sessionStorage.removeItem("currentUser");
        window.location.reload();
      }
    });
  }
});