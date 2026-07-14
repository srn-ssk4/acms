// CONSTANTS DATA SEEDS
const today = new Date().toISOString().slice(0,10);
const storeKey = "sriratana-arts-system";
// เปลี่ยน URL ตรงนี้เป็น URL ที่ได้จาก Google Apps Script ของคุณ
const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbycHf_ofz1T7X6wnJIapKyOaer750uWq16LoMTeM8UqkRjYE5DRxXqwgEt8kHVRtjwFcw/exec"; 

// ... (คงค่าธีม field และค่าเริ่มต้นต่างๆ ไว้เหมือนเดิม)

// STATE GLOBAL DECLARATIONS
let db = seed(); // เริ่มต้นด้วยโครงสร้าง Seed ว่างก่อนโหลดข้อมูลจริง
let currentRole = "";
let currentPage = "dashboard";
let certLogoUrl = "";
let certSignUrl = "";
let certBgUrl = "";

// ==========================================
// 4. MAIN INITIALIZATION & ROUTING (ปรับปรุงให้ดึง Real-time ตอนเริ่ม)
// ==========================================
async function init() {
  // สร้างปุ่มสำรองข้อมูล JSON และนำเข้าเพิ่มเติมใน UI หน้าดัชนี/เอกสาร (หากยังไม่มีใน HTML)
  injectBackupControls(); 

  $("nav").innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-btn ${id===currentPage?"active":""}" data-page="${id}" type="button"><span>${icon}</span><span>${label}</span></button>`).join("");
  $("nav").addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (btn) showPage(btn.dataset.page);
  });
  
  // โหลดข้อมูลล่าสุดจาก Google Sheets แบบเรียลไทม์ทันทีที่เปิดระบบ
  await refreshDatabaseFromSheet();

  $("roleSelect").addEventListener("change", e => { currentRole = e.target.value; render(); });
  $("themeSelect").addEventListener("change", e => {
    db.theme = e.target.value;
    db.themeSettings = e.target.value === "custom" ? (db.themeSettings || {...themeDefaults.default}) : null;
    saveLocalTheme(); // แยกบันทึกเฉพาะธีมไว้ที่เครื่องผู้ใช้ได้
    render();
  });

  // ผูกการกดปุ่มคืนค่าตัวอย่าง
  $("seedBtn").addEventListener("click", async () => { 
    if (confirm("คืนค่าข้อมูลตัวอย่างและบันทึกลง Google Sheet หรือไม่?")) { 
      db = seed(); 
      await uploadBulkToSheet(db);
    } 
  });

  bindForms();
  render();

  // ตั้งเวลา Auto-Refresh ดึงข้อมูลใหม่ทุก 30 วินาที เพื่อให้ผู้ใช้หลายเครื่องเห็นข้อมูลอัปเดตตรงกัน
  setInterval(async () => {
    await refreshDatabaseFromSheet();
  }, 30000);
}

// ดึงข้อมูลภาพรวมใหม่จาก Google Sheet
async function refreshDatabaseFromSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL);
    const remoteDb = await response.json();
    if (remoteDb && Object.keys(remoteDb).length > 0) {
      // เมิร์จข้อมูลจากชีตเข้าสู่ State ตัวแปร db ในแอปพลิเคชัน
      Object.keys(remoteDb).forEach(key => {
        db[key] = remoteDb[key];
      });
      render();
    }
  } catch (err) {
    console.error("ไม่สามารถเชื่อมต่อดึงข้อมูลแบบเรียลไทม์จาก Google Sheets ได้: ", err);
  }
}

// ฟังก์ชันเซฟระดับโมดูล ส่งขึ้นแผ่นงานแบบตัวต่อตัวเรียลไทม์
async function saveToSheetRealTime(tableName, item) {
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "upsert",
        table: tableName,
        data: item
      })
    });
    console.log(`อัปเดตข้อมูลตาราง ${tableName} ไปยัง Google Sheets สำเร็จ`);
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการส่งข้อมูลเรียลไทม์: ", err);
  }
}

