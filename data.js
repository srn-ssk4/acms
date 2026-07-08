// ==========================================
// 1. CONSTANTS & INITIAL DATA SEEDS
// ==========================================
const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];
const navItems = [
  ["dashboard","▦","แดชบอร์ด"],["rankings","▤","ตารางอันดับ"],["events","☰","รายการแข่งขัน"],["registration","＋","ลงทะเบียนนักเรียน"],
  ["results","✓","บันทึกผลการแข่งขัน"],["schools","⌂","จัดการโรงเรียน"],["venues","⌖","จัดการสนามแข่งขัน"],["judges","⚖","กรรมการตัดสิน"],
  ["documents","□","ตรวจเอกสาร"],["reports","◫","รายงาน"],["users","◎","จัดการผู้ใช้งาน"]
];
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

function teacherCount(members) {
  const n = Number(members || 1);
  if (n === 1) return 1;
  if (n <= 5) return 2;
  return 3;
}
// ==========================================
// 1. CONSTANTS & INITIAL DATA SEEDS (ปรับปรุงข้อมูลเริ่มต้น)
// ==========================================
const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];
const navItems = [
  ["dashboard","▦","แดชบอร์ด"],["rankings","▤","ตารางอันดับ"],["events","☰","รายการแข่งขัน"],["registration","＋","ลงทะเบียนนักเรียน"],
  ["results","✓","บันทึกผลการแข่งขัน"],["schools","⌂","จัดการโรงเรียน"],["venues","⌖","จัดการสนามแข่งขัน"],["judges","⚖","กรรมการตัดสิน"],
  ["documents","□","ตรวจเอกสาร"],["reports","◫","รายงาน"],["users","◎","จัดการผู้ใช้งาน"]
];
const today = new Date().toISOString().slice(0,10);
const storeKey = "sriratana-arts-system";

