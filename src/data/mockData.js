// Realistic mock dataset for SmartU Transport — FAST NUCES Chiniot-Faisalabad Campus (CFD)
// All data here simulates what would normally live in a Postgres/Node backend.

export const CAMPUS_CENTER = { lat: 31.4504, lng: 73.0782 }; // FAST NUCES CFD, Faisalabad

// ---------------------------------------------------------------------------
// SCHEDULE TYPES & RECURRENCE ENUMS
// ---------------------------------------------------------------------------
export const SCHEDULE_TYPES = {
  REGULAR_MORNING: "REGULAR_MORNING",
  REGULAR_RETURN: "REGULAR_RETURN",
  SPECIAL_SHUTTLE: "SPECIAL_SHUTTLE",
  EVENT_SHUTTLE: "EVENT_SHUTTLE",
};

export const RECURRENCE_TYPES = {
  WEEKDAYS: "WEEKDAYS", // Monday - Friday
  DAILY: "DAILY",
  FRIDAY_ONLY: "FRIDAY_ONLY",
  SPECIFIC_DATE: "SPECIFIC_DATE",
  DATE_RANGE: "DATE_RANGE",
  EVENT: "EVENT",
};

// ---------------------------------------------------------------------------
// BASELINE ROUTE TIMETABLE — ROUTES 01 through 16
// ---------------------------------------------------------------------------
export const ROUTES = [
  {
    id: "RT-01",
    name: "Route 01 — D-Ground / Susan Road",
    shortName: "Route 01",
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
    name: "Route 02 — Jaranwala Road / Batala Colony",
    shortName: "Route 02",
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
    name: "Route 03 — Samanabad / Jail Road",
    shortName: "Route 03",
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
    name: "Route 04 — Chiniot / Lalian Road",
    shortName: "Route 04",
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
    name: "Route 05 — Millat Road / Mansoorabad",
    shortName: "Route 05",
    busId: "BUS-105",
    driverId: "DRV-05",
    conductorId: "CND-05",
    departureTime: "7:05 AM",
    stops: [
      { name: "Millat Road Chowk", lat: 31.4650, lng: 73.0890, eta: "7:05 AM" },
      { name: "Mansoorabad Pull", lat: 31.4580, lng: 73.0920, eta: "7:20 AM" },
      { name: "Noorpur Stop", lat: 31.4540, lng: 73.0850, eta: "7:38 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-06",
    name: "Route 06 — Madina Town / Kohinoor",
    shortName: "Route 06",
    busId: "BUS-106",
    driverId: "DRV-06",
    conductorId: "CND-06",
    departureTime: "7:15 AM",
    stops: [
      { name: "Madina Town Gate", lat: 31.4280, lng: 73.1020, eta: "7:15 AM" },
      { name: "Officers Colony", lat: 31.4330, lng: 73.0950, eta: "7:30 AM" },
      { name: "Gatwala Gate", lat: 31.4410, lng: 73.0880, eta: "7:45 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:05 AM" },
    ],
  },
  {
    id: "RT-07",
    name: "Route 07 — Ghulam Muhammad Abad",
    shortName: "Route 07",
    busId: "BUS-107",
    driverId: "DRV-07",
    conductorId: "CND-07",
    departureTime: "7:10 AM",
    stops: [
      { name: "GM Abad Gol Masjid", lat: 31.4050, lng: 73.0450, eta: "7:10 AM" },
      { name: "Bawa Chak", lat: 31.4150, lng: 73.0550, eta: "7:25 AM" },
      { name: "Labor Colony", lat: 31.4300, lng: 73.0650, eta: "7:42 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:15 AM" },
    ],
  },
  {
    id: "RT-08",
    name: "Route 08 — Satiana Road",
    shortName: "Route 08",
    busId: "BUS-108",
    driverId: "DRV-08",
    conductorId: "CND-08",
    departureTime: "7:15 AM",
    stops: [
      { name: "Satiana Road Bypass", lat: 31.3700, lng: 73.1100, eta: "7:15 AM" },
      { name: "Fish Farm Chowk", lat: 31.3950, lng: 73.1000, eta: "7:30 AM" },
      { name: "Batala Colony Main", lat: 31.4300, lng: 73.0800, eta: "7:45 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-09",
    name: "Route 09 — Sargodha Road",
    shortName: "Route 09",
    busId: "BUS-109",
    driverId: "DRV-09",
    conductorId: "CND-09",
    departureTime: "7:00 AM",
    stops: [
      { name: "Sargodha Road Bypass", lat: 31.4700, lng: 73.0300, eta: "7:00 AM" },
      { name: "Chiniot Pul Stand", lat: 31.4600, lng: 73.0500, eta: "7:20 AM" },
      { name: "FDA City Main Gate", lat: 31.4550, lng: 73.0650, eta: "7:40 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:05 AM" },
    ],
  },
  {
    id: "RT-10",
    name: "Route 10 — Canal Expressway",
    shortName: "Route 10",
    busId: "BUS-110",
    driverId: "DRV-10",
    conductorId: "CND-10",
    departureTime: "7:20 AM",
    stops: [
      { name: "Canal View Housing", lat: 31.4200, lng: 73.1200, eta: "7:20 AM" },
      { name: "Abdullah Garden", lat: 31.4300, lng: 73.1050, eta: "7:35 AM" },
      { name: "Kashmir Pul", lat: 31.4420, lng: 73.0900, eta: "7:50 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-11",
    name: "Route 11 — Peoples Colony / Batala Colony",
    shortName: "Route 11",
    busId: "BUS-111",
    driverId: "DRV-11",
    conductorId: "CND-11",
    departureTime: "7:20 AM",
    stops: [
      { name: "Peoples Colony No 1", lat: 31.4100, lng: 73.0800, eta: "7:20 AM" },
      { name: "Chenab Club Chowk", lat: 31.4220, lng: 73.0830, eta: "7:35 AM" },
      { name: "Jail Road Cut", lat: 31.4380, lng: 73.0790, eta: "7:50 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-12",
    name: "Route 12 — Narwala Road",
    shortName: "Route 12",
    busId: "BUS-112",
    driverId: "DRV-12",
    conductorId: "CND-12",
    departureTime: "7:10 AM",
    stops: [
      { name: "Narwala Road Bypass", lat: 31.4200, lng: 73.0200, eta: "7:10 AM" },
      { name: "Gole Cloth Market", lat: 31.4280, lng: 73.0450, eta: "7:28 AM" },
      { name: "Allied Hospital Gate", lat: 31.4400, lng: 73.0600, eta: "7:45 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-13",
    name: "Route 13 — Jhang Road",
    shortName: "Route 13",
    busId: "BUS-113",
    driverId: "DRV-13",
    conductorId: "CND-13",
    departureTime: "6:55 AM",
    stops: [
      { name: "Jhang Road Bypass", lat: 31.3900, lng: 73.0100, eta: "6:55 AM" },
      { name: "Ayub Agriculture Gate", lat: 31.4100, lng: 73.0400, eta: "7:18 AM" },
      { name: "Railway Station Chowk", lat: 31.4250, lng: 73.0650, eta: "7:40 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:15 AM" },
    ],
  },
  {
    id: "RT-14",
    name: "Route 14 — Sheikhupura Road / Gutwala",
    shortName: "Route 14",
    busId: "BUS-114",
    driverId: "DRV-14",
    conductorId: "CND-14",
    departureTime: "7:05 AM",
    stops: [
      { name: "Sheikhupura Road Stand", lat: 31.4700, lng: 73.1300, eta: "7:05 AM" },
      { name: "Gutwala Water Park", lat: 31.4600, lng: 73.1100, eta: "7:22 AM" },
      { name: "Expressway Interchange", lat: 31.4550, lng: 73.0950, eta: "7:42 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:10 AM" },
    ],
  },
  {
    id: "RT-15",
    name: "Route 15 — Chiniot City Express",
    shortName: "Route 15",
    busId: "BUS-115",
    driverId: "DRV-15",
    conductorId: "CND-15",
    departureTime: "6:50 AM",
    stops: [
      { name: "Chiniot Katchery Chowk", lat: 31.7300, lng: 72.9850, eta: "6:50 AM" },
      { name: "Chenab Bridge Toll", lat: 31.6900, lng: 72.9980, eta: "7:10 AM" },
      { name: "Sahianwala Interchange", lat: 31.5400, lng: 73.0450, eta: "7:35 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:15 AM" },
    ],
  },
  {
    id: "RT-16",
    name: "Route 16 — Tandlianwala / Dijkot",
    shortName: "Route 16",
    busId: "BUS-116",
    driverId: "DRV-16",
    conductorId: "CND-16",
    departureTime: "6:40 AM",
    stops: [
      { name: "Dijkot Main Stand", lat: 31.2150, lng: 73.0350, eta: "6:40 AM" },
      { name: "Samundri Road Chowk", lat: 31.3500, lng: 73.0600, eta: "7:10 AM" },
      { name: "Novelty Cinema Stop", lat: 31.4150, lng: 73.0720, eta: "7:38 AM" },
      { name: "FAST NUCES CFD Campus", lat: 31.4504, lng: 73.0782, eta: "8:15 AM" },
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
  { id: "BUS-105", plate: "FSD-9021", capacity: 45, model: "Toyota Coaster", status: "Active", routeId: "RT-05" },
  { id: "BUS-106", plate: "FSD-5512", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-06" },
  { id: "BUS-107", plate: "FSD-7734", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-07" },
  { id: "BUS-108", plate: "FSD-1188", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-08" },
  { id: "BUS-109", plate: "FSD-2299", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-09" },
  { id: "BUS-110", plate: "FSD-3301", capacity: 45, model: "Toyota Coaster", status: "Active", routeId: "RT-10" },
  { id: "BUS-111", plate: "FSD-4412", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-11" },
  { id: "BUS-112", plate: "FSD-5523", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-12" },
  { id: "BUS-113", plate: "FSD-6634", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-13" },
  { id: "BUS-114", plate: "FSD-7745", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-14" },
  { id: "BUS-115", plate: "FSD-8856", capacity: 45, model: "Toyota Coaster", status: "Active", routeId: "RT-15" },
  { id: "BUS-116", plate: "FSD-9967", capacity: 50, model: "Hino AK1J", status: "Active", routeId: "RT-16" },
  { id: "BUS-117", plate: "FSD-8011", capacity: 50, model: "Hino AK1J", status: "Reserve", routeId: null },
  { id: "BUS-118", plate: "FSD-8022", capacity: 45, model: "Toyota Coaster", status: "Reserve", routeId: null },
  { id: "BUS-119", plate: "FSD-8033", capacity: 50, model: "Hino AK1J", status: "Under Maintenance", routeId: null },
];

export const DRIVERS = [
  { id: "DRV-01", name: "Muhammad Arshad", loginId: "driver_1", phone: "0300-1234567", status: "Active", assignedBusId: "BUS-101" },
  { id: "DRV-02", name: "Ghulam Rasool", loginId: "driver_2", phone: "0301-2345678", status: "Active", assignedBusId: "BUS-102" },
  { id: "DRV-03", name: "Nazir Ahmed", loginId: "driver_3", phone: "0302-3456789", status: "Active", assignedBusId: "BUS-103" },
  { id: "DRV-04", name: "Shahid Mehmood", loginId: "driver_4", phone: "0333-4567890", status: "Active", assignedBusId: "BUS-104" },
  { id: "DRV-05", name: "Rana Tanveer", loginId: "driver_5", phone: "0345-5678901", status: "Active", assignedBusId: "BUS-105" },
  { id: "DRV-06", name: "Imran Bhatti", loginId: "driver_6", phone: "0321-6789012", status: "Active", assignedBusId: "BUS-106" },
  { id: "DRV-07", name: "Kashif Ali", loginId: "driver_7", phone: "0300-7654321", status: "Active", assignedBusId: "BUS-107" },
  { id: "DRV-08", name: "Tariq Jameel", loginId: "driver_8", phone: "0301-8765432", status: "Active", assignedBusId: "BUS-108" },
  { id: "DRV-09", name: "Sultan Mehmood", loginId: "driver_9", phone: "0302-9876543", status: "Active", assignedBusId: "BUS-109" },
  { id: "DRV-10", name: "Zafar Iqbal", loginId: "driver_10", phone: "0303-0987654", status: "Active", assignedBusId: "BUS-110" },
  { id: "DRV-11", name: "Mian Rafiq", loginId: "driver_11", phone: "0304-1098765", status: "Active", assignedBusId: "BUS-111" },
  { id: "DRV-12", name: "Bashir Ahmed", loginId: "driver_12", phone: "0305-2109876", status: "Active", assignedBusId: "BUS-112" },
  { id: "DRV-13", name: "Nadeem Akhtar", loginId: "driver_13", phone: "0306-3210987", status: "Active", assignedBusId: "BUS-113" },
  { id: "DRV-14", name: "Liaquat Ali", loginId: "driver_14", phone: "0307-4321098", status: "Active", assignedBusId: "BUS-114" },
  { id: "DRV-15", name: "Qasim Khan", loginId: "driver_15", phone: "0308-5432109", status: "Active", assignedBusId: "BUS-115" },
  { id: "DRV-16", name: "Yasin Gujjar", loginId: "driver_16", phone: "0309-6543210", status: "Active", assignedBusId: "BUS-116" },
  { id: "DRV-17", name: "Abid Hussain", loginId: "driver_17", phone: "0310-7654321", status: "Reserve", assignedBusId: null },
  { id: "DRV-18", name: "Sarwar Khan", loginId: "driver_18", phone: "0311-8765432", status: "Reserve", assignedBusId: null },
];

export const CONDUCTORS = [
  { id: "CND-01", name: "Aslam Chaudhry", loginId: "conductor_1", phone: "0304-1112233", status: "Active", assignedBusId: "BUS-101" },
  { id: "CND-02", name: "Riaz Hussain", loginId: "conductor_2", phone: "0305-2223344", status: "Active", assignedBusId: "BUS-102" },
  { id: "CND-03", name: "Waqas Anjum", loginId: "conductor_3", phone: "0306-3334455", status: "Active", assignedBusId: "BUS-103" },
  { id: "CND-04", name: "Bilal Yousaf", loginId: "conductor_4", phone: "0307-4445566", status: "Active", assignedBusId: "BUS-104" },
  { id: "CND-05", name: "Sajid Iqbal", loginId: "conductor_5", phone: "0308-5556677", status: "Active", assignedBusId: "BUS-105" },
  { id: "CND-06", name: "Farooq Shah", loginId: "conductor_6", phone: "0309-6667788", status: "Active", assignedBusId: "BUS-106" },
  { id: "CND-07", name: "Tanveer Abbas", loginId: "conductor_7", phone: "0310-7778899", status: "Active", assignedBusId: "BUS-107" },
  { id: "CND-08", name: "Nasir Mehmood", loginId: "conductor_8", phone: "0311-8889900", status: "Active", assignedBusId: "BUS-108" },
  { id: "CND-09", name: "Kamran Siddique", loginId: "conductor_9", phone: "0312-9990011", status: "Active", assignedBusId: "BUS-109" },
  { id: "CND-10", name: "Amjad Ali", loginId: "conductor_10", phone: "0313-0001122", status: "Active", assignedBusId: "BUS-110" },
  { id: "CND-11", name: "Shabbir Hussain", loginId: "conductor_11", phone: "0314-1112233", status: "Active", assignedBusId: "BUS-111" },
  { id: "CND-12", name: "Zubair Ahmad", loginId: "conductor_12", phone: "0315-2223344", status: "Active", assignedBusId: "BUS-112" },
  { id: "CND-13", name: "Munir Khan", loginId: "conductor_13", phone: "0316-3334455", status: "Active", assignedBusId: "BUS-113" },
  { id: "CND-14", name: "Hamid Raza", loginId: "conductor_14", phone: "0317-4445566", status: "Active", assignedBusId: "BUS-114" },
  { id: "CND-15", name: "Irfan Haider", loginId: "conductor_15", phone: "0318-5556677", status: "Active", assignedBusId: "BUS-115" },
  { id: "CND-16", name: "Noman Sadiq", loginId: "conductor_16", phone: "0319-6667788", status: "Active", assignedBusId: "BUS-116" },
  { id: "CND-17", name: "Akbar Ali", loginId: "conductor_17", phone: "0320-7778899", status: "Reserve", assignedBusId: null },
  { id: "CND-18", name: "Javed Iqbal", loginId: "conductor_18", phone: "0321-8889900", status: "Reserve", assignedBusId: null },
];

// ---------------------------------------------------------------------------
// INITIAL ADMIN-MANAGED SCHEDULES (Default Timetable + Overrides + Shuttles)
// ---------------------------------------------------------------------------
export const DEFAULT_SCHEDULES = [
  // 1. Regular Morning Schedules for all routes (Mon-Fri)
  ...ROUTES.map((route, idx) => ({
    id: `SCH-MRN-${String(idx + 1).padStart(2, "0")}`,
    routeId: route.id,
    title: `${route.shortName} Morning Service`,
    serviceType: SCHEDULE_TYPES.REGULAR_MORNING,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: route.departureTime,
    arrivalTime: "8:25 AM",
    busId: route.busId,
    driverId: route.driverId,
    conductorId: route.conductorId,
    status: "ACTIVE",
    notes: "Regular morning student commute to campus.",
    isOverride: false,
  })),

  // 2. Regular Return Schedules (Mon-Fri 5:00 PM closing)
  {
    id: "SCH-RET-01",
    routeId: "RT-01",
    title: "Route 01 Evening Return",
    serviceType: SCHEDULE_TYPES.REGULAR_RETURN,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: "5:00 PM",
    arrivalTime: "5:50 PM",
    busId: "BUS-101",
    driverId: "DRV-01",
    conductorId: "CND-01",
    status: "ACTIVE",
    notes: "Regular afternoon return after university closing hours.",
    isOverride: false,
  },
  {
    id: "SCH-RET-02",
    routeId: "RT-02",
    title: "Route 02 Evening Return",
    serviceType: SCHEDULE_TYPES.REGULAR_RETURN,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: "5:00 PM",
    arrivalTime: "6:00 PM",
    busId: "BUS-102",
    driverId: "DRV-02",
    conductorId: "CND-02",
    status: "ACTIVE",
    notes: "Regular afternoon return after university closing hours.",
    isOverride: false,
  },
  {
    id: "SCH-RET-03",
    routeId: "RT-03",
    title: "Route 03 Evening Return",
    serviceType: SCHEDULE_TYPES.REGULAR_RETURN,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: "5:05 PM",
    arrivalTime: "5:55 PM",
    busId: "BUS-103",
    driverId: "DRV-03",
    conductorId: "CND-03",
    status: "ACTIVE",
    notes: "Regular afternoon return after university closing hours.",
    isOverride: false,
  },
  {
    id: "SCH-RET-04",
    routeId: "RT-04",
    title: "Route 04 Chiniot Evening Return",
    serviceType: SCHEDULE_TYPES.REGULAR_RETURN,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: "5:00 PM",
    arrivalTime: "6:15 PM",
    busId: "BUS-104",
    driverId: "DRV-04",
    conductorId: "CND-04",
    status: "ACTIVE",
    notes: "Regular afternoon return to Chiniot.",
    isOverride: false,
  },

  // 3. Friday 2:00 PM Special Shuttles
  {
    id: "SCH-SPE-FRI-01",
    routeId: "RT-01",
    title: "Friday 2:00 PM City Shuttle",
    serviceType: SCHEDULE_TYPES.SPECIAL_SHUTTLE,
    recurrence: RECURRENCE_TYPES.FRIDAY_ONLY,
    departureTime: "2:00 PM",
    arrivalTime: "2:50 PM",
    busId: "BUS-117",
    driverId: "DRV-17",
    conductorId: "CND-17",
    status: "ACTIVE",
    notes: "Friday early return shuttle after Jummah prayer.",
    isOverride: false,
  },
  {
    id: "SCH-SPE-FRI-02",
    routeId: "RT-05",
    title: "Friday Jummah Masjid Shuttle",
    serviceType: SCHEDULE_TYPES.SPECIAL_SHUTTLE,
    recurrence: RECURRENCE_TYPES.FRIDAY_ONLY,
    departureTime: "1:00 PM",
    arrivalTime: "1:45 PM",
    busId: "BUS-105",
    driverId: "DRV-05",
    conductorId: "CND-05",
    status: "ACTIVE",
    notes: "Campus to Jamia Masjid Ghausia and return for Friday prayers.",
    isOverride: false,
  },

  // 4. University Event Shuttles (Late Night / Special Events)
  {
    id: "SCH-EVT-01",
    routeId: "RT-08",
    title: "FAST Annual TechFest Late Night Shuttle",
    serviceType: SCHEDULE_TYPES.EVENT_SHUTTLE,
    recurrence: RECURRENCE_TYPES.SPECIFIC_DATE,
    specificDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), // in 2 days
    departureTime: "10:30 PM",
    arrivalTime: "11:20 PM",
    busId: "BUS-108",
    driverId: "DRV-08",
    conductorId: "CND-08",
    status: "ACTIVE",
    notes: "Late night transport for students attending TechFest 2026 hackathon.",
    isOverride: false,
  },
  {
    id: "SCH-EVT-02",
    routeId: "RT-01",
    title: "FAST Olympiad Midnight Transport",
    serviceType: SCHEDULE_TYPES.EVENT_SHUTTLE,
    recurrence: RECURRENCE_TYPES.SPECIFIC_DATE,
    specificDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), // in 5 days
    departureTime: "11:30 PM",
    arrivalTime: "12:15 AM",
    busId: "BUS-118",
    driverId: "DRV-18",
    conductorId: "CND-18",
    status: "ACTIVE",
    notes: "Midnight shuttle service for closing ceremony and participants.",
    isOverride: false,
  },
];

// Helper functions to generate student credentials according to FAST CFD format:
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
  { id: "STU-014", name: "Ali", rollNo: "22F-3099", email: "f223099@cfd.nu.edu.pk", password: "3099@fast", role: "HOSTELITE", routeId: "RT-01", cnic: "33202-7777777-1", feeStatus: "Paid" },
];

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
    message: "Route 03 (Samanabad) is running approximately 15 minutes behind schedule this morning due to traffic near Jail Road.",
    audience: "RT-03",
    audienceLabel: "Route 03",
    date: "2026-09-02T07:05:00",
    author: "Transport Admin",
  },
  {
    id: "ANN-002",
    message: "Friday special shuttle service to Jamia Masjid starts at 1:00 PM and City Shuttle at 2:00 PM.",
    audience: "ALL",
    audienceLabel: "All Routes",
    date: "2026-08-29T10:00:00",
    author: "Transport Admin",
  },
  {
    id: "ANN-003",
    message: "Bus FSD-8033 is under scheduled maintenance. Reserve bus FSD-8011 has been deployed.",
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
    const contactEmail = (cand.contactEmail || "").toLowerCase();
    const lId = (cand.loginId || "").toLowerCase();
    const rNoStripped = rNo.replace(/[^a-z0-9]/g, "");
    const loginStripped = cleanLogin.replace(/[^a-z0-9]/g, "");

    return (
      cleanLogin === lId ||
      cleanLogin === rNo ||
      cleanLogin === email ||
      cleanLogin === contactEmail ||
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
      expectedPass.toLowerCase() === cleanPass.toLowerCase()
    );
  };

  try {
    let studentList = [];
    const raw = typeof window !== "undefined" ? localStorage.getItem("smartu-students") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.students) {
        studentList = parsed.state.students;
      }
    }

    const studentAccount = studentList.find(isUserMatch);
    if (studentAccount?.accountStatus === "Rejected") return null;
    if (studentAccount && !isPassMatch(studentAccount)) return null;
    if (studentAccount) {
      return {
        loginId: studentAccount.rollNo,
        rollNo: studentAccount.rollNo,
        email: studentAccount.email,
        contactEmail: studentAccount.contactEmail,
        userType: studentAccount.userType || (studentAccount.role === "FACULTY" ? "faculty" : "student"),
        accountStatus: studentAccount.accountStatus || "Approved",
        seatNo: studentAccount.seatNo ?? null,
        password: studentAccount.password,
        role: studentAccount.role,
        name: studentAccount.name,
        refId: studentAccount.id,
      };
    }
  } catch (e) {
    console.error(e);
  }

  let account = MOCK_ACCOUNTS.find((a) => isUserMatch(a) && isPassMatch(a));
  if (account) {
    return {
      ...account,
      userType: account.userType || (account.role === "FACULTY" ? "faculty" : "student"),
      accountStatus: account.accountStatus || "Approved",
      seatNo: account.seatNo ?? null,
    };
  }

  return null;
}

export const ROLE_HOME = {
  ADMIN: "/admin",
  DAY_SCHOLAR: "/student",
  HOSTELITE: "/student",
  FACULTY: "/student",
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