// ฟังก์ชันลบข้อมูลแบบเรียลไทม์บนแผ่นงาน
async function deleteFromSheetRealTime(tableName, id) {
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        table: tableName,
        id: id
      })
    });
  } catch (err) {
    console.error("ไม่สามารถส่งคำสั่งลบไปยัง Google Sheets ได้: ", err);
  }
}

function saveLocalTheme() {
  localStorage.setItem(storeKey + "-theme", JSON.stringify({theme: db.theme, themeSettings: db.themeSettings}));
}

// ==========================================
// DATA OPERATIONS & FORMS BINDING (แก้ไขให้ทำงานแบบ Async/Await)
// ==========================================
function bindForms() {
  // ดักจับ Event Click ปุ่มลบข้อมูลเดิม ปรับปรุงให้ยิงขึ้น Google Sheet
  document.addEventListener("click", async e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    
    if (action === "deleteEvent") await removeSheetItem("events", id);
    if (action === "deleteSchool") await removeSheetItem("schools", id);
    if (action === "deleteVenue") await removeSheetItem("venues", id);
    if (action === "deleteRegistration") await removeSheetItem("registrations", id);
    if (action === "deleteJudge") await removeSheetItem("judges", id);
    if (action === "deleteUser") await removeSheetItem("users", id);
    
    // Actions อื่นๆ คงเดิม
    if (action === "editEvent") editEvent(id);
    if (action === "editSchool") editSchool(id);
    if (action === "editVenue") editVenue(id);
    if (action === "editRegistration") editRegistration(id);
    if (action === "editJudge") editJudge(id);
    if (action === "editUser") editUser(id);
    if (action === "approveDoc") updateDoc(id, "รับรอง");
    if (action === "rejectDoc") updateDoc(id, "ต้องแก้ไข");
  });

  // ฟอร์มจัดการ Event แข่งขัน
  if($("eventForm")) $("eventForm").addEventListener("submit", async e => {
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
    $("eventId").value = "";
    render();
    await saveToSheetRealTime("events", item); // ส่งขึ้นชีตเรียลไทม์
  });

  // ฟอร์มลงทะเบียนนักเรียน
  if($("registrationForm")) $("registrationForm").addEventListener("submit", async e => {
    e.preventDefault();
    const id = $("regId")?.value || nextId("r", db.registrations);
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
      rank: oldReg.rank || null
    };

    upsert(db.registrations, item);
    e.target.reset();
    if($("regId")) $("regId").value = "";
    render();
    await saveToSheetRealTime("registrations", item); // ส่งขึ้นชีตเรียลไทม์
  });

  // ฟอร์มกรอกบันทึกคะแนนของกรรมการ
  if ($("resultForm")) {
    $("resultForm").addEventListener("submit", async e => {
      e.preventDefault();
      const regId = $("resultRegId").value || $("resultRegistration").value;
      const scoreValue = $("resultScore").value;
      const score = scoreValue !== "" ? Number(scoreValue) : null;
      let medal = $("resultMedal").value;
      const rank = $("resultRank").value !== "" ? Number($("resultRank").value) : null;

      if (!medal && score !== null) medal = medalFromScore(score);

      const targetReg = byId(db.registrations, regId);
      if (!targetReg.id) return alert("ไม่พบข้อมูล");

      targetReg.score = score;
      targetReg.medal = medal;
      targetReg.rank = rank;

      render();
      e.target.reset();
      $("resultRegId").value = "";
      
      await saveToSheetRealTime("registrations", targetReg); // บันทึกผลคะแนนขึ้นชีตทันที
      alert("บันทึกคะแนนลงระบบเครือข่ายสำเร็จ!");
    });
  }
  
  // โครงสร้างฟอร์มอื่นๆ เช่น schoolForm, venueForm, judgeForm ให้เติมสถาปัตยกรรม "await saveToSheetRealTime('ชื่อตาราง', item);" ในลักษณะเดียวกันท้ายฟังก์ชัน Submit
}