const themeDefaults = {
  default: { bg:"#f5f7fb", panel:"#ffffff", text:"#14202e", line:"#d9e2ec", primary:"#126a6f", primary2:"#0e8780", accent:"#d28722", sidebar:"#12202e", heroFrom:"#126a6f", heroTo:"#0e8780", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  royal: { bg:"#f6f3ee", panel:"#fffdf8", text:"#1f2230", line:"#ded3c2", primary:"#6d214f", primary2:"#a13664", accent:"#b8860b", sidebar:"#23182a", heroFrom:"#6d214f", heroTo:"#a13664", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  fresh: { bg:"#f3fbf6", panel:"#ffffff", text:"#10231a", line:"#cce2d4", primary:"#227447", primary2:"#3a9d63", accent:"#e0a100", sidebar:"#163826", heroFrom:"#227447", heroTo:"#3a9d63", radius:8, font:'"Segoe UI", Tahoma, sans-serif' }
};
// ล้างข้อมูลเหรียญจำลองใน defaultSchools ออกทั้งหมด (ตั้งค่าเป็น 0)
const defaultSchools = [
  "บ้านศรีแก้ว","บ้านหนองสังข์","บ้านพิวพวย(เสียงราษฎร์พัฒนา)","บ้านศิลาทอง","บ้านบกห้วยโนน","บ้านตระกวน","อนุบาลศรีรัตนะ","บ้านตระกาจ",
  "บ้านตาแบน","โชติพันธุ์วิทยาสามัคคี","บ้านหนองรุง","บ้านโนนแก","บ้านปุน","บ้านขนาด","บ้านหนองบัวทอง","บ้านทุ่งสว่าง","บ้านจอก(ประชาสามัคคี)",
  "บ้านสะพุง","บ้านหนองปิงโปง","บ้านจานบัว","บ้านเสื่องข้าว","บ้นกระหวัน","บ้านตูม(นพค.15 กรป.กลางอุปถัมภ์)","บ้านหนองใหญ่-ตาไทย","บ้านสลับ","บ้านตายู(อสพป.32)"
].map((name, i) => ({ 
  id: "s"+(i+1), 
  name, 
  director: "ผอ."+["ก้อ"][i%5]+"ใจดี", 
  phone: "08"+String(12000000+i*137).slice(0,8), 
  medals: { gold: 0, silver: 0, bronze: 0, joined: 0 } // ยกเลิกข้อมูลจำลองเรียบร้อย
}));
const defaultVenues = [
  { id:"v1", name:"หอประชุมศรีรัตนะ", host:"โรงเรียนบ้านศรีแก้ว", contact:"ครูดี 081-234-5678" },
];

const defaultEvents = [
  ["คัดลายมือสื่อภาษาไทย","ภาษาไทย","ป.1-3","เดี่ยว",1,today,"v1"],
].map((e,i)=>({ id:"e"+(i+1), name:e[0], subject:e[1], level:e[2], type:e[3], members:e[4], date:e[5], venueId:e[6], teachers: teacherCount(e[4]) }));

const defaultRegistrations = [
  { id:"r1", eventId:"e1", schoolId:"s1", students:"ด.ญ.ใจดี", teacher:"ครูรัตน์", phone:"0811111111", photo:"แนบแล้ว", cert:"แนบแล้ว", status:"รอตรวจ", score:null, medal:null },
];

function makeUsers() {
  const admins = Array.from({length:1}, (_,i)=>({ id:"a"+(i+1), username:"admin"+String(i+1).padStart(2,"0"), role:"admin", password:"SriRatana@123", changed:false }));
  const users = Array.from({length:2}, (_,i)=>({ id:"u"+(i+1), username:"user"+String(i+1).padStart(2,"0"), role:"user", password:"User@123", changed:false }));
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
    certNo: 1
  };
}// ==========================================
// 1. CONSTANTS & INITIAL DATA SEEDS
// ==========================================
const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];
const navItems = [
  ["dashboard","▦","แดชบอร์ด"],["rankings","▤","ตารางอันดับ"],["events","☰","รายการแข่งขัน"],["registration","＋","ลงทะเบียนนักเรียน"],
  ["results","✓","บันทึกผลการแข่งขัน"],["schools","⌂","จัดการโรงเรียน"],["venues","⌖","จัดการสนามแข่งขัน"],["judges","⚖","กรรมการตัดสิน"],
  ["documents","□","ตรวจเอกสาร"],["reports","◫","รายงาน"],["users","◎","จัดการผู้ใช้งาน"]
];
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

function teacherCount(members) {
  const n = Number(members || 1);
  if (n === 1) return 1;
  if (n <= 5) return 2;
  return 3;
}

// ==========================================
// 1. CONSTANTS & INITIAL DATA SEEDS (ปรับปรุงข้อมูลเริ่มต้น)
// ==========================================
const subjects = ["ภาษาไทย","คณิตศาสตร์","วิทยาศาสตร์และเทคโนโลยี","สังคมศึกษา ศาสนาและวัฒนธรรม","สุขศึกษาและพลศึกษา","ศิลปะ","การงานอาชีพ","ภาษาต่างประเทศ","กิจกรรมพัฒนาผู้เรียน","เด็กพิเศษเรียนรวม","ศิลปวัฒนธรรมอีสาน"];
const levels = ["ปฐมวัย","ป.1-3","ป.4-6","ป.1-6","ม.1-3"];
const navItems = [
  ["dashboard","▦","แดชบอร์ด"],["rankings","▤","ตารางอันดับ"],["events","☰","รายการแข่งขัน"],["registration","＋","ลงทะเบียนนักเรียน"],
  ["results","✓","บันทึกผลการแข่งขัน"],["schools","⌂","จัดการโรงเรียน"],["venues","⌖","จัดการสนามแข่งขัน"],["judges","⚖","กรรมการตัดสิน"],
  ["documents","□","ตรวจเอกสาร"],["reports","◫","รายงาน"],["users","◎","จัดการผู้ใช้งาน"]
];
const today = new Date().toISOString().slice(0,10);
const storeKey = "sriratana-arts-system";

