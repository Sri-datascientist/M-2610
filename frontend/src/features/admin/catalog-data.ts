export type HistoryEntry = {
  at: string;
  text: string;
  by: string;
  action?: string;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
};
export type NoteEntry = { at: string; text: string; by: string };
export type ChecklistItem = { label: string; done: boolean };
export type DocumentItem = { name: string; submitted: string; version?: number };

export const doctorStatuses = [
  "Pending Review",
  "Under Review",
  "Additional Information Required",
  "Verified",
  "Rejected",
  "Suspended",
] as const;
export type DoctorStatus = (typeof doctorStatuses)[number];

/** Display label for a stored doctor status. The stored value stays unchanged. */
export function doctorStatusLabel(status: DoctorStatus): string {
  return status === "Pending Review" ? "Registered" : status;
}

export const specializations = [
  "Kayachikitsa",
  "Panchakarma",
  "Shalya Tantra",
  "Prasuti Tantra",
  "Dravyaguna",
  "Kaumarbhritya",
  "Shalakya Tantra",
] as const;

export type Doctor = {
  id: string;
  name: string;
  specialization: (typeof specializations)[number];
  registrationNumber: string;
  submittedDate: string;
  status: DoctorStatus;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  pincode: string;
  experience: string;
  languages: string;
  qualifications: { degree: string; institution: string; year: string }[];
  council: string;
  registrationValidUntil: string;
  registrationState: string;
  documents: DocumentItem[];
  checklist: ChecklistItem[];
  notes: NoteEntry[];
  history: HistoryEntry[];
};

const doctorChecklist = (): ChecklistItem[] => [
  { label: "Identity matches the council register", done: false },
  { label: "Degree certificate is legible", done: false },
  { label: "Registration is current", done: false },
  { label: "Photograph matches the application", done: false },
];