async function removeSheetItem(listName, id) {
  if (currentRole !== "admin" && listName !== "registrations") {
    return alert("เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้");
  }
  if (!confirm("คุณต้องการยืนยันการลบข้อมูลนี้ออกจาก Google Sheet หรือไม่?")) return;
  
  db[listName] = db[listName].filter(x => x.id !== id);
  render();
  await deleteFromSheetRealTime(listName, id); // นำออกจากชีตแบบออนไลน์เรียลไทม์
}

// ===================================================
// ระบบจัดการสำรองข้อมูล และนำเข้าในรูปแบบไฟล์ JSON (Backup System)
// ===================================================
function injectBackupControls() {
  // ตรวจสอบว่ามีกล่องจัดการระบบรายงานหรือตั้งค่าระบบหรือยังเพื่อทำการวางปุ่ม Backup
  if ($("users") && !$("jsonBackupContainer")) {
    const container = document.createElement("div");
    container.id = "jsonBackupContainer";
    container.className = "card";
    container.style.marginTop = "20px";
    container.innerHTML = `
      <h3>📦 การจัดการคลังข้อมูลสำรอง (JSON Backup & Google Sheets)</h3>
      <p style="font-size:13px; color:#666;">คุณสามารถสำรองโครงสร้างข้อมูลทั้งหมดเป็นไฟล์เดี่ยว หรือ นำไฟล์สำรองกลับมายัดลง Google Sheets ใหม่ทั้งหมดได้ที่นี่</p>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button type="button" class="secondary" onclick="exportDatabaseToJson()">💾 ดาวน์โหลดข้อมูลสำรอง (.json)</button>
        <button type="button" class="primary" onclick="$('importJsonFile').click()">📤 อัปโหลดข้อมูลลง Google Sheet</button>
        <input type="file" id="importJsonFile" style="display:none" accept=".json" onchange="importDatabaseFromJson(event)">
      </div>
    `;
    $("users").appendChild(container);
  }
}

// ฟังก์ชันดึงโครงสร้าง db ออกมาเขียนไฟล์ JSON ให้ดาวน์โหลดเก็บไว้ในเครื่องคอมพิวเตอร์
function exportDatabaseToJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement("a");
  const exportDate = new Date().toISOString().slice(0,10);
  
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `sriratana_backup_${exportDate}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// ฟังก์ชันนำเข้าข้อมูลจากไฟล์ JSON ชุดใหญ่ แล้วเขียนล้างไพ่เซ็ตลงแผ่นงาน Google Sheet ทันที
async function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (!importedData.events || !importedData.registrations || !importedData.schools) {
        return alert("โครงสร้างไฟล์ JSON สำรองไม่ถูกต้อง ไม่สามารถดำเนินการต่อได้");
      }
      
      if (confirm("การนำเข้าข้อมูลชุดใหญ่จะล้างข้อมูลเดิมบน Google Sheets และแทนที่ด้วยข้อมูลจากไฟล์นี้ทั้งหมด ยืนยันที่จะทำต่อหรือไม่?")) {
        alert("กำลังเริ่มขั้นตอนการ Bulk Import โปรดรอสักครู่...");
        db = importedData;
        render();
        await uploadBulkToSheet(db);
      }
    } catch (err) {
      alert("ไฟล์ JSON เกิดข้อผิดพลาดในการตรวจสอบรูปแบบ: " + err);
    }
  };
  reader.readAsText(file);
}

// ฟังก์ชันส่งอัปโหลดข้อมูลก้อนใหญ่ล้างไพ่เขียนใหม่ขึ้นชีต
async function uploadBulkToSheet(databaseObject) {
  try {
    const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "bulkImport",
        data: databaseObject
      })
    });
    const result = await res.json();
    if(result.status === "success") {
       alert("นำข้อมูลสำรอง JSON ลง Google Sheet เรียบร้อยแล้ว! ทุกเครื่องจะซิงค์สอดคล้องกันทันที");
       await refreshDatabaseFromSheet();
    } else {
       alert("เกิดข้อผิดพลาดจากฝั่งสคริปต์แผ่นงาน: " + result.error);
    }
  } catch (err) {
    alert("เกิดปัญหาล้มเหลวในการส่งข้อมูลไปยังสคริปต์คลาวด์: " + err);
  }
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