const themeDefaults = {
  default: { bg:"#f5f7fb", panel:"#ffffff", text:"#14202e", line:"#d9e2ec", primary:"#126a6f", primary2:"#0e8780", accent:"#d28722", sidebar:"#12202e", heroFrom:"#126a6f", heroTo:"#0e8780", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  royal: { bg:"#f6f3ee", panel:"#fffdf8", text:"#1f2230", line:"#ded3c2", primary:"#6d214f", primary2:"#a13664", accent:"#b8860b", sidebar:"#23182a", heroFrom:"#6d214f", heroTo:"#a13664", radius:8, font:'"Segoe UI", Tahoma, sans-serif' },
  fresh: { bg:"#f3fbf6", panel:"#ffffff", text:"#10231a", line:"#cce2d4", primary:"#227447", primary2:"#3a9d63", accent:"#e0a100", sidebar:"#163826", heroFrom:"#227447", heroTo:"#3a9d63", radius:8, font:'"Segoe UI", Tahoma, sans-serif' }
};
// ล้างข้อมูลเหรียญจำลองใน defaultSchools ออกทั้งหมด (ตั้งค่าเป็น 0)
const defaultSchools = [
  "บ้านศรีแก้ว","บ้านหนองสังข์","บ้านพิวพวย(เสียงราษฎร์พัฒนา)","บ้านศิลาทอง","บ้านบกห้วยโนน","บ้านตระกวน","อนุบาลศรีรัตนะ","บ้านตระกาจ",
  "บ้านตาแบน","โชติพันธุ์วิทยาสามัคคี","บ้านหนองรุง","บ้านโนนแก","บ้านปุน","บ้านขนาด","บ้านหนองบัวทอง","บ้านทุ่งสว่าง","บ้านจอก(ประชาสามัคคี)",
  "บ้านสะพุง","บ้านหนองปิงโปง","บ้านจานบัว","บ้านเสื่องข้าว","บ้นกระหวัน","บ้านตูม(นพค.15 กรป.กลางอุปถัมภ์)","บ้านหนองใหญ่-ตาไทย","บ้านสลับ","บ้านตายู(อสพป.32)"
].map((name, i) => ({ 
  id: "s"+(i+1), 
  name, 
  director: "ผอ."+["ก้อ"][i%5]+"ใจดี", 
  phone: "08"+String(12000000+i*137).slice(0,8), 
  medals: { gold: 0, silver: 0, bronze: 0, joined: 0 } // ยกเลิกข้อมูลจำลองเรียบร้อย
}));
const defaultVenues = [
  { id:"v1", name:"หอประชุม100ปี", host:"โรงเรียนบ้านศรีแก้ว", contact:"ครูใจดี 012-345-6789" },

];
const defaultEvents = [
  ["คัดลายมือสื่อภาษาไทย","ภาษาไทย","ป.1-3","เดี่ยว",1,today,"v1"],

].map((e,i)=>({ id:"e"+(i+1), name:e[0], subject:e[1], level:e[2], type:e[3], members:e[4], date:e[5], venueId:e[6], teachers: teacherCount(e[4]) }));

const defaultRegistrations = [
  { id:"r1", eventId:"e1", schoolId:"s1", students:"ด.ญ.ใจดี", teacher:"ครก้อ ใจดี", phone:"0811111111", photo:"แนบแล้ว", cert:"แนบแล้ว", status:"รอตรวจ", score:null, medal:null },
  
];

function seed() {
  return {
    theme:"default",
    themeSettings:null,
    schools: defaultSchools,
    venues: defaultVenues,
    events: defaultEvents,
    registrations: defaultRegistrations,
    judges: [
      { id:"j1", eventId:"e1", name:"ครูใจดี มีสุข", role:"ครู/บุคลากร", rank:"ครูชำนาญการ", phone:"0851111111" },
    ],
    users: makeUsers(),
    certNo: 26
  };
}