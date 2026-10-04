// Realistic mock dataset for SmartU Transport — FAST NUCES Chiniot-Faisalabad Campus (CFD)
// All data here simulates what would normally live in a Postgres/Node backend.

export const CAMPUS_CENTER = { lat: 31.4504, lng: 73.0782 }; // FAST NUCES CFD, Faisalabad

// ---------------------------------------------------------------------------
// ROUTES — with real Faisalabad / Chiniot area stop names and coordinates
// ---------------------------------------------------------------------------
export const ROUTES = [
  {
    id: "RT-01",
    name: "D-Ground — Susan Road Route",
    shortName: "D-Ground",
    busId: "BUS-101",
    driverId: "DRV-01",
    conductorId: "CND-01",
    departureTime: "7:15 AM",
    stops: [
      { name: "D-Ground Chowk", lat: 31.4180, lng: 73.0790, eta: "7:15 AM" },
      { name: "Kohinoor Chowk", lat: 31.4245, lng: 73.0705, eta: "7:28 AM" },
      { name: "Susan Road", lat: 31.4360, lng: 73.0680, eta: "7:40 AM" },
      { name: "Abdullahpur Stop", lat: 31.4430, lng: 73.0720, eta: "7:50 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:05 AM" },
    ],
  },
  {
    id: "RT-02",
    name: "Jaranwala Road Route",
    shortName: "Jaranwala Road",
    busId: "BUS-102",
    driverId: "DRV-02",
    conductorId: "CND-02",
    departureTime: "7:00 AM",
    stops: [
      { name: "Jaranwala Road Stand", lat: 31.3855, lng: 73.0525, eta: "7:00 AM" },
      { name: "Millat Town", lat: 31.4022, lng: 73.0611, eta: "7:18 AM" },
      { name: "Gulistan Colony", lat: 31.4198, lng: 73.0653, eta: "7:35 AM" },
      { name: "Batala Colony", lat: 31.4351, lng: 73.0715, eta: "7:48 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:05 AM" },
    ],
  },
  {
    id: "RT-03",
    name: "Samanabad — Jail Road Route",
    shortName: "Samanabad",
    busId: "BUS-103",
    driverId: "DRV-03",
    conductorId: "CND-03",
    departureTime: "7:10 AM",
    stops: [
      { name: "Samanabad Chowk", lat: 31.4092, lng: 73.0955, eta: "7:10 AM" },
      { name: "Jail Road", lat: 31.4188, lng: 73.0900, eta: "7:24 AM" },
      { name: "Kohinoor City Gate", lat: 31.4310, lng: 73.0865, eta: "7:40 AM" },
      { name: "Canal Road Stop", lat: 31.4420, lng: 73.0820, eta: "7:52 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:05 AM" },
    ],
  },
  {
    id: "RT-04",
    name: "Chiniot Route",
    shortName: "Chiniot",
    busId: "BUS-104",
    driverId: "DRV-04",
    conductorId: "CND-04",
    departureTime: "6:45 AM",
    stops: [
      { name: "Chiniot Bus Stand", lat: 31.7200, lng: 72.9780, eta: "6:45 AM" },
      { name: "Rurki Road Chowk", lat: 31.6450, lng: 73.0050, eta: "7:10 AM" },
      { name: "Lalian Road Stop", lat: 31.5600, lng: 73.0300, eta: "7:35 AM" },
      { name: "Chak Jhumra Interchange", lat: 31.5000, lng: 73.0550, eta: "7:55 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:20 AM" },
    ],
  },
  {
    id: "RT-05",
    name: "Friday Jamia Masjid Shuttle",
    shortName: "Friday Shuttle",
    busId: "BUS-105",
    driverId: "DRV-05",
    conductorId: "CND-05",
    departureTime: "1:00 PM",
    stops: [
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "1:00 PM" },
      { name: "Jamia Masjid Ghausia", lat: 31.4470, lng: 73.0730, eta: "1:10 PM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "1:45 PM" },
    ],
  },
];

