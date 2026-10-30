import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Building,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FilePenLine,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  Layers2,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Network,
  Pause,
  Phone,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  Video,
  X,
  Scale,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/services/apiClient";
import { setStoredToken } from "@/lib/api";
import { validateIndianMobile, validateAuthenticEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import practitionerImage from "@/assets/Practitioner.png";
import mentorshipImage from "@/assets/meyveda-mentorship.jpg";
import juniorDoctorImage from "@/assets/meyveda-doctor-hero.jpg";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import justMeyvedaLogo from "@/assets/just_meyveda.png";
import justMeyvedDownLogo from "@/assets/just_meyved_down.png";
import rishiVideo from "@/assets/Rishi.mp4";
import stage1Image from "@/assets/1.png";
import stage2Image from "@/assets/2.png";
import stage3Image from "@/assets/3.png";
import stage4Image from "@/assets/4.png";
import stage5Image from "@/assets/5.png";
import treePng from "@/assets/tree.png";
import { ClusterFranchiseePartnerSection } from "../components/ClusterFranchiseePartnerSection";

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS & DATA                            */
/* -------------------------------------------------------------------------- */

const navigation = [
  { label: "For Doctors", href: "#top" },
  { label: "About us", href: "/about" },
  { label: "Public relation", href: "#public-relation" },
  { label: "Contact us", href: "/contact" },
  { label: "Blogs", href: "#blogs" },
];

const AYUSH_SYSTEMS = [
  {
    name: "Ayurveda",
    icon: (
      <svg
        className="size-5 sm:size-6 text-[#E67230]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Leaf / Herb doodle */}
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    name: "Naturopathy",
    icon: (
      <svg
        className="size-5 sm:size-6 text-[#E67230]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Sun & Water Wave nature doodle */}
        <circle cx="12" cy="9" r="4" />
        <path d="M12 2v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
        <path d="M2 18c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      </svg>
    ),
  },
  {
    name: "Unani",
    icon: (
      <svg
        className="size-5 sm:size-6 text-[#E67230]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Mortar, pestle & flower botanical doodle */}
        <path d="M4 14a8 8 0 0 0 16 0H4Z" />
        <path d="M15 4l-4 6" />
        <path d="M8 20h8" />
      </svg>
    ),
  },
  {
    name: "Siddha",
    icon: (
      <svg
        className="size-5 sm:size-6 text-[#E67230]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Traditional medicinal flask / Kalasha doodle */}
        <path d="M10 2h4" />
        <path d="M12 2v4" />
        <path d="M8.5 7.5a6.5 6.5 0 1 0 7 0L14 6H10l-1.5 1.5Z" />
        <circle cx="12" cy="14" r="2" />
      </svg>
    ),
  },
  {
    name: "Homoeopathy",
    icon: (
      <svg
        className="size-5 sm:size-6 text-[#E67230]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Potentised medicine droplet / phial doodle */}
        <path d="M12 3a6 6 0 0 0 6 6c0 4-3 8-6 12-3-4-6-8-6-12a6 6 0 0 0 6-6Z" />
        <circle cx="12" cy="9" r="1.5" />
      </svg>
    ),
  },
];

const carouselFeatures = [
  {
    number: "01",
    tag: "Available",
    title: "Knowledge Library & Updates",
    description: "Keep the original source close to every question.",
    referenceDetail: "Classical texts · Verses · Source updates",
    href: "#knowledge",
    icon: BookOpen,
    ctaText: "Explore Library",
    illustrationType: "library",
  },
  {
    number: "02",
    tag: "Planned",
    title: "Journals & Publications",
    description: "Bring research into your ongoing professional learning.",
    referenceDetail: "Peer review · Clinical studies · Citations",
    href: "#journals",
    icon: FileText,
    ctaText: "View Publications",
    illustrationType: "journals",
  },
  {
    number: "03",
    tag: "Profile available",
    title: "Professional Profile Management",
    description: "Build a professional identity, sharable to the Vaidya Forum.",
    referenceDetail: "Verified credentials · Vaidya Forum · Public ID",
    href: "#profile",
    icon: UserRound,
    ctaText: "Manage Profile",
    illustrationType: "profile",
  },
  {
    number: "04",
    tag: "Preview",
    title: "Interactive Medicine Catalogue",
    description: "Explore medicines with clearer sourcing and reference context.",
    referenceDetail: "Formulations · Dravya sourcing · Dosage specs",
    href: "#find-medicines",
    icon: Search,
    ctaText: "Browse Catalogue",
    illustrationType: "medicines",
  },
  {
    number: "05",
    tag: "Planned",
    title: "HRMS & Hiring Tools",
    description: "Spend less time coordinating teams and more time delivering care.",
    referenceDetail: "Team rosters · Practitioner hiring · Scheduling",
    href: "#hrms",
    icon: UsersRound,
    ctaText: "Learn More",
    illustrationType: "hrms",
  },
  {
    number: "06",
    tag: "Planned",
    title: "Compliances Management Dashboard",
    description: "Keep important practice obligations visible in one place.",
    referenceDetail: "Obligations registry · Audit trails · Verification",
    href: "#compliance",
    icon: ShieldCheck,
    ctaText: "Learn More",
    illustrationType: "compliance",
  },
];

const journeyStages = [
  {
    number: "01",
    label: "Meet",
    subtitle: "Appointments & daily practice",
    title: "Start the day with your practice in view.",
    description:
      "Review your appointments, availability and upcoming consultations in one place, so the day begins with a clear view of what needs your attention.",
    image: stage1Image,
    clinicalBadge: "Appointments & Daily Practice",
    highlights: [
      "Appointments and calendar",
      "Availability and consultation schedule",
      "Upcoming consultations",
    ],
    icon: CalendarDays,
  },
  {
    number: "02",
    label: "Understand",
    subtitle: "Clinical cases & history",
    title: "Bring the case together before you decide.",
    description:
      "Review the patient's case, previous encounters, clinical notes and relevant history in one connected clinical record.",
    image: stage2Image,
    clinicalBadge: "Clinical Cases & History",
    highlights: [
      "Clinical case history",
      "Previous encounters",
      "Clinical notes",
      "Follow-up context",
    ],
    icon: BookOpen,
  },
  {
    number: "03",
    label: "Decide",
    subtitle: "AYUSH assessment & clinical judgement",
    title: "Bring assessment and clinical judgement together.",
    description:
      "Record the AYUSH clinical assessment and organise the information you need to make informed decisions for the case.",
    image: stage3Image,
    clinicalBadge: "AYUSH Assessment & Clinical Judgement",
    highlights: [
      "AYUSH clinical assessment",
      "Diagnosis coding",
      "Practitioner-led clinical decisions",
    ],
    icon: ClipboardCheck,
  },
  {
    number: "04",
    label: "Prescribe",
    subtitle: "Electronic prescriptions",
    title: "Turn your clinical decision into a clear prescription.",
    description:
      "Create and manage structured electronic prescriptions as part of the patient's clinical journey, with prescription history kept connected to the case.",
    image: stage4Image,
    clinicalBadge: "Structured Electronic Prescriptions",
    highlights: [
      "Electronic prescriptions",
      "Prescription items",
      "Prescription versions",
      "Connected clinical record",
    ],
    icon: FilePenLine,
  },
  {
    number: "05",
    label: "Follow",
    subtitle: "Follow-ups & ongoing care",
    title: "Keep the clinical journey moving forward.",
    description:
      "Continue the relationship beyond the consultation with follow-ups, ongoing case management and connected communication.",
    image: stage5Image,
    clinicalBadge: "Follow-Ups & Ongoing Care",
    highlights: [
      "Follow-up management",
      "Ongoing case history",
      "Patient communication",
      "Continued clinical documentation",
    ],
    icon: HeartHandshake,
  },
];

const workspaceFeatures = [
  {
    number: "01",
    title: "Appointments & Calendar",
    description: "Keep consultations, availability and follow-ups organised around your practice.",
    icon: CalendarDays,
  },
  {
    number: "02",
    title: "Clinical Cases",
    description: "Keep the patient's clinical journey connected across encounters and follow-ups.",
    icon: ClipboardList,
  },
  {
    number: "03",
    title: "AYUSH Assessment",
    description: "Capture the observations and assessments that shape your clinical thinking.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Digital Prescriptions",
    description: "Create structured prescriptions that reflect your treatment decisions.",
    icon: FilePenLine,
  },
  {
    number: "05",
    title: "Patient Communication",
    description: "Continue necessary clinical conversations beyond the consultation.",
    icon: MessageCircle,
  },
  {
    number: "06",
    title: "Clinical Knowledge",
    description:
      "Search across AYUSH literature, formulations, concepts, therapies and research.",
    icon: BookOpen,
  },
];

const practiceSettings = [
  {
    title: "Independent Private Clinic",
    description:
      "Run your solo consulting practice with patient queues, digital records, and inventory clarity.",
    icon: Stethoscope,
    badge: "Solo Practice",
  },
  {
    title: "Hospital / Institutional AYUSH",
    description:
      "Integrate OPD/IPD consultations, case handovers, and department-wide clinical documentation.",
    icon: Building,
    badge: "Institutional",
  },
  {
    title: "Panchakarma & Therapy Center",
    description:
      "Schedule therapies, track snehana/swedana sessions, and monitor treatment milestone progress.",
    icon: Activity,
    badge: "Therapy Centers",
  },
  {
    title: "Multi-Location & Telepractice",
    description:
      "Practice seamlessly across multiple physical consulting chambers and secure remote consultations.",
    icon: Network,
    badge: "Multi-Facility",
  },
];

const calendarDays = [
  { day: "M", date: "14", weekday: "Monday" },
  { day: "T", date: "15", weekday: "Tuesday" },
  { day: "W", date: "16", weekday: "Wednesday" },
  { day: "T", date: "17", weekday: "Thursday", selected: true },
  { day: "F", date: "18", weekday: "Friday" },
  { day: "S", date: "19", weekday: "Saturday" },
  { day: "S", date: "20", weekday: "Sunday" },
];

const workspaceNavTabs = [
  { id: "overview", label: "Overview", icon: Layers2 },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "cases", label: "Clinical Cases", icon: ClipboardList },
  { id: "prescriptions", label: "Prescriptions", icon: FilePenLine },
  { id: "communication", label: "Communication", icon: MessageCircle },
  { id: "mentorship", label: "Guru-Shishya", icon: GraduationCap },
  { id: "revenue", label: "Revenue & Payouts", icon: CreditCard },
] as const;

type WorkspaceTabId = (typeof workspaceNavTabs)[number]["id"];

const clinicalAssessmentData = {
  patient: "Ananya Deshmukh",
  caseId: "1184",
  ageGender: "34y · Female",
  consultationType: "In-Person Clinic · Encounter #3",
  ashtavidhaPariksha: [
    { label: "Nadi (Pulse)", value: "Mandaagni, Vata-Pitta dominant", status: "Ama lakshana" },
    { label: "Mutra (Urine)", value: "Alpa-Peeta, Avila", status: "Normal frequency" },
    { label: "Mala (Bowel)", value: "Krura Kostha, Vibandha", status: "Sama Pravritti" },
    { label: "Jihwa (Tongue)", value: "Saama (White coating present)", status: "Agni sluggish" },
    { label: "Shabda (Voice)", value: "Prakruta (Clear)", status: "Normal" },
    { label: "Sparsha (Skin)", value: "Ruksha, Sheeta (Dry, Cold)", status: "Vata Vriddhi" },
    { label: "Druk (Eyes)", value: "Prakruta, Alpa-Rukshata", status: "Normal" },
    { label: "Akruti (Gait)", value: "Morning stiffness, antalgic", status: "Sandhishoola" },
  ],
  sampraptiGhataka: {
    dosha: "Vata (Vyana & Apana) + Kapha (Shleshaka)",
    dushya: "Rasa, Asthi, Sandhi Snayu",
    agni: "Mandaagni with Jataragni Mandya",
    srotas: "Rasavaha, Asthivaha",
    srotodushti: "Sanga (Obstruction due to Ama)",
    adhishthana: "Janu & Manibandha Sandhi (Knees & Wrists)",
    vyadhi: "Amavata (Sama Vata Stage)",
  },
  doctorObservations:
    "Patient exhibits significant improvement in morning stiffness (down from 45 min to 15 min after 10 days of Deepana-Pachana). Jihwa coating is clearing. Recommend continuing Shamana Chikitsa with classical formulations before initiating any Basti therapy.",
};

const knowledgeSearchItems = [
  {
    category: "Classical Literature",
    title: "Charaka Samhita · Chikitsa Sthana",
    subtitle: "Adhyaya 15 · Grahani Chikitsa",
    excerpt:
      "Detailed classical principles of Agni, Ama pathogenesis, and Deepana-Pachana protocol formulation.",
    tag: "Primary Samhita Source",
  },
  {
    category: "Concepts",
    title: "Ama Pathogenesis & Srotorodha",
    subtitle: "Doshic interaction with unassimilated metabolic byproducts",
    excerpt:
      "Sama vs Niraama differentiation across Ashtavidha Pariksha markers in joint disorders.",
    tag: "Clinical Concept",
  },
  {
    category: "Dravya",
    title: "Ashwagandha (Withania somnifera)",
    subtitle: "Bhavaprakasha Nighantu · Haritakyadi Varga",
    excerpt:
      "Tikta, Kashaya, Madhura rasa · Ushna virya · Madhura vipaka · Balya, Rasayana, Vata-Kaphahara.",
    tag: "Pharmacology & Rasapanchaka",
  },
  {
    category: "Formulations",
    title: "Dashamoolarishta",
    subtitle: "Sharangadhara Samhita · Madhyama Khanda",
    excerpt:
      "Classical Sandhana Kalpana indicated in Vata Vyadhi, Sutika Roga, Grahani, and Deepana.",
    tag: "Classical Yoga",
  },
  {
    category: "Research",
    title: "Clinical Evaluation of Deepana-Pachana Protocol",
    subtitle: "Journal of AYUSH Clinical Research (2024)",
    excerpt:
      "Controlled cohort assessment on morning stiffness and ESR reduction in classical Amavata management.",
    tag: "Peer-Reviewed Study",
  },
  {
    category: "Therapies",
    title: "Baluka Swedana Protocol",
    subtitle: "Ruksha Sweda for Sama Sandhishoola",
    excerpt:
      "Clinical indication in acute Amavata before Snigdha Swedana or Abhyanga is attempted.",
    tag: "Panchakarma Upakarma",
  },
];

const appointmentsData = [
  {
    time: "09:30 AM",
    patient: "Ananya Deshmukh",
    type: "Follow-up Consultation",
    mode: "In-Person Clinic",
    prakriti: "Vata-Pitta",
    condition: "Amavata / Joint Stiffness",
    status: "Checked In",
    statusColor: "bg-[#F47C0B] text-white",
  },
  {
    time: "10:15 AM",
    patient: "Mahesh Kulkarni",
    type: "Review & Titration",
    mode: "In-Person Clinic",
    prakriti: "Kapha-Vata",
    condition: "Prameha & Medoroga",
    status: "Waiting in OPD",
    statusColor: "bg-[#FAF9F6] text-[#6B6B6B] border border-[#EBE7DF]",
  },
  {
    time: "11:00 AM",
    patient: "Rajesh Varma",
    type: "New Consultation",
    mode: "Video Consultation",
    prakriti: "Pitta-Kapha",
    condition: "Amlapitta & Digestive Health",
    status: "Upcoming (11:00 AM)",
    statusColor: "bg-[#FAF9F6] text-[#F47C0B] border border-[#F47C0B]/30 font-bold",
  },
  {
    time: "12:00 PM",
    patient: "Sunita Nair",
    type: "Progress Check",
    mode: "In-Person Clinic",
    prakriti: "Pitta-Vata",
    condition: "Twak Vikara Follow-up",
    status: "Confirmed",
    statusColor: "bg-[#FAF9F6] text-[#6B6B6B] border border-[#EBE7DF]",
  },
  {
    time: "12:45 PM",
    patient: "Priyadarshini K.",
    type: "Case Review",
    mode: "In-Person Clinic",
    prakriti: "Kapha-Vata",
    condition: "Rasayana Protocol Progress",
    status: "Scheduled",
    statusColor: "bg-[#FAF9F6] text-[#6B6B6B] border border-[#EBE7DF]",
  },
];

const clinicalCasesData = [
  {
    id: "1184",
    patient: "Ananya Deshmukh",
    age: "34y · Female",
    prakriti: "Vata-Pitta",
    condition: "Amavata / Sandhishoola",
    encounters: 3,
    status: "In Treatment · Shamana",
    lastSeen: "3 days ago",
    nadi: "Mandaagni, Vata-Pitta",
    agni: "Mandaagni (Ama)",
    kostha: "Krura",
    jihwa: "Saama (Coated)",
    progress:
      "Morning stiffness reduced from 45 min to 15 min. Agni stabilized with Deepana-Pachana.",
  },
  {
    id: "1192",
    patient: "Rajesh Varma",
    age: "41y · Male",
    prakriti: "Pitta-Kapha",
    condition: "Amlapitta & Digestive Health",
    encounters: 1,
    status: "Deepana-Pachana Phase",
    lastSeen: "7 days ago",
    nadi: "Teekshnagni, Pitta",
    agni: "Vishama / Teekshna",
    kostha: "Madhyama",
    jihwa: "Niraama",
    progress: "Heartburn episodes down 60%. Dietary Pathya strictly adhered to.",
  },
  {
    id: "1178",
    patient: "Mahesh Kulkarni",
    age: "48y · Male",
    prakriti: "Kapha-Vata",
    condition: "Prameha & Medoroga",
    encounters: 4,
    status: "Ahara & Aushadha Titration",
    lastSeen: "12 days ago",
    nadi: "Manda, Kapha",
    agni: "Mandaagni",
    kostha: "Mrudu",
    jihwa: "Alpa-Saama",
    progress: "Fasting blood sugar stabilized. Weight reduced by 1.8 kg over 4 weeks.",
  },
  {
    id: "1165",
    patient: "Priyadarshini K.",
    age: "38y · Female",
    prakriti: "Kapha-Vata",
    condition: "Dhatu Kshaya / Rasayana",
    encounters: 2,
    status: "Rasayana Phase 2",
    lastSeen: "18 days ago",
    nadi: "Pravrutta, Sama",
    agni: "Sama Agni",
    kostha: "Madhyama",
    jihwa: "Niraama",
    progress: "Bala and Ojas enhanced. Sleep quality significantly improved.",
  },
];

const prescriptionDraftData = {
  id: "#0284",
  version: "v1.2",
  patient: "Ananya Deshmukh",
  age: "34y / Female",
  diagnosis: "Amavata (Sama Vata Stage)",
  date: "17 Oct 2026",
  medicines: [
    {
      name: "Ashwagandha Churna",
      type: "Classical Churna",
      dose: "3g",
      timing: "BD after food",
      anupana: "Warm Ksheera (Cow Milk) or lukewarm water",
      duration: "30 Days",
    },
    {
      name: "Dashamoolarishta",
      type: "Classical Sandhana Kalpana",
      dose: "20ml",
      timing: "BD after food",
      anupana: "Equal quantity (20ml) warm water",
      duration: "30 Days",
    },
    {
      name: "Mahasudarshan Vati",
      type: "Classical Vati Kalpana",
      dose: "1 tab (500mg)",
      timing: "BD before meals",
      anupana: "Lukewarm water",
      duration: "15 Days",
    },
    {
      name: "Mahanarayana Taila",
      type: "Bahya Chikitsa (External Oil)",
      dose: "External Application",
      timing: "Morning before warm bath",
      anupana: "Gentle Abhyanga on affected joints",
      duration: "Daily",
    },
  ],
  pathya:
    "Shashtika shali, mudga yusha, warm water, cooked vegetables, light digestive spices (jeeraka, shunti).",
  apathya:
    "Dadhi (curd), cold beverages, deep-fried food, daytime sleep (divaswapna), exposure to cold wind.",
};

const communicationThreads = [
  {
    id: "c1",
    patient: "Ananya Deshmukh",
    time: "10:15 AM",
    preview: "Namaste Doctor, the morning stiffness is much less today...",
    unread: true,
    condition: "Amavata Care",
    messages: [
      {
        sender: "patient",
        time: "10:15 AM",
        text: "Namaste Dr. Suniti, following your advice the morning joint stiffness has come down to about 15 minutes. Digestion also feels lighter. Should I take the Ashwagandha with warm milk or plain warm water if milk causes heaviness?",
      },
      {
        sender: "doctor",
        time: "10:28 AM",
        text: "Namaste Ananya. Glad to hear the Ama is clearing. If milk feels heavy, take it with warm water and a pinch of dry ginger (Shunti churna) after dinner. Keep up the warm water intake.",
      },
    ],
  },
  {
    id: "c2",
    patient: "Rajesh Varma",
    time: "09:40 AM",
    preview: "Confirming our 11:00 AM video call link. Have endoscopy report ready...",
    unread: true,
    condition: "Amlapitta Consultation",
  },
  {
    id: "c3",
    patient: "Priyadarshini K.",
    time: "Yesterday",
    preview: "Regarding diet: is warm mung soup suitable for dinner during travel?",
    unread: false,
    condition: "Rasayana Protocol",
  },
];

const guruShishyaData = {
  mentee: "Dr. Suniti Sharma, BAMS, MD (Ayu)",
  mentor: "Dr. K. R. Namboodiri, Senior Vaidya",
  mentorTitle: "Senior Vaidya · 38 Years Clinical Experience",
  tradition: "Kottakkal Clinical Lineage & Charaka Tradition",
  caseTitle: "Case Discussion #1184 — Recurrent Sama Vata in Amavata",
  consentStatus: "Patient Consent Verified for Clinical Mentorship · Identifiers Redacted",
  menteeQuery:
    "Revered Vaidyaji, the patient presented with acute morning stiffness and Sama lakshana. Langhana and Deepana-Pachana with Shunti-Guduchi resolved initial Ama. Seeking your guidance on initiating Baluka Swedana before Matra Basti in this Kostha presentation.",
  mentorGuidance:
    "Ayushman Suniti, your assessment of Sama Vata is precise. Because the Kostha is Krura and Agni is stabilizing, Baluka Swedana for 5 days is appropriate. For Matra Basti, prefer Brihat Saindhavadya Taila over plain Tila Taila to prevent Vata-Pitta aggravation. Continue monitoring Jihwa daily.",
  stats: {
    hoursLogged: "42 hrs",
    casesReviewed: "16 Cases",
    cpdCredits: "AYUSH Certified",
  },
};

const settlementsData = {
  currentCycle: "01 Oct – 15 Oct 2026",
  nextPayout: "21 Oct 2026",
  totalEarnings: "₹48,500",
  inPersonEarnings: "₹42,000",
  inPersonVisits: "48 visits",
  videoEarnings: "₹6,500",
  videoVisits: "13 sessions",
  history: [
    {
      date: "15 Oct 2026",
      period: "01 Oct – 15 Oct",
      amount: "₹48,500",
      status: "Processing (Payout Oct 21)",
      bank: "HDFC Bank ****4920",
    },
    {
      date: "30 Sep 2026",
      period: "16 Sep – 30 Sep",
      amount: "₹54,200",
      status: "Settled / Paid",
      bank: "HDFC Bank ****4920",
    },
    {
      date: "15 Sep 2026",
      period: "01 Sep – 15 Sep",
      amount: "₹46,800",
      status: "Settled / Paid",
      bank: "HDFC Bank ****4920",
    },
  ],
};

const knowledgeCategories = [
  {
    id: "dravya",
    label: "Dravya & Pharmacology",
    subtitle: "Herbs, Minerals & Rasapanchaka",
    icon: Sparkles,
    query: "Ashwagandha (Withania somnifera)",
    sampleItem: {
      sanskrit: "अश्वगन्धा (Withania somnifera)",
      botanical: "Withania somnifera (L.) Dunal · Solanaceae",
      rasapanchaka: {
        rasa: "Tikta, Kashaya, Madhura",
        guna: "Laghu, Snigdha",
        virya: "Ushna (Hot)",
        vipaka: "Madhura (Sweet post-digestive)",
      },
      karma: "Vata-Kaphahara, Balya, Rasayana, Medhya, Shothahara",
      indications: "Kshaya, Daurbalya, Vata Vyadhi, Klaibya, Shotha",
      classicalRef: "Bhavaprakasha Nighantu · Haritakyadi Varga",
      dosage: "3–6g churna daily with Ksheera (Warm Milk) or Ghrita",
    },
  },
  {
    id: "formulations",
    label: "Classical Formulations",
    subtitle: "Yogas, Kwathas, Asavas & Vatis",
    icon: FilePenLine,
    query: "Dashamoolarishta",
    sampleItem: {
      sanskrit: "दशमूलारिष्ट (Dashamoolarishta)",
      botanical: "Classical Sandhana Kalpana (Fermented Arishta)",
      rasapanchaka: {
        rasa: "Tikta, Kashaya, Madhura",
        guna: "Laghu, Ushna, Teekshna",
        virya: "Ushna",
        vipaka: "Katu",
      },
      karma: "Tridoshaghna (Pradhana Vatahara), Deepana, Pachana, Srotoshodhaka",
      indications: "Sutika Roga, Vata Vyadhi, Grahani, Shwasa, Kasa, Daurbalya",
      classicalRef: "Sharangadhara Samhita · Madhyama Khanda 10/78-92",
      dosage: "15–25 ml with equal quantity of warm water after meals",
    },
  },
  {
    id: "classics",
    label: "Classical Literature",
    subtitle: "Brihat Trayi & Laghu Trayi Texts",
    icon: BookOpen,
    query: "Charaka Samhita · Sutrasthana",
    sampleItem: {
      sanskrit: "चरकसंहिता · सूत्रस्थानम् (Dirghanjivitiya Adhyaya)",
      botanical: "Foundational Classical Treatise",
      rasapanchaka: {
        rasa: "Siddhanta",
        guna: "Tridosha Siddhanta",
        virya: "Hetu-Linga-Aushadha",
        vipaka: "Dhatu Samya",
      },
      karma: "Sarva Roga Prashamana · Swasthasya Swasthya Rakshanam",
      indications: "Clinical epistemology, diagnostic framework, ethics of physician",
      classicalRef: "Charaka Samhita · Sutrasthana 1/41-43",
      dosage: "Trisutra Ayurveda: Etiology (Hetu), Symptom (Linga), Therapy (Aushadha)",
    },
  },
  {
    id: "concepts",
    label: "AYUSH Concepts",
    subtitle: "Nidana, Agni, Srotas & Dhatu",
    icon: Layers2,
    query: "Agni Dushti & Ama Samprapti",
    sampleItem: {
      sanskrit: "अग्निमान्द्य एवं आम सम्प्राप्ति",
      botanical: "Pathological Assessment Framework",
      rasapanchaka: {
        rasa: "Jatharagni / Dhatvagni",
        guna: "Guru, Snigdha, Pichhila (Ama)",
        virya: "Sheeta",
        vipaka: "Avipakva",
      },
      karma: "Deepana-Pachana chikitsa sutra before samshodhana or rasayana",
      indications: "Metabolic impairment, auto-immune conditions, inflammatory cascades",
      classicalRef: "Ashtanga Hridaya · Sutrasthana Chapter 13",
      dosage: "Evaluate Langhana, Pachana, and Doshavasechana stages",
    },
  },
  {
    id: "research",
    label: "Research & Evidence",
    subtitle: "Contemporary Studies & Monographs",
    icon: Award,
    query: "Standardized Withanolide Pharmacokinetics",
    sampleItem: {
      sanskrit: "Clinical Pharmacological Correlation",
      botanical: "Peer-Reviewed Systematic Research Monograph",
      rasapanchaka: {
        rasa: "Bioactive Withanolides",
        guna: "Cortisol Modulation",
        virya: "GABAergic Activity",
        vipaka: "Neuroprotective",
      },
      karma: "Longitudinal HPA-axis regulation & clinical cognitive stress recovery",
      indications: "Contemporary clinical evidence supporting classical Rasayana indications",
      classicalRef: "Journal of Ethnopharmacology Monograph",
      dosage: "Verified evidence bridge preserving classical treatment autonomy",
    },
  },
  {
    id: "therapies",
    label: "Therapies & Panchakarma",
    subtitle: "Snehana, Swedana, Shodhana & Upakarma",
    icon: Activity,
    query: "Virechana Karma Clinical Protocol",
    sampleItem: {
      sanskrit: "विरेचन कर्म विधि (Virechana Karma)",
      botanical: "Pradhana Shodhana for Pitta & Rakta Dushti",
      rasapanchaka: {
        rasa: "Deepana-Pachana",
        guna: "Snehapana (Accha Sneha)",
        virya: "Swedana",
        vipaka: "Samsarjana Krama",
      },
      karma: "Koshta Shuddhi, Pitta Shamana, Dhatu Prasanna, Indriya Prasadana",
      indications: "Kushtha, Raktapitta, Kamala, Amavata, Prameha Upadrava",
      classicalRef: "Sushruta Samhita · Chikitsasthana Chapter 33",
      dosage: "Monitored multi-day clinical stages: Purva, Pradhana, Paschat Karma",
    },
  },
];

const contributionPillars = [
  {
    num: "01",
    tag: "DOCUMENT",
    title: "Clinical Case Studies",
    desc: "Standardized before-and-after outcome documentation, pulse progression records, and recovery milestones.",
    icon: BookOpen,
  },
  {
    num: "02",
    tag: "SHARE",
    title: "Practical Formulation Notes",
    desc: "Real-world observations on dosage adjustments, anupana variations, and patient constitutional responses.",
    icon: FilePenLine,
  },
  {
    num: "03",
    tag: "ENGAGE",
    title: "Peer Clinical Discourse",
    desc: "Constructive case discussions with verified fellow Vaidyas on challenging or atypical presentations.",
    icon: MessageCircle,
  },
];

const corePrinciples = [
  {
    num: "01",
    tag: "CLINICAL",
    title: "Built around your clinical workflow",
    desc: "Designed around the authentic rhythm of an AYUSH consultation, preserving your clinical intuition and diagnostic autonomy.",
  },
  {
    num: "02",
    tag: "CONNECTED",
    title: "The parts of practice belong together",
    desc: "Preparation, consultation, Nadi assessment, classical formulations, and follow-ups stay in one continuous longitudinal thread.",
  },
  {
    num: "03",
    tag: "KNOWLEDGE",
    title: "Classical wisdom within reach",
    desc: "Classical literature, dravya pharmacology, and contemporary clinical studies remain accessible right when clinical decisions are made.",
  },
  {
    num: "04",
    tag: "PROFESSIONAL",
    title: "Your identity across every setting",
    desc: "Your verified credential, peer mentorship circles, case contributions, and practice records belong to you across every chamber and facility.",
  },
];

/* -------------------------------------------------------------------------- */
/*                                ROUTE DEFINITION                            */
/* -------------------------------------------------------------------------- */

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meyveda | Ancient Wisdom. Clearer Evidence. Deeper Discovery." },
      {
        name: "description",
        content:
          "A more connected way to explore classical AYUSH, discover medicines, examine quality evidence, and build your own clinical research library.",
      },
      { property: "og:title", content: "Meyveda | For AYUSH Doctors" },
      {
        property: "og:description",
        content: "Ancient Wisdom. Clearer Evidence. Deeper Discovery. Join Meyveda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeyvedaDoctorsPage,
});

