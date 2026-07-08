// ==========================================
// 1. CONFIGURATION FOR MULTI-USER (FIREBASE)
// ==========================================
// แทนที่ค่าด้านล่างนี้ด้วย Config ที่ได้มาจากโปรเจกต์ Firebase ของคุณ
const firebaseConfig = {
  apiKey: "https://acms-dc534-default-rtdb.firebaseio.com/",
  authDomain: "https://acms-dc534-default-rtdb.firebaseio.com/",
  databaseURL: "https://acms-dc534-default-rtdb.firebaseio.com/,
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// เริ่มต้นทำงาน Firebase
if (firebaseConfig.apiKey !== "https://acms-dc534-default-rtdb.firebaseio.com/") {
  firebase.initializeApp(firebaseConfig);
} else {
  console.warn("⚠️ กรุณาตั้งค่าพารามิเตอร์ firebaseConfig ในไฟล์ data.js เพื่อเชื่อมต่อฐานข้อมูลออนไลน์ส่วนกลาง");
}

const db = firebase.database ? firebase.database() : null;

const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];

// ฟังก์ชันช่วยจัดการข้อมูลผ่าน Firebase เพื่อป้องกันข้อมูลชนกัน (Concurrency Control)
const DatabaseManager = {
  // ดึงข้อมูลทั้งหมดจากระบบส่วนกลางแบบ Realtime
  syncData: function(callback) {
    if(!db) return;
    db.ref("sriratana_system").on("value", (snapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    });
  },

  // บันทึกหรืออัปเดตรายการแข่งขันแบบระบุ ID เจาะจง ป้องกันการเขียนทับทั้งก้อน
  updateEvent: async function(eventId, eventData) {
    if(!db) return;
    return db.ref("sriratana_system/events/" + eventId).set(eventData);
  },

  // บันทึกรายชื่อนักเรียนที่ลงทะเบียนแข่งขัน
  registerStudent: async function(regId, regData) {
    if(!db) return;
    return db.ref("sriratana_system/registrations/" + regId).set(regData);
  },

  // บันทึกผลคะแนนแข่งขัน
  submitResult: async function(eventId, resultData) {
    if(!db) return;
    return db.ref("sriratana_system/results/" + eventId).set(resultData);
  }
};
