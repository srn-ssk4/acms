// ==========================================
// 2. CORE APPLICATION LOGIC (MULTI-USER VER.)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("loginOverlay");
  const mainContainer = document.getElementById("mainContainer");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("loginError");
  const userDisplay = document.getElementById("userDisplay");

  // ตรวจสอบเซสชันผู้ใช้งานเดิม
  const savedUser = sessionStorage.getItem("currentUser");
  if (savedUser) {
    initApp(JSON.parse(savedUser));
  }

  // ระบบตรวจสอบการเข้าสู่ระบบ
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const user = usernameInput.value.trim();
      const pass = passwordInput.value.trim();

      if (user && pass) { // ในระบบจริงสามารถต่อยอดไปดึงข้อมูลผู้ใช้จาก db.ref('users') ได้
        const userData = { username: user, role: "admin", loginTime: new Date().toISOString() };
        sessionStorage.setItem("currentUser", JSON.stringify(userData));
        initApp(userData);
      } else {
        if(loginError) loginError.style.display = "block";
      }
    });
  }

  // ฟังก์ชันเริ่มแอปพลิเคชันหลักหลังจากยืนยันตัวตนสำเร็จ
  function initApp(user) {
    if(loginOverlay) loginOverlay.style.display = "none";
    if(mainContainer) mainContainer.style.display = "block";
    if(userDisplay) userDisplay.textContent = `ผู้ใช้งานปัจจุบัน: ${user.username}`;

    // เชื่อมต่อฐานข้อมูลกลางแบบเรียลไทม์ (เมื่อคนอื่นเปลี่ยน ข้อมูลในหน้าจอเราจะเปลี่ยนตามทันที)
    if (typeof DatabaseManager !== "undefined") {
      DatabaseManager.syncData((cloudData) => {
        console.log("🔄 ดึงข้อมูลเวอร์ชันล่าสุดจาก Firebase เรียบร้อย:", cloudData);
        // บันทึกข้อมูลลง Memory ของแอปพลิเคชัน เพื่อทำการกระจายข้อมูลไปยังตารางต่างๆ ของคุณ
        window.currentGlobalData = cloudData;
        
        // เรียกฟังก์ชันเรนเดอร์ตาราง หน้าหลัก แดชบอร์ดของคุณที่นี่
        // ตัวอย่าง: if(typeof renderDashboard === 'function') renderDashboard(cloudData);
      });
    }
  }

  // ระบบจัดการการออกจากระบบ (Logout & Clear Session)
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        sessionStorage.removeItem("currentUser");
        if(loginOverlay) {
          if(usernameInput) usernameInput.value = "";
          if(passwordInput) passwordInput.value = "";
          loginOverlay.style.display = "flex";
        }
        if(mainContainer) mainContainer.style.display = "none";
      }
    });
  }
});
