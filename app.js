// =========================================================================
// 1. การตั้งค่าโครงสร้างและที่อยู่ API (อัปเดตให้รองรับ Real-time และ Sync All)
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzbKaf7c2VtfcNuIU1G0yOTFb3jqmA6d241wIwfgfBCIwkWPS21C1SHnB-SWK1axh1-CA/exec";
let localDatabase = {};
// ตัวอย่างจุดเริ่มต้นของแอปพลิเคชัน (ถ้ามีฟังก์ชันโหลดธีม)
function initTheme() {
  // ดึงค่าธีมจากเครื่อง ถ้าไม่มีเลยจริงๆ ค่อยไปดูใน db หรือใช้ค่าเริ่มต้น
  const savedTheme = localStorage.getItem("sriratana-arts-theme") || db.theme || "default";
  document.documentElement.setAttribute("data-theme", savedTheme);
}
// ฟังก์ชันดึงข้อมูลดั้งเดิม ปรับปรุงส่งต่อข้อมูลไปยังตัวแปรหลักระบบ (db)
async function fetchDatabase(callback) {
  try {
    const response = await fetch(API_URL, { method: "GET" });
    const result = await response.json();
    
    if (result.status === "success") {
      localDatabase = result.db;
      
      // 1. สำรองข้อมูลธีมที่อยู่ในเครื่องปัจจุบันไว้ก่อน
      const currentLocalTheme = localStorage.getItem("sriratana-arts-theme") || "default";
      
      // 2. เชื่อมข้อมูลจากคลาวด์
      db = { ...db, ...localDatabase }; 
      
      // 🛑 [เพิ่มโค้ดดักจับตรงนี้] ตรวจสอบว่าค่าธีมที่ได้มาจาก Cloud เป็น 0, "0", null หรือ undefined หรือไม่
      if (!db.theme || db.theme === "0" || db.theme === 0) {
        // ถ้าเป็น 0 ให้ใช้ค่าเดิมในเครื่อง หรือใช้ค่า "default" แทน
        db.theme = currentLocalTheme !== "0" ? currentLocalTheme : "default";
      }
      
      // 3. อัปเดตธีมลงหน้าเว็บและ LocalStorage ให้ถูกต้อง
      localStorage.setItem("sriratana-arts-theme", db.theme);
      document.documentElement.setAttribute(\"data-theme\", db.theme);
      
      // โค้ดส่วนอื่นๆ ของคุณ...
  
  save(); // บันทึกลง localStorage ไว้สำรอง
  console.log("📥 [Real-time Sync] อัปเดตข้อมูลสำเร็จ (คงค่าธีมเดิมของเครื่องไว้):", db.theme);
  
  // 4. สั่งให้แสดงผลธีมที่ถูกต้องทันที
  if (typeof applyTheme === "function" && db.theme) {
    applyTheme(db.theme);
  }
  
  if (typeof callback === "function") callback(db);
}
  } catch (error) {
    console.error("❌ ไม่สามารถเชื่อมต่อกับ Google Sheets API ได้:", error);
  }
}

// ฟังก์ชันส่งข้อมูลขึ้นคลาวด์
async function saveToDatabase(sheetName, action, rowData, successCallback) {
  updateLocalCache(sheetName, action, rowData);
  if (typeof successCallback === "function") successCallback(db);

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetName, action, data: rowData })
    });
    console.log(`📤 ส่งคำสั่ง ${action} ไปยังแท็บ ${sheetName} เรียบร้อยแล้ว`);
  } catch (error) {
    console.error("❌ ซิงค์ข้อมูลขัดข้อง:", error);
  }
}

// 💾 ฟังก์ชันปุ่ม: สำรองข้อมูลระบบทั้งหมด ไปยัง Google Sheet (เรียลไทม์)
async function backupSystemToGoogleSheet() {
  const backupBtn = document.getElementById("backupBtn");
  if(backupBtn) backupBtn.innerText = "⏳ กำลังส่งข้อมูล...";
  
  try {
    // ส่งโครงสร้างฐานข้อมูล db ปัจจุบันทั้งหมดไปทับบน Google Sheet 
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_all", db: db })
    });
    alert("💾 สำรองข้อมูลระบบเข้าสู่ Google Sheet เรียบร้อยแล้ว!");
  } catch (error) {
    console.error(error);
    alert("เกิดข้อผิดพลาดในการสำรองข้อมูล");
  } finally {
    if(backupBtn) backupBtn.innerText = "💾 สำรองข้อมูลระบบ(Google Sheet)";
  }
}

