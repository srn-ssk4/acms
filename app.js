// กำหนด URL ของ Google Apps Script Web App ที่ได้จากการ Deploy
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycHf_ofz1T7X6wnJIapKyOaer750uWq16LoMTeM8UqkRjYE5DRxXqwgEt8kHVRtjwFcw/exec"; 
const storeKey = "sriratana-arts-system";

// ตัวอย่างการโหลดข้อมูลที่ถูกต้องในฟังก์ชัน init() หรือก่อน render()
async function startApp() {
  const cloudData = await loadDataFromCloud();
  if (cloudData) {
     db = cloudData;
  } else {
     db = seed();
  }
  init();
}
// ==========================================
// ระบบจัดการการเข้าสู่ระบบ (Login System)
// ==========================================

function setupLogin() {
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("mainLoginForm");

  // 1. ตรวจสอบก่อนว่าเคย Login ค้างไว้ใน Session ไหม
  const cachedUser = sessionStorage.getItem("currentUser");
  if (cachedUser) {
    if (loginOverlay) loginOverlay.style.display = "none"; // ถ้าเคยล็อกอินแล้ว ให้ซ่อนหน้าต่างล็อกอินเลย
    return;
  }

  // 2. ดักจับการกดปุ่ม "เข้าสู่ระบบ"
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault(); // ป้องกันหน้าเว็บ รีเฟรช

      const usernameInput = document.getElementById("username")?.value.trim();
      const passwordInput = document.getElementById("password")?.value.trim();

      if (!usernameInput || !passwordInput) {
        alert("กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน");
        return;
      }

      // 3. ตรวจสอบข้อมูลกับ db.users (ตรวจสอบว่า db มีอยู่และโหลดมาแล้ว)
      if (typeof db !== "undefined" && db.users) {
        const user = db.users.find(u => u.username === usernameInput && u.password === passwordInput);

        if (user) {
          // หากข้อมูลถูกต้อง บันทึกลง Session
          sessionStorage.setItem("currentUser", JSON.stringify(user));
          
          alert(`ยินดีต้อนรับคุณ ${user.name || user.username}`);
          
          // ซ่อนหน้าต่าง Login เพื่อเข้าสู่หน้าจอหลัก
          if (loginOverlay) loginOverlay.style.display = "none";
          
          // (ตัวเลือกเพิ่มเติม) สั่งเปิดหน้าแดชบอร์ดหรือรีโหลดการทำงานตามระบบของคุณ
          if (typeof render === "function") render(); 

        } else {
          alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        }
      } else {
        alert("ระบบกำลังโหลดข้อมูลจากคลาวด์ หรือยังไม่มีข้อมูลผู้ใช้งานในระบบ");
      }
    });
  }
}
async function startApp() {
  const cloudData = await loadDataFromCloud();
  if (cloudData) {
     db = cloudData;
  } else {
     db = seed();
  }
  init();
  
  setupLogin(); // 👈 เพิ่มฟังก์ชันนี้เข้าไปท้ายสุดเพื่อให้ระบบเริ่มดักจับการ Login
}