// ---------------------------------------------------------------------------
// FLEET — buses, drivers, conductors
// ---------------------------------------------------------------------------
export const BUSES = [
  { id: "BUS-101", plate: "FSD-2023", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-01" },
  { id: "BUS-102", plate: "FSD-4471", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-02" },
  { id: "BUS-103", plate: "FSD-6690", capacity: 45, model: "Toyota Coaster", status: "Active", routeId: "RT-03" },
  { id: "BUS-104", plate: "FSD-3387", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-04" },
  { id: "BUS-105", plate: "FSD-9021", capacity: 30, model: "Toyota Coaster", status: "Active", routeId: "RT-05" },
  { id: "BUS-106", plate: "FSD-5512", capacity: 50, model: "Hino AK1J", status: "Reserve", routeId: null },
  { id: "BUS-107", plate: "FSD-7734", capacity: 45, model: "Toyota Coaster", status: "Under Maintenance", routeId: null },
];

export const DRIVERS = [
  { id: "DRV-01", name: "Muhammad Arshad", loginId: "driver_1", phone: "0300-1234567", status: "Active", assignedBusId: "BUS-101" },
  { id: "DRV-02", name: "Ghulam Rasool", loginId: "driver_2", phone: "0301-2345678", status: "Active", assignedBusId: "BUS-102" },
  { id: "DRV-03", name: "Nazir Ahmed", loginId: "driver_3", phone: "0302-3456789", status: "Active", assignedBusId: "BUS-103" },
  { id: "DRV-04", name: "Shahid Mehmood", loginId: "driver_4", phone: "0333-4567890", status: "On Leave", assignedBusId: "BUS-104" },
  { id: "DRV-05", name: "Rana Tanveer", loginId: "driver_5", phone: "0345-5678901", status: "Active", assignedBusId: "BUS-105" },
  { id: "DRV-06", name: "Imran Bhatti", loginId: "driver_6", phone: "0321-6789012", status: "Reserve", assignedBusId: null },
];

export const CONDUCTORS = [
  { id: "CND-01", name: "Aslam Chaudhry", loginId: "conductor_1", phone: "0304-1112233", status: "Active", assignedBusId: "BUS-101" },
  { id: "CND-02", name: "Riaz Hussain", loginId: "conductor_2", phone: "0305-2223344", status: "Active", assignedBusId: "BUS-102" },
  { id: "CND-03", name: "Waqas Anjum", loginId: "conductor_3", phone: "0306-3334455", status: "Active", assignedBusId: "BUS-103" },
  { id: "CND-04", name: "Bilal Yousaf", loginId: "conductor_4", phone: "0307-4445566", status: "Active", assignedBusId: "BUS-104" },
  { id: "CND-05", name: "Sajid Iqbal", loginId: "conductor_5", phone: "0308-5556677", status: "Active", assignedBusId: "BUS-105" },
];

// Helper functions to generate student credentials according to FAST CFD format:
// Email: f223284@cfd.nu.edu.pk (Always starts with 'f' + year + serial digits @ cfd.nu.edu.pk)
// Password: 3284@fast (serial digits + @fast)
export function generateStudentEmail(rollNo) {
  if (!rollNo) return "";
  const trimmed = rollNo.trim();
  const match = trimmed.match(/^(\d+)[A-Za-z]+-?(\d+)$/);
  if (match) {
    const [, year, num] = match;
    return `f${year}${num}@cfd.nu.edu.pk`;
  }
  const digits = (trimmed.match(/\d+/g) || []).join("");
  return `f${digits}@cfd.nu.edu.pk`;
}

export function generateStudentPassword(rollNo) {
  if (!rollNo) return "";
  const trimmed = rollNo.trim();
  const hyphenMatch = trimmed.match(/-(\d+)$/);
  if (hyphenMatch) {
    return `${hyphenMatch[1]}@fast`;
  }
  const digits = trimmed.replace(/\D/g, "");
  return `${digits || "1234"}@fast`;
}

// ---------------------------------------------------------------------------
// STUDENTS
// ---------------------------------------------------------------------------
export const STUDENTS = [
  { id: "STU-001", name: "Ahmed Raza", rollNo: "22F-3082", email: "f223082@cfd.nu.edu.pk", password: "3082@fast", role: "DAY_SCHOLAR", routeId: "RT-01", cnic: "33202-1234567-1", feeStatus: "Paid" },
  { id: "STU-002", name: "Fatima Noor", rollNo: "22F-3091", email: "f223091@cfd.nu.edu.pk", password: "3091@fast", role: "HOSTELITE", routeId: "RT-02", cnic: "33202-2345678-2", feeStatus: "Paid" },
  { id: "STU-003", name: "Hassan Ali", rollNo: "21F-2871", email: "f212871@cfd.nu.edu.pk", password: "2871@fast", role: "DAY_SCHOLAR", routeId: "RT-03", cnic: "33202-3456789-3", feeStatus: "Pending" },
  { id: "STU-004", name: "Ayesha Siddiqui", rollNo: "23F-4410", email: "f234410@cfd.nu.edu.pk", password: "4410@fast", role: "HOSTELITE", routeId: "RT-04", cnic: "33202-4567890-4", feeStatus: "Paid" },
  { id: "STU-005", name: "Usman Tariq", rollNo: "22K-1187", email: "f221187@cfd.nu.edu.pk", password: "1187@fast", role: "DAY_SCHOLAR", routeId: "RT-01", cnic: "33202-5678901-5", feeStatus: "Paid" },
  { id: "STU-006", name: "Zainab Malik", rollNo: "21I-0965", email: "f210965@cfd.nu.edu.pk", password: "0965@fast", role: "HOSTELITE", routeId: "RT-02", cnic: "33202-6789012-6", feeStatus: "Paid" },
  { id: "STU-007", name: "Bilal Sarwar", rollNo: "23CFD-1021", email: "f231021@cfd.nu.edu.pk", password: "1021@fast", role: "DAY_SCHOLAR", routeId: "RT-03", cnic: "33202-7890123-7", feeStatus: "Paid" },
  { id: "STU-008", name: "Mahnoor Khan", rollNo: "22F-3140", email: "f223140@cfd.nu.edu.pk", password: "3140@fast", role: "HOSTELITE", routeId: "RT-04", cnic: "33202-8901234-8", feeStatus: "Pending" },
  { id: "STU-009", name: "Talha Farooq", rollNo: "21F-2733", email: "f212733@cfd.nu.edu.pk", password: "2733@fast", role: "DAY_SCHOLAR", routeId: "RT-02", cnic: "33202-9012345-9", feeStatus: "Paid" },
  { id: "STU-010", name: "Sana Aslam", rollNo: "24F-5021", email: "f245021@cfd.nu.edu.pk", password: "5021@fast", role: "DAY_SCHOLAR", routeId: "RT-01", cnic: "33202-0123456-0", feeStatus: "Paid" },
  { id: "STU-011", name: "Hamza Sheikh", rollNo: "23K-1345", email: "f231345@cfd.nu.edu.pk", password: "1345@fast", role: "HOSTELITE", routeId: "RT-04", cnic: "33202-1122334-1", feeStatus: "Paid" },
  { id: "STU-012", name: "Iqra Naveed", rollNo: "22I-0871", email: "f220871@cfd.nu.edu.pk", password: "0871@fast", role: "DAY_SCHOLAR", routeId: "RT-03", cnic: "33202-2233445-2", feeStatus: "Paid" },
  { id: "STU-013", name: "Faheela", rollNo: "22F-3284", email: "f223284@cfd.nu.edu.pk", password: "3284@fast", role: "DAY_SCHOLAR", routeId: "RT-01", cnic: "33202-9988776-5", feeStatus: "Paid" },
];

// The demo account you actually log in with (password: "3082@fast" or "student123")
export const DEMO_STUDENT = STUDENTS[0]; // Ahmed Raza, 22F-3082, Day Scholar
export const DEMO_HOSTELITE = STUDENTS[1]; // Fatima Noor, 22F-3091, Hostelite

// ---------------------------------------------------------------------------
// FINES / CHALLANS
// ---------------------------------------------------------------------------
export const FINES = [
  { id: "FIN-001", rollNo: "22F-3082", reason: "Late Cancellation Penalty", amount: 500, status: "Unpaid", date: "2026-08-20" },
  { id: "FIN-002", rollNo: "22F-3082", reason: "Missed Boarding — No Show", amount: 300, status: "Pending Approval", date: "2026-08-11" },
  { id: "FIN-003", rollNo: "22F-3091", reason: "Damaged Seat Cover", amount: 1200, status: "Cleared", date: "2026-07-30" },
  { id: "FIN-004", rollNo: "21F-2871", reason: "Unpaid Monthly Transport Fee — August", amount: 3500, status: "Unpaid", date: "2026-08-01" },
  { id: "FIN-005", rollNo: "22F-3140", reason: "Late Cancellation Penalty", amount: 500, status: "Unpaid", date: "2026-08-25" },
];

// ---------------------------------------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------------------------------------
export const ANNOUNCEMENTS = [
  {
    id: "ANN-001",
    message: "Route 3 (Samanabad) is running approximately 15 minutes behind schedule this morning due to traffic near Jail Road.",
    audience: "RT-03",
    audienceLabel: "Samanabad Route",
    date: "2026-09-02T07:05:00",
    author: "Transport Admin",
  },
  {
    id: "ANN-002",
    message: "Friday Jamia Masjid shuttle timing has shifted to 1:00 PM starting this week to accommodate Jummah prayers.",
    audience: "ALL",
    audienceLabel: "All Routes",
    date: "2026-08-29T10:00:00",
    author: "Transport Admin",
  },
  {
    id: "ANN-003",
    message: "Bus FSD-7734 is under scheduled maintenance. A reserve bus has been assigned — no service disruption expected.",
    audience: "ALL",
    audienceLabel: "All Routes",
    date: "2026-08-27T09:15:00",
    author: "Transport Admin",
  },
];

// ---------------------------------------------------------------------------
// AUTH — pre-provisioned accounts (mock)
// ---------------------------------------------------------------------------
export const MOCK_ACCOUNTS = [
  { loginId: "admin", password: "admin123", role: "ADMIN", name: "Dr. Kashif Zafar", refId: "ADM-01" },
  ...DRIVERS.map((d) => ({ loginId: d.loginId, password: "driver123", role: "DRIVER", name: d.name, refId: d.id })),
  ...CONDUCTORS.map((c) => ({ loginId: c.loginId, password: "conductor123", role: "CONDUCTOR", name: c.name, refId: c.id })),
  ...STUDENTS.map((s) => ({
    loginId: s.rollNo,
    rollNo: s.rollNo,
    email: s.email,
    password: s.password,
    role: s.role,
    name: s.name,
    refId: s.id,
  })),
];

export const ROLL_NO_REGEX = /^\d{2}[A-Za-z]{1,4}-\d{4}$/i;

export function findAccount(loginId, password) {
  if (!loginId || !password) return null;
  const cleanLogin = loginId.trim().toLowerCase();
  const cleanPass = password.trim();

  const isUserMatch = (cand) => {
    if (!cand) return false;
    const rNo = (cand.rollNo || cand.loginId || "").toLowerCase();
    const email = (cand.email || generateStudentEmail(cand.rollNo || cand.loginId) || "").toLowerCase();
    const lId = (cand.loginId || "").toLowerCase();
    const rNoStripped = rNo.replace(/[^a-z0-9]/g, "");
    const loginStripped = cleanLogin.replace(/[^a-z0-9]/g, "");

    return (
      cleanLogin === lId ||
      cleanLogin === rNo ||
      cleanLogin === email ||
      cleanLogin.split("@")[0] === email.split("@")[0] ||
      cleanLogin.split("@")[0] === rNo ||
      (loginStripped && loginStripped === rNoStripped)
    );
  };

  const isPassMatch = (cand) => {
    if (!cand) return false;
    const expectedPass = cand.password || generateStudentPassword(cand.rollNo || cand.loginId);
    return (
      expectedPass === cleanPass ||
      expectedPass.toLowerCase() === cleanPass.toLowerCase() ||
      (cand.role !== "ADMIN" && (cleanPass === "student123" || cleanPass === "driver123" || cleanPass === "conductor123"))
    );
  };

  // 1. Search in pre-provisioned MOCK_ACCOUNTS
  let account = MOCK_ACCOUNTS.find((a) => isUserMatch(a) && isPassMatch(a));
  if (account) return account;

  // 2. Search dynamically registered students in localStorage
  try {
    let studentList = [];
    const raw = typeof window !== "undefined" ? localStorage.getItem("smartu-students") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.students) {
        studentList = parsed.state.students;
      }
    }

    const sMatch = studentList.find((s) => isUserMatch(s) && isPassMatch(s));
    if (sMatch) {
      return {
        loginId: sMatch.rollNo,
        rollNo: sMatch.rollNo,
        email: sMatch.email || generateStudentEmail(sMatch.rollNo),
        password: sMatch.password || generateStudentPassword(sMatch.rollNo),
        role: sMatch.role || "DAY_SCHOLAR",
        name: sMatch.name,
        refId: sMatch.id,
      };
    }
  } catch (e) {
    console.error("Error finding account:", e);
  }

  return null;
}

export const ROLE_HOME = {
  ADMIN: "/admin",
  DAY_SCHOLAR: "/student",
  HOSTELITE: "/student",
  CONDUCTOR: "/conductor",
  DRIVER: "/driver",
};

export const ROLE_LABEL = {
  ADMIN: "Administrator",
  DAY_SCHOLAR: "Day Scholar",
  HOSTELITE: "Hostelite",
  CONDUCTOR: "Conductor",
  DRIVER: "Driver",
};