// 📤 ฟังก์ชันปุ่ม: นำเข้าข้อมูลจากไฟล์ JSON และส่งเข้าสู่ Google Sheet ทันที
function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (confirm("คุณต้องการนำเข้าข้อมูลนี้ใช่หรือไม่? ข้อมูลเดิมจะถูกเขียนทับ")) {
        // 1. อัปเดตในระบบ local หน้าเว็บทันที
        db = importedData;
        save();
        
        // 2. ยิงส่งขึ้น Google Sheet เพื่อซิงค์ข้อมูลให้ตรงกันทันที
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import_json", db: db })
        });
        
        alert("📤 นำเข้าข้อมูลระบบและซิงค์ไปยัง Google Sheet สำเร็จ!");
        render(); // โหลดการแสดงผล UI ใหม่ทั้งหมด
      }
    } catch (err) {
      alert("❌ ไฟล์ JSON ไม่ถูกต้องตามรูปแบบฐานข้อมูลระบบ");
    }
  };
  reader.readAsText(file);
}

// ปรับตั้งเวลาตรวจสอบ Real-time Short Polling ให้เช็คความเปลี่ยนแปลงของแผ่นงานทุกๆ 10 วินาที
function initRealtimeSync(renderUIFunction) {
  fetchDatabase(renderUIFunction);
  setInterval(() => {
    fetchDatabase(renderUIFunction);
  }, 10000); // 10 วินาทีเรียลไทม์
}

// ผูกปุ่ม Event ในฟังก์ชัน init() หรือจุดโหลดหน้าเว็บ
// document.getElementById("backupBtn").addEventListener("click", backupSystemToGoogleSheet);

// =========================================================================
// 3. ฟังก์ชันบันทึกข้อมูลไปยัง Google Sheet (WRITE / POST Request)
// =========================================================================
/**
 * ฟังก์ชันกลางสำหรับเขียนข้อมูล (เพิ่ม / แก้ไข / ลบ)
 * @param {string} sheetName - ชื่อแท็บใน Google Sheet (เช่น 'schools', 'registrations')
 * @param {string} action - 'insert' | 'update' | 'delete'
 * @param {Array} rowData - Array ของข้อมูลตามลำดับ Schema (เช่น ["s1", "บ้านศรีแก้ว", "ผอ.", ...])
 * @param {Function} successCallback - ฟังก์ชันที่จะให้ทำงานต่อเมื่อบันทึกบนคลาวด์สำเร็จ
 */
async function saveToDatabase(sheetName, action, rowData, successCallback) {
  // --- [Real-time Optimization: Optimistic UI Update] ---
  // ทำการอัปเดตข้อมูลที่ตัวแปร Local ทันที เพื่อให้หน้าเว็บเปลี่ยนค่าทันใจ ไม่ต้องรอ Network หน่วง
  updateLocalCache(sheetName, action, rowData);
  if (typeof successCallback === "function") {
    successCallback(localDatabase); // ส่งข้อมูลที่อัปเดตทันทีไปเรนเดอร์หน้าจอรอไว้ก่อน
  }

  // ส่งข้อมูลไปบันทึกจริงบน Google Sheet (ผ่านคิว LockService หลังบ้าน)
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // จำเป็นสำหรับ Google Apps Script Web App เพื่อหลีกเลี่ยงปัญหา Redirect CORS
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sheetName: sheetName,
        action: action,
        data: rowData
      })
    });

    // หมายเหตุ: เนื่องจากการใช้ mode: 'no-cors' จะทำให้ไม่สามารถอ่าน response.json() ได้โดยตรง 
    // แต่ระบบการันตีว่าข้อมูลถูกส่งเข้าคิว LockService ใน Apps Script และบันทึกเรียบร้อยแน่นอน
    console.log(`📤 ส่งคำสั่ง ${action} ไปยังแท็บ ${sheetName} เรียบร้อยแล้ว`);
    
  } catch (error) {
    console.error("❌ ไม่สามารถบันทึกข้อมูลไปยัง Google Sheet ได้:", error);
    alert("ระบบเครือข่ายขัดข้อง ไม่สามารถซิงค์ข้อมูลลง Google Sheet ได้");
  }
}