// 1. ฟังก์ชันดึงข้อมูลล่าสุดจาก Google Sheets (ดึงทุกครั้งที่เปิดหน้าหรือโหลดใหม่)
async function loadDataFromCloud() {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getData`);
    const result = await response.json();
    if (result.status === "success" && result.data[storeKey]) {
      // นำข้อมูลที่ได้จาก Cloud ไปใส่ในตัวแปรหลักของระบบคุณ
      // ตัวอย่างเช่น:
      // systemData = result.data[storeKey];
      console.log("โหลดข้อมูลจาก Google Sheets สำเร็จ", result.data[storeKey]);
      return result.data[storeKey];
    }
  } catch (error) {
    console.error("ไม่สามารถดึงข้อมูลจาก Cloud ได้:", error);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลปัจจุบัน");
  }
}

// 2. ฟังก์ชันบันทึกข้อมูลกลับไปยัง Google Sheets
async function saveDataToCloud(updatedData) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      redirect: "follow", // จำเป็นสำหรับ Google Apps Script Web App
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveData",
        key: storeKey,
        value: updatedData
      })
    });
    
    const result = await response.json();
    if (result.status === "success") {
      console.log("บันทึกข้อมูลลง Google Sheets เรียบร้อย");
    } else {
      alert("บันทึกไม่สำเร็จ: " + result.message);
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    alert("ไม่สามารถเชื่อมต่ออินเทอร์เน็ตเพื่อบันทึกข้อมูลได้");
  }
}
function doGet(e) {
  // เช็คว่า e หรือ e.parameter มีตัวตนอยู่จริงไหม (ถ้าไม่มีให้แจ้งเตือนกลับไป)
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "ไม่สามารถเรียกใช้งานฟังก์ชันนี้โดยตรงจาก Apps Script ได้ กรุณาเชื่อมต่อผ่าน Web App หรือใส่ Parameter บังคับ" 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Database");
  // ... โค้ดเดิมของคุณ ...
}
// ==========================================
// 2. STATE & DATABASE GLOBAL DECLARATIONS
// ==========================================
let db = db = seed();
let currentRole = "";
let currentPage = "dashboard";
let certLogoUrl = "";
let certSignUrl = "";
let certBgUrl = ""; // เพิ่มตัวแปรเก็บไฟล์ภาพพื้นหลังต้นฉบับ
// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function teacherCount(members) {
  const n = Number(members || 1);
  if (n === 1) return 1;
  if (n <= 5) return 2;
  return 3;
}
function medalFromScore(score) {
  score = Number(score);
  if (score >= 80) return "เหรียญทอง";
  if (score >= 70) return "เหรียญเงิน";
  if (score >= 60) return "เหรียญทองแดง";
  return "เข้าร่วมการแข่งขัน";
}
function makeUsers() {
  const admins = Array.from({length:1}, (_,i)=>({ id:"a"+(i+1), username:"admin"+String(i+1).padStart(2,"0"), role:"admin", password:"SriRatana@123", changed:false }));
  const users = Array.from({length:1}, (_,i)=>({ id:"u"+(i+1), username:"user"+String(i+1).padStart(2,"0"), role:"user", password:"User@123", changed:false }));
  return admins.concat(users);
}
function seed() {
  return {
    theme:"default",
    themeSettings:null,
    schools: defaultSchools,
    venues: defaultVenues,
    events: defaultEvents,
    registrations: defaultRegistrations,
    judges: [
      { id:"j1", eventId:"e1", name:"ครูสุ", role:"ครู/บุคลากร", rank:"ครูชำนาญการ", phone:"0851111111" },
    ],
    users: makeUsers(),
    certNo: 360
  };
}

const $ = id => document.getElementById(id);
const byId = (list, id) => list.find(x => x.id === id) || {};
const save = () => localStorage.setItem(storeKey, JSON.stringify(db));
const nextId = (prefix, list) => prefix + (list.length ? Math.max(...list.map(x => Number(String(x.id).replace(/\D/g,"")) || 0)) + 1 : 1);
const optionList = (items, getLabel = x => x.name) => items.map(x => `<option value="${x.id}">${getLabel(x)}</option>`).join("");
const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[s]));

// ==========================================
// 4. MAIN INITIALIZATION & ROUTING
// ==========================================
function init() {
  $("nav").innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${label}</span></button>`).join("");
  $("nav").addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (btn) showPage(btn.dataset.page);
  });
  $("roleSelect").addEventListener("change", e => { currentRole = e.target.value; render(); });
  $("themeSelect").addEventListener("change", e => {
    db.theme = e.target.value;
    db.themeSettings = e.target.value === "custom" ? (db.themeSettings || {...themeDefaults.default}) : null;
    save();
    render();
  });
  $("themePanelBtn").addEventListener("click", () => openThemePanel());
  $("closeThemePanel").addEventListener("click", () => closeThemePanel());
  $("themePanel").addEventListener("click", e => { if (e.target.id === "themePanel") closeThemePanel(); });
  Object.values(themeFields).forEach(id => $(id).addEventListener("input", previewThemeSettings));
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
    settings[key] = key === "radius" ? Number($(id).value) : $(id).value;
  });
  return settings;
}