export const seedDoctors: Doctor[] = [
  {
    id: "DOC-1042",
    name: "Dr. Meera Nair",
    specialization: "Kayachikitsa",
    registrationNumber: "NCISM/KER/2014/1182",
    submittedDate: "08 Oct 2026",
    status: "Pending Review",
    email: "meera.nair@example.com",
    phone: "+91 98470 11220",
    address: "Panampilly Nagar, Main Road",
    city: "Kochi",
    state: "Kerala",
    pincode: "682036",
    experience: "12 years",
    languages: "Malayalam, English, Hindi",
    qualifications: [
      {
        degree: "BAMS",
        institution: "Government Ayurveda College, Thiruvananthapuram",
        year: "2012",
      },
      { degree: "MD Kayachikitsa", institution: "VPSV Ayurveda College, Kottakkal", year: "2016" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "31 Mar 2028",
    registrationState: "Kerala",
    documents: [
      { name: "BAMS degree certificate", submitted: "08 Oct 2026" },
      { name: "MD certificate", submitted: "08 Oct 2026" },
      { name: "NCISM registration", submitted: "08 Oct 2026" },
      { name: "Identity proof", submitted: "08 Oct 2026" },
    ],
    checklist: doctorChecklist(),
    notes: [],
    history: [{ at: "08 Oct 2026 10:15", text: "Application submitted", by: "Dr. Meera Nair" }],
  },
  {
    id: "DOC-1048",
    name: "Dr. Anjali Menon",
    specialization: "Kayachikitsa",
    registrationNumber: "NCISM/KER/2019/5528",
    submittedDate: "11 Oct 2026",
    status: "Pending Review",
    email: "anjali.menon@example.com",
    phone: "+91 98951 22018",
    address: "Mavoor Road, Near Cyberpark",
    city: "Kozhikode",
    state: "Kerala",
    pincode: "673016",
    experience: "7 years",
    languages: "Malayalam, English",
    qualifications: [
      { degree: "BAMS", institution: "Pankajakasthuri Ayurveda Medical College", year: "2017" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "14 Aug 2027",
    registrationState: "Kerala",
    documents: [
      { name: "BAMS degree certificate", submitted: "11 Oct 2026" },
      { name: "NCISM registration", submitted: "11 Oct 2026" },
    ],
    checklist: doctorChecklist(),
    notes: [],
    history: [{ at: "11 Oct 2026 16:40", text: "Application submitted", by: "Dr. Anjali Menon" }],
  },
  {
    id: "DOC-0988",
    name: "Dr. Arjun Deshmukh",
    specialization: "Panchakarma",
    registrationNumber: "NCISM/MAH/2011/0844",
    submittedDate: "02 Oct 2026",
    status: "Under Review",
    email: "arjun.deshmukh@example.com",
    phone: "+91 98220 44119",
    address: "FC Road, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411005",
    experience: "15 years",
    languages: "Marathi, Hindi, English",
    qualifications: [
      { degree: "BAMS", institution: "Tilak Ayurved Mahavidyalaya, Pune", year: "2009" },
      { degree: "MD Panchakarma", institution: "R.A. Podar Medical College", year: "2013" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "20 Jan 2027",
    registrationState: "Maharashtra",
    documents: [
      { name: "BAMS degree certificate", submitted: "02 Oct 2026" },
      { name: "MD Panchakarma certificate", submitted: "02 Oct 2026" },
      { name: "NCISM registration", submitted: "02 Oct 2026" },
    ],
    checklist: [
      { label: "Identity matches the council register", done: true },
      { label: "Degree certificate is legible", done: true },
      { label: "Registration is current", done: false },
      { label: "Photograph matches the application", done: true },
    ],
    notes: [
      {
        at: "04 Oct 2026 11:05",
        text: "Registration scan is cropped. Waiting on a full page.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      { at: "04 Oct 2026 11:02", text: "Review started", by: "Ananya Iyer" },
      { at: "02 Oct 2026 09:20", text: "Application submitted", by: "Dr. Arjun Deshmukh" },
    ],
  },
  {
    id: "DOC-1011",
    name: "Dr. Suniti Sharma",
    specialization: "Prasuti Tantra",
    registrationNumber: "NCISM/DL/2016/3301",
    submittedDate: "21 Sep 2026",
    status: "Additional Information Required",
    email: "suniti.sharma@example.com",
    phone: "+91 98100 77821",
    address: "Karol Bagh, Pusa Road",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110005",
    experience: "10 years",
    languages: "Hindi, English",
    qualifications: [
      { degree: "BAMS", institution: "Ayurvedic and Unani Tibbia College", year: "2014" },
      { degree: "MS Prasuti Tantra", institution: "All India Institute of Ayurveda", year: "2018" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "30 Jun 2026",
    registrationState: "Delhi",
    documents: [
      { name: "BAMS degree certificate", submitted: "21 Sep 2026" },
      { name: "MS certificate", submitted: "21 Sep 2026" },
      { name: "NCISM registration", submitted: "21 Sep 2026" },
    ],
    checklist: doctorChecklist(),
    notes: [
      {
        at: "28 Sep 2026 15:12",
        text: "Registration expiry has passed. A renewal receipt is required.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "28 Sep 2026 15:12",
        text: "Additional information requested: renewal receipt",
        by: "Ananya Iyer",
      },
      { at: "21 Sep 2026 13:00", text: "Application submitted", by: "Dr. Suniti Sharma" },
    ],
  },
  {
    id: "DOC-0774",
    name: "Dr. Lakshmi Rao",
    specialization: "Shalya Tantra",
    registrationNumber: "NCISM/KAR/2008/2219",
    submittedDate: "14 Aug 2026",
    status: "Verified",
    email: "lakshmi.rao@example.com",
    phone: "+91 98450 33012",
    address: "Jayanagar 4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560011",
    experience: "18 years",
    languages: "Kannada, English, Hindi",
    qualifications: [
      {
        degree: "BAMS",
        institution: "Government Ayurveda Medical College, Bengaluru",
        year: "2006",
      },
      { degree: "MS Shalya Tantra", institution: "SDM College of Ayurveda, Hassan", year: "2010" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "12 Dec 2028",
    registrationState: "Karnataka",
    documents: [
      { name: "BAMS degree certificate", submitted: "14 Aug 2026" },
      { name: "MS certificate", submitted: "14 Aug 2026" },
      { name: "NCISM registration", submitted: "14 Aug 2026" },
    ],
    checklist: doctorChecklist().map((item) => ({ ...item, done: true })),
    notes: [],
    history: [
      { at: "18 Aug 2026 10:30", text: "Practitioner verified", by: "Ananya Iyer" },
      { at: "14 Aug 2026 08:45", text: "Application submitted", by: "Dr. Lakshmi Rao" },
    ],
  },
  {
    id: "DOC-0810",
    name: "Dr. Hari Prasad",
    specialization: "Dravyaguna",
    registrationNumber: "NCISM/UP/2009/0771",
    submittedDate: "03 Jul 2026",
    status: "Verified",
    email: "hari.prasad@example.com",
    phone: "+91 94150 22880",
    address: "Assi Ghat Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221005",
    experience: "17 years",
    languages: "Hindi, Sanskrit, English",
    qualifications: [
      { degree: "BAMS", institution: "Banaras Hindu University", year: "2007" },
      { degree: "MD Dravyaguna", institution: "Banaras Hindu University", year: "2011" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "01 May 2029",
    registrationState: "Uttar Pradesh",
    documents: [
      { name: "BAMS degree certificate", submitted: "03 Jul 2026" },
      { name: "MD certificate", submitted: "03 Jul 2026" },
      { name: "NCISM registration", submitted: "03 Jul 2026" },
    ],
    checklist: doctorChecklist().map((item) => ({ ...item, done: true })),
    notes: [],
    history: [
      { at: "09 Jul 2026 12:10", text: "Practitioner verified", by: "Ananya Iyer" },
      { at: "03 Jul 2026 17:25", text: "Application submitted", by: "Dr. Hari Prasad" },
    ],
  },
  {
    id: "DOC-1102",
    name: "Dr. Fatima Qureshi",
    specialization: "Kaumarbhritya",
    registrationNumber: "NCISM/TS/2018/4410",
    submittedDate: "19 Sep 2026",
    status: "Rejected",
    email: "fatima.qureshi@example.com",
    phone: "+91 90000 11842",
    address: "Banjara Hills, Road No 12",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500034",
    experience: "8 years",
    languages: "Telugu, Urdu, English",
    qualifications: [
      { degree: "BAMS", institution: "Dr. BRKR Government Ayurvedic College", year: "2016" },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "02 Feb 2027",
    registrationState: "Telangana",
    documents: [
      { name: "BAMS degree certificate", submitted: "19 Sep 2026" },
      { name: "Identity proof", submitted: "19 Sep 2026" },
    ],
    checklist: doctorChecklist(),
    notes: [
      {
        at: "25 Sep 2026 09:40",
        text: "Council register has no matching registration number.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "25 Sep 2026 09:40",
        text: "Rejected: registration number was not found on the council register",
        by: "Ananya Iyer",
      },
      { at: "19 Sep 2026 11:18", text: "Application submitted", by: "Dr. Fatima Qureshi" },
    ],
  },
  {
    id: "DOC-0904",
    name: "Dr. Vikram Joshi",
    specialization: "Shalakya Tantra",
    registrationNumber: "NCISM/RJ/2012/1904",
    submittedDate: "12 May 2026",
    status: "Suspended",
    email: "vikram.joshi@example.com",
    phone: "+91 98290 55102",
    address: "Tonk Road, Gopalpura Bypass",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302018",
    experience: "14 years",
    languages: "Hindi, English",
    qualifications: [
      { degree: "BAMS", institution: "National Institute of Ayurveda, Jaipur", year: "2010" },
      {
        degree: "MS Shalakya",
        institution: "National Institute of Ayurveda, Jaipur",
        year: "2014",
      },
    ],
    council: "National Commission for Indian System of Medicine",
    registrationValidUntil: "18 Nov 2026",
    registrationState: "Rajasthan",
    documents: [
      { name: "BAMS degree certificate", submitted: "12 May 2026" },
      { name: "MS certificate", submitted: "12 May 2026" },
      { name: "NCISM registration", submitted: "12 May 2026" },
    ],
    checklist: doctorChecklist().map((item, index) => ({ ...item, done: index < 3 })),
    notes: [
      {
        at: "02 Jun 2026 14:00",
        text: "Practice suspended after a council order dated 28 May 2026.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "02 Jun 2026 14:00",
        text: "Record suspended after a council order",
        by: "Ananya Iyer",
      },
      { at: "16 May 2026 10:00", text: "Practitioner verified", by: "Ananya Iyer" },
      { at: "12 May 2026 09:12", text: "Application submitted", by: "Dr. Vikram Joshi" },
    ],
  },
];

export const licenceStatuses = ["Valid", "Expiring", "Pending", "Expired"] as const;
export type LicenceStatus = (typeof licenceStatuses)[number];

export const manufacturerStatuses = [
  "Pending Review",
  "Under Review",
  "Corrections Requested",
  "Verified",
  "Rejected",
  "Suspended",
] as const;
export type ManufacturerStatus = (typeof manufacturerStatuses)[number];

export type Facility = {
  name: string;
  address: string;
  kind: string;
  status: "Operational" | "Proposed" | "Closed";
};

export type Licence = {
  name: string;
  number: string;
  issued: string;
  expires: string;
  status: LicenceStatus;
};

export type Form25D = {
  number: string;
  status: "Valid" | "Pending" | "Expired" | "Missing";
  issued: string;
  expires: string;
};

export type Manufacturer = {
  id: string;
  company: string;
  registeredAddress?: string;
  city: string;
  state: string;
  pincode: string;
  location: string;
  applicationDate: string;
  licenceStatus: LicenceStatus;
  status: ManufacturerStatus;
  contact: string;
  email: string;
  phone?: string;
  gstin: string;
  form25d: Form25D;
  yearEstablished: string;
  facilities: Facility[];
  licences: Licence[];
  documents: DocumentItem[];
  notes: NoteEntry[];
  history: HistoryEntry[];
};

export const seedManufacturers: Manufacturer[] = [
  {
    id: "MFR-18",
    company: "Sahyadri Botanics",
    registeredAddress: "Plot 14, Ayyanthole Industrial Area",
    city: "Thrissur",
    state: "Kerala",
    pincode: "680003",
    location: "Thrissur, Kerala",
    applicationDate: "12 Oct 2026",
    licenceStatus: "Pending",
    status: "Pending Review",
    contact: "Neha Krishnan",
    email: "quality@sahyadribotanics.example",
    phone: "+91 98471 22334",
    gstin: "32AABCS1820Q1Z4",
    form25d: {
      number: "F25D-KL-2026-0041",
      status: "Pending",
      issued: "—",
      expires: "—",
    },
    yearEstablished: "2015",
    facilities: [
      {
        name: "Thrissur extraction unit",
        address: "Plot 14, Ayyanthole industrial area, Thrissur",
        kind: "Extraction and churna",
        status: "Proposed",
      },
    ],
    licences: [
      {
        name: "AYUSH manufacturing licence",
        number: "AYU-KL-Pending",
        issued: "—",
        expires: "—",
        status: "Pending",
      },
    ],
    documents: [
      { name: "Application form", submitted: "12 Oct 2026" },
      { name: "Site layout", submitted: "12 Oct 2026" },
      { name: "GST certificate", submitted: "12 Oct 2026" },
      { name: "Form 25D Application Draft", submitted: "12 Oct 2026" },
    ],
    notes: [],
    history: [{ at: "12 Oct 2026 09:30", text: "Application submitted", by: "Neha Krishnan" }],
  },
  {
    id: "MFR-22",
    company: "Malabar Extracts",
    registeredAddress: "NH 66, Azhikode Industrial Corridor",
    city: "Kannur",
    state: "Kerala",
    pincode: "670009",
    location: "Kannur, Kerala",
    applicationDate: "10 Oct 2026",
    licenceStatus: "Pending",
    status: "Pending Review",
    contact: "Joseph Mathew",
    email: "joseph@malabarextracts.example",
    phone: "+91 98472 55667",
    gstin: "32AADCM4412P1Z8",
    form25d: {
      number: "F25D-KL-2025-0188",
      status: "Expired",
      issued: "15 Jan 2023",
      expires: "14 Jan 2026",
    },
    yearEstablished: "2019",
    facilities: [
      {
        name: "Kannur taila unit",
        address: "NH 66, Azhikode, Kannur",
        kind: "Taila",
        status: "Operational",
      },
    ],
    licences: [
      {
        name: "Factory licence",
        number: "FAC-KN-2291",
        issued: "01 Apr 2024",
        expires: "31 Mar 2027",
        status: "Valid",
      },
    ],
    documents: [
      { name: "Factory licence", submitted: "10 Oct 2026" },
      { name: "Partnership deed", submitted: "10 Oct 2026" },
      { name: "Form 25D Renewal Submission", submitted: "10 Oct 2026" },
    ],
    notes: [],
    history: [{ at: "10 Oct 2026 14:12", text: "Application submitted", by: "Joseph Mathew" }],
  },
  {
    id: "MFR-09",
    company: "Kerala Herbals",
    registeredAddress: "Eloor Industrial Estate, Aluva",
    city: "Kochi",
    state: "Kerala",
    pincode: "683501",
    location: "Kochi, Kerala",
    applicationDate: "28 Sep 2026",
    licenceStatus: "Expiring",
    status: "Under Review",
    contact: "Ravi Menon",
    email: "ravi@keralaherbals.example",
    phone: "+91 98473 88990",
    gstin: "32AABCK1008R1Z2",
    form25d: {
      number: "F25D-KL-2024-0092",
      status: "Valid",
      issued: "01 Nov 2024",
      expires: "31 Oct 2027",
    },
    yearEstablished: "1998",
    facilities: [
      {
        name: "Kochi ghrita block",
        address: "Eloor industrial estate, Kochi",
        kind: "Ghrita and lehya",
        status: "Operational",
      },
      {
        name: "Aluva warehouse",
        address: "Warehouse 3, Aluva",
        kind: "Storage",
        status: "Operational",
      },
    ],
    licences: [
      {
        name: "GMP certificate",
        number: "GMP-KL-441",
        issued: "01 Nov 2023",
        expires: "31 Oct 2026",
        status: "Expiring",
      },
      {
        name: "AYUSH manufacturing licence",
        number: "AYU-KL-188",
        issued: "15 Jan 2022",
        expires: "14 Jan 2027",
        status: "Valid",
      },
    ],
    documents: [
      { name: "GMP certificate", submitted: "28 Sep 2026" },
      { name: "AYUSH licence", submitted: "28 Sep 2026" },
      { name: "Facility photographs", submitted: "29 Sep 2026" },
      { name: "Form 25D Verification Record", submitted: "28 Sep 2026" },
    ],
    notes: [
      {
        at: "01 Oct 2026 11:20",
        text: "GMP renewal application number is missing from the pack.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      { at: "01 Oct 2026 11:18", text: "Review started", by: "Ananya Iyer" },
      { at: "28 Sep 2026 16:05", text: "Application submitted", by: "Ravi Menon" },
    ],
  },
  {
    id: "MFR-03",
    company: "Arya Vaidya Sala",
    registeredAddress: "Kottakkal Head Office Campus, Malappuram",
    city: "Kottakkal",
    state: "Kerala",
    pincode: "676503",
    location: "Kottakkal, Kerala",
    applicationDate: "02 Jun 2026",
    licenceStatus: "Valid",
    status: "Verified",
    contact: "Priya Nambiar",
    email: "regulatory@aryavaidyasala.example",
    phone: "+91 94471 11223",
    gstin: "32AAACA2210F1Z6",
    form25d: {
      number: "F25D-KL-2025-0012",
      status: "Valid",
      issued: "01 Jan 2025",
      expires: "31 Dec 2029",
    },
    yearEstablished: "1902",
    facilities: [
      {
        name: "Kottakkal factory",
        address: "Kottakkal, Malappuram",
        kind: "Classical formulations",
        status: "Operational",
      },
    ],
    licences: [
      {
        name: "GMP certificate",
        number: "GMP-KL-018",
        issued: "01 Jan 2025",
        expires: "31 Dec 2027",
        status: "Valid",
      },
      {
        name: "AYUSH manufacturing licence",
        number: "AYU-KL-014",
        issued: "12 Mar 2024",
        expires: "11 Mar 2029",
        status: "Valid",
      },
    ],
    documents: [
      { name: "GMP certificate", submitted: "02 Jun 2026" },
      { name: "AYUSH licence", submitted: "02 Jun 2026" },
      { name: "Form 25D Ayurvedic Manufacturing Endorsement", submitted: "02 Jun 2026" },
    ],
    notes: [],
    history: [
      { at: "14 Oct 2026 09:40", text: "Manufacturer verified", by: "Ananya Iyer" },
      { at: "02 Jun 2026 10:00", text: "Renewal submitted", by: "Priya Nambiar" },
    ],
  },
  {
    id: "MFR-07",
    company: "Himalaya Wellness",
    registeredAddress: "Makali Corporate Park, Tumkur Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "562123",
    location: "Bengaluru, Karnataka",
    applicationDate: "18 Apr 2026",
    licenceStatus: "Valid",
    status: "Verified",
    contact: "Asha Rao",
    email: "asha.rao@himalayawellness.example",
    phone: "+91 98451 99001",
    gstin: "29AABCH1012D1Z1",
    form25d: {
      number: "F25D-KA-2025-0772",
      status: "Valid",
      issued: "20 Feb 2025",
      expires: "19 Feb 2030",
    },
    yearEstablished: "1930",
    facilities: [
      {
        name: "Makali plant",
        address: "Makali, Bengaluru",
        kind: "Tablets and churna",
        status: "Operational",
      },
    ],
    licences: [
      {
        name: "GMP certificate",
        number: "GMP-KA-772",
        issued: "20 Feb 2025",
        expires: "19 Feb 2028",
        status: "Valid",
      },
    ],
    documents: [
      { name: "GMP certificate", submitted: "18 Apr 2026" },
      { name: "Site master file", submitted: "18 Apr 2026" },
      { name: "Form 25D Central AYUSH Endorsement", submitted: "18 Apr 2026" },
    ],
    notes: [],
    history: [
      { at: "22 Apr 2026 15:10", text: "Manufacturer verified", by: "Ananya Iyer" },
      { at: "18 Apr 2026 09:00", text: "Application submitted", by: "Asha Rao" },
    ],
  },
  {
    id: "MFR-31",
    company: "Dabur Ayurveda Unit",
    registeredAddress: "Plot 22, Site IV, Sahibabad Industrial Area",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    pincode: "201010",
    location: "Ghaziabad, Uttar Pradesh",
    applicationDate: "07 Aug 2026",
    licenceStatus: "Valid",
    status: "Corrections Requested",
    contact: "Imran Siddiqui",
    email: "imran.siddiqui@daburayurveda.example",
    phone: "+91 98110 33445",
    gstin: "09AAACD1020C1Z5",
    form25d: {
      number: "F25D-UP-2023-0552",
      status: "Valid",
      issued: "01 Sep 2023",
      expires: "31 Aug 2028",
    },
    yearEstablished: "1884",
    facilities: [
      {
        name: "Ghaziabad unit 2",
        address: "Sahibabad industrial area, Ghaziabad",
        kind: "Vati and churna",
        status: "Operational",
      },
    ],
    licences: [
      {
        name: "AYUSH manufacturing licence",
        number: "AYU-UP-552",
        issued: "01 Sep 2023",
        expires: "31 Aug 2028",
        status: "Valid",
      },
    ],
    documents: [
      { name: "AYUSH licence", submitted: "07 Aug 2026" },
      { name: "Batch coding SOP", submitted: "07 Aug 2026" },
      { name: "Form 25D Certified Schedule M-1", submitted: "07 Aug 2026" },
    ],
    notes: [
      {
        at: "20 Aug 2026 13:45",
        text: "The site master file does not list the vati compression room.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "20 Aug 2026 13:45",
        text: "Corrections requested: update the site master file",
        by: "Ananya Iyer",
      },
      { at: "07 Aug 2026 11:30", text: "Application submitted", by: "Imran Siddiqui" },
    ],
  },
];

export const dosageForms = ["Tablet", "Churna", "Kwath", "Ghrita", "Taila"] as const;
export type DosageForm = (typeof dosageForms)[number];

export const medicineStatuses = [
  "Draft",
  "Pending Review",
  "Under Review",
  "Approved",
  "Changes Requested",
  "Rejected",
  "Inactive",
] as const;
export type MedicineStatus = (typeof medicineStatuses)[number];

export type FormulaLine = { ingredient: string; part: string; quantity: string };

export type MedicineVersion = {
  version: number;
  status: MedicineStatus;
  submitted: string;
  packSize: string;
  classification: string;
  labels: string[];
  formulation: FormulaLine[];
  note?: string;
};

export type Medicine = {
  id: string;
  name: string;
  brand: string;
  sku: string;
  manufacturerId: string;
  manufacturer: string;
  dosageForm: DosageForm;
  documents: DocumentItem[];
  versions: MedicineVersion[];
  history: HistoryEntry[];
};

const triphala = (qty: string): FormulaLine[] => [
  { ingredient: "Haritaki", part: "Fruit rind", quantity: qty },
  { ingredient: "Vibhitaki", part: "Fruit rind", quantity: qty },
  { ingredient: "Amalaki", part: "Fruit rind", quantity: qty },
  { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
];

export const seedMedicines: Medicine[] = [
  {
    id: "MED-210",
    name: "Triphala Guggulu",
    brand: "Kottakkal",
    sku: "MV-TRP-30T",
    manufacturerId: "MFR-03",
    manufacturer: "Arya Vaidya Sala",
    dosageForm: "Tablet",
    documents: [
      { name: "Label artwork", submitted: "02 Jan 2025", version: 1 },
      { name: "Label artwork revision", submitted: "09 Oct 2026", version: 3 },
      { name: "Stability summary", submitted: "09 Oct 2026", version: 3 },
    ],
    versions: [
      {
        version: 1,
        status: "Approved",
        submitted: "02 Jan 2025",
        packSize: "30 tablets",
        classification: "Classical guggulu preparation",
        labels: ["For digestive support as directed by a practitioner"],
        formulation: triphala("1 part"),
      },
      {
        version: 2,
        status: "Approved",
        submitted: "18 Nov 2025",
        packSize: "30 tablets",
        classification: "Classical guggulu preparation",
        labels: ["For digestive support as directed by a practitioner"],
        formulation: triphala("1 part"),
        note: "Pack artwork refresh. Formula unchanged.",
      },
      {
        version: 3,
        status: "Pending Review",
        submitted: "09 Oct 2026",
        packSize: "60 tablets",
        classification: "Classical guggulu preparation",
        labels: ["Take as directed by a registered Ayurveda practitioner"],
        formulation: triphala("1.2 parts"),
        note: "Pack size and triphala ratio changed.",
      },
    ],
    history: [
      { at: "09 Oct 2026 10:12", text: "Version 3 submitted for review", by: "Priya Nambiar" },
      { at: "18 Nov 2025 15:00", text: "Version 2 approved", by: "Ananya Iyer" },
      { at: "02 Jan 2025 11:20", text: "Version 1 approved", by: "Ananya Iyer" },
    ],
  },
  {
    id: "MED-188",
    name: "Ashwagandha Churna",
    brand: "Himalaya",
    sku: "MV-ASH-100",
    manufacturerId: "MFR-07",
    manufacturer: "Himalaya Wellness",
    dosageForm: "Churna",
    documents: [{ name: "Label artwork", submitted: "04 Mar 2026", version: 2 }],
    versions: [
      {
        version: 1,
        status: "Approved",
        submitted: "12 Aug 2024",
        packSize: "60 g",
        classification: "Single-herb churna",
        labels: ["Withania somnifera root powder"],
        formulation: [{ ingredient: "Ashwagandha", part: "Root", quantity: "100%" }],
      },
      {
        version: 2,
        status: "Approved",
        submitted: "04 Mar 2026",
        packSize: "100 g",
        classification: "Single-herb churna",
        labels: ["Withania somnifera root powder"],
        formulation: [{ ingredient: "Ashwagandha", part: "Root", quantity: "100%" }],
      },
    ],
    history: [
      { at: "06 Mar 2026 09:40", text: "Version 2 approved", by: "Ananya Iyer" },
      { at: "12 Aug 2024 12:00", text: "Version 1 approved", by: "Ananya Iyer" },
    ],
  },
  {
    id: "MED-244",
    name: "Dashamoola Kwath",
    brand: "Sahyadri",
    sku: "MV-DSH-200",
    manufacturerId: "MFR-18",
    manufacturer: "Sahyadri Botanics",
    dosageForm: "Kwath",
    documents: [{ name: "Kwath process note", submitted: "06 Oct 2026", version: 1 }],
    versions: [
      {
        version: 1,
        status: "Under Review",
        submitted: "06 Oct 2026",
        packSize: "200 ml",
        classification: "Classical kwath",
        labels: ["Decoction of the ten roots"],
        formulation: [
          { ingredient: "Bilva", part: "Root", quantity: "1 part" },
          { ingredient: "Agnimantha", part: "Root", quantity: "1 part" },
          { ingredient: "Shyonaka", part: "Root", quantity: "1 part" },
          { ingredient: "Patala", part: "Root", quantity: "1 part" },
          { ingredient: "Gambhari", part: "Root", quantity: "1 part" },
        ],
      },
    ],
    history: [
      { at: "07 Oct 2026 11:00", text: "Review started", by: "Ananya Iyer" },
      { at: "06 Oct 2026 17:22", text: "Version 1 submitted", by: "Neha Krishnan" },
    ],
  },
  {
    id: "MED-251",
    name: "Brahmi Ghrita",
    brand: "Kerala Herbals",
    sku: "MV-BRH-150",
    manufacturerId: "MFR-09",
    manufacturer: "Kerala Herbals",
    dosageForm: "Ghrita",
    documents: [{ name: "Draft label", submitted: "13 Oct 2026", version: 1 }],
    versions: [
      {
        version: 1,
        status: "Draft",
        submitted: "13 Oct 2026",
        packSize: "150 g",
        classification: "Classical ghrita",
        labels: ["Draft label, not for release"],
        formulation: [
          { ingredient: "Brahmi", part: "Whole plant", quantity: "1 part" },
          { ingredient: "Go-ghrita", part: "Clarified butter", quantity: "4 parts" },
        ],
      },
    ],
    history: [{ at: "13 Oct 2026 08:50", text: "Draft created", by: "Ravi Menon" }],
  },
  {
    id: "MED-176",
    name: "Chandraprabha Vati",
    brand: "Dabur",
    sku: "MV-CHP-40T",
    manufacturerId: "MFR-31",
    manufacturer: "Dabur Ayurveda Unit",
    dosageForm: "Tablet",
    documents: [{ name: "Label artwork", submitted: "19 Aug 2026", version: 4 }],
    versions: [
      {
        version: 3,
        status: "Approved",
        submitted: "11 Jan 2026",
        packSize: "40 tablets",
        classification: "Classical vati",
        labels: ["Classical compound tablet"],
        formulation: [
          { ingredient: "Shilajatu", part: "Purified exudate", quantity: "1 part" },
          { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
        ],
      },
      {
        version: 4,
        status: "Changes Requested",
        submitted: "19 Aug 2026",
        packSize: "40 tablets",
        classification: "Classical vati",
        labels: ["Supports urinary comfort"],
        formulation: [
          { ingredient: "Shilajatu", part: "Purified exudate", quantity: "1 part" },
          { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
        ],
        note: "Remove the disease claim from the label.",
      },
    ],
    history: [
      {
        at: "22 Aug 2026 10:15",
        text: "Changes requested on version 4: remove the disease claim",
        by: "Ananya Iyer",
      },
      { at: "11 Jan 2026 16:30", text: "Version 3 approved", by: "Ananya Iyer" },
    ],
  },
  {
    id: "MED-142",
    name: "Ksheerabala Taila",
    brand: "Kottakkal",
    sku: "MV-KSB-100",
    manufacturerId: "MFR-03",
    manufacturer: "Arya Vaidya Sala",
    dosageForm: "Taila",
    documents: [{ name: "Label artwork", submitted: "03 Feb 2026", version: 1 }],
    versions: [
      {
        version: 1,
        status: "Rejected",
        submitted: "03 Feb 2026",
        packSize: "100 ml",
        classification: "Classical taila",
        labels: ["External and internal use"],
        formulation: [
          { ingredient: "Bala", part: "Root", quantity: "1 part" },
          { ingredient: "Ksheera", part: "Milk", quantity: "4 parts" },
          { ingredient: "Tila taila", part: "Sesame oil", quantity: "4 parts" },
        ],
        note: "Internal-use claim is not supported by the submitted label.",
      },
    ],
    history: [
      {
        at: "10 Feb 2026 12:05",
        text: "Version 1 rejected: internal-use claim is unsupported",
        by: "Ananya Iyer",
      },
      { at: "03 Feb 2026 09:18", text: "Version 1 submitted", by: "Priya Nambiar" },
    ],
  },
  {
    id: "MED-099",
    name: "Sitopaladi Churna",
    brand: "Himalaya",
    sku: "MV-SIT-50",
    manufacturerId: "MFR-07",
    manufacturer: "Himalaya Wellness",
    dosageForm: "Churna",
    documents: [{ name: "Archived label", submitted: "01 Dec 2023", version: 1 }],
    versions: [
      {
        version: 1,
        status: "Inactive",
        submitted: "01 Dec 2023",
        packSize: "50 g",
        classification: "Classical churna",
        labels: ["Catalogue entry withdrawn"],
        formulation: [
          { ingredient: "Mishri", part: "Sugar candy", quantity: "16 parts" },
          { ingredient: "Vanshalochana", part: "Inner culm", quantity: "8 parts" },
          { ingredient: "Pippali", part: "Fruit", quantity: "4 parts" },
          { ingredient: "Ela", part: "Seed", quantity: "2 parts" },
          { ingredient: "Tvak", part: "Bark", quantity: "1 part" },
        ],
      },
    ],
    history: [
      {
        at: "15 Jan 2026 10:00",
        text: "Marked inactive. Approved history kept.",
        by: "Ananya Iyer",
      },
    ],
  },
  {
    id: "MED-230",
    name: "Yogaraja Guggulu",
    brand: "Sahyadri",
    sku: "MV-YOG-30T",
    manufacturerId: "MFR-18",
    manufacturer: "Sahyadri Botanics",
    dosageForm: "Tablet",
    documents: [{ name: "Formula sheet", submitted: "05 Oct 2026", version: 1 }],
    versions: [
      {
        version: 1,
        status: "Pending Review",
        submitted: "05 Oct 2026",
        packSize: "30 tablets",
        classification: "Classical guggulu preparation",
        labels: ["Classical compound. Practitioner directed."],
        formulation: [
          { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
          { ingredient: "Triphala", part: "Fruit rind", quantity: "1 part" },
          { ingredient: "Trikatu", part: "Fruit", quantity: "1 part" },
        ],
      },
    ],
    history: [{ at: "05 Oct 2026 13:40", text: "Version 1 submitted", by: "Neha Krishnan" }],
  },
];

export function latestVersion(medicine: Medicine): MedicineVersion {
  const version = medicine.versions[medicine.versions.length - 1];
  if (!version) throw new Error(`Medicine ${medicine.id} has no versions.`);
  return version;
}