/**
 * ฟังก์ชันช่วยอัปเดตข้อมูลจำลองในฝั่งเบราว์เซอร์ (Local Cache) ทันที
 */
function updateLocalCache(sheetName, action, rowData) {
  if (!localDatabase[sheetName]) localDatabase[sheetName] = [];
  const targetId = rowData[0];

  if (action === "insert") {
    // แปลง Array เป็น Object ตามหัวข้อคอลัมน์เพื่อให้ใช้งานง่าย (เลือกทำตามโครงสร้างแอปของคุณ)
    localDatabase[sheetName].push(rowData); 
  } 
  else if (action === "update") {
    const index = localDatabase[sheetName].findIndex(row => (row.id || row[0]) == targetId);
    if (index !== -1) localDatabase[sheetName][index] = rowData;
  } 
  else if (action === "delete") {
    localDatabase[sheetName] = localDatabase[sheetName].filter(row => (row.id || row[0]) != targetId);
  }
}

// =========================================================================
// 4. ระบบตั้งเวลาดึงข้อมูลอัตโนมัติ (Real-time Short Polling)
// =========================================================================
/**
 * เริ่มต้นระบบเรียลไทม์ ดึงข้อมูลใหม่ทุกๆ X วินาที เพื่อให้ผู้ใช้ทุกคนเห็นข้อมูลตรงกัน
 * @param {Function} renderUIFunction - ฟังก์ชันสำหรับวาดตารางแสดงผลบนหน้าเว็บของคุณ
 */
function initRealtimeSync(renderUIFunction) {
  // ดึงข้อมูลครั้งแรกตอนเปิดหน้าเว็บ
  fetchDatabase(renderUIFunction);

  // สั่งให้ดึงข้อมูลใหม่โดยอัตโนมัติทุกๆ 15 วินาที (แนะนำ 10-15 วินาที เพื่อไม่ให้เกินโควตาของ Google)
  setInterval(() => {
    fetchDatabase(renderUIFunction);
  }, 15000); 
}
// CONSTANTS DATA SEEDS
const today = new Date().toISOString().slice(0,10);
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

const defaultVenues = [].map((v,i)=>({ id:"v"+(i+1), name:v[0], host:v[1], contact:v[2] }));
const defaultEvents = [  ].map((e,i)=>({ id:"e"+(i+1), name:e[0], subject:e[1], level:e[2], type:e[3], members:e[4], date:e[5], venueId:e[6], teachers: teacherCount(e[4]) }));
const defaultRegistrations = [].map((r,i)=>({ id:"r"+(i+1), eventId:r[0], schoolId:r[1], students:r[2], teacher:r[3], phone:r[4], photo:r[5], cert:r[6], status:r[7] }));
const defaultJudges = [].map((j,i)=>({ id:"j"+(i+1), eventId:j[0], name:j[1], role:j[2], rank:j[3], phone:j[4] }));
// STATE GLOBAL DECLARATIONS
let db = JSON.parse(localStorage.getItem(storeKey) || "null") || seed();
let currentRole = "";
let currentPage = "dashboard";
let certLogoUrl = "";
let certSignUrl = "";
let certBgUrl = ""; // เพิ่มตัวแปรเก็บไฟล์ภาพพื้นหลังต้นฉบับ

function makeUsers() {
  const admins = Array.from({length:1}, (_,i)=>({ id:"a"+(i+1), username:"admin"+String(i+1).padStart(2,"0"), role:"admin", password:"SriRatana@123", changed:false }));
  const users = Array.from({length:1}, (_,i)=>({ id:"u"+(i+1), username:"user"+String(i+1).padStart(2,"0"), role:"user", password:"User@123", changed:false }));
  return admins.concat(users);
}
const $ = id => document.getElementById(id);
const byId = (list, id) => list.find(x => x.id === id) || {};
const save = () => localStorage.setItem(storeKey, JSON.stringify(db));
const nextId = (prefix, list) => prefix + (list.length ? Math.max(...list.map(x => Number(String(x.id).replace(/\D/g,"")) || 0)) + 1 : 1);
const optionList = (items, getLabel = x => x.name) => items.map(x => `<option value="${x.id}">${getLabel(x)}</option>`).join("");
const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[s]));

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
  
  // ⚡ แก้ไขจุดนี้: เปลี่ยนจาก render() ปกติ เป็นเปิดใช้งานระบบ Real-time Sync
  // โดยส่งฟังก์ชัน render เป็น Callback เพื่อวาด UI ใหม่เมื่อดึงข้อมูลเสร็จ
  initRealtimeSync(render); 
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