function previewThemeSettings() {
  applyThemeSettings(readThemeControls());
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
  
  // ซ่อนหรือแสดงปุ่มควบคุมตามสิทธิ์ปัจจุบันในระบบ
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

function fillSelects() {
  const subjectOptions = subjects.map(s => `<option>${s}</option>`).join("");
  const levelOptions = levels.map(s => `<option>${s}</option>`).join("");
  ["eventSubject"].forEach(id => { if ($(id)) $(id).innerHTML = subjectOptions; });
  ["eventLevel"].forEach(id => { if ($(id)) $(id).innerHTML = levelOptions; });
  ["eventVenue"].forEach(id => { if ($(id)) $(id).innerHTML = optionList(db.venues); });
  ["regEvent","judgeEvent","certEvent"].forEach(id => { if ($(id)) $(id).innerHTML = optionList(db.events, e => `${e.name} (${e.level})`); });
  ["regSchool"].forEach(id => { if ($(id)) $(id).innerHTML = optionList(db.schools); });
  if ($("resultRegistration")) {
    $("resultRegistration").innerHTML = db.registrations.map(r => `<option value="${r.id}">${byId(db.events,r.eventId).name || "-"} - ${byId(db.schools,r.schoolId).name || "-"}</option>`).join("");
  }
}

// ==========================================
// 6. MODULE RENDERERS (ปรับปรุงระบบคำนวณอันดับตามผลการแข่งจริง)
// ==========================================
function rankedSchools() {
  // 1. สร้าง Map เพื่อใช้ในการรวมนับเหรียญรางวัลจริงของแต่ละโรงเรียน
  const schoolMedalMap = {};
  db.schools.forEach(s => {
    schoolMedalMap[s.id] = { id: s.id, name: s.name, gold: 0, silver: 0, bronze: 0, joined: 0 };
  });

  // 2. ประมวลผลจากรายการลงทะเบียนแข่งขันจริงที่ได้รับการบันทึกคะแนนแล้ว
  db.registrations.forEach(r => {
    if (schoolMedalMap[r.schoolId]) {
      if (r.medal === "เหรียญทอง") schoolMedalMap[r.schoolId].gold++;
      else if (r.medal === "เหรียญเงิน") schoolMedalMap[r.schoolId].silver++;
      else if (r.medal === "เหรียญทองแดง") schoolMedalMap[r.schoolId].bronze++;
      else if (r.medal === "เข้าร่วมการแข่งขัน") schoolMedalMap[r.schoolId].joined++;
    }
  });

  // 3. แปลงกลับเป็น Array และทำการ Sort เรียงลำดับ ทอง -> เงิน -> ทองแดง -> ชื่อโรงเรียน
  return Object.values(schoolMedalMap).sort((a, b) => 
    b.gold - a.gold || 
    b.silver - a.silver || 
    b.bronze - a.bronze || 
    a.name.localeCompare(b.name, "th")
  ).map(item => ({
    id: item.id,
    name: item.name,
    medals: { gold: item.gold, silver: item.silver, bronze: item.bronze, joined: item.joined }
  }));
}
function renderDashboard() {
  const pending = db.registrations.filter(r => r.status === "รอตรวจ").length; //[cite: 2]
  const totalStudents = db.registrations.reduce((sum, r) => sum + Math.max(1, String(r.students).split(/\n|,/).filter(Boolean).length), 0); //[cite: 2]
  const sortedEvents = [...db.events]
		.sort((a, b) => new Date(a.date) - new Date(b.date)); // เรียงลำดับจากวันที่น้อย (เก่าสุด) ไปหามาก (ใหม่สุด)
  const stats = [
    ["รายการแข่งขัน", db.events.length, `${subjects.length} กลุ่มสาระ`], //[cite: 2]
    ["นักเรียนลงทะเบียน", totalStudents, "จากฐานข้อมูลรับสมัคร"], //[cite: 2]
    ["โรงเรียน", db.schools.length, "โรงเรียนในกลุ่มศรีรัตนะ"], //[cite: 2]
    ["รอตรวจเอกสาร", pending, "รายการต้องดำเนินการ"] //[cite: 2]
  ];
  $("stats").innerHTML = stats.map(s => `<div class="card stat"><span class="label">${s[0]}</span><span class="value">${s[1]}</span><span class="note">${s[2]}</span></div>`).join(""); //[cite: 2]
  $("topMedals").innerHTML = medalRows(rankedSchools().slice(0,10), true); //[cite: 2]
  
  // === ส่วนที่แก้ไข: เรียงลำดับตามวันที่แข่งขันล่าสุด และตัดมาแสดง 5 รายการ ===
  const recentEvents = [...db.events]
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // เรียงจากวันที่ใหม่สุดไปเก่าสุด (หรือสลับเป็น a - b เพื่อเรียงจากเก่าไปใหม่)
    .slice(0, 5); // แสดง 5 รายการล่าสุด
    
$("todayEvents").innerHTML = table(
    ["รายการ", "กลุ่มสาระ", "ระดับ", "สนาม", "วันที่แข่งขัน"], 
    sortedEvents.map(e => [
      e.name, 
      e.subject, 
      e.level, 
      byId(db.venues, e.venueId).name || "-",
      e.date // แสดงวันที่แข่งขันในตาราง
    ])
  );
}

function medalRows(rows, compact=false) {
  return table(compact ? ["โรงเรียน","ทอง","เงิน","ทองแดง"] : ["อันดับโรงเรียน","🎖️🎖🎖️️ ทอง","🎖🎖️️ เงิน","🎖️ ทองแดง","🎖️ เข้าร่วม","รวมทั้งหมด"], rows.map((s,i) => {
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
    // ปรับตรรกะตรงนี้: แอดมินจัดการได้หมด ยูสเซอร์จัดการได้เฉพาะกรณีที่ยังไม่ได้อนุมัติ/ตรวจสอบ
    (currentRole === "admin" || r.status === "รอตรวจ" || r.status === "ต้องแก้ไข") 
      ? rowActions("editRegistration", r.id) + rowActions("deleteRegistration", r.id, true) 
      : `<span class="badge">อนุมัติแล้ว (อ่านอย่างเดียว)</span>`
  ]));
}

function renderResults() {
  const table = $("resultsTable");
  if (!table) return;

  // กรองเอาเฉพาะรายการที่ได้รับการลงทะเบียนเรียบร้อยแล้ว (มีรายชื่อทีม)
  const registered = db.registrations || [];

  let html = `
    <thead>
      <tr>
        <th>รายการแข่งขัน</th>
        <th>โรงเรียน</th>
        <th>คะแนน</th>
        <th>ผลการประกวด</th>
        <th>อันดับ</th>
        <th class="admin-only">จัดการ</th> </tr>
    </thead>
    <tbody>
  `;

  registered.forEach(r => {
    const ev = byId(db.events, r.eventId);
    const sch = byId(db.schools, r.schoolId);
    if (!ev || !sch) return;

    // แสดงผลคะแนน (ถ้ายังไม่ได้กรอกให้แสดงเป็นเครื่องหมายลบ)
    const scoreText = (r.score !== undefined && r.score !== null) ? r.score : "-";
    const medalText = r.medal || "-";
    const rankText = r.rank ? `อันดับที่ ${r.rank}` : "-";

    html += `
      <tr>
        <td><b>${ev.name}</b><br><small>${ev.level} (${ev.type})</small></td>
        <td>${sch.name}</td>
        <td><span class="badge">${scoreText}</span></td>
        <td><span class="badge ${r.medal ? 'success' : ''}">${medalText}</span></td>
        <td>${rankText}</td>
        <td class="admin-only">
          <button class="btn-sm" onclick="editResult('${r.id}')">✏️ แก้ไข</button>
        </td>
      </tr>
    `;
  });

  html += "</tbody>";
  table.innerHTML = html;
  
  // เรียกฟังก์ชันจัดการสิทธิ์ปุ่มซ่อน/แสดงอีกครั้งหลังจากวาดตารางเสร็จ
  if(typeof applyRoleSecurity === "function") applyRoleSecurity();
}

function editResult(regId) {
  const r = byId(db.registrations, regId);
  if (!r) return;

  // ส่ง ID หลักไปเก็บไว้ใน hidden input
  $("resultRegId").value = r.id;

  // บังคับให้ Select เลือกข้อมูลของแถวที่ต้องการแก้ไข
  if ($("resultRegistration")) {
    $("resultRegistration").value = r.id;
  }
  
  // นำคะแนน อันดับ และเหรียญรางวัลเดิมที่มีอยู่กลับเข้าฟอร์มกรอกข้อมูล
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
    currentRole === "admin" ? 
      rowActions("editUser", u.id) + 
      rowActions("deleteUser", u.id, true) + 
      `<button class="secondary" data-action="resetPassword" data-id="${u.id}">Reset password</button>` 
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
	  <div>${certSignUrl ? `<img src="${certSignUrl}" alt="signature" style="width:150px;height:48px;object-fit:contain;display:block;margin:0 auto 4px">` : ""}<div
	  class="sign-line">ประธานกลุ่มโรงเรียนศรีรัตนะ</div></div></div>
    </div>`;
}

// ==========================================
// 7. COMPONENT HTML BUILDERS
// ==========================================
function table(headers, rows) {
  if (!rows.length) return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody><tr><td colspan="${headers.length}" class="empty">ยังไม่มีข้อมูล</td></tr></tbody>`;
  return `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function statusBadge(status) {
  const cls = status === "รับรอง" ? "ok" : status === "ต้องแก้ไข" ? "bad" : "warn";
  return `<span class="badge ${cls}">${status}</span>`;
}
function medalBadge(medal) {
  const cls = medal === "เข้าร่วมการแข่งขัน" ? "warn" : "ok";
  return `<span class="badge ${cls}">${medal || "-"}</span>`;
}
function rowActions(action, id, danger=false) {
  const label = action.startsWith("edit") ? "แก้ไข" : "ลบ";
  return `<button class="${danger ? "danger" : "secondary"}" data-action="${action}" data-id="${id}">${label}</button> `;
}

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
    const item = {
      id,
      name: $("eventName").value,
      subject: $("eventSubject").value,
      level: $("eventLevel").value,
      type: $("eventType").value,
      members: Number($("eventMembers").value),
      date: $("eventDate").value,
      venueId: $("eventVenue").value,
      teachers: teacherCount(Number($("eventMembers").value))
    };
    
    upsert(db.events, item);
    e.target.reset();
    $("eventId").value = ""; // เคลียร์ค่า ID
    save();
    render();
});
  if($("clearEvent")) $("clearEvent").addEventListener("click", () => $("eventForm").reset());

  if($("clearSchool")) $("clearSchool").addEventListener("click", () => $("schoolForm").reset());
  if($("reportBtn")) $("reportBtn").addEventListener("click", openReport);
  if($("clearUser")) $("clearUser").addEventListener("click", () => {
  $("userForm").reset();
  if($("userId")) $("userId").value = "";
});
  ["certType","certName","certAward","certEvent"].forEach(id => {
    if($(id)) $(id).addEventListener("input", renderCertificate);
  });
  
  if($("certLogo")) $("certLogo").addEventListener("change", e => readImage(e.target.files[0], url => { certLogoUrl = url; renderCertificate(); }));
  if($("certSign")) $("certSign").addEventListener("change", e => readImage(e.target.files[0], url => { certSignUrl = url; renderCertificate(); }));

if($("registrationForm")) $("registrationForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("regId")?.value || nextId("r", db.registrations);
    
    // ค้นหาข้อมูลเดิมเผื่อมีค่าคะแนนหรือผลรางวัลอยู่แล้วเพื่อไม่ให้หายไปตอนแก้ไข
    const oldReg = byId(db.registrations, id);

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
      medalApplied: oldReg.medalApplied || false
    };

    upsert(db.registrations, item);
    e.target.reset();
    if($("regId")) $("regId").value = ""; // เคลียร์ ID หลังบันทึกสำเร็จ
    save(); 
    render();
  });
  
if ($("resultForm")) {
  $("resultForm").addEventListener("submit", e => {
    e.preventDefault();
    
    // ดึงค่าโดยอ้างอิงจาก ID จริงที่มีอยู่ในหน้า HTML
    const regId = $("resultRegId").value || $("resultRegistration").value;
    const scoreValue = $("resultScore").value;
    const score = scoreValue !== "" ? Number(scoreValue) : null;
    let medal = $("resultMedal").value;
    const rank = $("resultRank").value !== "" ? Number($("resultRank").value) : null;

    // หากเปิดช่องเหรียญรางวัลเป็นค่าว่างไว้ ให้ระบบคำนวณจากคะแนนโดยอัตโนมัติ
    if (!medal && score !== null) {
      medal = medalFromScore(score);
    }

    // ค้นหารายการลงทะเบียนเดิมในฐานข้อมูลเพื่อเตรียมเขียนทับ
    const targetReg = byId(db.registrations, regId);

    if (!targetReg || !targetReg.id) {
      alert("ไม่พบข้อมูลการลงทะเบียนแข่งขันที่ตรงกัน");
      return;
    }

    // ทำการเซ็ตค่าผลการแข่งขันลง Object ข้อมูล
    targetReg.score = score;
    targetReg.medal = medal;
    targetReg.rank = rank;

    // อัปเดตลง Array และ Save ลง LocalStorage
    save();
    render();
    
    // รีเซ็ตฟอร์มให้กลับเป็นค่าว่าง
    e.target.reset();
    $("resultRegId").value = ""; 
    
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
    const item = { 
      id, 
      eventId: $("judgeEvent").value, 
      name: $("judgeName").value, 
      role: $("judgeRole").value, 
      rank: $("judgeRank").value, 
      phone: $("judgePhone").value 
    };
    
    upsert(db.judges, item);
    e.target.reset();
    $("judgeId").value = ""; // เคลียร์ ID หลังจากบันทึกเสร็จ
    save(); 
    render();
  });
  
  if($("certForm")) $("certForm").addEventListener("submit", e => {
    e.preventDefault();
    db.certNo = (db.certNo || 1) + 1;
    save(); renderCertificate(); alert("สร้างเกียรติบัตรและเลขทะเบียนเรียบร้อย สามารถพิมพ์เป็น PDF ได้จากเบราว์เซอร์");
  });
  
  if($("userForm")) $("userForm").addEventListener("submit", e => {
    e.preventDefault();
    db.users.push({ id:nextId("u", db.users), username:$("userName").value, role:$("userRole").value, password:$("userPassword").value, changed:false });
    e.target.reset(); $("userPassword").value = "SriRatana@123"; save(); render();
  });
}
function editJudge(id) {
  const j = byId(db.judges, id);
  $("judgeId").value = j.id;
  $("judgeEvent").value = j.eventId;
  $("judgeName").value = j.name;
  $("judgeRole").value = j.role;
  $("judgeRank").value = j.rank;
  $("judgePhone").value = j.phone;
  showPage("judges"); // สลับกลับมาหน้าฟอร์มกรรมการตัดสินเพื่อให้ผู้ใช้แก้ไขข้อมูล
}
function upsert(list, item) {
  const index = list.findIndex(x => x.id === item.id);
  if (index >= 0) list[index] = item; else list.push(item);
}
function removeItem(listName, id) {
  // หากเป็นผู้ใช้งานทั่วไป (User) ไม่อนุญาตให้ลบข้อมูลส่วนกลางเด็ดขาด
  if (currentRole !== "admin") {
    if (listName !== "registrations") {
      return alert("เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้");
    }
    // ตัวอย่างเพิ่มเติม: หากเป็น User ควรเช็คเพิ่มว่าเป็นเจ้าของรายการลงทะเบียนนั้นไหม
    const item = byId(db.registrations, id);
    // if (item.schoolId !== currentUserSchoolId) return alert("ไม่สามารถลบข้อมูลของโรงเรียนอื่นได้");
  }
  
  if (!confirm("คุณต้องการยืนยันการลบข้อมูลนี้หรือไม่?")) return;
  db[listName] = db[listName].filter(x => x.id !== id);
  save(); 
  render();
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
function editUser(id) {
  const u = byId(db.users, id);
  $("userId").value = u.id;
  $("userName").value = u.username;
  $("userRole").value = u.role;
  $("userPassword").value = u.password;
  showPage("users"); // ล็อกหน้าให้อยู่ที่เมนูจัดการผู้ใช้งาน
}
function editRegistration(id) {
  const r = byId(db.registrations, id);
  if (!$("regId")) {
    // ป้องกันกรณีหน้าเว็บลืมใส่ Input Hidden สำหรับ ID
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "regId";
    $("registrationForm").appendChild(hiddenInput);
  }
  
  $("regId").value = r.id;
  $("regEvent").value = r.eventId;
  $("regSchool").value = r.schoolId;
  $("regStudents").value = r.students;
  $("regTeacher").value = r.teacher;
  $("regPhone").value = r.phone;
  
  showPage("registration"); // สลับกลับมาหน้าฟอร์มลงทะเบียนเพื่อให้ผู้ใช้แก้ไขข้อมูล
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
function openReport() {
  // ทำการแปลงข้อมูลฝั่งระบบหลักให้อยู่ในรูป JSON เพื่อส่งต่อไปยังหน้าต่างรายงาน
  const registrationsData = JSON.stringify(db.registrations);
  const eventsData = JSON.stringify(db.events);
  const schoolsData = JSON.stringify(db.schools);

  const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>รายงานผลการแข่งขัน</title>
  <style>
    body { font-family: "Segoe UI", Tahoma, sans-serif; margin: 32px; color: #14202e; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    p { margin: 0 0 18px; color: #637184; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
    th, td { border: 1px solid #cfd8e3; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef3f8; font-weight: bold; }
    .head { display: flex; gap: 14px; align-items: center; margin-bottom: 18px; }
    .seal { width: 54px; height: 54px; border: 2px solid #126a6f; display: grid; place-items: center; color: #126a6f; font-weight: 800; font-size: 26px; }
    
    /* สไตล์ของส่วนควบคุมการเลือกประเภทรายงาน (จะถูกซ่อนเวลาสั่งพิมพ์จริง) */
    .no-print { display: flex; gap: 12px; align-items: center; background: #f5f7fb; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #d9e2ec; }
    .no-print label { font-size: 14px; font-weight: bold; }
    .no-print select { padding: 6px 12px; border-radius: 4px; border: 1px solid #d9e2ec; font-size: 14px; background: #fff; }
    .no-print button { padding: 6px 16px; background: #126a6f; color: white; border: 0; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: auto; font-size: 14px; }
    .no-print button:hover { background: #0e8780; }
    
    /* ควบคุมซ่อนเมนูเลือกรายงานเมื่อกดพิมพ์ PDF หรือพิมพ์ลงกระดาษ */
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <label for="viewSelect">เลือกรูปแบบการแสดงผล:</label>
    <select id="viewSelect" onchange="renderTable()">
      <option value="event">แสดงผลแบบ "รายการแข่งขัน"</option>
      <option value="school">แสดงผลแบบ "รายโรงเรียน"</option>
      <option value="winner">แสดงผลแบบ "ตัวแทนกลุ่ม" (คะแนนสูงสุดตามรายการ)</option>
    </select>
    <button onclick="window.print()">พิมพ์ PDF / พิมพ์เอกสาร</button>
  </div>

  <div class="head">
    <div class="seal">ศ</div>
    <div>
      <h1 id="reportTitle">รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน</h1>
      <p>กลุ่มโรงเรียนศรีรัตนะ สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาศรีสะเกษ เขต 4</p>
    </div>
  </div>
  
  <table id="reportTable"></table>

  <script>
    // รับชุดข้อมูลเชื่อมมาจากระบบหลัก
    const regData = ${registrationsData};
    const eventData = ${eventsData};
    const schoolData = ${schoolsData};

    function byId(list, id) { return list.find(x => x.id === id) || {}; }
    function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#039;" }[s])); }

    function renderTable() {
      const mode = document.getElementById("viewSelect").value;
      const table = document.getElementById("reportTable");
      const title = document.getElementById("reportTitle");
      let html = "";
      let items = [...regData];

      if (mode === "school") {
        title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (แยกตามรายโรงเรียน)";
        
        // เรียงลำดับตามชื่อโรงเรียน (ภาษาไทย)
        items.sort((a, b) => (byId(schoolData, a.schoolId).name || "").localeCompare(byId(schoolData, b.schoolId).name || "", "th"));
        
        html += '<thead><tr><th>โรงเรียน</th><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>ผู้เข้าแข่งขัน</th><th>คะแนน</th><th>ผลรางวัล/สถานะ</th></tr></thead><tbody>';
        items.forEach(r => {
          const ev = byId(eventData, r.eventId);
          const sch = byId(schoolData, r.schoolId);
          html += '<tr><td><b>' + escapeHtml(sch.name) + '</b></td><td>' + escapeHtml(ev.name) + ' (' + escapeHtml(ev.level) + ')</td><td>' + escapeHtml(ev.subject) + '</td><td>' + escapeHtml(r.students) + '</td><td>' + (r.score ?? "-") + '</td><td>' + escapeHtml(r.medal || r.status) + '</td></tr>';
        });
      } else if (mode === "winner") {
        title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (ตัวแทนกลุ่ม - คะแนนสูงสุดแยกตามรายการ)";

        // ค้นหาตัวแทนกลุ่มที่มีคะแนนสูงสุดของแต่ละรายการแข่งขัน
        const winnersMap = {};
        items.forEach(r => {
          const currentScore = parseFloat(r.score) || 0;
          if (!winnersMap[r.eventId]) {
            winnersMap[r.eventId] = r;
          } else {
            const existingScore = parseFloat(winnersMap[r.eventId].score) || 0;
            if (currentScore > existingScore) {
              winnersMap[r.eventId] = r;
            }
          }
        });

        // ดึงเฉพาะรายการที่เป็นตัวแทนกลุ่มออกมาแล้วจัดเรียงตามชื่อรายการแข่งขัน
        const filteredItems = Object.values(winnersMap);
        filteredItems.sort((a, b) => (byId(eventData, a.eventId).name || "").localeCompare(byId(eventData, b.eventId).name || "", "th"));

        html += '<thead><tr><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>โรงเรียน (ตัวแทนกลุ่ม)</th><th>ผู้เข้าแข่งขัน</th><th>คะแนนสูงสุด</th><th>ผลรางวัล/สถานะ</th></tr></thead><tbody>';
        filteredItems.forEach(r => {
          const ev = byId(eventData, r.eventId);
          const sch = byId(schoolData, r.schoolId);
          html += '<tr><td><b>' + escapeHtml(ev.name) + '</b> (' + escapeHtml(ev.level) + ')</td><td>' + escapeHtml(ev.subject) + '</td><td><span style="color: #126a6f; font-weight: bold;">★ ' + escapeHtml(sch.name) + '</span></td><td>' + escapeHtml(r.students) + '</td><td>' + (r.score ?? "-") + '</td><td>' + escapeHtml(r.medal || r.status) + '</td></tr>';
        });
      } else {
        title.textContent = "รายงานผลการแข่งขันศิลปหัตถกรรมนักเรียน (แยกตามรายการแข่งขัน)";
        
        // เรียงลำดับตามชื่อรายการแข่งขัน (ภาษาไทย)
        items.sort((a, b) => (byId(eventData, a.eventId).name || "").localeCompare(byId(eventData, b.eventId).name || "", "th"));

        html += '<thead><tr><th>รายการแข่งขัน</th><th>กลุ่มสาระ</th><th>โรงเรียน</th><th>ผู้เข้าแข่งขัน</th><th>คะแนน</th><th>ผลรางวัล/สถานะ</th></tr></thead><tbody>';
        items.forEach(r => {
          const ev = byId(eventData, r.eventId);
          const sch = byId(schoolData, r.schoolId);
          html += '<tr><td><b>' + escapeHtml(ev.name) + '</b> (' + escapeHtml(ev.level) + ')</td><td>' + escapeHtml(ev.subject) + '</td><td>' + escapeHtml(sch.name) + '</td><td>' + escapeHtml(r.students) + '</td><td>' + (r.score ?? "-") + '</td><td>' + escapeHtml(r.medal || r.status) + '</td></tr>';
        });
      }
      html += "</tbody>";
      table.innerHTML = html;
    }

    // ประมวลผลตารางเมื่อหน้าเว็บโหลดครั้งแรก
    renderTable();
  <\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

// ==========================================
// 9. START Database
// ==========================================
// ==========================================
// ระบบสำรองข้อมูล และ นำเข้าข้อมูล (JSON Backup)
// ==========================================

// 1. ฟังก์ชันสำหรับ "สำรองข้อมูล" (Export JSON)
function backupDatabaseToJson() {
  try {
    // ดึงข้อมูลทั้งหมดจาก LocalStorage โดยใช้ storeKey ของระบบ
    const dataStr = fetch(https://script.google.com/macros/s/AKfycbycHf_ofz1T7X6wnJIapKyOaer750uWq16LoMTeM8UqkRjYE5DRxXqwgEt8kHVRtjwFcw/exec);
    if (!dataStr) {
      alert("ไม่พบข้อมูลในระบบที่สามารถสำรองได้");
      return;
    }

    // สร้าง Blob สำหรับดาวน์โหลดไฟล์
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-sriratana-arts-${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert("สำรองข้อมูลสำเร็จเรียบร้อยแล้ว!");
  } catch (error) {
    console.error(error);
    alert("เกิดข้อผิดพลาดในการสำรองข้อมูล: " + error.message);
  }
}

// 2. ฟังก์ชันสำหรับ "นำเข้าข้อมูล" (Import JSON)
function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const contents = e.target.result;
      
      // ทดสอบ Parse ตรวจสอบความถูกต้องของ JSON ก่อนบันทึก
      const parsed = JSON.parse(contents);
      
      // ยืนยันการทับข้อมูล
      if (confirm("คำเตือน: การนำเข้าข้อมูลใหม่ จะเขียนทับข้อมูลเดิมทั้งหมดในระบบปัจจุบัน คุณต้องการดำเนินการต่อหรือไม่?")) {
        localStorage.setItem(storeKey, JSON.stringify(parsed));
        alert("นำเข้าข้อมูลสำเร็จแล้ว! ระบบจะรีโหลดหน้าเว็บใหม่");
        window.location.reload(); // รีโหลดเพื่อให้หน้าเว็บดึงข้อมูลใหม่มาแสดงทันที
      }
    } catch (error) {
      alert("ไฟล์ JSON ไม่ถูกต้อง หรือโครงสร้างข้อมูลผิดพลาด ไม่สามารถนำเข้าได้");
      console.error(error);
    }
  };
  reader.readAsText(file);
}
// ==========================================
// ฟังก์ชันนำเข้าข้อมูลจากไฟล์ JSON
// ==========================================
function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const confirmImport = confirm("คุณต้องการนำเข้าข้อมูลจากไฟล์นี้ใช่หรือไม่?\n*** คำเตือน: ข้อมูลปัจจุบันในระบบทั้งหมดจะถูกแทนที่ด้วยข้อมูลจากไฟล์นี้ทันที ***");
  if (!confirmImport) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error("โครงสร้างไฟล์ JSON ไม่ถูกต้อง");
      }

      // นำข้อมูลเข้าสู่ LocalStorage
      localStorage.setItem(storeKey, JSON.stringify(jsonData));
      
      alert("🎉 นำเข้าข้อมูลสำเร็จแล้ว! ระบบกำลังเริ่มทำงานใหม่และจัดระเบียบหน่วยความจำ...");
      
      // ล้าง Session ชั่วคราวเพื่อให้ระบบดึงค่าใหม่จาก LocalStorage มาคำนวณทั้งหมด
      sessionStorage.clear(); 
      
      // บังคับ Hard Reload หน้าเว็บ
      window.location.href = window.location.pathname;

    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        alert("❌ ไม่สามารถบันทึกได้: ไฟล์ข้อมูลมีขนาดใหญ่เกินขีดจำกัดพื้นที่ของเบราว์เซอร์ (จำกัด 5MB)");
      } else {
        alert("❌ เกิดข้อผิดพลาด: ไม่สามารถนำเข้าข้อมูลได้ (" + error.message + ")");
      }
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}
init();
// ===================================================
// ระบบควบคุม LOGIN และความปลอดภัย (วางท้ายไฟล์ app.js)
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("mainLoginForm");
  const loginError = document.getElementById("loginError");

  // ฟังก์ชันหาข้อมูลผู้ใช้งานจากระบบปัจจุบัน
  function getAllUsers() {
    // 1. ลองดึงจาก localStorage ของระบบก่อน
    const stored = fetch(https://script.google.com/macros/s/AKfycbycHf_ofz1T7X6wnJIapKyOaer750uWq16LoMTeM8UqkRjYE5DRxXqwgEt8kHVRtjwFcw/exec);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.users && parsed.users.length > 0) {
          return parsed.users;
        }
      } catch (e) { console.error(e); }
    }
    // 2. ถ้าไม่มีใน localStorage ให้เรียกจากฟังก์ชันสร้างผู้ใช้เริ่มต้นใน data.js
    if (typeof makeUsers === "function") {
      return makeUsers();
    }
    return [];
  }

  // จัดการการกดยืนยันฟอร์ม Login
const loginForm = document.getElementById("mainLoginForm"); // เช็ค ID ให้ตรงกับ index.html
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const uInput = document.getElementById("username").value;
    const pInput = document.getElementById("password").value;

    const foundUser = db.users.find(u => u.username === uInput && u.password === pInput);
    if (foundUser) {
      sessionStorage.setItem("currentUser", JSON.stringify(foundUser));
      currentRole = foundUser.role; // กำหนด Role ให้ระบบนำไป Render
      document.getElementById("loginOverlay").style.display = "none";
      render(); // สั่งรีเฟรชหน้าทำงาน
      alert(`ยินดีต้อนรับ: ${foundUser.username}`);
    } else {
      alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
    }
  });
}
      // ค้นหาบัญชีที่ข้อมูลตรงกัน
      const foundUser = appUsers.find(u => u.username === usernameInput && u.password === passwordInput);
      
// ค้นหาโค้ดส่วนยืนยันล็อกอินในฟังก์ชัน เช่น $("loginForm").addEventListener("submit", ...)
if (foundUser) {
  // บันทึกเซสชันปกติ
  sessionStorage.setItem("currentUser", JSON.stringify(foundUser));
  if (loginOverlay) loginOverlay.style.display = "none";

  // ⚡ บรรทัดสำคัญ: ปรับสิทธิ์ในแอปตามที่ Account นี้ได้รับจริง ๆ
  const roleSelect = document.getElementById("roleSelect");
 // ค้นหาจุดที่มีการเช็คเปลี่ยนสิทธิ์บทบาทผู้ใช้งาน (Role Change)
if (roleSelect) {
  roleSelect.addEventListener("change", () => {
    const r = roleSelect.value;
    renderNav();
    
    // ปลดล็อกให้ปุ่มรายงาน (reportBtn) ใช้งานได้ทั้งแอดมินและยูสเซอร์ทั่วไป
    const reportBtn = document.getElementById("reportBtn");
    if (reportBtn) {
      reportBtn.disabled = false; // เปิดให้กดพิมพ์/ดูรายงานได้เสมอ
    }

    // ส่วนของปุ่มสร้างหรือแก้ไขเกียรติบัตรอื่นๆ ที่เป็นสิทธิ์แอดมิน (ถ้าต้องการล็อกไว้เหมือนเดิม)
    const submitCertBtn = document.querySelector('#reports form button[type="submit"]');
    if (submitCertBtn) {
      submitCertBtn.disabled = (r !== "admin");
    }
  });
}

  const roleBadge = document.getElementById("roleBadge");
  if (roleBadge) {
    roleBadge.textContent = `${foundUser.username} (${foundUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
  }

  alert(`ยินดีต้อนรับเข้าสู่ระบบ: คุณ ${foundUser.username}`);

      } else {
        // รหัสผิดพลาดให้แจ้งเตือน
        if (loginError) loginError.style.display = "block";
        document.getElementById("loginPassword").value = "";
      }
    });
  }

  // ตรวจสอบความปลอดภัยแบบอัตโนมัติ: ถ้าเคยล็อกอินไว้แล้วใน Session ปัจจุบัน ไม่ต้องล็อกอินซ้ำ