/* -------------------------------------------------------------------------- */
/*                                LOGO COMPONENT                              */
/* -------------------------------------------------------------------------- */

function MeyvedaLogo({
  className = "",
  variant = "navbar",
  compact = false,
}: {
  className?: string;
  variant?: "navbar" | "footer" | "cta" | "modal" | "custom";
  compact?: boolean;
}) {
  const activeVariant = compact ? "modal" : variant;
  const sizeClasses = {
    navbar: "h-10 sm:h-12 lg:h-[52px] w-auto",
    footer: "h-11 sm:h-13 lg:h-[54px] w-auto",
    cta: "h-11 sm:h-13 lg:h-[54px] w-auto",
    modal: "h-8 sm:h-9 w-auto",
    custom: "",
  }[activeVariant];

  return (
    <img
      src={meyvedaLogo}
      alt="Meyveda — reinvent you"
      width={1755}
      height={492}
      className={`block shrink-0 object-contain select-none transition-opacity hover:opacity-95 ${sizeClasses} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                3D / ORGANIC FLOW CANVAS                     */
/* -------------------------------------------------------------------------- */

function InfinityFlowCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.38;

      if (!prefersReducedMotion) {
        angle += 0.008;
      }

      // Draw subtle background glowing radial
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, scale * 1.5);
      bgGrad.addColorStop(0, "rgba(244, 124, 11, 0.08)");
      bgGrad.addColorStop(0.7, "rgba(250, 249, 246, 0.02)");
      bgGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw 3D lemniscate loop
      const points: { x: number; y: number; z: number; t: number }[] = [];
      const totalSteps = 140;

      for (let i = 0; i <= totalSteps; i++) {
        const t = (i / totalSteps) * Math.PI * 2;
        // Lemniscate of Bernoulli parametric
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const xRaw = (scale * Math.cos(t)) / denom;
        const yRaw = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const zRaw = Math.sin(t * 2 + angle * 2) * (scale * 0.35);

        // 3D rotation around Y and subtle X tilt
        const rotY = angle;
        const tiltX = 0.35;

        // Rotate Y
        const xRot = xRaw * Math.cos(rotY) - zRaw * Math.sin(rotY);
        const zRot = xRaw * Math.sin(rotY) + zRaw * Math.cos(rotY);

        // Rotate X
        const yRot = yRaw * Math.cos(tiltX) - zRot * Math.sin(tiltX);
        const zFinal = yRaw * Math.sin(tiltX) + zRot * Math.cos(tiltX);

        // Perspective projection
        const fov = 400;
        const pScale = fov / (fov + zFinal);
        const px = cx + xRot * pScale;
        const py = cy + yRot * pScale;

        points.push({ x: px, y: py, z: zFinal, t });
      }

      // Sort segments by depth or render multi-layer ribbon
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (!p1 || !p2) continue;

        const alpha = Math.max(0.18, Math.min(0.9, (p1.z + scale * 0.5) / scale));
        ctx.strokeStyle = `rgba(244, 124, 11, ${alpha})`;
        ctx.lineWidth = Math.max(1.8, (p1.z + scale * 0.5) * 0.02 + 2);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw floating pulse nodes along the ribbon
      for (let k = 0; k < 4; k++) {
        const pulseT = (angle * 1.5 + (k * Math.PI) / 2) % (Math.PI * 2);
        const index = Math.floor((pulseT / (Math.PI * 2)) * totalSteps) % totalSteps;
        const node = points[index];
        if (node) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#F47C0B";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(244, 124, 11, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                DECORATIVE MOTIF                            */
/* -------------------------------------------------------------------------- */

function MeyvedaInfinityWave({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none opacity-40 overflow-hidden ${className}`}
    >
      <svg
        width="600"
        height="220"
        viewBox="0 0 600 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 110C90 30 180 30 250 110C320 190 410 190 480 110C530 50 580 80 600 110"
          stroke="#F47C0B"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeOpacity="0.35"
        />
        <path
          d="M0 130C100 60 170 50 260 130C340 210 430 200 520 130C560 90 600 100 620 120"
          stroke="#EBE7DF"
          strokeWidth="1.2"
        />
        <circle cx="250" cy="110" r="4" fill="#F47C0B" fillOpacity="0.4" />
        <circle cx="480" cy="110" r="3" fill="#F47C0B" fillOpacity="0.3" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                BUTTONS & CTAS                              */
/* -------------------------------------------------------------------------- */

function RegisterPrimaryButton({
  children = "Register",
  className = "",
  size = "default",
  onClick,
  disabled = false,
  type,
}: {
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const sizeClasses = {
    sm: "h-9 px-4 text-xs font-bold",
    default: "h-11 px-5 text-sm font-bold sm:h-12 sm:px-6 sm:text-sm",
    lg: "h-13 px-7 text-base font-bold sm:h-14 sm:px-8 sm:text-base",
  }[size];

  return (
    <Button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-md bg-[#E67230] text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 active:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
    >
      <span>{children}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 group-hover:translate-x-1"
      />
    </Button>
  );
}

function SignInSecondaryButton({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`h-11 rounded-md border border-[#EBE7DF] bg-white px-5 text-sm font-semibold text-[#111111] shadow-none transition-all duration-200 hover:border-[#E67230]/40 hover:bg-[#FAF9F6] hover:text-[#111111] sm:h-12 sm:px-6 ${className}`}
    >
      Sign In
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SECTION INTRO                                 */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="mb-3 text-sm font-semibold text-[#F47C0B]">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-extrabold leading-[1.16] tracking-tight text-[#111111] sm:text-4xl lg:text-[44px] lg:leading-[1.14]">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-7 text-[#6B6B6B] sm:text-lg sm:leading-8 ${
            centered ? "mx-auto max-w-2xl" : "max-w-xl"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                     WORKSPACE SHOWCASE INTERNAL PAGE VIEWS                */
/* -------------------------------------------------------------------------- */

export function WorkspaceOverviewPage({
  selectedDay,
  setSelectedDay,
  selectedAppointmentIndex,
  setSelectedAppointmentIndex,
  onNavigateTab,
}: {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  selectedAppointmentIndex: number;
  setSelectedAppointmentIndex: (idx: number) => void;
  onNavigateTab?: (tabId: WorkspaceTabId) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 4 Key Stat Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          {
            id: "appointments" as const,
            count: "08",
            label: "Today's Appointments",
            pill: "+2 Video",
            icon: CalendarDays,
          },
          {
            id: "communication" as const,
            count: "03",
            label: "Pending Follow-Ups",
            pill: "Action Needed",
            icon: Clock3,
          },
          {
            id: "cases" as const,
            count: "05",
            label: "Active Cases",
            pill: "In Treatment",
            icon: ClipboardList,
          },
          {
            id: "prescriptions" as const,
            count: "02",
            label: "Prescription Drafts",
            pill: "Ready to Sign",
            icon: FilePenLine,
          },
        ].map(({ id, count, label, pill, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigateTab?.(id)}
            className="group rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-3.5 text-left transition-all duration-200 hover:border-[#F47C0B]/40 hover:bg-white hover:shadow-xs sm:p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tabular-nums text-[#111111] sm:text-3xl">
                {count}
              </span>
              <Icon className="size-4 text-[#DE6D05] transition-transform duration-200 group-hover:scale-110" />
            </div>
            <p className="mt-1 text-xs font-bold text-[#111111]">{label}</p>
            <span className="mt-1 inline-block text-[9px] font-semibold text-[#6B6B6B]">
              {pill}
            </span>
          </button>
        ))}
      </div>

      {/* Dashboard Split: Left (Consultations, Cases, Prescriptions) & Right (Calendar, Messages, Mentorship, Revenue) */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* Left Column */}
        <div className="space-y-4">
          {/* 1. Upcoming Consultations */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#111111]">Upcoming Consultations</h4>
                <p className="text-[11px] text-[#6B6B6B]">Scheduled for today with Prakriti tags</p>
              </div>
              <span className="rounded bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-bold text-[#6B6B6B]">
                3 of 8 Remaining
              </span>
            </div>

            <div className="divide-y divide-[#EBE7DF]">
              {appointmentsData.slice(0, 3).map((item, index) => {
                const isSelected = selectedAppointmentIndex === index;
                return (
                  <div
                    key={item.time}
                    onClick={() => setSelectedAppointmentIndex(index)}
                    role="button"
                    tabIndex={0}
                    className={`flex flex-col gap-2 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isSelected ? "bg-[#FAF9F6] -mx-2 px-2 rounded-lg" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#6B6B6B]">
                        {item.time}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-[#111111]">{item.patient}</p>
                          <span className="rounded-full bg-white border border-[#EBE7DF] px-2 py-0.5 text-[9px] font-bold text-[#DE6D05]">
                            {item.prakriti}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B]">
                          {item.type} · {item.condition}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${item.statusColor}`}
                      >
                        {item.status}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab?.("appointments");
                        }}
                        className="h-7 text-[10px] font-bold text-[#111111] hover:text-[#F47C0B]"
                      >
                        View Record
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Clinical Case Continuity Preview */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-[#DE6D05]" />
                <h4 className="text-xs font-bold text-[#111111]">
                  Active Clinical Case Preview · Continuity Across Encounters
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.("cases")}
                className="rounded bg-white px-2 py-0.5 text-[9px] font-bold text-[#DE6D05] border border-[#EBE7DF] hover:border-[#F47C0B]/40"
              >
                Case #1184 · Encounter #3
              </button>
            </div>
            <div className="rounded-lg border border-[#EBE7DF] bg-white p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111]">Ananya Deshmukh (34y · Female)</span>
                <span className="text-[10px] font-semibold text-[#6B6B6B]">
                  Prakriti: Vata-Pitta
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                <span className="font-semibold text-[#111111]">Diagnosis:</span> Amavata (Sama Vata
                Stage) · Shamana Phase
              </p>
              <p className="text-[11px] leading-relaxed text-[#6B6B6B]">
                <span className="font-semibold text-[#111111]">Longitudinal Progress:</span> Morning
                stiffness reduced from 45 min to 15 min after 10-day Deepana-Pachana. Agni
                stabilizing; Jihwa coating clearing. Moving to gentle Shamana protocol.
              </p>
            </div>
          </div>

          {/* 3. Prescription Draft Preview */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="flex items-center justify-between font-bold text-[#111111]">
              <span className="flex items-center gap-1.5 text-xs text-[#111111]">
                <FilePenLine className="size-3.5 text-[#DE6D05]" />
                Rx: Classical <strong className="font-bold text-[#E65C24]">AYUSH</strong> Treatment Protocol
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab?.("prescriptions")}
                className="rounded bg-white px-2 py-0.5 text-[9px] font-bold text-[#6B6B6B] border border-[#EBE7DF] hover:border-[#F47C0B]/40"
              >
                Draft #0284 · v1.2
              </button>
            </div>
            <div className="mt-2.5 rounded-lg border border-[#EBE7DF] bg-white p-3 font-mono text-[11px] text-[#111111] space-y-1">
              <p>1. Ashwagandha Churna 3g — BD with warm water or Ksheera (30 Days)</p>
              <p>2. Dashamoolarishta 20ml — BD with equal warm water after meals (30 Days)</p>
              <p>3. Mahasudarshan Vati 1 tab — BD before meals (Pathya: Laghu Ahara)</p>
            </div>
            <p className="mt-2 text-[10px] text-[#6B6B6B]">
              <span className="font-semibold text-[#111111]">Pathya:</span> Shashtika shali, mudga
              yusha, warm boiled water ·{" "}
              <span className="font-semibold text-[#111111]">Apathya:</span> Dadhi, divaswapna
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* 1. Interactive Calendar Week */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111111]">October 2026</p>
              <span className="text-[10px] font-bold text-[#DE6D05]">Week 42</span>
            </div>

            {/* Day Selector */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => {
                const isChosen = selectedDay === item.date;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDay(item.date)}
                    className={`flex flex-col items-center gap-1 rounded-md p-1.5 text-center transition-all ${
                      isChosen
                        ? "bg-[#F47C0B] text-white shadow-xs"
                        : "text-[#111111] hover:bg-white"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold ${
                        isChosen ? "text-white" : "text-[#6B6B6B]"
                      }`}
                    >
                      {item.day}
                    </span>
                    <span className="text-xs font-black tabular-nums">{item.date}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[#EBE7DF] pt-3 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Practice Distribution
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#111111]">
                  <span className="size-2 rounded-full bg-[#F47C0B]" />
                  In-Person Consultations
                </span>
                <span className="font-bold">6 Visits</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#111111]">
                  <span className="size-2 rounded-full bg-[#6B6B6B]" />
                  Tele-Health / Video
                </span>
                <span className="font-bold">2 Calls</span>
              </div>
            </div>
          </div>

          {/* 2. Patient Communication */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-[#DE6D05]" />
                <h4 className="text-xs font-bold text-[#111111]">
                  Patient Communication & Follow-Ups
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.("communication")}
                className="rounded bg-white px-2 py-0.5 text-[9px] font-bold text-[#DE6D05] border border-[#EBE7DF] hover:border-[#F47C0B]/40"
              >
                2 Unread
              </button>
            </div>
            <div className="rounded-lg border border-[#EBE7DF] bg-white p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#111111]">Ananya Deshmukh</span>
                <span className="text-[10px] text-[#6B6B6B]">Today, 10:15 AM</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] italic">
                &ldquo;Namaste Doctor, the morning stiffness is down to 15 min. Digestion feels
                lighter...&rdquo;
              </p>
              <div className="border-t border-[#EBE7DF] pt-1.5 text-[10px] text-[#111111]">
                <span className="font-semibold text-[#DE6D05]">Clinical Note:</span> Advised on warm
                water intake.
              </div>
            </div>
          </div>

          {/* 3. Guru-Shishya Clinical Mentorship */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-[#DE6D05]" />
                <h4 className="text-xs font-bold text-[#111111]">Guru-Shishya Workspace</h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.("mentorship")}
                className="rounded bg-white px-2 py-0.5 text-[9px] font-bold text-[#6B6B6B] border border-[#EBE7DF] hover:border-[#F47C0B]/40"
              >
                Supervised Case
              </button>
            </div>
            <div className="rounded-lg border border-[#EBE7DF] bg-white p-3 text-xs space-y-1">
              <p className="text-[11px] font-bold text-[#111111]">
                Mentor: Dr. K. R. Namboodiri, Senior Vaidya (38 yrs exp)
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                Case #1184 Guidance: Proceed with Ruksha Sweda for 5 days; prefer Brihat
                Saindhavadya Taila.
              </p>
              <span className="inline-block text-[9px] font-semibold text-[#DE6D05]">
                Verified Patient Consent on File
              </span>
            </div>
          </div>

          {/* 4. Practice Settlements */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-[#DE6D05]" />
                <h4 className="text-xs font-bold text-[#111111]">Practice Settlements & Revenue</h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.("revenue")}
                className="rounded bg-white px-2 py-0.5 text-[9px] font-bold text-[#DE6D05] border border-[#EBE7DF] hover:border-[#F47C0B]/40"
              >
                Direct to Bank
              </button>
            </div>
            <div className="rounded-lg border border-[#EBE7DF] bg-white p-3 text-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#6B6B6B]">Month-to-Date Payout Due:</p>
                <p className="text-sm font-black text-[#111111]">₹48,500</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6B6B6B]">Scheduled Settlement:</p>
                <p className="text-[11px] font-bold text-[#DE6D05]">21 October 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceAppointmentsPage({
  selectedDay,
  setSelectedDay,
  selectedAppointmentIndex,
  setSelectedAppointmentIndex,
}: {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  selectedAppointmentIndex: number;
  setSelectedAppointmentIndex: (idx: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Page Context Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">Appointments & OPD Schedule</h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Thursday, 17 October 2026 · 8 Consultations Scheduled (6 In-Person Clinic, 2 Tele-Health
            Video)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-[#EBE7DF] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111]">
            All (08)
          </span>
          <span className="rounded-md border border-[#EBE7DF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B6B6B]">
            In-Person (06)
          </span>
          <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
            Video Consult (02)
          </span>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Calendar & OPD Status on Right */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Full Schedule Queue */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-[#EBE7DF] pb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Today&apos;s Schedule · Chamber 1
              </h5>
              <span className="text-[11px] font-semibold text-[#DE6D05]">Token Queue Active</span>
            </div>

            <div className="space-y-2.5">
              {appointmentsData.map((item, index) => {
                const isSelected = selectedAppointmentIndex === index;
                const isVideo = item.mode.includes("Video");
                return (
                  <div
                    key={item.time}
                    onClick={() => setSelectedAppointmentIndex(index)}
                    role="button"
                    tabIndex={0}
                    className={`rounded-xl border p-3.5 transition-all text-left ${
                      isSelected
                        ? "border-[#F47C0B]/60 bg-[#FFFDF9] shadow-xs"
                        : "border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white hover:border-[#F47C0B]/40"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold text-[#6B6B6B] mt-0.5">
                          {item.time}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-extrabold text-[#111111]">{item.patient}</p>
                            <span className="rounded-full bg-white border border-[#EBE7DF] px-2 py-0.2 text-[9px] font-bold text-[#DE6D05]">
                              {item.prakriti}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
                            {item.type} · {item.condition}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#6B6B6B]">
                            {isVideo ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#DE6D05]">
                                <Video className="size-3 text-[#DE6D05]" />
                                Video Consultation (Encrypted Link Ready)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Building className="size-3 text-[#6B6B6B]" />
                                OPD Chamber 1 · In-Person
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${item.statusColor}`}
                        >
                          {item.status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] font-bold hover:text-[#F47C0B]"
                        >
                          {isVideo ? "Open Video Call" : "Open Record"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar & Allocation Details */}
        <div className="space-y-4">
          {/* Calendar Week View */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111111]">October 2026</p>
              <span className="text-[10px] font-bold text-[#DE6D05]">Week 42</span>
            </div>

            {/* Day Selector */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => {
                const isChosen = selectedDay === item.date;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDay(item.date)}
                    className={`flex flex-col items-center gap-1 rounded-md p-1.5 text-center transition-all ${
                      isChosen
                        ? "bg-[#F47C0B] text-white shadow-xs"
                        : "text-[#111111] hover:bg-white"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold ${
                        isChosen ? "text-white" : "text-[#6B6B6B]"
                      }`}
                    >
                      {item.day}
                    </span>
                    <span className="text-xs font-black tabular-nums">{item.date}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[#EBE7DF] pt-3 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Practice Distribution
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#111111]">
                  <span className="size-2 rounded-full bg-[#F47C0B]" />
                  In-Person Consultations
                </span>
                <span className="font-bold">6 Visits</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#111111]">
                  <span className="size-2 rounded-full bg-[#6B6B6B]" />
                  Tele-Health / Video
                </span>
                <span className="font-bold">2 Calls</span>
              </div>
            </div>
          </div>

          {/* OPD Chamber Live Allocation */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5 text-xs space-y-3">
            <h5 className="font-bold text-[#111111]">Chamber Availability & Flow</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                <span className="font-semibold text-[#111111]">Consulting Room:</span>
                <span className="font-bold text-[#DE6D05]">Room 1 · Dr. Suniti Sharma</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                <span className="font-semibold text-[#111111]">Daily Booking Load:</span>
                <span className="font-bold text-[#111111]">8 / 10 Slots (80% Capacity)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                <span className="font-semibold text-[#111111]">Documentation Buffer:</span>
                <span className="font-bold text-[#111111]">15 min per consultation</span>
              </div>
            </div>
            <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
              Appointments automatically sync with the patient app and dispatch SMS token
              notifications to minimize waiting room congestion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceClinicalCasesPage({
  selectedCaseId,
  setSelectedCaseId,
}: {
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
}) {
  const currentCase =
    clinicalCasesData.find((c) => c.id === selectedCaseId) ?? clinicalCasesData[0]!;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">
              Clinical Cases & Longitudinal Records
            </h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Continuity across clinical encounters · Ashtavidha Pariksha & Doshic progression
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-[#EBE7DF] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111]">
            Active Cases (05)
          </span>
          <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
            Shamana (03)
          </span>
          <span className="rounded-md border border-[#EBE7DF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B6B6B]">
            Deepana-Pachana (01)
          </span>
        </div>
      </div>

      {/* Grid: Case List on Left, Selected Case File on Right */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        {/* Left Column: Case Selector List */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Active Cases ({clinicalCasesData.length})
          </p>
          {clinicalCasesData.map((c) => {
            const isSelected = c.id === selectedCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCaseId(c.id)}
                className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-[#F47C0B]/60 bg-[#FFFDF9] shadow-xs"
                    : "border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white hover:border-[#F47C0B]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#111111]">Case #{c.id}</span>
                    <span className="rounded-full border border-[#EBE7DF] bg-white px-2 py-0.2 text-[9px] font-bold text-[#DE6D05]">
                      {c.prakriti}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">
                    {c.encounters} Encounters
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-[#111111]">{c.patient}</p>
                <p className="text-[11px] text-[#6B6B6B]">{c.condition}</p>
                <div className="mt-2 flex items-center justify-between border-t border-[#EBE7DF] pt-1.5 text-[10px]">
                  <span className="font-semibold text-[#DE6D05]">{c.status}</span>
                  <span className="text-[#6B6B6B]">{c.lastSeen}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Longitudinal Case File */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            {/* Case File Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE7DF] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-extrabold text-[#111111]">{currentCase.patient}</h5>
                  <span className="text-xs text-[#6B6B6B]">({currentCase.age})</span>
                  <span className="rounded-full border border-[#EBE7DF] bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-bold text-[#DE6D05]">
                    Prakriti: {currentCase.prakriti}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">
                  Case #{currentCase.id} · Primary Diagnosis: {currentCase.condition}
                </p>
              </div>
              <span className="rounded bg-[#FAF9F6] border border-[#EBE7DF] px-2.5 py-1 text-[10px] font-bold text-[#111111]">
                {currentCase.status}
              </span>
            </div>

            {/* Ayurvedic Pariksha Marker Grid */}
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Rogi Pariksha & Doshic State
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                  <span className="text-[10px] font-bold text-[#6B6B6B]">Agni</span>
                  <p className="font-extrabold text-[#111111] truncate">{currentCase.agni}</p>
                </div>
                <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                  <span className="text-[10px] font-bold text-[#6B6B6B]">Kostha</span>
                  <p className="font-extrabold text-[#111111] truncate">{currentCase.kostha}</p>
                </div>
                <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                  <span className="text-[10px] font-bold text-[#6B6B6B]">Jihwa</span>
                  <p className="font-extrabold text-[#111111] truncate">{currentCase.jihwa}</p>
                </div>
                <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-2.5">
                  <span className="text-[10px] font-bold text-[#6B6B6B]">Nadi</span>
                  <p className="font-extrabold text-[#111111] truncate">{currentCase.nadi}</p>
                </div>
              </div>
            </div>

            {/* Longitudinal Encounter Timeline */}
            <div className="mb-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Longitudinal Encounter History
              </p>
              <div className="space-y-2 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs">
                <div className="border-l-2 border-[#DE6D05] pl-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#111111]">Encounter #1 · Initial Intake</span>
                    <span className="text-[10px] text-[#6B6B6B]">14 days ago</span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Acute morning stiffness 45 min. Heavy Jihwa coating. Started Deepana-Pachana
                    protocol (Shunti-Guduchi).
                  </p>
                </div>
                <div className="border-l-2 border-[#F47C0B]/40 pl-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#111111]">
                      Encounter #2 · Mid-Cycle Review
                    </span>
                    <span className="text-[10px] text-[#6B6B6B]">7 days ago</span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Stiffness reduced to 25 min. Appetite stabilizing. Jihwa coating receding
                    gradually.
                  </p>
                </div>
                <div className="border-l-2 border-[#DE6D05] pl-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#111111]">
                      Encounter #3 · Today&apos;s Review
                    </span>
                    <span className="text-[10px] font-bold text-[#DE6D05]">17 October 2026</span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Morning stiffness down to 15 min. Ama clearing well. Moving to gentle Shamana
                    protocol with classical formulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor's Clinical Assessment */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#DE6D05]">
                Doctor&apos;s Clinical Assessment
              </span>
              <p className="mt-1 text-[11px] leading-relaxed text-[#111111]">
                {currentCase.progress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspacePrescriptionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <FilePenLine className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">
              Electronic Prescriptions & Classical Formulations
            </h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Classical <strong className="font-bold text-[#E65C24]">AYUSH</strong> formulation registry, dose & anupana titration, and Pathya/Apathya
            regimens
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
            Draft #0284 · Ready to Sign
          </span>
          <Button
            size="sm"
            className="h-7 text-xs font-bold bg-[#F47C0B] hover:bg-[#DE6D05] text-white"
          >
            Sign & Issue Rx
          </Button>
        </div>
      </div>

      {/* Grid: Rx Form on Left, Version History & Sign-off on Right */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        {/* Left Column: Active Prescription Sheet */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            {/* Rx Sheet Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE7DF] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#DE6D05]">
                  {prescriptionDraftData.id} · {prescriptionDraftData.version}
                </span>
                <h5 className="text-sm font-extrabold text-[#111111]">
                  {prescriptionDraftData.patient} ({prescriptionDraftData.age})
                </h5>
                <p className="text-[11px] text-[#6B6B6B]">
                  Diagnosis: {prescriptionDraftData.diagnosis}
                </p>
              </div>
              <span className="rounded bg-[#FAF9F6] border border-[#EBE7DF] px-2.5 py-1 text-[10px] font-bold text-[#6B6B6B]">
                Date: {prescriptionDraftData.date}
              </span>
            </div>

            {/* Formulations List */}
            <div className="mb-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Prescribed Classical Medicines ({prescriptionDraftData.medicines.length})
              </p>
              <div className="space-y-2">
                {prescriptionDraftData.medicines.map((med, idx) => (
                  <div
                    key={med.name}
                    className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#DE6D05]">
                          {idx + 1}.
                        </span>
                        <span className="font-extrabold text-[#111111]">{med.name}</span>
                        <span className="rounded-full bg-white border border-[#EBE7DF] px-2 py-0.2 text-[9px] font-semibold text-[#6B6B6B]">
                          {med.type}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#111111]">
                        {med.dose}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B6B6B]">
                      <span>
                        <strong className="text-[#111111]">Timing:</strong> {med.timing}
                      </span>
                      <span>
                        <strong className="text-[#111111]">Anupana:</strong> {med.anupana}
                      </span>
                      <span>
                        <strong className="text-[#111111]">Duration:</strong> {med.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pathya & Apathya Regimen Box */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]">
                Dietary & Lifestyle Regimen (Pathya / Apathya)
              </span>
              <p className="text-[11px] text-[#6B6B6B]">
                <strong className="text-[#111111]">Pathya (Do):</strong>{" "}
                {prescriptionDraftData.pathya}
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                <strong className="text-[#DE6D05]">Apathya (Avoid):</strong>{" "}
                {prescriptionDraftData.apathya}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Version History & Sign-off Status */}
        <div className="space-y-4">
          {/* Sign-off authentication */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5 text-xs space-y-3">
            <h5 className="font-bold text-[#111111]">Physician Authentication</h5>
            <div className="space-y-2 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Doctor:</span>
                <span className="font-bold text-[#111111]">Dr. Suniti Sharma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">AYUSH Reg:</span>
                <span className="font-bold text-[#111111]">AYU-MH-84920</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Chamber:</span>
                <span className="font-bold text-[#111111]">Sambhram Ayur Clinic · Pune</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Digital Stamp:</span>
                <span className="font-bold text-[#DE6D05]">Ready to Apply</span>
              </div>
            </div>
            <Button className="w-full text-xs font-bold bg-[#F47C0B] hover:bg-[#DE6D05] text-white">
              Digitally Sign & Dispatch to Patient
            </Button>
          </div>

          {/* Version History */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5 text-xs space-y-2.5">
            <h5 className="font-bold text-[#111111]">Prescription Versions</h5>
            <div className="space-y-2 text-[11px]">
              <div className="rounded-lg border border-[#F47C0B]/40 bg-white p-2.5">
                <div className="flex justify-between font-bold">
                  <span className="text-[#DE6D05]">v1.2 (Current Draft)</span>
                  <span className="text-[#6B6B6B]">Today</span>
                </div>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                  Added Mahanarayana Taila for local joint stiffness relief.
                </p>
              </div>
              <div className="rounded-lg border border-[#EBE7DF] bg-white p-2.5">
                <div className="flex justify-between font-bold">
                  <span className="text-[#111111]">v1.1 (Signed)</span>
                  <span className="text-[#6B6B6B]">10 Oct</span>
                </div>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                  Adjusted Dashamoolarishta titration to 20ml BD.
                </p>
              </div>
              <div className="rounded-lg border border-[#EBE7DF] bg-white p-2.5">
                <div className="flex justify-between font-bold">
                  <span className="text-[#111111]">v1.0 (Fulfilled)</span>
                  <span className="text-[#6B6B6B]">03 Oct</span>
                </div>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                  Initial Deepana-Pachana protocol (Shunti + Guduchi).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceCommunicationPage() {
  const [selectedThreadId, setSelectedThreadId] = useState("c1");
  const currentThread =
    communicationThreads.find((t) => t.id === selectedThreadId) ?? communicationThreads[0]!;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">
              Clinical Communication & Patient Follow-Ups
            </h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Structured post-consultation care, diet queries, and clinical advice threads
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-[#EBE7DF] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111]">
            All Threads (03)
          </span>
          <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
            2 Unread
          </span>
        </div>
      </div>

      {/* Grid: Message Threads List on Left, Active Conversation on Right */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        {/* Left Column: Conversations List */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Recent Conversations
          </p>
          {communicationThreads.map((thread) => {
            const isSelected = thread.id === selectedThreadId;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-[#F47C0B]/60 bg-[#FFFDF9] shadow-xs"
                    : "border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white hover:border-[#F47C0B]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#111111]">{thread.patient}</span>
                  <span className="text-[10px] text-[#6B6B6B]">{thread.time}</span>
                </div>
                <p className="text-[11px] text-[#DE6D05] font-semibold mt-0.5">
                  {thread.condition}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-[#6B6B6B]">
                  &ldquo;{thread.preview}&rdquo;
                </p>
                {thread.unread && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded bg-[#FFF8F0] border border-[#F47C0B]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#DE6D05]">
                    <span className="size-1.5 rounded-full bg-[#F47C0B]" />
                    Follow-Up Action Needed
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Clinical Thread */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            {/* Conversation Header */}
            <div className="mb-4 flex items-center justify-between border-b border-[#EBE7DF] pb-3">
              <div>
                <h5 className="text-sm font-extrabold text-[#111111]">{currentThread.patient}</h5>
                <p className="text-[11px] text-[#6B6B6B]">
                  {currentThread.condition} · Verified Asynchronous Care Thread
                </p>
              </div>
              <span className="rounded bg-[#FAF9F6] border border-[#EBE7DF] px-2 py-0.5 text-[10px] font-bold text-[#6B6B6B]">
                Case #1184
              </span>
            </div>

            {/* Messages Log */}
            <div className="space-y-3 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs mb-4">
              <div className="rounded-lg bg-white p-3 border border-[#EBE7DF] space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-[#111111]">{currentThread.patient}</span>
                  <span className="text-[#6B6B6B]">10:15 AM</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#111111]">
                  Namaste Dr. Suniti, following your advice the morning joint stiffness has come
                  down to about 15 minutes. Digestion also feels lighter. Should I take the
                  Ashwagandha with warm milk or plain warm water if milk causes heaviness?
                </p>
              </div>

              <div className="rounded-lg bg-[#FFFDF9] p-3 border border-[#F47C0B]/30 space-y-1 ml-4">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-[#DE6D05]">Dr. Suniti Sharma</span>
                  <span className="text-[#6B6B6B]">10:28 AM</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#111111]">
                  Namaste Ananya. Glad to hear the Ama is clearing. If milk feels heavy, take it
                  with warm water and a pinch of dry ginger (Shunti churna) after dinner. Keep up
                  the warm water intake.
                </p>
              </div>
            </div>

            {/* Clinical Note Entry */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#DE6D05]">
                Clinical Note Logged to Case File
              </span>
              <p className="text-[11px] text-[#111111]">
                Advised substitution of lukewarm water + Shunti for milk if heaviness occurs. Noted
                66% reduction in morning stiffness duration.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                Confirm Anupana Adjustment
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                Schedule Review Call
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                Send Pathya Guidance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceGuruShishyaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">
              Guru-Shishya Clinical Mentorship Workspace
            </h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Supervised case discussions, senior Vaidya clinical oversight, and traditional <strong className="font-bold text-[#E65C24]">AYUSH</strong>
            lineage learning
          </p>
        </div>
        <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
          Verified Patient Consent on File
        </span>
      </div>

      {/* Grid: Case Discussion on Left, Mentor Profile & CPD on Right */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        {/* Left Column: Active Mentorship Discussion */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
            {/* Discussion Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE7DF] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DE6D05]">
                  Active Case Supervision
                </span>
                <h5 className="text-sm font-extrabold text-[#111111]">
                  {guruShishyaData.caseTitle}
                </h5>
              </div>
              <span className="rounded bg-[#FAF9F6] border border-[#EBE7DF] px-2 py-0.5 text-[10px] font-semibold text-[#6B6B6B]">
                Confidential Case Review
              </span>
            </div>

            {/* Mentee Presentation & Query */}
            <div className="mb-3 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#111111]">
                  Mentee Case Presentation: {guruShishyaData.mentee}
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Clinical Presentation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#111111]">
                &ldquo;{guruShishyaData.menteeQuery}&rdquo;
              </p>
            </div>

            {/* Senior Vaidya Guidance */}
            <div className="mb-4 rounded-lg border border-[#F47C0B]/40 bg-[#FFFDF9] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#DE6D05]">
                  Senior Mentor Guidance: {guruShishyaData.mentor}
                </span>
                <span className="text-[10px] font-bold text-[#DE6D05]">Clinical Directive</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#111111]">
                &ldquo;{guruShishyaData.mentorGuidance}&rdquo;
              </p>
            </div>

            {/* Classical Principle Annotation */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Classical Principle Highlighted
              </span>
              <p className="mt-1 text-[11px] text-[#6B6B6B] leading-relaxed">
                Ruksha Sweda (Baluka) is mandatory while Ama lingers; premature Snigdha Sweda or
                Abhyanga drives Ama deeper into Sandhi sthana. (Ashtanga Hridaya Sutrasthana 13).
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Mentor Profile & CPD Verification */}
        <div className="space-y-4">
          {/* Mentor Profile */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5 text-xs space-y-3">
            <h5 className="font-bold text-[#111111]">Mentor Details</h5>
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 space-y-2 text-[11px]">
              <div>
                <span className="text-[10px] text-[#6B6B6B]">Senior Vaidya:</span>
                <p className="font-extrabold text-[#111111]">{guruShishyaData.mentor}</p>
                <p className="text-[10px] text-[#6B6B6B]">{guruShishyaData.mentorTitle}</p>
              </div>
              <div className="border-t border-[#EBE7DF] pt-1.5">
                <span className="text-[10px] text-[#6B6B6B]">Clinical Lineage:</span>
                <p className="font-semibold text-[#111111]">{guruShishyaData.tradition}</p>
              </div>
            </div>
          </div>

          {/* Mentorship Metrics */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5 text-xs space-y-3">
            <h5 className="font-bold text-[#111111]">Mentorship Activity & CPD</h5>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg border border-[#EBE7DF] bg-white p-2.5">
                <p className="text-lg font-black text-[#111111]">
                  {guruShishyaData.stats.casesReviewed}
                </p>
                <span className="text-[10px] text-[#6B6B6B]">Cases Reviewed</span>
              </div>
              <div className="rounded-lg border border-[#EBE7DF] bg-white p-2.5">
                <p className="text-lg font-black text-[#DE6D05]">
                  {guruShishyaData.stats.hoursLogged}
                </p>
                <span className="text-[10px] text-[#6B6B6B]">Hours Logged</span>
              </div>
            </div>
            <p className="text-[10px] text-[#6B6B6B] leading-relaxed">
              Supervised clinical hours qualify for AYUSH Continuous Professional Development (CPD)
              accreditation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceRevenuePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-[#DE6D05]" />
            <h4 className="text-sm font-bold text-[#111111]">Revenue & Practice Settlements</h4>
          </div>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            Automated direct-to-bank consultation payouts, earnings breakdown, and reconciliation
          </p>
        </div>
        <span className="rounded-md border border-[#F47C0B]/30 bg-[#FFF8F0] px-2.5 py-1 text-[11px] font-bold text-[#DE6D05]">
          Scheduled Settlement: 21 October 2026
        </span>
      </div>

      {/* 4 Financial Stat Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-3.5 sm:p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Month-to-Date
          </span>
          <p className="mt-1 text-2xl font-black text-[#111111] sm:text-3xl">
            {settlementsData.totalEarnings}
          </p>
          <span className="mt-1 inline-block text-[9px] font-semibold text-[#DE6D05]">
            Cycle: {settlementsData.currentCycle}
          </span>
        </div>
        <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-3.5 sm:p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Next Payout Due
          </span>
          <p className="mt-1 text-2xl font-black text-[#DE6D05] sm:text-3xl">
            {settlementsData.totalEarnings}
          </p>
          <span className="mt-1 inline-block text-[9px] font-semibold text-[#6B6B6B]">
            Disbursement: {settlementsData.nextPayout}
          </span>
        </div>
        <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-3.5 sm:p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            In-Person OPD
          </span>
          <p className="mt-1 text-2xl font-black text-[#111111] sm:text-3xl">
            {settlementsData.inPersonEarnings}
          </p>
          <span className="mt-1 inline-block text-[9px] font-semibold text-[#6B6B6B]">
            {settlementsData.inPersonVisits}
          </span>
        </div>
        <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-3.5 sm:p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Tele-Health Video
          </span>
          <p className="mt-1 text-2xl font-black text-[#111111] sm:text-3xl">
            {settlementsData.videoEarnings}
          </p>
          <span className="mt-1 inline-block text-[9px] font-semibold text-[#6B6B6B]">
            {settlementsData.videoVisits}
          </span>
        </div>
      </div>

      {/* Grid: Settlements Table on Left, Bank Routing on Right */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Settlement History Table */}
        <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[#EBE7DF] pb-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
              Recent Settlement Cycles
            </h5>
            <span className="text-[11px] font-semibold text-[#DE6D05]">Direct to Bank</span>
          </div>

          <div className="divide-y divide-[#EBE7DF]">
            {settlementsData.history.map((item) => (
              <div
                key={item.period}
                className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#111111]">{item.period}</span>
                    <span className="text-[10px] text-[#6B6B6B]">· {item.bank}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#DE6D05]">{item.status}</span>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-sm font-black text-[#111111]">{item.amount}</span>
                  <p className="text-[9px] text-[#6B6B6B]">Reconciled {item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bank Details & Terms */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 sm:p-5 text-xs space-y-3">
            <h5 className="font-bold text-[#111111]">Settlement Account Details</h5>
            <div className="space-y-2 rounded-lg border border-[#EBE7DF] bg-white p-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Beneficiary:</span>
                <span className="font-bold text-[#111111]">Dr. Suniti Sharma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Bank:</span>
                <span className="font-bold text-[#111111]">HDFC Bank Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Account:</span>
                <span className="font-mono font-bold text-[#111111]">****4920</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Payout Schedule:</span>
                <span className="font-semibold text-[#DE6D05]">Bi-monthly (1st & 16th)</span>
              </div>
            </div>
            <p className="text-[10px] text-[#6B6B6B] leading-relaxed">
              100% practitioner earnings with zero commission deductions on in-person clinic
              consultations. Direct automatic NEFT/RTGS settlement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN PAGE COMPONENT                           */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*             HORIZONTAL STORYTELLING JOURNEY: CLINICAL PIPELINE             */
/* Browser-native, 60fps transform, finite duration, zero scroll-lock        */
/* Degrades on mobile & prefers-reduced-motion to native swipe track         */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*         SCROLL-DRIVEN PRACTICE SUITE HORIZONTAL SHOWCASE (RTL)             */
/* Progressively moves 6 cards horizontally (right-to-left) on vertical scroll*/
/* Reuses HorizontalStorytellingSection transform and progress calculation     */
/* Degrades cleanly on mobile (<1024px) & reduced-motion to touch snap track  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*             PRACTICE SUITE CARD TOP VISUAL PREVIEW ILLUSTRATION            */
/* -------------------------------------------------------------------------- */

function PracticeSuiteCardPreview({ type }: { type: string }) {
  switch (type) {
    case "library":
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Classical Ayurveda manuscript / open reference book with Sanskrit verses */}
          <div className="relative flex flex-col items-center">
            {/* Open Folio / Manuscript */}
            <div className="relative flex h-20 w-40 items-center justify-between rounded-lg border border-[#EBE7DF] bg-white/95 p-2.5 shadow-sm">
              {/* Left page */}
              <div className="flex flex-1 flex-col gap-1 border-r border-[#EBE7DF]/80 pr-2">
                <span className="font-serif text-[9px] font-bold text-[#E67230]">चरक संहिता</span>
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-sm bg-[#111111]/30" />
                  <div className="h-1 w-4/5 rounded-sm bg-[#111111]/20" />
                  <div className="h-1 w-full rounded-sm bg-[#111111]/20" />
                  <div className="h-1 w-2/3 rounded-sm bg-[#111111]/20" />
                </div>
              </div>
              {/* Right page */}
              <div className="flex flex-1 flex-col gap-1 pl-2">
                <span className="font-mono text-[8px] font-bold text-[#555555]">Sutra 1.41</span>
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-sm bg-[#E67230]/40" />
                  <div className="h-1 w-3/4 rounded-sm bg-[#111111]/20" />
                  <div className="h-1 w-5/6 rounded-sm bg-[#111111]/20" />
                  <div className="h-1 w-1/2 rounded-sm bg-[#111111]/20" />
                </div>
              </div>
              {/* Red Ribbon Bookmark */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-5 w-2 rounded-b-xs bg-[#E67230] shadow-xs" />
            </div>
            {/* Bottom Shastra / Classical Source Indicator */}
            <div className="mt-1.5 flex items-center gap-1.5 rounded-full border border-[#EBE7DF] bg-white px-2.5 py-0.5 shadow-2xs">
              <BookOpen className="size-2.5 text-[#E67230]" />
              <span className="font-mono text-[8.5px] font-bold text-[#111111]">SAMHITA VERSE · REF 01</span>
            </div>
          </div>
        </div>
      );

    case "journals":
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Academic journal / research paper layout with publication metadata */}
          <div className="relative flex items-center gap-3">
            {/* Journal / Paper sheet */}
            <div className="relative flex h-20 w-32 flex-col justify-between rounded-lg border border-[#EBE7DF] bg-white/95 p-2 shadow-sm">
              <div className="border-b border-[#EBE7DF] pb-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] font-bold text-[#E67230]">AYUSH RESEARCH</span>
                  <span className="font-mono text-[7px] text-[#888888]">VOL 18 · 2026</span>
                </div>
                <p className="mt-0.5 truncate text-[8.5px] font-extrabold text-[#111111]">
                  Clinical Efficacy Studies
                </p>
              </div>
              {/* Paper abstract text lines & citation marker */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <div className="h-1 w-3/4 rounded-sm bg-[#111111]/30" />
                  <span className="size-1 rounded-full bg-[#E67230]" />
                </div>
                <div className="h-1 w-full rounded-sm bg-[#111111]/20" />
                <div className="h-1 w-5/6 rounded-sm bg-[#111111]/20" />
              </div>
              <div className="flex items-center justify-between text-[7px] font-mono text-[#777777]">
                <span>DOI: 10.1016/ayush</span>
                <span className="text-[#E67230] font-bold">[12 CITATIONS]</span>
              </div>
            </div>

            {/* Research & Citation Symbol Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#E67230]/30 bg-[#FFFBF8] shadow-xs">
                <FileText className="size-4.5 text-[#E67230]" />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#EBE7DF] bg-white px-2 py-0.5 shadow-2xs">
                <span className="font-mono text-[8.5px] font-bold text-[#111111]">PEER REVIEW</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "profile":
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Professional AYUSH practitioner profile card */}
          <div className="relative flex items-center gap-3">
            {/* Identity Badge Card */}
            <div className="relative flex h-20 w-34 items-center gap-2 rounded-lg border border-[#EBE7DF] bg-white/95 p-2 shadow-sm">
              {/* Doctor Avatar / Portrait */}
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E67230]/40 bg-[#FFF6EE]">
                <UserRound className="size-5 text-[#E67230]" />
                <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#111111] text-white">
                  <Check className="size-2 text-[#E67230]" />
                </div>
              </div>
              {/* Credentials & Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-extrabold text-[#111111]">Dr. Ananya P.</p>
                <p className="truncate text-[8px] font-bold text-[#E67230]">BAMS, MD (Ayu)</p>
                <div className="mt-1 flex items-center gap-1 rounded bg-[#FAF9F6] px-1 py-0.5 border border-[#EBE7DF]">
                  <Award className="size-2 text-[#E67230]" />
                  <span className="font-mono text-[7px] font-bold text-[#555555]">VERIFIED AYUSH</span>
                </div>
              </div>
            </div>

            {/* Visibility / Share Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#E67230]/30 bg-[#FFFBF8] shadow-xs">
                <Network className="size-4.5 text-[#E67230]" />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#EBE7DF] bg-white px-2 py-0.5 shadow-2xs">
                <span className="font-mono text-[8.5px] font-bold text-[#111111]">VAIDYA FORUM</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "medicines":
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Medicine catalogue interface: Ayurvedic formulation bottle & composition */}
          <div className="relative flex items-center justify-center gap-3">
            {/* Glass medicine bottle */}
            <div className="relative flex flex-col items-center">
              {/* Bottle Cap */}
              <div className="h-2 w-6 rounded-t-sm bg-[#111111] shadow-xs" />
              {/* Bottle Neck */}
              <div className="h-2 w-4 border-x border-[#EBE7DF] bg-[#F8F6F2]" />
              {/* Bottle Body */}
              <div className="relative flex h-18 w-14 flex-col items-center justify-between rounded-md border border-[#EBE7DF] bg-white/95 p-1.5 shadow-sm">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#E67230]">
                  ASHTA
                </span>
                {/* Traditional medicine label detail */}
                <div className="w-full rounded border border-[#EBE7DF] bg-[#FAF9F6] px-1 py-0.5 text-center">
                  <div className="h-0.5 w-full rounded bg-[#E67230]/40" />
                  <div className="mt-0.5 h-0.5 w-3/4 mx-auto rounded bg-[#111111]/30" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-1 rounded-full bg-[#E67230]" />
                  <span className="font-mono text-[8px] font-bold text-[#111111]">500mg</span>
                </div>
              </div>
            </div>

            {/* Herbal composition leaf & search indicator */}
            <div className="flex flex-col items-center gap-1.5">
              {/* Botanical Leaf */}
              <div className="flex size-9 items-center justify-center rounded-full border border-[#E67230]/30 bg-[#FFFBF8] shadow-xs">
                <svg
                  className="size-5 text-[#E67230]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6" />
                </svg>
              </div>
              {/* Magnifying Glass Search Badge */}
              <div className="flex items-center gap-1 rounded-full border border-[#EBE7DF] bg-white px-2 py-0.5 shadow-2xs">
                <Search className="size-2.5 text-[#E67230]" />
                <span className="font-mono text-[8.5px] font-bold text-[#111111]">DRAVYA FINDER</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "hrms":
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Workforce management / HRMS illustration: practitioner tiles & scheduling */}
          <div className="relative flex items-center gap-3">
            {/* Workforce & Team roster card */}
            <div className="relative flex h-20 w-32 flex-col justify-between rounded-lg border border-[#EBE7DF] bg-white/95 p-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-1">
                <span className="font-mono text-[8px] font-bold text-[#E67230]">CLINIC ROSTER</span>
                <span className="rounded bg-[#FAF9F6] px-1 text-[7px] font-bold text-[#111111] border border-[#EBE7DF]">
                  4 ACTIVE
                </span>
              </div>
              {/* Team member slots */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-4 items-center justify-center rounded-full bg-[#E67230]/15 text-[#E67230]">
                      <UserRound className="size-2.5" />
                    </div>
                    <span className="text-[8px] font-bold text-[#111111]">Senior Vaidya</span>
                  </div>
                  <span className="font-mono text-[7.5px] text-[#22c55e] font-bold">On Duty</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-4 items-center justify-center rounded-full bg-[#111111]/10 text-[#111111]">
                      <UserRound className="size-2.5" />
                    </div>
                    <span className="text-[8px] font-bold text-[#555555]">Therapist</span>
                  </div>
                  <span className="font-mono text-[7.5px] text-[#E67230] font-bold">Scheduled</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[7px] font-mono text-[#888888]">
                <CalendarDays className="size-2 text-[#E67230]" />
                <span>Next shift: 02:00 PM</span>
              </div>
            </div>

            {/* Team / Recruitment Element */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#E67230]/30 bg-[#FFFBF8] shadow-xs">
                <UsersRound className="size-4.5 text-[#E67230]" />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#EBE7DF] bg-white px-2 py-0.5 shadow-2xs">
                <span className="font-mono text-[8.5px] font-bold text-[#111111]">TEAM HRMS</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "compliance":
    default:
      return (
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#EBE7DF]/80 bg-gradient-to-br from-[#FAF9F6] via-white to-[#FFF6EE] p-3 select-none">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(#E67230 0.75px, transparent 0.75px), radial-gradient(#111111 0.75px, #FAF9F6 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          {/* Compliance checklist / dashboard with document records and verification */}
          <div className="relative flex items-center gap-3">
            {/* Compliance Checklist Document */}
            <div className="flex h-20 w-32 flex-col justify-between rounded-lg border border-[#EBE7DF] bg-white/95 p-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-1">
                <span className="font-mono text-[8px] font-bold text-[#111111]">COMPLIANCE LOG</span>
                <span className="size-1.5 rounded-full bg-[#22c55e]" />
              </div>
              {/* Checklist items with checkmarks */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[7.5px] text-[#555555]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-2 text-[#22c55e]" />
                    <span>State Board Reg</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">Active</span>
                </div>
                <div className="flex items-center justify-between text-[7.5px] text-[#555555]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-2 text-[#22c55e]" />
                    <span>Pharmacy License</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">Verified</span>
                </div>
                <div className="flex items-center justify-between text-[7.5px] text-[#555555]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-2 text-[#E67230]" />
                    <span>Annual Audit</span>
                  </span>
                  <span className="font-mono font-bold text-[#E67230]">Current</span>
                </div>
              </div>
              <div className="rounded bg-[#FAF9F6] px-1 py-0.5 text-center text-[7px] font-bold text-[#111111] border border-[#EBE7DF]">
                REGULATORY VERIFIED
              </div>
            </div>

            {/* Verification Shield & Status Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#E67230]/30 bg-[#FFFBF8] shadow-xs">
                <ShieldCheck className="size-4.5 text-[#E67230]" />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#EBE7DF] bg-white px-2 py-0.5 shadow-2xs">
                <span className="font-mono text-[8.5px] font-bold text-[#111111]">AUDIT PASS</span>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

function PracticeSuiteScrollSection({
  handleNavClick,
}: {
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [maxTranslate, setMaxTranslate] = useState(1320);

  useEffect(() => {
    const checkMedia = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };
    checkMedia();
    window.addEventListener("resize", checkMedia);
    return () => window.removeEventListener("resize", checkMedia);
  }, []);

  // Dynamically compute exact maxTranslate distance from track scroll width and visible viewport container width
  useEffect(() => {
    if (!isDesktop || reducedMotion) return;

    const measureTrack = () => {
      if (trackRef.current) {
        const viewportWidth = trackRef.current.parentElement?.clientWidth || window.innerWidth;
        const totalTrackWidth = trackRef.current.scrollWidth;
        // The distance needed to bring the entire last card (and its trailing margin/padding) into view
        const calculatedMax = Math.max(0, totalTrackWidth - viewportWidth);
        if (calculatedMax > 0) {
          setMaxTranslate(calculatedMax);
        }
      }
    };

    measureTrack();
    // Re-measure after initial layout settles
    const timer = setTimeout(measureTrack, 150);
    window.addEventListener("resize", measureTrack);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureTrack);
    };
  }, [isDesktop, reducedMotion]);

  useEffect(() => {
    if (!isDesktop || reducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) {
            ticking = false;
            return;
          }
          const rect = containerRef.current.getBoundingClientRect();
          const totalDistance = containerRef.current.offsetHeight - window.innerHeight;
          if (totalDistance > 0) {
            const current = -rect.top;
            const progress = Math.max(0, Math.min(1, current / totalDistance));
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop, reducedMotion]);

  const currentTranslate = scrollProgress * maxTranslate;
  const activeSlideIndex = Math.min(
    carouselFeatures.length - 1,
    Math.max(0, Math.round(scrollProgress * (carouselFeatures.length - 1))),
  );

  const scrollToSlide = (index: number) => {
    if (!containerRef.current) return;
    const totalDistance = containerRef.current.offsetHeight - window.innerHeight;
    const targetFraction = index / (carouselFeatures.length - 1);
    const rect = containerRef.current.getBoundingClientRect();
    const currentScrollY = window.scrollY || window.pageYOffset;
    const containerTopY = currentScrollY + rect.top;
    const targetY = containerTopY + targetFraction * totalDistance;

    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={containerRef}
      id="practice-suite"
      aria-label="Practice Suite Capabilities Showcase"
      className={
        isDesktop && !reducedMotion
          ? "relative h-[250vh] border-b border-[#EBE7DF] bg-[#FAF9F6]"
          : "relative border-b border-[#EBE7DF] bg-[#FAF9F6] py-14 sm:py-16"
      }
    >
      <div
        className={
          isDesktop && !reducedMotion
            ? "sticky top-20 flex h-[calc(100vh-5rem)] flex-col justify-center overflow-hidden py-8"
            : "mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12"
        }
      >
        {/* Section Header with Controls & Progress */}
        <div className="mx-auto w-full max-w-[1216px] px-5 sm:px-8 lg:px-12 mb-7">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E67230]">
                FOUNDATIONAL SERVICES · FOR ALL AYUSH PRACTITIONERS
              </p>
              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl lg:text-[34px]">
                Universal services for AYUSH Practitioners
              </h3>
              <p className="mt-2 text-base text-[#6B6B6B] sm:text-[17px] leading-relaxed max-w-2xl">
                A shared foundation for informed, connected practice.
              </p>
            </div>

            {/* Controls & Pagination synced with vertical scroll progress */}
            <div className="flex items-center gap-4 self-start sm:self-end">
              {/* Active Indicator & Fraction Counter */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#E67230]">
                  0{activeSlideIndex + 1}
                </span>
                <span className="font-mono text-xs text-[#888888]">/</span>
                <span className="font-mono text-xs font-medium text-[#888888]">
                  0{carouselFeatures.length}
                </span>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSlide(Math.max(0, activeSlideIndex - 1))}
                  disabled={activeSlideIndex === 0}
                  aria-label="Previous capability card"
                  className="flex size-10 items-center justify-center rounded-full border border-[#EBE7DF] bg-white text-[#111111] shadow-2xs transition-all hover:border-[#E67230] hover:text-[#E67230] hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230]"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    scrollToSlide(Math.min(carouselFeatures.length - 1, activeSlideIndex + 1))
                  }
                  disabled={activeSlideIndex === carouselFeatures.length - 1}
                  aria-label="Next capability card"
                  className="flex size-10 items-center justify-center rounded-full border border-[#EBE7DF] bg-white text-[#111111] shadow-2xs transition-all hover:border-[#E67230] hover:text-[#E67230] hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230]"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-Driven Horizontal Track (Desktop) */}
        {isDesktop && !reducedMotion ? (
          <div className="mx-auto w-full max-w-[1216px] px-5 sm:px-8 lg:px-12 overflow-hidden">
            <div
              ref={trackRef}
              style={{
                transform: `translate3d(-${currentTranslate}px, 0, 0)`,
                willChange: "transform",
              }}
              className="flex items-stretch gap-6 transition-transform duration-75 ease-out"
            >
              {carouselFeatures.map((item, idx) => {
                const isActive = activeSlideIndex === idx;
                return (
                  <div key={item.title} className="w-[360px] lg:w-[370px] shrink-0">
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`group relative flex h-full flex-col justify-start rounded-2xl border bg-white p-5 sm:p-6 transition-all duration-300 hover:border-[#E67230]/60 hover:bg-[#FFFBF8] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230] motion-reduce:transition-none ${
                        isActive
                          ? "border-[#E67230]/60 shadow-xs ring-1 ring-[#E67230]/25"
                          : "border-[#EBE7DF] shadow-2xs"
                      }`}
                    >
                      <div>
                        {/* Top Dedicated Visual Preview Area */}
                        <PracticeSuiteCardPreview type={item.illustrationType} />

                        {/* Category Label */}
                        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[#E67230]">
                          {item.tag}
                        </p>

                        {/* Bold Card Title */}
                        <h4 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-[#111111] transition-colors group-hover:text-[#E67230]">
                          {item.title}
                        </h4>

                        {/* Concise One-Sentence Description */}
                        <p className="mt-2 text-[13.5px] sm:text-[14px] leading-relaxed text-[#555555]">
                          {item.description}
                        </p>

                        {/* Reference Detail Strip */}
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#EBE7DF]/80 bg-[#FAF9F6] px-3 py-2 text-xs text-[#333333] transition-colors group-hover:bg-white group-hover:border-[#E67230]/30">
                          <span className="size-1.5 rounded-full bg-[#E67230] shrink-0" />
                          <span className="font-mono text-[11px] text-[#666666] truncate">
                            {item.referenceDetail}
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })}
              {/* Trailing spacer so the 6th card is not tight against the container edge */}
              <div className="w-8 shrink-0" aria-hidden="true" />
            </div>

            {/* Pagination Indicators below track */}
            <div className="mt-8 flex items-center justify-between border-t border-[#EBE7DF]/70 pt-4">
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Capabilities scroll pagination"
              >
                {carouselFeatures.map((feature, idx) => (
                  <button
                    key={feature.title}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    role="tab"
                    aria-selected={activeSlideIndex === idx}
                    aria-label={`Scroll to capability ${idx + 1}: ${feature.title}`}
                    className={`h-2 rounded-full transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230] ${
                      activeSlideIndex === idx
                        ? "w-8 bg-[#E67230]"
                        : "w-2 bg-[#EBE7DF] hover:bg-[#888888]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#E67230]">
                  Scroll Progress: {Math.round(scrollProgress * 100)}%
                </span>
                <div className="h-1.5 w-24 rounded-full bg-[#EBE7DF] overflow-hidden">
                  <div
                    className="h-full bg-[#E67230] transition-all duration-75"
                    style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Mobile / Tablet / Reduced Motion Fallback: Native horizontal swipe snap track */
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-none">
            {carouselFeatures.map((item) => {
              return (
                <div key={item.title} className="w-[85%] max-w-[340px] shrink-0 snap-center">
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="group relative flex h-full flex-col justify-start rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-2xs transition-all hover:border-[#E67230]/60 hover:bg-[#FFFBF8]"
                  >
                    <div>
                      {/* Top Dedicated Visual Preview Area */}
                      <PracticeSuiteCardPreview type={item.illustrationType} />

                      {/* Category Label */}
                      <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-[#E67230]">
                        {item.tag}
                      </p>

                      {/* Bold Card Title */}
                      <h4 className="mt-1 text-lg font-extrabold tracking-tight text-[#111111]">
                        {item.title}
                      </h4>

                      {/* Concise One-Sentence Description */}
                      <p className="mt-2 text-sm leading-relaxed text-[#555555]">
                        {item.description}
                      </p>

                      {/* Reference Detail Strip */}
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#EBE7DF]/80 bg-[#FAF9F6] px-3 py-2 text-xs text-[#333333]">
                        <span className="size-1.5 rounded-full bg-[#E67230] shrink-0" />
                        <span className="font-mono text-[11px] text-[#666666] truncate">
                          {item.referenceDetail}
                        </span>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*             CORE VAIDYA: INTERACTIVE CIRCULAR RADIAL SECTION               */
/* -------------------------------------------------------------------------- */

interface CoreVaidyaService {
  id: string;
  number: string;
  title: string;
  description: string;
  gradientClass: string;
  activeRingColor: string;
  badgeBg: string;
  subtleGlow: string;
}

const CORE_VAIDYA_SERVICES: CoreVaidyaService[] = [
  {
    id: "supply-chain",
    number: "01",
    title: "Supply Chain Management",
    description:
      "Coordinate medicine and consumable supplies with trusted business partners, supporting reliable availability throughout the patient-care journey.",
    gradientClass: "from-[#F58238] via-[#E67230] to-[#CF5C1D]",
    activeRingColor: "#E67230",
    badgeBg: "rgba(230, 114, 48, 0.12)",
    subtleGlow: "0 14px 38px -8px rgba(230, 114, 48, 0.42)",
  },
  {
    id: "virtual-clinic",
    number: "02",
    title: "Virtual Clinic",
    description:
      "Connect electronic health records, patient relationship management, teleconsultation, e-prescriptions, and AI-assisted clinical decision support in one connected care experience.",
    gradientClass: "from-[#E67230] via-[#D86423] to-[#B85217]",
    activeRingColor: "#D86423",
    badgeBg: "rgba(216, 100, 35, 0.12)",
    subtleGlow: "0 14px 38px -8px rgba(216, 100, 35, 0.42)",
  },
  {
    id: "package-service",
    number: "03",
    title: "Package Service Management",
    description:
      "Organise ongoing medical support, treatment follow-ups, and coordinated services to deliver more consistent patient care.",
    gradientClass: "from-[#D86423] via-[#BE561A] to-[#A04412]",
    activeRingColor: "#BE561A",
    badgeBg: "rgba(190, 86, 26, 0.12)",
    subtleGlow: "0 14px 38px -8px rgba(190, 86, 26, 0.42)",
  },
  {
    id: "practitioners-forum",
    number: "04",
    title: "Practitioners Forum & Co-practice",
    description:
      "Connect with fellow practitioners for collaboration, second opinions, co-signing, professional guidance, and shared clinical learning.",
    gradientClass: "from-[#F37B32] via-[#E06822] to-[#AE4E18]",
    activeRingColor: "#AE4E18",
    badgeBg: "rgba(174, 78, 24, 0.12)",
    subtleGlow: "0 14px 38px -8px rgba(174, 78, 24, 0.42)",
  },
];

export function CoreVaidyaSection() {
  const [selectedId, setSelectedId] = useState<string>("supply-chain");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId || selectedId;
  const activeService =
    CORE_VAIDYA_SERVICES.find((s) => s.id === activeId) ?? CORE_VAIDYA_SERVICES[0]!;

  return (
    <section
      id="core-vaidya"
      aria-labelledby="core-vaidya-title"
      className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] relative overflow-hidden py-14 sm:py-16 lg:py-20"
    >
      {/* Subtle background ambient radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(230, 114, 48, 0.08) 0%, rgba(250, 249, 246, 0) 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* ================================================================= */}
        {/* DESKTOP & TABLET: Left-hand Bigger Radial Circles + Right-hand Details */}
        {/* ================================================================= */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* LEFT COLUMN (Col 1 to 7): Bigger Circular Elements Diagram */}
          <div className="md:col-span-7 lg:col-span-7 flex justify-center items-center py-4">
            <div className="relative w-[480px] h-[480px] lg:w-[530px] lg:h-[530px] flex items-center justify-center">
              {/* Outer Decorative Dashed Orbit Ring */}
              <div
                className="absolute inset-[36px] lg:inset-[40px] rounded-full border border-dashed border-[#E67230]/35 pointer-events-none animate-[spin_120s_linear_infinite]"
                aria-hidden="true"
              />

              {/* Inner Subtle Guide Orbit Ring */}
              <div
                className="absolute inset-[78px] lg:inset-[86px] rounded-full border border-[#EBE7DF] pointer-events-none"
                aria-hidden="true"
              />

              {/* Central Meyveda Logo Hub */}
              <div className="relative z-20 flex flex-col items-center justify-center size-[116px] lg:size-[128px] rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-[#EBE7DF] p-3.5 transition-transform duration-300 hover:scale-105">
                <img
                  src={justMeyvedDownLogo}
                  alt="Meyveda Logo"
                  className="max-h-[68px] max-w-[82px] w-auto h-auto object-contain select-none"
                />
                <span className="sr-only">Meyveda Ecosystem Core</span>
              </div>

              {/* 4 Interactive Orange-Gradient Circles - Bigger Scale */}
              {/* 1. TOP: Supply Chain Management */}
              {(() => {
                const service = CORE_VAIDYA_SERVICES[0]!;
                const isCurrent = activeId === service.id;
                return (
                  <button
                    type="button"
                    id={`core-vaidya-circle-${service.id}`}
                    aria-label={`View details for ${service.title}`}
                    aria-pressed={selectedId === service.id}
                    onClick={() => setSelectedId(service.id)}
                    onMouseEnter={() => setHoveredId(service.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setSelectedId(service.id)}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 z-30 size-[152px] lg:size-[170px] rounded-full p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 ${
                      isCurrent
                        ? "scale-106 z-40 border-[2.5px] border-white ring-4 ring-[#E67230]/35 shadow-xl"
                        : "scale-100 hover:scale-104 border border-white/50 opacity-95 hover:opacity-100"
                    }`}
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, #F98F4B 0%, #E67230 50%, #C95618 100%)"
                        : "linear-gradient(135deg, #F37E38 0%, #E67230 100%)",
                      boxShadow: isCurrent ? service.subtleGlow : "0 8px 24px -4px rgba(230, 114, 48, 0.28)",
                    }}
                  >
                    <span className="text-white font-extrabold text-[14px] lg:text-[15.5px] leading-[1.22] tracking-tight drop-shadow-xs select-none px-2">
                      {service.title}
                    </span>
                  </button>
                );
              })()}

              {/* 2. RIGHT: Virtual Clinic */}
              {(() => {
                const service = CORE_VAIDYA_SERVICES[1]!;
                const isCurrent = activeId === service.id;
                return (
                  <button
                    type="button"
                    id={`core-vaidya-circle-${service.id}`}
                    aria-label={`View details for ${service.title}`}
                    aria-pressed={selectedId === service.id}
                    onClick={() => setSelectedId(service.id)}
                    onMouseEnter={() => setHoveredId(service.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setSelectedId(service.id)}
                    className={`absolute top-1/2 right-0 -translate-y-1/2 z-30 size-[152px] lg:size-[170px] rounded-full p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 ${
                      isCurrent
                        ? "scale-106 z-40 border-[2.5px] border-white ring-4 ring-[#E67230]/35 shadow-xl"
                        : "scale-100 hover:scale-104 border border-white/50 opacity-95 hover:opacity-100"
                    }`}
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, #E67230 0%, #D45E1D 50%, #B84E14 100%)"
                        : "linear-gradient(135deg, #E67230 0%, #C8561A 100%)",
                      boxShadow: isCurrent ? service.subtleGlow : "0 8px 24px -4px rgba(216, 100, 35, 0.28)",
                    }}
                  >
                    <span className="text-white font-extrabold text-[14px] lg:text-[15.5px] leading-[1.22] tracking-tight drop-shadow-xs select-none px-2">
                      {service.title}
                    </span>
                  </button>
                );
              })()}

              {/* 3. BOTTOM: Package Service Management */}
              {(() => {
                const service = CORE_VAIDYA_SERVICES[2]!;
                const isCurrent = activeId === service.id;
                return (
                  <button
                    type="button"
                    id={`core-vaidya-circle-${service.id}`}
                    aria-label={`View details for ${service.title}`}
                    aria-pressed={selectedId === service.id}
                    onClick={() => setSelectedId(service.id)}
                    onMouseEnter={() => setHoveredId(service.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setSelectedId(service.id)}
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-30 size-[152px] lg:size-[170px] rounded-full p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 ${
                      isCurrent
                        ? "scale-106 z-40 border-[2.5px] border-white ring-4 ring-[#E67230]/35 shadow-xl"
                        : "scale-100 hover:scale-104 border border-white/50 opacity-95 hover:opacity-100"
                    }`}
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, #DD6724 0%, #BE561A 50%, #9F400F 100%)"
                        : "linear-gradient(135deg, #CC5B1C 0%, #AE4E18 100%)",
                      boxShadow: isCurrent ? service.subtleGlow : "0 8px 24px -4px rgba(190, 86, 26, 0.28)",
                    }}
                  >
                    <span className="text-white font-extrabold text-[14px] lg:text-[15.5px] leading-[1.22] tracking-tight drop-shadow-xs select-none px-2">
                      {service.title}
                    </span>
                  </button>
                );
              })()}

              {/* 4. LEFT: Practitioners Forum & Co-practice */}
              {(() => {
                const service = CORE_VAIDYA_SERVICES[3]!;
                const isCurrent = activeId === service.id;
                return (
                  <button
                    type="button"
                    id={`core-vaidya-circle-${service.id}`}
                    aria-label={`View details for ${service.title}`}
                    aria-pressed={selectedId === service.id}
                    onClick={() => setSelectedId(service.id)}
                    onMouseEnter={() => setHoveredId(service.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setSelectedId(service.id)}
                    className={`absolute top-1/2 left-0 -translate-y-1/2 z-30 size-[152px] lg:size-[170px] rounded-full p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 ${
                      isCurrent
                        ? "scale-106 z-40 border-[2.5px] border-white ring-4 ring-[#E67230]/35 shadow-xl"
                        : "scale-100 hover:scale-104 border border-white/50 opacity-95 hover:opacity-100"
                    }`}
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, #F37B32 0%, #D86221 50%, #A84915 100%)"
                        : "linear-gradient(135deg, #E67230 0%, #AE4E18 100%)",
                      boxShadow: isCurrent ? service.subtleGlow : "0 8px 24px -4px rgba(174, 78, 24, 0.28)",
                    }}
                  >
                    <span className="text-white font-extrabold text-[14px] lg:text-[15.5px] leading-[1.22] tracking-tight drop-shadow-xs select-none px-2">
                      {service.title}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN (Col 8 to 12): Section Title & Description on Right-Hand Side */}
          <div className="md:col-span-5 lg:col-span-5 flex flex-col justify-center">
            {/* Section Eyebrow, Main Heading & Subtitle */}
            <div className="mb-6 lg:mb-8 text-left">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
                MEMBER SERVICES · FOR MEMBER PRACTITIONERS
              </p>
              <h2
                id="core-vaidya-title"
                className="mt-2 text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#111111] leading-[1.18]"
              >
                Core Vaidya
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#555555] leading-relaxed">
                Connected care, coordinated supplies and a community of peers around your practice.
              </p>
            </div>

            {/* Interactive Selected Service Detail Card */}
            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-7 lg:p-8 shadow-sm transition-all duration-300">
              {/* Card Meta Tag */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230]">
                  {activeService.number}
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-[#E67230]">
                  Connected Service
                </span>
              </div>

              {/* Title */}
              <h3
                key={`title-${activeService.id}`}
                className="text-2xl lg:text-[24px] font-bold tracking-tight text-[#111111] transition-all duration-200"
              >
                {activeService.title}
              </h3>

              {/* Description */}
              <p
                key={`desc-${activeService.id}`}
                className="mt-3.5 text-base sm:text-[16px] leading-relaxed text-[#555555] transition-all duration-200"
              >
                {activeService.description}
              </p>
            </div>

            {/* Quick-switch indicator pills below card */}
            <div className="mt-4 flex items-center gap-2 justify-start">
              {CORE_VAIDYA_SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Select ${s.title}`}
                  onClick={() => setSelectedId(s.id)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeId === s.id
                      ? "w-8 bg-[#E67230]"
                      : "w-2.5 bg-[#EBE7DF] hover:bg-[#E67230]/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MOBILE LAYOUT (< md): Compact Connected Radial & Card Flow        */}
        {/* ================================================================= */}
        <div className="block md:hidden py-4">
          {/* Central Logo in compact connected layout */}
          <div className="flex justify-center mb-5">
            <div className="flex flex-col items-center justify-center size-[88px] rounded-full bg-white shadow-md border border-[#EBE7DF] p-2.5">
              <img
                src={justMeyvedDownLogo}
                alt="Meyveda Logo"
                className="max-h-[48px] max-w-[60px] w-auto h-auto object-contain select-none"
              />
            </div>
          </div>

          {/* 4 Interactive Circles in 2x2 Connected Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto mb-5">
            {CORE_VAIDYA_SERVICES.map((service) => {
              const isCurrent = activeId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  id={`core-vaidya-mobile-circle-${service.id}`}
                  aria-pressed={selectedId === service.id}
                  onClick={() => setSelectedId(service.id)}
                  className={`aspect-square rounded-full p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E67230] ${
                    isCurrent
                      ? "scale-105 border-2 border-white ring-2 ring-[#E67230]"
                      : "border border-white/40 opacity-90"
                  }`}
                  style={{
                    background: isCurrent
                      ? "linear-gradient(135deg, #F98F4B 0%, #E67230 50%, #C95618 100%)"
                      : "linear-gradient(135deg, #F37E38 0%, #E67230 100%)",
                    boxShadow: isCurrent ? service.subtleGlow : "0 4px 14px rgba(230, 114, 48, 0.25)",
                  }}
                >
                  <span className="text-white font-extrabold text-[12px] leading-[1.2] tracking-tight drop-shadow-xs select-none">
                    {service.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Description Card for Mobile */}
          <div className="rounded-2xl border border-[#EBE7DF] bg-white p-4.5 shadow-sm max-w-[400px] mx-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex size-5.5 items-center justify-center rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230]">
                {activeService.number}
              </span>
              <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#E67230]">
                Selected Service
              </span>
            </div>
            <h3 className="text-base font-bold text-[#111111]">
              {activeService.title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#555555]">
              {activeService.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*       MANAGED SERVICES ORGANIZATION: ANIMATED TREE OF GROWTH               */
/* -------------------------------------------------------------------------- */

interface ManagedServiceNode {
  id: string;
  number: string;
  title: string;
  description: string;
  gradient: string;
  glow: string;
  border: string;
  tag: string;
  leftPercent: number;
  topPercent: number;
  sizePercent: number;
}

const MANAGED_SERVICES_DATA: ManagedServiceNode[] = [
  {
    id: "physical-clinics",
    number: "01",
    title: "Physical Co-working Clinics",
    description:
      "Grow your practice in shared physical clinics without building every facility from scratch. Access turnkey consultation suites and collaborative clinical environments designed for modern AYUSH medicine.",
    gradient: "linear-gradient(135deg, #F98F4B 0%, #E67230 50%, #C95618 100%)",
    glow: "0 12px 32px -4px rgba(230, 114, 48, 0.45)",
    border: "#E67230",
    tag: "SHARED INFRASTRUCTURE",
    leftPercent: 27.7,
    topPercent: 61.0,
    sizePercent: 14.5,
  },
  {
    id: "customer",
    number: "02",
    title: "Customer & Practitioner Engagement",
    description:
      "Strengthen practitioner engagement and patient support at every touchpoint. Build enduring care relationships with seamless coordination and collaborative patient follow-up tools.",
    gradient: "linear-gradient(135deg, #F37E38 0%, #D86423 50%, #B84E14 100%)",
    glow: "0 12px 32px -4px rgba(216, 100, 35, 0.45)",
    border: "#D86423",
    tag: "PRACTITIONER ENGAGEMENT",
    leftPercent: 30.0,
    topPercent: 42.0,
    sizePercent: 13.0,
  },
  {
    id: "vision",
    number: "03",
    title: "Strategic Vision & Ecosystem",
    description:
      "Build a more connected future for the field of AYUSH and integrated healthcare. Unite clinical traditions with scalable digital standards and continuous collective intelligence.",
    gradient: "linear-gradient(135deg, #DD6724 0%, #BE561A 50%, #9F400F 100%)",
    glow: "0 12px 32px -4px rgba(190, 86, 26, 0.45)",
    border: "#AE4E18",
    tag: "ECOSYSTEM VISION",
    leftPercent: 46.2,
    topPercent: 30.3,
    sizePercent: 14.0,
  },
  {
    id: "innovation",
    number: "04",
    title: "Continuous Innovation",
    description:
      "Continuously improve products, clinical services and care delivery processes. Leverage modern digital health workflows and standardized clinical formulations for sustainable practice excellence.",
    gradient: "linear-gradient(135deg, #F98F4B 0%, #E67230 50%, #C95618 100%)",
    glow: "0 12px 32px -4px rgba(230, 114, 48, 0.45)",
    border: "#E67230",
    tag: "SYSTEMS INNOVATION",
    leftPercent: 61.8,
    topPercent: 42.0,
    sizePercent: 13.0,
  },
  {
    id: "operations",
    number: "05",
    title: "Operational Support System",
    description:
      "Bring day-to-day operations together with an all-inclusive practice support model. Streamline appointment orchestration, billing, supply logistics, and compliance through one unified partner.",
    gradient: "linear-gradient(135deg, #DD6724 0%, #BE561A 50%, #9F400F 100%)",
    glow: "0 12px 32px -4px rgba(190, 86, 26, 0.45)",
    border: "#AE4E18",
    tag: "OPERATING MODEL",
    leftPercent: 66.1,
    topPercent: 61.0,
    sizePercent: 14.5,
  },
];

export function ManagedServicesTreeSection() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Automatic cycling every 3 seconds across all 5 nodes in order
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MANAGED_SERVICES_DATA.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeService = MANAGED_SERVICES_DATA[currentIndex];

  return (
    <section
      id="managed-services"
      aria-labelledby="managed-services-title"
      className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] py-14 sm:py-18 lg:py-20 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(230, 114, 48, 0.07) 0%, rgba(250, 249, 246, 0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-14 xl:px-16">
        {/* DESKTOP (lg and up): 2-Column Responsive Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          {/* LEFT COLUMN: Section Header & Smooth Automatic Sliding Cards */}
          <div
            className="lg:col-span-5 flex flex-col justify-center z-10 lg:pl-12 xl:pl-20 max-w-[560px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Section Eyebrow, Title & Intro Description */}
            <div className="mb-5 lg:mb-6">
              <div className="inline-flex items-center gap-2 mb-2.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-[#E67230]/10 text-[#E67230]">
                  <Building2 className="size-3.5" />
                </span>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
                  MANAGED SERVICES · FOR CLINICS & CARE ORGANIZATIONS
                </p>
              </div>
              <h2
                id="managed-services-title"
                className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#111111] leading-[1.16]"
              >
                Managed Services Organization
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#555555] leading-relaxed">
                Shared clinical spaces, coordinated visibility and all-inclusive operational support
                for your next stage of growth.
              </p>
            </div>

            {/* Smooth Sliding Carousel Viewport */}
            <div className="relative overflow-hidden rounded-2xl border border-[#EBE7DF] bg-white shadow-sm transition-all duration-300">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {MANAGED_SERVICES_DATA.map((service) => {
                  return (
                    <div
                      key={service.id}
                      className="w-full shrink-0 p-6 sm:p-7 lg:p-8 flex flex-col justify-between"
                      style={{ minHeight: "260px" }}
                    >
                      <div>
                        {/* Card Meta / Eyebrow Header */}
                        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#FAF9F6]">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230]">
                              {service.number}
                            </span>
                            <span className="text-xs font-bold tracking-wider uppercase text-[#E67230]">
                              {service.tag}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#888888]">
                            <span className="size-1.5 rounded-full bg-[#E67230] animate-pulse" />
                            Tree Node {service.number} / 05
                          </span>
                        </div>

                        {/* Service Title */}
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] leading-tight">
                          {service.title}
                        </h3>

                        {/* Clarified Professional Description */}
                        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#555555]">
                          {service.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-6 pt-4 border-t border-[#EBE7DF]/80 flex items-center justify-between">
                        <a
                          href="#contact"
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#111111] hover:text-[#E67230] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230]"
                        >
                          <span>Learn More</span>
                          <ArrowRight className="size-4 text-[#E67230]" />
                        </a>

                        <span className="font-mono text-xs text-[#888888]">
                          Auto-sliding (3s) · Hover to pause
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Switcher Indicators with Progress Fill */}
            <div className="mt-4 flex items-center gap-2.5 justify-start">
              {MANAGED_SERVICES_DATA.map((s, index) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to ${s.title}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? "w-8 bg-[#E67230]"
                      : "w-2.5 bg-[#EBE7DF] hover:bg-[#E67230]/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Authentic Organic Tree with Natural Wind-Blown Foliage */}
          <div
            className="lg:col-span-7 flex justify-center items-center py-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative w-full aspect-[1536/1024] flex items-center justify-center select-none overflow-visible scale-105 xl:scale-110 transition-transform duration-500">
              {/* Authentic Organic Tree Artwork */}
              <img
                src={treePng}
                alt="Managed Services Growth Tree"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Natural Wind-Breeze Foliage Layer */}
              <svg
                viewBox="0 0 1536 1024"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="overlayLeafWarm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F9B183" />
                    <stop offset="100%" stopColor="#E67230" />
                  </linearGradient>
                  <linearGradient id="overlayLeafBurnt" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E67230" />
                    <stop offset="100%" stopColor="#AE4E18" />
                  </linearGradient>
                  <linearGradient id="overlayLeafAmber" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FBBF7A" />
                    <stop offset="100%" stopColor="#E67230" />
                  </linearGradient>
                  <linearGradient id="overlayLeafGolden" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FED7AA" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>

                {/* Wind Breeze Leaves: LEFT BRANCH FOLIAGE */}
                <g className="tree-leaf-sway-1" transform="translate(302, 364) rotate(-38)">
                  <path d="M 0 0 C -12 -20 -8 -36 0 -46 C 8 -36 12 -20 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.92" />
                </g>
                <g className="tree-leaf-rustle" transform="translate(334, 458) rotate(-45)">
                  <path d="M 0 0 C -11 -17 -6 -30 0 -38 C 6 -30 11 -17 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.94" />
                </g>
                <g className="tree-leaf-flutter" transform="translate(452, 266) rotate(22)">
                  <path d="M 0 0 C -10 -16 -5 -28 0 -35 C 5 -28 10 -16 0 0 Z" fill="url(#overlayLeafAmber)" opacity="0.9" />
                </g>
                <g className="tree-leaf-breeze" transform="translate(327, 658) rotate(48)">
                  <path d="M 0 0 C -14 -22 -9 -38 0 -48 C 9 -38 14 -22 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.9" />
                </g>
                <g className="tree-leaf-sway-2" transform="translate(502, 826) rotate(-28)">
                  <path d="M 0 0 C -11 -18 -7 -32 0 -40 C 7 -32 11 -18 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-sway-3" transform="translate(527, 863) rotate(35)">
                  <path d="M 0 0 C -12 -20 -7 -34 0 -42 C 7 -34 12 -20 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.92" />
                </g>

                {/* Wind Breeze Leaves: TOP CROWN FOLIAGE */}
                <g className="tree-leaf-breeze" transform="translate(564, 165) rotate(32)">
                  <path d="M 0 0 C -13 -20 -8 -36 0 -46 C 8 -36 13 -20 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.9" />
                </g>
                <g className="tree-leaf-sway-1" transform="translate(591, 325) rotate(-18)">
                  <path d="M 0 0 C -10 -16 -6 -30 0 -38 C 6 -30 10 -16 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-flutter" transform="translate(768, 110) rotate(-12)">
                  <path d="M 0 0 C -12 -18 -7 -32 0 -40 C 7 -32 12 -18 0 0 Z" fill="url(#overlayLeafAmber)" opacity="0.92" />
                </g>
                <g className="tree-leaf-rustle" transform="translate(783, 134) rotate(26)">
                  <path d="M 0 0 C -15 -24 -9 -42 0 -52 C 9 -42 15 -24 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.95" />
                </g>
                <g className="tree-leaf-breeze" transform="translate(849, 322) rotate(-24)">
                  <path d="M 0 0 C -11 -18 -6 -32 0 -40 C 6 -32 11 -18 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-sway-2" transform="translate(925, 171) rotate(38)">
                  <path d="M 0 0 C -12 -20 -7 -34 0 -44 C 7 -34 12 -20 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.92" />
                </g>
                <g className="tree-leaf-flutter" transform="translate(949, 213) rotate(-32)">
                  <path d="M 0 0 C -11 -17 -6 -30 0 -38 C 6 -30 11 -17 0 0 Z" fill="url(#overlayLeafAmber)" opacity="0.9" />
                </g>

                {/* Wind Breeze Leaves: RIGHT BRANCH FOLIAGE */}
                <g className="tree-leaf-sway-2" transform="translate(963, 164) rotate(42)">
                  <path d="M 0 0 C -12 -19 -7 -34 0 -42 C 7 -34 12 -19 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-breeze" transform="translate(1078, 271) rotate(-26)">
                  <path d="M 0 0 C -11 -18 -6 -32 0 -40 C 6 -32 11 -18 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.92" />
                </g>
                <g className="tree-leaf-rustle" transform="translate(1107, 299) rotate(36)">
                  <path d="M 0 0 C -16 -26 -10 -44 0 -54 C 10 -44 16 -26 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.95" />
                </g>
                <g className="tree-leaf-flutter" transform="translate(1234, 389) rotate(-34)">
                  <path d="M 0 0 C -13 -21 -8 -36 0 -46 C 8 -36 13 -21 0 0 Z" fill="url(#overlayLeafAmber)" opacity="0.92" />
                </g>
                <g className="tree-leaf-sway-3" transform="translate(1162, 549) rotate(45)">
                  <path d="M 0 0 C -11 -18 -7 -32 0 -40 C 7 -32 11 -18 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-breeze" transform="translate(1027, 773) rotate(-25)">
                  <path d="M 0 0 C -12 -19 -7 -34 0 -42 C 7 -34 12 -19 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.9" />
                </g>

                {/* Wind Breeze Leaves: CENTER & LOWER CANOPY */}
                <g className="tree-leaf-rustle" transform="translate(643, 495) rotate(-20)">
                  <path d="M 0 0 C -11 -17 -6 -30 0 -38 C 6 -30 11 -17 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-sway-1" transform="translate(713, 528) rotate(22)">
                  <path d="M 0 0 C -13 -20 -8 -36 0 -44 C 8 -36 13 -20 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.92" />
                </g>
                <g className="tree-leaf-flutter" transform="translate(563, 566) rotate(-35)">
                  <path d="M 0 0 C -11 -18 -6 -32 0 -40 C 6 -32 11 -18 0 0 Z" fill="url(#overlayLeafGolden)" opacity="0.9" />
                </g>
                <g className="tree-leaf-breeze" transform="translate(574, 642) rotate(40)">
                  <path d="M 0 0 C -14 -22 -8 -38 0 -48 C 8 -38 14 -22 0 0 Z" fill="url(#overlayLeafAmber)" opacity="0.92" />
                </g>
                <g className="tree-leaf-sway-2" transform="translate(861, 550) rotate(-28)">
                  <path d="M 0 0 C -10 -16 -6 -28 0 -36 C 6 -28 10 -16 0 0 Z" fill="url(#overlayLeafWarm)" opacity="0.9" />
                </g>
                <g className="tree-leaf-rustle" transform="translate(908, 881) rotate(32)">
                  <path d="M 0 0 C -12 -19 -7 -34 0 -42 C 7 -34 12 -19 0 0 Z" fill="url(#overlayLeafBurnt)" opacity="0.9" />
                </g>
              </svg>

              {/* 5 Seamless Interactive Hotspots */}
              {MANAGED_SERVICES_DATA.map((service, index) => {
                return (
                  <button
                    key={service.id}
                    type="button"
                    id={`managed-tree-node-${service.id}`}
                    aria-label={`View details for ${service.title}`}
                    aria-pressed={currentIndex === index}
                    onClick={() => setCurrentIndex(index)}
                    onMouseEnter={() => {
                      setCurrentIndex(index);
                      setIsHovered(true);
                    }}
                    onMouseLeave={() => setIsHovered(false)}
                    onFocus={() => setCurrentIndex(index)}
                    style={{
                      left: `${service.leftPercent}%`,
                      top: `${service.topPercent}%`,
                      width: `${service.sizePercent}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 aspect-square rounded-full cursor-pointer bg-transparent border-0 outline-none p-0 focus:outline-none"
                  >
                    <span className="sr-only">{service.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TABLET & MOBILE (< lg): Reflowed Responsive Layout                */}
        {/* Shows Complete Tree with all 5 Circular Nodes, Leaves & Roots     */}
        {/* Followed by the Interactive Information Card                     */}
        {/* ================================================================= */}
        <div className="block lg:hidden">
          {/* 1. Header (Eyebrow, Title & Intro Description) */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-[#E67230]/10 text-[#E67230]">
                <Building2 className="size-3.5" />
              </span>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
                MANAGED SERVICES · FOR CLINICS & CARE ORGANIZATIONS
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111] leading-tight">
              Managed Services Organization
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#555555] leading-relaxed">
              Shared clinical spaces, coordinated visibility and all-inclusive operational support
              for your next stage of growth.
            </p>
          </div>

          {/* 2. Complete Tree Illustration with All 5 Circular Nodes */}
          <div
            className="relative w-full max-w-[680px] mx-auto aspect-[1536/1024] flex items-center justify-center select-none my-4 sm:my-6 overflow-visible"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Tree Artwork */}
            <img
              src={treePng}
              alt="Managed Services Growth Tree"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Natural Wind-Breeze Foliage Layer */}
            <svg
              viewBox="0 0 1536 1024"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="overlayLeafWarmMobile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F9B183" />
                  <stop offset="100%" stopColor="#E67230" />
                </linearGradient>
                <linearGradient id="overlayLeafBurntMobile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E67230" />
                  <stop offset="100%" stopColor="#AE4E18" />
                </linearGradient>
                <linearGradient id="overlayLeafAmberMobile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FBBF7A" />
                  <stop offset="100%" stopColor="#E67230" />
                </linearGradient>
                <linearGradient id="overlayLeafGoldenMobile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FED7AA" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
              </defs>

              {/* Foliage Leaves */}
              <g className="tree-leaf-sway-1" transform="translate(302, 364) rotate(-38)">
                <path d="M 0 0 C -12 -20 -8 -36 0 -46 C 8 -36 12 -20 0 0 Z" fill="url(#overlayLeafWarmMobile)" opacity="0.92" />
              </g>
              <g className="tree-leaf-rustle" transform="translate(334, 458) rotate(-45)">
                <path d="M 0 0 C -11 -17 -6 -30 0 -38 C 6 -30 11 -17 0 0 Z" fill="url(#overlayLeafBurntMobile)" opacity="0.94" />
              </g>
              <g className="tree-leaf-flutter" transform="translate(452, 266) rotate(22)">
                <path d="M 0 0 C -10 -16 -5 -28 0 -35 C 5 -28 10 -16 0 0 Z" fill="url(#overlayLeafAmberMobile)" opacity="0.9" />
              </g>
              <g className="tree-leaf-breeze" transform="translate(327, 658) rotate(48)">
                <path d="M 0 0 C -14 -22 -9 -38 0 -48 C 9 -38 14 -22 0 0 Z" fill="url(#overlayLeafGoldenMobile)" opacity="0.9" />
              </g>
              <g className="tree-leaf-breeze" transform="translate(564, 165) rotate(32)">
                <path d="M 0 0 C -13 -20 -8 -36 0 -46 C 8 -36 13 -20 0 0 Z" fill="url(#overlayLeafGoldenMobile)" opacity="0.9" />
              </g>
              <g className="tree-leaf-sway-1" transform="translate(591, 325) rotate(-18)">
                <path d="M 0 0 C -10 -16 -6 -30 0 -38 C 6 -30 10 -16 0 0 Z" fill="url(#overlayLeafWarmMobile)" opacity="0.9" />
              </g>
              <g className="tree-leaf-flutter" transform="translate(768, 110) rotate(-12)">
                <path d="M 0 0 C -12 -18 -7 -32 0 -40 C 7 -32 12 -18 0 0 Z" fill="url(#overlayLeafAmberMobile)" opacity="0.92" />
              </g>
              <g className="tree-leaf-rustle" transform="translate(783, 134) rotate(26)">
                <path d="M 0 0 C -15 -24 -9 -42 0 -52 C 9 -42 15 -24 0 0 Z" fill="url(#overlayLeafBurntMobile)" opacity="0.95" />
              </g>
              <g className="tree-leaf-sway-2" transform="translate(925, 171) rotate(38)">
                <path d="M 0 0 C -12 -20 -7 -34 0 -44 C 7 -34 12 -20 0 0 Z" fill="url(#overlayLeafGoldenMobile)" opacity="0.92" />
              </g>
              <g className="tree-leaf-breeze" transform="translate(1078, 271) rotate(-26)">
                <path d="M 0 0 C -11 -18 -6 -32 0 -40 C 6 -32 11 -18 0 0 Z" fill="url(#overlayLeafGoldenMobile)" opacity="0.92" />
              </g>
              <g className="tree-leaf-rustle" transform="translate(1107, 299) rotate(36)">
                <path d="M 0 0 C -16 -26 -10 -44 0 -54 C 10 -44 16 -26 0 0 Z" fill="url(#overlayLeafBurntMobile)" opacity="0.95" />
              </g>
              <g className="tree-leaf-flutter" transform="translate(1234, 389) rotate(-34)">
                <path d="M 0 0 C -13 -21 -8 -36 0 -46 C 8 -36 13 -21 0 0 Z" fill="url(#overlayLeafAmberMobile)" opacity="0.92" />
              </g>
            </svg>

            {/* 5 Seamless Interactive Touch/Click Hotspots on Tree Artwork */}
            {MANAGED_SERVICES_DATA.map((service, index) => {
              const isSelected = currentIndex === index;
              return (
                <button
                  key={service.id}
                  type="button"
                  id={`managed-tree-node-mobile-${service.id}`}
                  aria-label={`Select ${service.title}`}
                  aria-pressed={isSelected}
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    left: `${service.leftPercent}%`,
                    top: `${service.topPercent}%`,
                    width: `${service.sizePercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 aspect-square rounded-full cursor-pointer transition-all duration-300 p-0 focus:outline-none ${
                    isSelected
                      ? "ring-4 ring-[#E67230]/70 ring-offset-2 ring-offset-[#FAF9F6] shadow-md"
                      : "ring-0 hover:ring-2 hover:ring-[#E67230]/40"
                  }`}
                >
                  <span className="sr-only">{service.title}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Interactive Information Card with Slide Indicators */}
          <div
            className="w-full max-w-[540px] mx-auto mt-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Sliding Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#EBE7DF] bg-white shadow-sm transition-all duration-300">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {MANAGED_SERVICES_DATA.map((service) => {
                  return (
                    <div
                      key={service.id}
                      className="w-full shrink-0 p-5 sm:p-7 flex flex-col justify-between"
                      style={{ minHeight: "220px" }}
                    >
                      <div>
                        {/* Card Meta / Eyebrow Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#FAF9F6]">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230]">
                              {service.number}
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#E67230]">
                              {service.tag}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#888888]">
                            <span className="size-1.5 rounded-full bg-[#E67230] animate-pulse" />
                            Tree Node {service.number} / 05
                          </span>
                        </div>

                        {/* Service Title */}
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#111111] leading-snug">
                          {service.title}
                        </h3>

                        {/* Clarified Professional Description */}
                        <p className="mt-2 sm:mt-2.5 text-sm sm:text-base leading-relaxed text-[#555555]">
                          {service.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 pt-3.5 border-t border-[#EBE7DF]/80 flex items-center justify-between">
                        <a
                          href="#contact"
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#111111] hover:text-[#E67230] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230]"
                        >
                          <span>Learn More</span>
                          <ArrowRight className="size-3.5 sm:size-4 text-[#E67230]" />
                        </a>

                        <span className="font-mono text-[11px] sm:text-xs text-[#888888]">
                          Auto-sliding (3s)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Switcher Indicators with Progress Fill */}
            <div className="mt-3.5 flex items-center gap-2.5 justify-center">
              {MANAGED_SERVICES_DATA.map((s, index) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to ${s.title}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? "w-8 bg-[#E67230]"
                      : "w-2.5 bg-[#EBE7DF] hover:bg-[#E67230]/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MeyvedaDoctorsPage() {
  const router = useRouter();
  const navigate = useNavigate();
  // Navigation & modals
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Authentication Context Hook
  const { user, isAuthenticated, logout, login, register: authRegister } = useAuth();

  const handleExploreDoctorDashboard = () => {
    const token =
      localStorage.getItem("meyveda_access_token") ||
      localStorage.getItem("meyveda_auth_token") ||
      localStorage.getItem("meyveda_token");

    let isStoreSignedIn = false;
    try {
      const rawState = localStorage.getItem("meyveda_state");
      if (rawState) {
        const parsed = JSON.parse(rawState);
        if (parsed.signedIn) isStoreSignedIn = true;
      }
    } catch {
      /* ignore */
    }

    const hasAdminSession =
      Boolean(sessionStorage.getItem("meyveda-admin") || localStorage.getItem("meyveda-admin"));
    const hasMfgSession =
      Boolean(sessionStorage.getItem("mvg_mfg_session") || localStorage.getItem("mvg_mfg_session"));
    const storedRole = (
      localStorage.getItem("meyveda_user_role") ||
      user?.role ||
      ""
    ).toLowerCase();

    const isUserLoggedIn = Boolean(
      isAuthenticated || user || token || isStoreSignedIn || hasAdminSession || hasMfgSession
    );

    if (!isUserLoggedIn) {
      navigate({ to: "/register" });
      return;
    }

    if (storedRole === "admin" || hasAdminSession) {
      window.location.href = "/admin/home";
    } else if (storedRole === "manufacturer" || hasMfgSession) {
      window.location.href = "/manufacturer/overview";
    } else {
      navigate({ to: "/workspace" });
    }
  };

  // Safe navigation handler for anchor links and routes
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    } else if (href.startsWith("/")) {
      e.preventDefault();
      navigate({ to: href as any });
    }
  };

  // Registration Form State (Full Name, Qualification, Pincode, Reg No, Email OTP, Mobile OTP)
  const [doctorName, setDoctorName] = useState("");
  const [doctorDegree, setDoctorDegree] = useState("BAMS");
  const [doctorPincode, setDoctorPincode] = useState("");
  const [doctorCity, setDoctorCity] = useState("");
  const [doctorState, setDoctorState] = useState("");
  const [isDetectingDoctorCity, setIsDetectingDoctorCity] = useState(false);
  const [doctorCouncil, setDoctorCouncil] = useState<{
    board_type: string;
    board_name: string;
    statutory_act: string;
    controlling_authority: string;
    jurisdiction?: string;
    official_portal?: string;
    description?: string;
  } | null>(null);

  // Auto-detect City and Medical Council from PIN Code
  useEffect(() => {
    const cleanPin = doctorPincode.trim().replace(/\D/g, "").slice(0, 6);
    if (cleanPin.length === 6 && /^[1-9][0-9]{5}$/.test(cleanPin)) {
      let isCancelled = false;
      setIsDetectingDoctorCity(true);
      apiClient
        .get<any>(`/pincode/${cleanPin}`)
        .then((res) => {
          if (!isCancelled) {
            const detectedCity =
              res?.district ||
              res?.division ||
              res?.primary_post_office?.district ||
              "";
            const detectedState = res?.state || "";
            setDoctorCity(detectedCity);
            setDoctorState(detectedState);
            setDoctorCouncil(res?.ayush_governance || null);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setDoctorCouncil(null);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsDetectingDoctorCity(false);
          }
        });
      return () => {
        isCancelled = true;
      };
    } else {
      setDoctorCity("");
      setDoctorState("");
      setDoctorCouncil(null);
      setIsDetectingDoctorCity(false);
    }
  }, [doctorPincode]);
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [doctorInviteCode, setDoctorInviteCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (params.get("ref") || params.get("invite") || "").toUpperCase().slice(0, 5);
    }
    return "";
  });
  const [doctorInviteValidating, setDoctorInviteValidating] = useState(false);
  const [doctorInviteStatus, setDoctorInviteStatus] = useState<{
    checked: boolean;
    valid: boolean;
    doctorName?: string | null;
    message?: string;
  }>({ checked: false, valid: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidateDoctorInvite = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 5) return;
    setDoctorInviteValidating(true);
    try {
      const res = await apiClient.get<{
        valid: boolean;
        invite_code: string;
        doctor_name?: string | null;
        message: string;
      }>(`/auth/validate-invite/${clean}`);
      setDoctorInviteStatus({
        checked: true,
        valid: res.valid,
        doctorName: res.doctor_name,
        message: res.message,
      });
      if (res.valid) {
        toast.success(`Invite code verified! Referred by ${res.doctor_name}`);
      } else {
        toast.error(res.message || "Invalid invite code");
      }
    } catch {
      setDoctorInviteStatus({
        checked: true,
        valid: false,
        message: "Unable to verify invite code",
      });
    } finally {
      setDoctorInviteValidating(false);
    }
  };

  // Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const [emailDemoOtp, setEmailDemoOtp] = useState<string | null>(null);

  // Mobile OTP state
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [mobileToken, setMobileToken] = useState<string | null>(null);
  const [mobileDemoOtp, setMobileDemoOtp] = useState<string | null>(null);

  // Timers for OTP resend cooldowns
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setEmailCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailCooldown]);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const interval = setInterval(() => {
      setMobileCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mobileCooldown]);

  // 1. Send Email OTP
  const handleSendEmailOtp = async () => {
    const emailVal = validateAuthenticEmail(doctorEmail);
    if (!emailVal.valid) {
      toast.error(emailVal.error || "Please enter a valid email address.");
      return;
    }
    const trimmedEmail = emailVal.cleanEmail;
    setEmailSending(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        target: string;
        demo_otp?: string | null;
        expires_in?: number;
      }>("/auth/send-email-otp", { email: trimmedEmail });

      setEmailOtpSent(true);
      setEmailCooldown(60);
      if (res.demo_otp) {
        setEmailDemoOtp(res.demo_otp);
      } else {
        setEmailDemoOtp(null);
      }

      toast.success(res.message || `Verification code sent to ${trimmedEmail}`, {
        description: "Sent via Zoho ZeptoMail gateway. Valid for 5 minutes.",
        duration: 8000,
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch email verification code.";
      toast.error(msg);
      const match = msg.match(/wait (\d+) seconds/i);
      if (match && match[1]) {
        setEmailCooldown(parseInt(match[1], 10));
      }
    } finally {
      setEmailSending(false);
    }
  };

  // 2. Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    const cleanCode = emailOtpInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast.error("Please enter the 6-digit email OTP.");
      return;
    }
    setEmailVerifying(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        verified: boolean;
        message: string;
        verification_token?: string | null;
      }>("/auth/verify-email-otp", {
        email: doctorEmail.trim().toLowerCase(),
        otp: cleanCode,
      });

      if (res.verified) {
        setEmailVerified(true);
        setEmailOtpSent(false);
        if (res.verification_token) {
          setEmailToken(res.verification_token);
        }
        toast.success("Email address verified successfully!");
      } else {
        toast.error(res.message || "Invalid verification code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired email verification code.");
    } finally {
      setEmailVerifying(false);
    }
  };

  // 3. Send Mobile OTP
  const handleSendMobileOtp = async () => {
    const mobileVal = validateIndianMobile(doctorPhone);
    if (!mobileVal.valid) {
      toast.error(mobileVal.error || "Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    const finalMobile = mobileVal.cleanDigits;
    setMobileSending(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        target: string;
        demo_otp?: string | null;
        expires_in?: number;
      }>("/auth/send-sms-otp", { mobile: finalMobile });

      setMobileOtpSent(true);
      setMobileCooldown(60);
      if (res.demo_otp) {
        setMobileDemoOtp(res.demo_otp);
      } else {
        setMobileDemoOtp(null);
      }

      toast.success(res.message || `SMS verification code sent to +91 ${finalMobile}`, {
        description: "Sent via MSG91 SMS gateway. Valid for 5 minutes.",
        duration: 8000,
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch SMS verification code.";
      toast.error(msg);
      const match = msg.match(/wait (\d+) seconds/i);
      if (match && match[1]) {
        setMobileCooldown(parseInt(match[1], 10));
      }
    } finally {
      setMobileSending(false);
    }
  };

  // 4. Verify Mobile OTP
  const handleVerifyMobileOtp = async () => {
    const cleanCode = mobileOtpInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast.error("Please enter the 6-digit SMS OTP.");
      return;
    }
    setMobileVerifying(true);

    try {
      const cleaned = doctorPhone.replace(/\D/g, "").slice(-10);
      const res = await apiClient.post<{
        success: boolean;
        verified: boolean;
        message: string;
        verification_token?: string | null;
      }>("/auth/verify-sms-otp", {
        mobile: cleaned,
        otp: cleanCode,
      });

      if (res.verified) {
        setMobileVerified(true);
        setMobileOtpSent(false);
        if (res.verification_token) {
          setMobileToken(res.verification_token);
        }
        toast.success("Mobile number verified successfully!");
      } else {
        toast.error(res.message || "Invalid SMS verification code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired SMS verification code.");
    } finally {
      setMobileVerifying(false);
    }
  };

  // Handle Doctor Registration submit via backend API
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      toast.error("Please enter your Full Name.");
      return;
    }
    if (!doctorDegree) {
      toast.error("Please select your Qualification.");
      return;
    }
    if (!doctorPincode.trim() || !/^[1-9][0-9]{5}$/.test(doctorPincode.trim())) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return;
    }
    if (!doctorCity.trim()) {
      toast.error("Please wait for your city to be auto-verified from your PIN code.");
      return;
    }
    if (!doctorRegNo.trim()) {
      toast.error("Please enter your Doctor Registration Number.");
      return;
    }
    if (!emailVerified) {
      toast.error("Please verify your Email Address using the 6-digit OTP.");
      return;
    }
    if (!mobileVerified) {
      toast.error("Please verify your Mobile Number using the 6-digit SMS OTP.");
      return;
    }

    if (!doctorPassword || doctorPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    const cleanInvite = doctorInviteCode.trim().toUpperCase();
    if (!cleanInvite) {
      toast.error("Invite code is compulsory for registration.");
      return;
    }
    if (cleanInvite.length < 5) {
      toast.error("Invite code must be 5 characters (e.g. MSV77).");
      return;
    }
    if (doctorInviteStatus.checked && !doctorInviteStatus.valid) {
      toast.error("Invalid invite code. Please enter a valid invite code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedMobile = doctorPhone.replace(/\D/g, "").slice(-10);
      const formattedName = doctorName.trim().startsWith("Dr.") ? doctorName.trim() : `Dr. ${doctorName.trim()}`;

      const res = await apiClient.post<{
        id: string;
        email: string;
        role: string;
        status: string;
        message: string;
        access_token?: string | null;
        token_type?: string;
      }>("/auth/register", {
        email: doctorEmail.trim().toLowerCase(),
        password: doctorPassword,
        role: "doctor",
        full_name: formattedName,
        doctor_register_number: doctorRegNo.trim(),
        qualification: doctorDegree,
        pincode: doctorPincode.trim(),
        mobile: `+91 ${cleanedMobile}`,
        phone: cleanedMobile,
        verification_token: emailToken || undefined,
        invite_code: cleanInvite,
      });

      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        setStoredToken(res.access_token);
      }

      toast.success(
        `Welcome to Meyveda, ${formattedName}! Your practitioner workspace is active.`,
        { duration: 6000 }
      );
      setRegisterModalOpen(false);

      // Reset form
      setDoctorName("");
      setDoctorEmail("");
      setDoctorPhone("");
      setDoctorRegNo("");
      setDoctorPincode("");
      setDoctorCity("");
      setDoctorState("");
      setDoctorCouncil(null);
      setEmailVerified(false);
      setMobileVerified(false);
      setEmailOtpSent(false);
      setMobileOtpSent(false);
      setEmailToken(null);
      setMobileToken(null);

      // Redirect immediately to Doctor Workspace
      router.navigate({ to: "/workspace" });
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please verify your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Modal State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Meyveda Landing Page Interactive Previews
  const [currentAyushIndex, setCurrentAyushIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAyushIndex((prev) => (prev + 1) % AYUSH_SYSTEMS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Sign In submit via backend API
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword) {
      toast.error("Please enter both your registered email and password.");
      return;
    }

    setIsSigningIn(true);
    try {
      const cleanEmail = signInEmail.trim().toLowerCase();
      const res = await login({
        email: cleanEmail,
        password: signInPassword,
      });
      const userRole = (res?.role || "").toLowerCase();

      if (userRole === "admin" || cleanEmail === "admin@meyveda.com") {
        const adminSession = {
          name: "Platform Administrator",
          email: cleanEmail,
          role: "Platform Administrator",
        };
        sessionStorage.setItem("meyveda-admin", JSON.stringify(adminSession));
        localStorage.setItem("meyveda-admin", JSON.stringify(adminSession));
        localStorage.setItem("meyveda_user_role", "admin");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Administrator session verified. Redirecting to Admin Console...");
        setSignInModalOpen(false);
        setSignInEmail("");
        setSignInPassword("");
        window.location.href = "/admin/home";
        return;
      }

      if (userRole === "manufacturer") {
        const mfgSession = {
          brandName: "Registered Manufacturer",
          contactPerson: "Manufacturer Representative",
          email: cleanEmail,
          licenseNumber: "AYUSH/MFG/VERIFIED",
        };
        sessionStorage.setItem("meyveda_manufacturer_session", JSON.stringify(mfgSession));
        localStorage.setItem("meyveda_manufacturer_session", JSON.stringify(mfgSession));
        localStorage.setItem("meyveda_user_role", "manufacturer");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Manufacturer session verified. Redirecting to Manufacturer Portal...");
        setSignInModalOpen(false);
        setSignInEmail("");
        setSignInPassword("");
        window.location.href = "/manufacturer/overview";
        return;
      }

      toast.success("Welcome back! Signed in successfully.");
      setSignInModalOpen(false);
      setSignInEmail("");
      setSignInPassword("");

      // Redirect immediately to Doctor Dashboard
      router.navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Elegant Brand Cursor Ring & Subtle Trail (Desktop fine-pointer only, disabled for touch & reduced motion)
  const cursorRef = useRef<{
    ring: HTMLDivElement | null;
    dot: HTMLDivElement | null;
    trail: HTMLDivElement | null;
  }>({ ring: null, dot: null, trail: null });
  const [cursorActive, setCursorActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || isReducedMotion) return;

    let targetX = -100;
    let targetY = -100;
    let trailX = -100;
    let trailY = -100;
    let isMoving = false;
    let animId: number | null = null;
    let hasInitialized = false;

    const updateLoop = () => {
      // Ease trail toward target
      const dx = targetX - trailX;
      const dy = targetY - trailY;
      trailX += dx * 0.28;
      trailY += dy * 0.28;

      if (cursorRef.current.trail) {
        cursorRef.current.trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`;
      }

      // If trail has caught up within threshold and user isn't moving, sleep the RAF loop to save CPU
      if (!isMoving && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
        animId = null;
        return;
      }

      animId = requestAnimationFrame(updateLoop);
    };

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasInitialized) {
        trailX = targetX;
        trailY = targetY;
        hasInitialized = true;
      }

      // Position immediate ring and dot directly for instant responsive feedback
      if (cursorRef.current.ring) {
        cursorRef.current.ring.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }
      if (cursorRef.current.dot) {
        cursorRef.current.dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }

      setCursorActive(true);
      isMoving = true;

      // Start easing loop if not already running
      if (animId === null) {
        animId = requestAnimationFrame(updateLoop);
      }

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isMoving = false;
      }, 70);
    };

    const handleMouseLeave = () => {
      setCursorActive(false);
      isMoving = false;
      if (idleTimer) clearTimeout(idleTimer);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#111111] overflow-x-clip relative">
      {/* Elegant Orange Cursor Ring, Center Dot, and Subtle Trailing Dot (zero pointer events) */}
      <div
        aria-hidden="true"
        className="meyveda-cursor-container pointer-events-none transition-opacity duration-300 ease-out"
        style={{ opacity: cursorActive ? 1 : 0 }}
      >
        <div
          ref={(el) => {
            cursorRef.current.trail = el;
          }}
          className="meyveda-cursor-trail"
        />
        <div
          ref={(el) => {
            cursorRef.current.ring = el;
          }}
          className="meyveda-cursor-ring"
        />
        <div
          ref={(el) => {
            cursorRef.current.dot = el;
          }}
          className="meyveda-cursor-dot"
        />
      </div>
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION                                                    */}
      {/* Hierarchy: LEFT: Logo | CENTER: Links | RIGHT: [Sign In] [Register]  */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 sm:h-22 sm:px-8 lg:px-12">
          {/* LEFT: Meyveda Logo */}
          <a
            aria-label="Meyveda — Home"
            className="inline-flex items-center rounded-sm transition-opacity hover:opacity-90"
            href="#top"
          >
            <MeyvedaLogo />
          </a>

          {/* CENTER: Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navigation.map((item) => (
              <a
                className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
                href={item.href}
                key={item.label}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* RIGHT: CTAs (Sign In + Register Modal Triggers or Authenticated User) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#EBE7DF] hover:border-[#E67230]/40 transition-colors"
                >
                  <span className="size-6 sm:size-7 rounded-full bg-[#E67230] text-white flex items-center justify-center text-xs font-bold">
                    {(user.doctor_profile?.full_name || user.email)[0]?.toUpperCase()}
                  </span>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-[#111111] leading-tight line-clamp-1">
                      {user.doctor_profile?.full_name || user.email.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-[#777777] font-semibold leading-tight capitalize">
                      {user.role} · Active
                    </p>
                  </div>
                </Link>
                <Link
                  to="/dashboard"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E67230] hover:bg-[#D15F1F] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>My Workspace</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    toast.info("Signed out of your session.");
                  }}
                  className="text-xs font-semibold text-[#666666] hover:text-[#E67230] px-2 py-1.5 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm sm:text-[15px] font-bold text-[#111111] transition-colors hover:text-[#E67230]"
                >
                  Sign In
                </Link>

                <div className="hidden sm:block">
                  <RegisterPrimaryButton
                    className="h-11 px-5 text-sm sm:text-[15px] font-bold"
                    onClick={() => setRegisterModalOpen(true)}
                  >
                    Register as Doctor
                  </RegisterPrimaryButton>
                </div>

                <div className="sm:hidden">
                  <RegisterPrimaryButton
                    className="h-10 px-3.5 text-xs font-bold"
                    onClick={() => setRegisterModalOpen(true)}
                  >
                    Register as Doctor
                  </RegisterPrimaryButton>
                </div>
              </>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-10 items-center justify-center rounded-md border border-[#EBE7DF] bg-[#FAF9F6] text-[#111111] lg:hidden"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-b border-[#EBE7DF] bg-white px-5 py-6 lg:hidden"
          >
            <nav className="flex flex-col space-y-3.5">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item.href);
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-md px-2 py-1.5 text-base font-semibold text-[#111111] hover:bg-[#FAF9F6] hover:text-[#E67230]"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-[#EBE7DF] flex flex-col gap-2.5">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF9F6] border border-[#EBE7DF]">
                      <span className="size-8 rounded-full bg-[#E67230] text-white flex items-center justify-center text-xs font-bold">
                        {(user.doctor_profile?.full_name || user.email)[0]?.toUpperCase()}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#111111]">
                          {user.doctor_profile?.full_name || user.email}
                        </p>
                        <p className="text-xs text-[#666666] capitalize">{user.role} · Active</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white py-2.5 text-center text-sm font-bold shadow-xs transition-colors"
                    >
                      Open Practitioner Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        toast.info("Signed out.");
                      }}
                      className="w-full rounded-md border border-[#EBE7DF] bg-white py-2 text-center text-sm font-bold text-[#666666] hover:text-[#E67230]"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full rounded-md border border-[#EBE7DF] bg-white py-2.5 text-center text-sm font-bold text-[#111111] hover:bg-[#FAF9F6]"
                    >
                      Doctor Sign In
                    </Link>
                    <RegisterPrimaryButton
                      className="w-full h-11 text-sm font-bold"
                      onClick={() => {
                        setRegisterModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Register as Doctor
                    </RegisterPrimaryButton>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION — CINEMATIC FULL-BLEED VIDEO BACKGROUND             */}
      {/* Eyebrow: FOR AYURVEDA DOCTORS | Headline: Three deliberate lines    */}
      {/* Primary CTA: REGISTER | Left content overlay | Pure video background */}
      {/* ==================================================================== */}
      {/* 2. HERO SECTION — FULL-WIDTH BACKGROUND VIDEO WITH LEFT TEXT OVERLAY  */}
      {/* Background: Rishi.mp4 | Scaled character on right | Left editorial text  */}
      {/* ==================================================================== */}
      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-5.5rem)] lg:max-h-[820px] items-center overflow-hidden bg-[#FAF9F6] py-8 sm:py-10 lg:py-0"
        id="top"
      >
        {/* Full-Bleed Background Video Layer */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
          <div className="absolute inset-0 flex items-center justify-end">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="h-full w-full object-cover object-[75%_center] sm:object-[82%_center] md:object-[88%_center] lg:object-[88%_center] lg:w-[85%] lg:max-w-none xl:w-[82%]"
            >
              <source src={rishiVideo} type="video/mp4" />
            </video>
          </div>

          {/* Subtle Localized Readability Gradient behind left-side text */}
          {/* Fading transition begins around the horizontal position where 'Next' ends (~36-40%) and clears quickly */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAF9F6]/85 via-[#FAF9F6]/45 to-transparent sm:from-[#FAF9F6]/80 sm:via-[#FAF9F6]/35 sm:to-transparent lg:bg-gradient-to-r lg:from-[#FAF9F6]/95 lg:from-0% lg:via-[#FAF9F6]/90 lg:via-26% lg:via-[#FAF9F6]/55 lg:via-36% lg:via-[#FAF9F6]/15 lg:via-44% lg:to-transparent lg:to-50%"
          />
        </div>

        {/* Hero Content Layer (Structured Left Side) */}
        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="meyveda-enter max-w-[540px] lg:max-w-[490px] xl:max-w-[520px]">
            {/* Section Eyebrow */}
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#E67230] sm:text-xs">
              Dear <strong className="font-bold text-[#E65C24]">AYUSH</strong> Practitioners,
            </p>

            {/* Headline — Refined editorial display font contrasting tastefully with body typography */}
            <h1
              id="hero-title"
              className="text-[36px] sm:text-[44px] lg:text-[48px] xl:text-[52px] font-bold leading-[1.06] tracking-tight text-[#111111]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              <span className="block tracking-[-0.01em]">
                REINVENT YOU<span className="text-[#E67230]">R</span>
              </span>
            </h1>

            {/* Black rectangular box with animated AYUSH system carousel */}
            <div className="mt-3 flex items-center">
              <div className="inline-flex h-11 sm:h-12 items-center rounded-lg bg-[#111111] px-4 sm:px-5 shadow-md border border-[#222222]">
                <div
                  key={currentAyushIndex}
                  className="ayush-carousel-slide flex items-center gap-2.5"
                >
                  <span className="shrink-0 flex items-center justify-center">
                    {AYUSH_SYSTEMS[currentAyushIndex]?.icon}
                  </span>
                  <span className="text-base sm:text-lg font-bold tracking-wide text-white">
                    {AYUSH_SYSTEMS[currentAyushIndex]?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Practice-method line and just_meyveda.png logo */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:gap-3 text-sm sm:text-base lg:text-[17px] font-bold text-[#111111]">
              <span>practice method with</span>
              <img
                src={justMeyvedaLogo}
                alt="Meyveda"
                width={2151}
                height={731}
                className="inline-block h-10 sm:h-11 lg:h-12 w-auto object-contain shrink-0"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Supporting Headline */}
            <h2 className="mt-4 text-lg sm:text-xl lg:text-[22px] font-extrabold leading-snug text-[#111111]">
              Ancient Wisdom. Modern Practice. Your Next Chapter Starts Here.
            </h2>

            {/* Supporting paragraph text */}
            <p className="mt-2 max-w-[460px] text-xs sm:text-sm leading-relaxed text-[#555555]">
              Bring trusted <strong className="font-bold text-[#E65C24]">AYUSH</strong> knowledge, clinical insights, and smarter practice management
              together in one place. Discover a more connected way to strengthen your practice and
              deepen your knowledge with community grow the confidence.
            </p>

            {/* Action Buttons: Explore Doctor Dashboard CTA */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RegisterPrimaryButton
                size="default"
                className="h-11 sm:h-12 px-6 text-sm sm:text-[15px]"
                onClick={handleExploreDoctorDashboard}
              >
                Explore Doctor Dashboard
              </RegisterPrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. DOCTOR-CENTRIC VALUE BRIDGE & CAROUSEL (#doctors)                 */}
      {/* Concise value proposition + Sleek carousel WITHOUT number indicator  */}
      {/* ==================================================================== */}
      <section
        id="doctors"
        aria-labelledby="practice-connected-title"
        className="scroll-mt-20 border-y border-[#EBE7DF] bg-[#FAF9F6] py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          {/* Editorial Split Intro */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            <div className="lg:col-span-4 xl:col-span-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                <strong className="font-bold text-[#E65C24]">AYUSH</strong> Medical Intelligence
              </p>
              <h2
                id="practice-connected-title"
                className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-[#111111] sm:text-4xl lg:text-[40px] xl:text-[42px]"
              >
                Classical Knowledge.
                <br />
                Medicine Intelligence.
                <br />
                <span className="text-[#E67230]">Evidence-Driven Practice.</span>
              </h2>
            </div>
            <div className="lg:col-span-8 xl:col-span-8 lg:border-l lg:border-[#EBE7DF] lg:pl-10 xl:pl-12">
              <p className="text-base sm:text-lg lg:text-[18px] leading-relaxed sm:leading-[1.75] text-[#555555]">
                Meyveda connects authoritative Samhita literature, commercial formulation
                records, and batch-level testing evidence with your personal research—built
                specifically for <strong className="font-bold text-[#E65C24]">AYUSH</strong> physicians.
              </p>

              {/* 3 Distinctive Doctor Value Cards: Balanced row on desktop, equal widths/heights, generous text room */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-3.5 xl:gap-4 items-stretch">
                {/* Value Card 1: Knowledge, HRMS & Compliance */}
                <div className="group flex h-full flex-col justify-start rounded-2xl border border-[#EBE7DF] bg-white p-4.5 sm:p-5 lg:p-4.5 xl:p-5 shadow-2xs transition-all duration-250 hover:border-[#E67230]/60 hover:bg-[#FFFBF8] hover:shadow-xs motion-reduce:transition-none">
                  {/* Upper Row: Left-aligned Icon and Top Heading */}
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    {/* Compact Animated Vector Icon */}
                    <div className="shrink-0 w-9 sm:w-10 lg:w-9.5 xl:w-10 flex items-center justify-center transition-transform duration-250 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0">
                      <svg
                        viewBox="0 0 72 72"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-9 sm:size-10 lg:size-9.5 xl:size-10 text-[#E67230] meyveda-icon-float"
                        aria-hidden="true"
                      >
                        {/* Open manuscript & legal balance scales doodle */}
                        <path
                          d="M36 48C30 44 20 44 10 47V23C20 20 30 20 36 24M36 48C42 44 52 44 62 47V23C52 20 42 20 36 24M36 48V24"
                          stroke="#E67230"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Compliance check shield mark */}
                        <path
                          d="M48 20L53 25L61 17"
                          stroke="#E67230"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Manuscript lines */}
                        <path
                          d="M17 29C22 28 27 28 30 29M17 35C22 34 27 34 30 35M17 41C22 40 27 40 30 41"
                          stroke="#E67230"
                          strokeWidth="1.75"
                          strokeOpacity="0.55"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <h3 className="flex-1 min-w-0 text-[16px] sm:text-[17px] lg:text-[16px] xl:text-[17px] font-bold tracking-tight text-[#111111] leading-snug">
                      Knowledge, HRMS & Compliance
                    </h3>
                  </div>

                  {/* Lower Content Area: Regular-weight, readable secondary description */}
                  <p className="mt-2.5 sm:mt-3 text-[13.5px] sm:text-[14px] lg:text-[13px] xl:text-[14px] font-normal leading-relaxed text-[#555555]">
                    Trusted clinical references, practice resources, HRMS tools, and compliance support in one place.
                  </p>
                </div>

                {/* Value Card 2: Ethical Supply & Billing */}
                <div className="group flex h-full flex-col justify-start rounded-2xl border border-[#EBE7DF] bg-white p-4.5 sm:p-5 lg:p-4.5 xl:p-5 shadow-2xs transition-all duration-250 hover:border-[#E67230]/60 hover:bg-[#FFFBF8] hover:shadow-xs motion-reduce:transition-none">
                  {/* Upper Row: Left-aligned Icon and Top Heading */}
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    {/* Compact Animated Vector Icon */}
                    <div className="shrink-0 w-9 sm:w-10 lg:w-9.5 xl:w-10 flex items-center justify-center transition-transform duration-250 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0">
                      <svg
                        viewBox="0 0 72 72"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-9 sm:size-10 lg:size-9.5 xl:size-10 text-[#E67230] meyveda-icon-pulse"
                        aria-hidden="true"
                      >
                        {/* Medicine box / ethical supply delivery carton */}
                        <path
                          d="M36 14L56 25V47L36 58L16 47V25L36 14Z"
                          stroke="#E67230"
                          strokeWidth="2.25"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M36 14V58M16 25L36 36L56 25"
                          stroke="#E67230"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {/* Transparent billing receipt / tick symbol on carton */}
                        <circle cx="36" cy="36" r="6" fill="#FFFBF8" stroke="#E67230" strokeWidth="1.75" />
                        <path
                          d="M33.5 36L35.5 38L39 34.5"
                          stroke="#E67230"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <h3 className="flex-1 min-w-0 text-[16px] sm:text-[17px] lg:text-[16px] xl:text-[17px] font-bold tracking-tight text-[#111111] leading-snug">
                      Ethical Supply & Billing
                    </h3>
                  </div>

                  {/* Lower Content Area: Regular-weight, readable secondary description */}
                  <p className="mt-2.5 sm:mt-3 text-[13.5px] sm:text-[14px] lg:text-[13px] xl:text-[14px] font-normal leading-relaxed text-[#555555]">
                    Simplify medicine sourcing, consumable supply, and transparent, patient-centric billing.
                  </p>
                </div>

                {/* Value Card 3: Practice Growth & MSO Services */}
                <div className="group flex h-full flex-col justify-start rounded-2xl border border-[#EBE7DF] bg-white p-4.5 sm:p-5 lg:p-4.5 xl:p-5 shadow-2xs transition-all duration-250 hover:border-[#E67230]/60 hover:bg-[#FFFBF8] hover:shadow-xs motion-reduce:transition-none">
                  {/* Upper Row: Left-aligned Icon and Top Heading */}
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    {/* Compact Animated Vector Icon */}
                    <div className="shrink-0 w-9 sm:w-10 lg:w-9.5 xl:w-10 flex items-center justify-center transition-transform duration-250 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0">
                      <svg
                        viewBox="0 0 72 72"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-9 sm:size-10 lg:size-9.5 xl:size-10 text-[#E67230] meyveda-icon-float"
                        style={{ animationDelay: "1.2s" }}
                        aria-hidden="true"
                      >
                        {/* Practice growth trend upward curve and hospital/clinic outline */}
                        <path
                          d="M14 54L30 38L42 50L58 22"
                          stroke="#E67230"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Upward arrow pointer */}
                        <path
                          d="M48 22H58V32"
                          stroke="#E67230"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Clinic building silhouette accent */}
                        <path
                          d="M16 54V44H24V54M32 54V38H40V54M48 54V32H56V54"
                          stroke="#E67230"
                          strokeWidth="1.75"
                          strokeOpacity="0.45"
                          strokeLinecap="round"
                        />
                        {/* MSO node dot */}
                        <circle cx="58" cy="22" r="3" fill="#E67230" />
                      </svg>
                    </div>

                    <h3 className="flex-1 min-w-0 text-[16px] sm:text-[17px] lg:text-[16px] xl:text-[17px] font-bold tracking-tight text-[#111111] leading-snug">
                      Practice Growth & MSO Services
                    </h3>
                  </div>

                  {/* Lower Content Area: Regular-weight, readable secondary description */}
                  <p className="mt-2.5 sm:mt-3 text-[13.5px] sm:text-[14px] lg:text-[13px] xl:text-[14px] font-normal leading-relaxed text-[#555555]">
                    Access guided operational support and managed services to strengthen and grow your practice.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#111111] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#222222]"
                >
                  <span>Register as a Doctor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3B. SCROLL-DRIVEN PRACTICE SUITE HORIZONTAL SHOWCASE                */}
      {/* Direct vertical-scroll-driven right-to-left cards progression        */}
      {/* Pinned/Sticky viewport container matching HorizontalStorytellingSection */}
      {/* ==================================================================== */}
      <div id="why-meyveda" className="scroll-mt-20" />
      <div id="about-us" className="scroll-mt-20" />
      <PracticeSuiteScrollSection handleNavClick={handleNavClick} />

      {/* ==================================================================== */}
      {/* 4. CORE VAIDYA (MEMBER SERVICES · FOR MEMBER PRACTITIONERS)          */}
      {/* Interactive circular radial composition with 4 orange-gradient circles */}
      {/* surrounding the central Meyveda logo. Descriptions appear on hover/tap */}
      {/* Fits within one desktop screen (viewport-aware)                       */}
      {/* ==================================================================== */}
      <CoreVaidyaSection />

      {/* ==================================================================== */}
      {/* 10B. MANAGED SERVICES ORGANIZATION (#managed-services)               */}
      {/* Animated tree of organizational growth with 3 interactive nodes:     */}
      {/* Physical Co-working Clinics, HIMS & Marketing, Operational System   */}
      {/* ==================================================================== */}
      <ManagedServicesTreeSection />

      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 11. MEYVEDA PRACTITIONER COMMUNITY SECTION (#community)              */}
      {/* Centered template immediately above footer with single WhatsApp CTA   */}
      {/* ==================================================================== */}
      <div id="public-relation" className="scroll-mt-20" />
      <div id="pr" className="scroll-mt-20" />
      <section
        id="community"
        aria-labelledby="community-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] py-20 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12 text-center">
          <div className="mx-auto max-w-3xl">
            {/* Eyebrow */}
            <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
              THE MEYVEDA PRACTITIONER COMMUNITY
            </p>

            {/* Headline */}
            <h2
              id="community-heading"
              className="text-balance text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl lg:text-[44px] xl:text-[48px] leading-[1.15]"
            >
              Better Practice Begins with Shared Wisdom.
            </h2>

            {/* Supporting paragraph */}
            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg lg:text-[19px] leading-relaxed sm:leading-[1.75] text-[#555555]">
              Connect with a growing community of <strong className="font-bold text-[#E65C24]">AYUSH</strong> practitioners who value classical knowledge, thoughtful clinical practice, and continuous learning. Exchange perspectives, share experiences, learn from peers, and grow together as a professional community.
            </p>

            {/* Action Button: Single Primary WhatsApp CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-10">
              <a
                href="https://www.whatsapp.com/channel/0029Vb5lp2eICVfeN93oxw11"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex h-13 items-center justify-center gap-2 rounded-md bg-[#E67230] px-7 text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 active:shadow-sm sm:h-14 sm:px-8 sm:text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2"
              >
                <span>Join Our Community</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-white transition-transform duration-200 group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 12. CLUSTER FRANCHISEE PARTNER NETWORK                                */}
      {/* Premium dark section immediately above footer with 3 opportunity cards */}
      {/* ==================================================================== */}
      <div id="blogs" className="scroll-mt-20" />
      <ClusterFranchiseePartnerSection />

      {/* ==================================================================== */}
      {/* 13. FOOTER (#footer)                                                 */}
      {/* Compact, professional footer for Phase 1 Doctor Platform             */}
      {/* ==================================================================== */}
      <footer id="footer" className="bg-white py-12 text-[#111111] sm:py-16">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <MeyvedaLogo />
              <p className="text-sm leading-relaxed text-[#555555]">
                Classical wisdom. A stronger practice. Management Service Organization support for AYUSH practitioners.
              </p>
              <ul className="space-y-2.5 text-sm text-[#555555]">
                <li>
                  <a
                    href="#top"
                    onClick={(e) => handleNavClick(e, "#top")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#blogs"
                    onClick={(e) => handleNavClick(e, "#blogs")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Blogs
                  </a>
                </li>
                <li>
                  <a
                    href="#pr"
                    onClick={(e) => handleNavClick(e, "#pr")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Public Relations
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Universal Services for AYUSH Practitioners */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Universal services for AYUSH Practitioners
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
                <li>
                  <a
                    href="#knowledge"
                    onClick={(e) => handleNavClick(e, "#knowledge")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Knowledge Library & Updates
                  </a>
                </li>
                <li>
                  <a
                    href="#journals"
                    onClick={(e) => handleNavClick(e, "#journals")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Journals & Publications
                  </a>
                </li>
                <li>
                  <a
                    href="#profile"
                    onClick={(e) => handleNavClick(e, "#profile")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Professional Profile Management
                  </a>
                </li>
                <li>
                  <a
                    href="#find-medicines"
                    onClick={(e) => handleNavClick(e, "#find-medicines")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Interactive Medicine Catalogue
                  </a>
                </li>
                <li>
                  <a
                    href="#hrms"
                    onClick={(e) => handleNavClick(e, "#hrms")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    HRMS & Hiring Tools
                  </a>
                </li>
                <li>
                  <a
                    href="#compliance"
                    onClick={(e) => handleNavClick(e, "#compliance")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Compliances Management Dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Core Vaidya */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Core Vaidya
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
                <li>
                  <a
                    href="#core-vaidya"
                    onClick={(e) => handleNavClick(e, "#core-vaidya")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Supply Chain Management
                  </a>
                </li>
                <li>
                  <a
                    href="#core-vaidya"
                    onClick={(e) => handleNavClick(e, "#core-vaidya")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Virtual Clinic
                  </a>
                </li>
                <li>
                  <a
                    href="#core-vaidya"
                    onClick={(e) => handleNavClick(e, "#core-vaidya")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Package Service Management
                  </a>
                </li>
                <li>
                  <a
                    href="#core-vaidya"
                    onClick={(e) => handleNavClick(e, "#core-vaidya")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Practitioners Forum & Co-practice
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Managed Services Organization */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Managed Services Organization
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
                <li>
                  <a
                    href="#managed-services"
                    onClick={(e) => handleNavClick(e, "#managed-services")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Physical Co-working Clinics
                  </a>
                </li>
                <li>
                  <a
                    href="#managed-services"
                    onClick={(e) => handleNavClick(e, "#managed-services")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    HIMS & Marketing Supports
                  </a>
                </li>
                <li>
                  <a
                    href="#managed-services"
                    onClick={(e) => handleNavClick(e, "#managed-services")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    Operational Support System
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5: Connect with Meyveda */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Connect with Meyveda
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-[#E67230] transition-colors font-bold text-[#E67230] inline-flex items-center gap-1"
                  >
                    <span>Contact Us</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleExploreDoctorDashboard}
                    className="hover:text-[#E67230] transition-colors text-left cursor-pointer"
                  >
                    Explore Doctor Dashboard
                  </button>
                </li>
                <li>
                  <a
                    href="#pharma"
                    onClick={(e) => handleNavClick(e, "#pharma")}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    AYUSH Pharma Makers
                  </a>
                </li>
                <li>
                  <Link
                    to="/cluster-franchise"
                    className="hover:text-[#E67230] transition-colors text-left"
                  >
                    Cluster Franchise Partner
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-[#E67230] transition-colors text-left"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-[#E67230] transition-colors text-left"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-[#E67230] transition-colors text-left"
                  >
                    Sign In
                  </Link>
                </li>
                <li className="pt-2.5 border-t border-[#EBE7DF] text-xs text-[#555555] space-y-1.5">
                  <p className="font-bold text-[#111111]">Direct Contact</p>
                  <p>
                    <a href="mailto:meyveda@gmail.com" className="hover:text-[#E67230] transition-colors flex items-center gap-1.5 font-medium">
                      <Mail className="size-3.5 text-[#E67230]" />
                      meyveda@gmail.com
                    </a>
                  </p>
                  <p>
                    <a href="tel:+919986398332" className="hover:text-[#E67230] transition-colors flex items-center gap-1.5 font-medium">
                      <Phone className="size-3.5 text-[#E67230]" />
                      +91 99863 98332
                    </a>
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Legal Links & Back to Top */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EBE7DF] pt-6 text-xs text-[#666666] sm:flex-row">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span>© {new Date().getFullYear()} Meyveda. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <Link to="/terms" className="hover:text-[#E67230] hover:underline transition-colors">
                Terms &amp; Conditions
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link to="/privacy" className="hover:text-[#E67230] hover:underline transition-colors">
                Privacy Policy
              </Link>
            </div>
            <a
              href="#top"
              onClick={(e) => handleNavClick(e, "#top")}
              className="inline-flex items-center justify-center size-9 rounded-full border border-[#EBE7DF] bg-white text-[#111111] hover:text-[#E67230] hover:border-[#E67230]/40 hover:bg-[#FAF9F6] transition-all shadow-2xs cursor-pointer"
              title="Back to Top"
              aria-label="Back to Top"
            >
              <Home className="size-4" />
            </a>
          </div>
        </div>
      </footer>
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="max-w-lg border-[#EBE7DF] bg-white p-6 sm:p-7 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="mb-2">
              <MeyvedaLogo compact />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#111111]">
              Register as an <strong className="font-bold text-[#E65C24]">AYUSH</strong> Doctor
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#555555] leading-relaxed mt-1">
              Join fellow AYUSH practitioners. Access classical literature, commercial medicine
              intelligence, batch quality evidence, and your private research library.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} autoComplete="off" className="mt-4 space-y-3.5">
            {/* 1. Full Name * */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder=""
                autoComplete="off"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
              />
            </div>

            {/* 2. Qualification * (BAMS, BSMS, BNYS, BHMS, BUMS) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Qualification *
              </label>
              <select
                value={doctorDegree}
                onChange={(e) => setDoctorDegree(e.target.value)}
                className="w-full rounded-md border border-[#EBE7DF] bg-white px-3 py-2.5 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="BAMS">BAMS (Ayurveda)</option>
                <option value="BSMS">BSMS (Siddha)</option>
                <option value="BNYS">BNYS (Naturopathy & Yoga)</option>
                <option value="BHMS">BHMS (Homoeopathy)</option>
                <option value="BUMS">BUMS (Unani)</option>
              </select>
            </div>

            {/* 3. PIN Code & Auto-Fetched City (Locked) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                  PIN Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    placeholder="e.g. 600001, 560001"
                    autoComplete="off"
                    value={doctorPincode}
                    onChange={(e) => setDoctorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 text-sm font-mono text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    {isDetectingDoctorCity ? (
                      <Loader2 className="size-3.5 animate-spin text-[#E67230]" />
                    ) : doctorPincode.length === 6 && doctorCouncil ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-[#777777] mt-1">
                  Enter 6-digit PIN to auto-fetch City &amp; Council
                </p>
              </div>

              {/* City - Read-only / Locked */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-[#111111]">
                    City (Auto-locked) *
                  </label>
                  {isDetectingDoctorCity ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#E67230]">
                      <Loader2 className="size-3 animate-spin" />
                      <span>Fetching…</span>
                    </span>
                  ) : doctorCity ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <Lock className="size-2.5 text-emerald-700" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#888888]">
                      Auto-locked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#777777]">
                    <Lock className="size-3.5" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    placeholder="Auto-detected from PIN"
                    value={doctorCity ? (doctorState ? `${doctorCity}, ${doctorState}` : doctorCity) : ""}
                    className="w-full rounded-md border border-[#EBE7DF] bg-[#F5F3EF] pl-9 pr-8 py-2.5 text-sm font-medium text-[#111111] placeholder:text-[#888888] cursor-not-allowed select-none focus:outline-none"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    {isDetectingDoctorCity ? (
                      <Loader2 className="size-3.5 animate-spin text-[#E67230]" />
                    ) : doctorCity ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <Lock className="size-3.5 text-[#999999]" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[#777777] mt-1">
                  City is auto-verified and cannot be changed.
                </p>
              </div>
            </div>

            {/* Statutory Medical Council Card - Directly below PIN code & City */}
            {doctorCouncil && !isDetectingDoctorCity && (
              <div className="rounded-xl border border-[#E67230]/35 bg-gradient-to-br from-[#FFFDFB] to-[#FFF6EE] p-3.5 sm:p-4 shadow-2xs space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-5 rounded-full bg-[#E67230]/15 flex items-center justify-center text-[#E67230]">
                      <Scale className="size-3" />
                    </div>
                    <span className="text-[11px] font-bold text-[#E67230] uppercase tracking-wider">
                      Statutory Medical Council Jurisdiction
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#111111] border border-[#EBE7DF] shadow-2xs">
                    <ShieldCheck className="size-3 text-[#E67230]" />
                    {doctorCouncil.board_type || "State Statutory Board"}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-[#111111] leading-snug">
                    {doctorCouncil.board_name}
                  </h4>
                  {doctorCouncil.description && (
                    <p className="mt-1 text-[11px] text-[#555555] leading-relaxed">
                      {doctorCouncil.description}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-white/90 border border-[#EBE7DF] p-2.5 text-[11px] space-y-1">
                  <div>
                    <span className="font-bold text-[#111111]">Statutory Act: </span>
                    <span className="text-[#444444] font-medium">{doctorCouncil.statutory_act}</span>
                  </div>
                  {doctorCouncil.controlling_authority && (
                    <div>
                      <span className="font-bold text-[#111111]">Controlling Authority: </span>
                      <span className="text-[#444444] font-medium">{doctorCouncil.controlling_authority}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
                  <span className="text-[10px] text-[#666666]">
                    Registration credentials verified under this council.
                  </span>
                  {doctorCouncil.official_portal && (
                    <a
                      href={doctorCouncil.official_portal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E67230] hover:text-[#D15F1F] hover:underline"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Pulse Loader when resolving Council & City */}
            {isDetectingDoctorCity && (
              <div className="rounded-xl border border-[#E67230]/25 bg-[#FFFDFB] p-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E67230]">
                  <Loader2 className="size-3.5 animate-spin text-[#E67230]" />
                  <span>Resolving Statutory Medical Council &amp; City...</span>
                </div>
              </div>
            )}

            {/* 4. Doctor Registration Number * */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Doctor Registration Number *
              </label>
              <input
                type="text"
                required
                placeholder=""
                autoComplete="off"
                value={doctorRegNo}
                onChange={(e) => setDoctorRegNo(e.target.value)}
                className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 text-sm font-mono text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#777777] mt-1">
                State Medical Council or Central AYUSH Council Registration Number
              </p>
            </div>

            {/* 4. Email Address * with Send & Verify OTP */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-[#111111]">
                  Email Address *
                </label>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/30">
                    <CheckCircle2 className="size-3" /> Verified via ZeptoMail
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600">
                    OTP verification required
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  disabled={emailVerified}
                  placeholder=""
                  autoComplete="off"
                  value={doctorEmail}
                  onChange={(e) => {
                    setDoctorEmail(e.target.value);
                    if (emailVerified) {
                      setEmailVerified(false);
                      setEmailToken(null);
                    }
                  }}
                  className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors disabled:opacity-75 disabled:bg-gray-100"
                />
                {!emailVerified && (
                  <button
                    type="button"
                    disabled={emailSending || !doctorEmail.includes("@") || emailCooldown > 0}
                    onClick={handleSendEmailOtp}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-[#E67230] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#d94e10] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {emailSending ? "Sending..." : emailCooldown > 0 ? `${emailCooldown}s` : emailOtpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                )}
                {emailVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailVerified(false);
                      setEmailOtpSent(false);
                      setEmailOtpInput("");
                      setEmailToken(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#777777] hover:text-[#111111] cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Edit
                  </button>
                )}
              </div>

              {emailOtpSent && !emailVerified && (
                <div className="rounded-md border border-[#E67230]/30 bg-white p-2.5 space-y-1.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#E67230] flex items-center gap-1">
                      <ShieldCheck className="size-3.5" /> Enter 6-Digit Email OTP
                    </span>
                    <span className="text-[10px] text-[#777777]">Valid for 5 mins • Check inbox & spam</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3 py-1.5 font-mono text-center tracking-widest text-sm font-bold text-[#111111] focus:border-[#E67230] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={emailVerifying || emailOtpInput.trim().length < 6}
                      onClick={handleVerifyEmailOtp}
                      className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {emailVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Mobile Number * with Send & Verify OTP */}
            <div className="rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-[#111111]">
                  Mobile Number (SMS OTP) *
                </label>
                {mobileVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/30">
                    <CheckCircle2 className="size-3" /> Verified via MSG91
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600">
                    SMS verification required
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-[#777777]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={mobileVerified}
                    placeholder=""
                    autoComplete="off"
                    value={doctorPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setDoctorPhone(val);
                      if (mobileVerified) {
                        setMobileVerified(false);
                        setMobileToken(null);
                      }
                    }}
                    className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-3.5 py-2 font-mono text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors disabled:opacity-75 disabled:bg-gray-100"
                  />
                </div>
                {!mobileVerified && (
                  <button
                    type="button"
                    disabled={mobileSending || doctorPhone.replace(/\D/g, "").length < 10 || mobileCooldown > 0}
                    onClick={handleSendMobileOtp}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-[#E67230] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#d94e10] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {mobileSending ? "Sending..." : mobileCooldown > 0 ? `${mobileCooldown}s` : mobileOtpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                )}
                {mobileVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileVerified(false);
                      setMobileOtpSent(false);
                      setMobileOtpInput("");
                      setMobileToken(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#777777] hover:text-[#111111] cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Edit
                  </button>
                )}
              </div>

              {mobileOtpSent && !mobileVerified && (
                <div className="rounded-md border border-[#E67230]/30 bg-white p-2.5 space-y-1.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#E67230] flex items-center gap-1">
                      <ShieldCheck className="size-3.5" /> Enter 6-Digit SMS OTP
                    </span>
                    <span className="text-[10px] text-[#777777]">Valid for 5 mins • Check SMS</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      value={mobileOtpInput}
                      onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3 py-1.5 font-mono text-center tracking-widest text-sm font-bold text-[#111111] focus:border-[#E67230] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={mobileVerifying || mobileOtpInput.trim().length < 6}
                      onClick={handleVerifyMobileOtp}
                      className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {mobileVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Password */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showDoctorPassword ? "text" : "password"}
                  required
                  placeholder=""
                  autoComplete="new-password"
                  value={doctorPassword}
                  onChange={(e) => setDoctorPassword(e.target.value)}
                  className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#777777] hover:text-[#111111] cursor-pointer"
                  tabIndex={-1}
                >
                  {showDoctorPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* 7. Invite / Referral Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#111111]">
                  Invite Code <span className="text-[#E65C24] font-bold">*</span>
                </label>
                {doctorInviteStatus.checked && doctorInviteStatus.valid ? (
                  <span className="text-[11px] font-bold text-emerald-600">
                    ✓ Valid Code
                  </span>
                ) : doctorInviteStatus.checked && !doctorInviteStatus.valid ? (
                  <span className="text-[11px] font-bold text-red-600">
                    ✕ Invalid Code
                  </span>
                ) : (
                  <span className="text-[10px] text-[#E65C24] font-semibold">
                    Compulsory · 3 letters + 2 numbers (e.g. MSV77)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="MSV77"
                  autoComplete="off"
                  value={doctorInviteCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 5);
                    setDoctorInviteCode(val);
                    if (doctorInviteStatus.checked) {
                      setDoctorInviteStatus({ checked: false, valid: false });
                    }
                  }}
                  onBlur={() => {
                    if (doctorInviteCode.trim().length === 5 && !doctorInviteStatus.checked) {
                      handleValidateDoctorInvite(doctorInviteCode);
                    }
                  }}
                  className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2 font-mono uppercase tracking-widest text-sm font-bold text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  disabled={doctorInviteValidating || doctorInviteCode.trim().length < 5}
                  onClick={() => handleValidateDoctorInvite(doctorInviteCode)}
                  className="rounded-md border border-[#EBE7DF] bg-[#FAF9F6] px-3.5 py-2 text-xs font-bold text-[#111111] hover:bg-[#EBE7DF] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {doctorInviteValidating ? "Checking..." : doctorInviteStatus.valid ? "Verified ✓" : "Verify Code"}
                </button>
              </div>
              {doctorInviteStatus.checked && doctorInviteStatus.valid && doctorInviteStatus.doctorName && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Referred by {doctorInviteStatus.doctorName}. Referral reward will be credited.
                </p>
              )}
            </div>

            <p className="text-[11px] text-[#777777] text-center leading-relaxed">
              By registering, you agree to our{" "}
              <Link
                to="/terms"
                target="_blank"
                className="font-bold text-[#E67230] hover:underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="font-bold text-[#E67230] hover:underline"
              >
                Privacy Policy
              </Link>.
            </p>

            <div className="pt-1">
              <RegisterPrimaryButton
                size="lg"
                className="w-full"
                onClick={() => {}}
                disabled={isSubmitting || !emailVerified || !mobileVerified}
              >
                {isSubmitting
                  ? "Registering with Backend..."
                  : !emailVerified || !mobileVerified
                    ? "Verify Email & Mobile OTP to Register"
                    : "Register as a Doctor"}
              </RegisterPrimaryButton>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/register"
                onClick={() => setRegisterModalOpen(false)}
                className="text-xs font-bold text-[#555555] hover:text-[#E67230] transition-colors"
              >
                Go to Dedicated Practitioner Registration Page →
              </Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* 14. SIGN IN MODAL DIALOG                                             */}
      {/* ==================================================================== */}
      <Dialog open={signInModalOpen} onOpenChange={setSignInModalOpen}>
        <DialogContent className="max-w-md border-[#EBE7DF] bg-white p-6 sm:p-7 sm:rounded-2xl">
          <DialogHeader>
            <div className="mb-2">
              <MeyvedaLogo compact />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#111111]">
              Doctor Sign In
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#555555] leading-relaxed mt-1">
              Sign in to your Meyveda workspace with your verified credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignInSubmit} className="mt-4 space-y-4">
            <div className="flex items-center justify-between pb-0.5">
              <span className="text-[11px] font-medium text-[#777777]">Testing credentials?</span>
              <button
                type="button"
                onClick={() => {
                  setSignInEmail("doctor@practice.com");
                  setSignInPassword("Doctor123!");
                }}
                className="text-[11px] font-bold text-[#E67230] hover:underline bg-[#E67230]/10 hover:bg-[#E67230]/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                Auto-fill Demo Doctor
              </button>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="doctor@practice.com"
                className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                Password *
              </label>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={isSigningIn}
              className="h-11 w-full rounded-md bg-[#E67230] hover:bg-[#D15F1F] font-bold text-white transition-colors cursor-pointer"
            >
              {isSigningIn ? "Authenticating..." : "Sign In to Workspace"}
            </Button>

            <div className="text-center pt-1 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setSignInModalOpen(false)}
                className="text-xs font-semibold text-[#555555] hover:text-[#E67230] transition-colors"
              >
                Go to Dedicated Sign In Page with Doctor Mascot →
              </Link>
              <p className="text-xs sm:text-sm text-[#555555]">
                New practitioner?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSignInModalOpen(false);
                    setRegisterModalOpen(true);
                  }}
                  className="font-bold text-[#E67230] hover:underline"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