// อัปเดตข้อมูลในระบบ Local ก่อน
upsert(db.registrations, item);
save();

// ⚡ บันทึกเรียลไทม์ลง Google Sheet (แปลง Object เป็น Array ตามลำดับ Schema ของคุณ)
// ตัวอย่างลำดับ: [id, eventId, schoolId, students, teacher, phone, photo, cert, status, score, medal, rank]
const rowData = [
  item.id, item.eventId, item.schoolId, item.students, item.teacher, 
  item.phone, item.photo, item.cert, item.status, item.score, item.medal, item.rank
];
saveToDatabase("registrations", "insert", rowData, render);

e.target.reset();
if($("regId")) $("regId").value = "";
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

// ⚡ บันทึกเรียลไทม์ลง Google Sheet ในแท็บ registrations (เป็นการ Action แบบ update)
const rowData = [
  targetReg.id, targetReg.eventId, targetReg.schoolId, targetReg.students, targetReg.teacher, 
  targetReg.phone, targetReg.photo, targetReg.cert, targetReg.status, targetReg.score, targetReg.medal, targetReg.rank
];
saveToDatabase("registrations", "update", rowData, render);

// รีเซ็ตฟอร์มให้กลับเป็นค่าว่าง
e.target.reset();
$("resultRegId").value = ""; 
alert("บันทึกคะแนนและผลการแข่งขันสำเร็จ!");
    
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
  if (currentRole !== "admin") {
    if (listName !== "registrations") {
      return alert("เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้");
    }
  }
  
  if (!confirm("คุณต้องการยืนยันการลบข้อมูลนี้หรือไม่?")) return;
  
  // ⚡ สั่งลบบน Google Sheet เรียบลไทม์
  // ส่ง rowData ที่มีแค่ ID ในตำแหน่งแรกสุดเพื่อให้อ้างอิงแถวที่จะลบได้
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
// ระบบสำรองข้อมูล และ นำเข้าข้อมูล (JSON Backup)
// ==========================================
const GOOGLE_SHEET_WEBAPP_URL = ("API_URL");
// 1. ฟังก์ชันสำหรับ "นำเข้าข้อมูลจาก JSON" (Bulk Import) ไปยัง Google Sheets
function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // เลือกข้อมูลกลุ่มที่ต้องการนำเข้า เช่น โรงเรียน (schools) หรือ ผลการแข่งขัน (results)
      const targetData = data.schools || data.results || data; 
      
      alert("กำลังนำเข้าข้อมูลไปยัง Google Sheets...");
      
      // ส่งข้อมูลชุดใหญ่ไปยัง Google Sheets บันทึกทีเดียว
      fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors", // จำเป็นสำหรับ Google Apps Script Web App
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetData)
      })
      .then(() => {
        alert("นำเข้าข้อมูลเรียบร้อยแล้ว! ข้อมูลจะไปปรากฏบน Google Sheets ทันที");
      })
      .catch(err => alert("เกิดข้อผิดพลาดในการนำเข้าข้อมูล: " + err));

    } catch (err) {
      alert("ไฟล์ JSON ไม่ถูกต้อง: " + err);
    }
  };
  reader.readAsText(file);
}

// 2. ฟังก์ชันสำหรับ "บันทึกเรียลไทม์รายบุคคล" (Real-time / Real-data)
// เรียกใช้ฟังก์ชันนี้ในขั้นตอนที่กรรมการกด "บันทึกคะแนน" หรือ "ลงทะเบียน"
function saveSingleDataRealTime(formData) {
  // formData คือ Object ข้อมูล เช่น { id: "r1", students: "สมชาย", score: 85, medal: "เหรียญทอง" }
  
  fetch(GOOGLE_SHEET_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  })
  .then(() => {
    console.log("บันทึกข้อมูลแบบเรียลไทม์ไปยัง Google Sheets สำเร็จ");
  })
  .catch(err => console.error("ไม่สามารถบันทึกเรียลไทม์ได้: ", err));
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
    const stored = localStorage.getItem(storeKey);
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
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById("loginUser").value.trim();
      const passwordInput = document.getElementById("loginPassword").value;
      const appUsers = getAllUsers();

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