const currentSessionUser = sessionStorage.getItem("currentUser");
if (currentSessionUser && loginOverlay) {
  const user = JSON.parse(currentSessionUser);
  loginOverlay.style.display = "none"; // ซ่อนหน้าล็อกอิน
  
  setTimeout(() => {
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) {
      roleSelect.value = user.role; // กำหนดสิทธิ์ตาม session ที่เก็บไว้
      roleSelect.dispatchEvent(new Event('change')); // สั่งเรนเดอร์หน้าจอตามสิทธิ์นั้น ๆ
    }
    const roleBadge = document.getElementById("roleBadge");
    if (roleBadge) {
      roleBadge.textContent = `${user.username} (${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'})`;
    }
  }, 100);
}
const loginBtn = document.getElementById("loginBtn"); // หรือชื่อ id ของปุ่ม login ในหน้าเว็บ
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    // โค้ดตรวจสอบ username / password และสั่งให้ loginOverlay.style.display = "none";
  });
}
function renderNav() {
  const roleSelect = document.getElementById("roleSelect");
  const role = roleSelect ? roleSelect.value : "user";
  const nav = document.getElementById("nav");
  if (!nav) return;

  let html = "";
  navItems.forEach(([id, icon, title]) => {
    if (role === "user") {
      // เพิ่ม && id !== "reports" เข้าไปเพื่อให้ระบบไม่ข้าม (อนุญาตให้แสดงผลสำหรับ user)
      if (id !== "dashboard" && id !== "rankings" && id !== "events" && id !== "registration" && id !== "reports") {
        return; 
      }
    }
    html += `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${title}</span></button>`;
  });
  nav.innerHTML = html;
}

});
// ==========================================
// ระบบจัดการการออกจากระบบ (Logout & Clear Session)
// ==========================================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    // แสดงกล่องข้อความยืนยันเพื่อป้องกันการกดพลาด
    if (confirm("คุณต้องการออกจากระบบและเคลียร์สิทธิ์การเข้าใช้งานใช่หรือไม่?")) {
      
      // 1. เคลียร์ข้อมูลผู้ใช้ใน Session ปัจจุบัน
      sessionStorage.removeItem("currentUser");
      
      // 2. หากระบบของคุณมีการบันทึกค่าลงใน LocalStorage ด้วย ให้เคลียร์ค่าของระบบออก
      // (อ้างอิงจาก storeKey = "sriratana-arts-system" ในไฟล์ data.js)
     // if (typeof storeKey !== "undefined") {
       // localStorage.removeItem(storeKey);
      //}

      // 3. ปรับการแสดงผลหน้าเว็บให้กลับสู่สถานะล็อกอินใหม่
      const loginOverlay = document.getElementById("loginOverlay");
      if (loginOverlay) {
        // เคลียร์ค่าใน Input ของหน้า Login (ถ้ามี)
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        if (usernameInput) usernameInput.value = "";
        if (passwordInput) passwordInput.value = "";
        
        // แสดงหน้าต่างล็อกอินกลับขึ้นมาบังหน้าจอหลัก
        loginOverlay.style.display = "flex"; 
      }

      // 4. รีโหลดหน้าจอเพื่อล้างสถานะตัวแปร (State) ทั้งหมดในหน่วยความจำ และเริ่มกำหนดสิทธิ์ใหม่
      window.location.reload();
    }
  });
}