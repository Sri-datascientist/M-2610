export type ReferralPeriod = "Last 30 Days" | "Last 90 Days" | "Current Year" | "All Time";

export type DoctorReferralBreakdown = {
  patientRefId: string;
  consultationType: "Classical Consultation" | "Panchakarma Protocol" | "Telehealth";
  date: string;
  status: "Completed" | "Pending" | "Cancelled";
  pointsAwarded: number;
};

export type DoctorReferralScore = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  state: string;
  district: string;
  verifiedReferrals: number;
  totalConsultations: number;
  score: number;
  ranking: number;
  period: ReferralPeriod;
  lastUpdated: string;
  breakdown: DoctorReferralBreakdown[];
};

/**
 * Transparent scoring formula:
 * Score = (verifiedReferrals * 10) + (totalConsultations * 2)
 */
export function calculateReferralScore(verifiedReferrals: number, totalConsultations: number): number {
  return verifiedReferrals * 10 + totalConsultations * 2;
}

export const seedReferralScores: DoctorReferralScore[] = [
  {
    id: "DOC-0774",
    doctorId: "DOC-0774",
    doctorName: "Dr. Lakshmi Rao",
    specialization: "Shalya Tantra",
    state: "Karnataka",
    district: "Bengaluru",
    verifiedReferrals: 38,
    totalConsultations: 120,
    score: calculateReferralScore(38, 120), // 380 + 240 = 620
    ranking: 1,
    period: "Last 30 Days",
    lastUpdated: "2026-10-19",
    breakdown: [
      {
        patientRefId: "REF-9021",
        consultationType: "Panchakarma Protocol",
        date: "2026-10-18",
        status: "Completed",
        pointsAwarded: 10,
      },
      {
        patientRefId: "REF-8942",
        consultationType: "Classical Consultation",
        date: "2026-10-16",
        status: "Completed",
        pointsAwarded: 10,
      },
      {
        patientRefId: "REF-8810",
        consultationType: "Telehealth",
        date: "2026-10-12",
        status: "Completed",
        pointsAwarded: 10,
      },
    ],
  },
  {
    id: "DOC-0810",
    doctorId: "DOC-0810",
    doctorName: "Dr. Hari Prasad",
    specialization: "Dravyaguna",
    state: "Uttar Pradesh",
    district: "Varanasi",
    verifiedReferrals: 29,
    totalConsultations: 95,
    score: calculateReferralScore(29, 95), // 290 + 190 = 480
    ranking: 2,
    period: "Last 30 Days",
    lastUpdated: "2026-10-19",
    breakdown: [
      {
        patientRefId: "REF-8744",
        consultationType: "Classical Consultation",
        date: "2026-10-17",
        status: "Completed",
        pointsAwarded: 10,
      },
      {
        patientRefId: "REF-8621",
        consultationType: "Classical Consultation",
        date: "2026-10-14",
        status: "Completed",
        pointsAwarded: 10,
      },
    ],
  },
  {
    id: "DOC-0988",
    doctorId: "DOC-0988",
    doctorName: "Dr. Arjun Deshmukh",
    specialization: "Panchakarma",
    state: "Maharashtra",
    district: "Pune",
    verifiedReferrals: 21,
    totalConsultations: 74,
    score: calculateReferralScore(21, 74), // 210 + 148 = 358
    ranking: 3,
    period: "Last 30 Days",
    lastUpdated: "2026-10-19",
    breakdown: [
      {
        patientRefId: "REF-8512",
        consultationType: "Panchakarma Protocol",
        date: "2026-10-15",
        status: "Completed",
        pointsAwarded: 10,
      },
    ],
  },
  {
    id: "DOC-1042",
    doctorId: "DOC-1042",
    doctorName: "Dr. Meera Nair",
    specialization: "Kayachikitsa",
    state: "Kerala",
    district: "Kochi",
    verifiedReferrals: 16,
    totalConsultations: 55,
    score: calculateReferralScore(16, 55), // 160 + 110 = 270
    ranking: 4,
    period: "Last 30 Days",
    lastUpdated: "2026-10-19",
    breakdown: [
      {
        patientRefId: "REF-8419",
        consultationType: "Telehealth",
        date: "2026-10-11",
        status: "Completed",
        pointsAwarded: 10,
      },
    ],
  },
  {
    id: "DOC-1048",
    doctorId: "DOC-1048",
    doctorName: "Dr. Anjali Menon",
    specialization: "Kayachikitsa",
    state: "Kerala",
    district: "Kozhikode",
    verifiedReferrals: 11,
    totalConsultations: 40,
    score: calculateReferralScore(11, 40), // 110 + 80 = 190
    ranking: 5,
    period: "Last 30 Days",
    lastUpdated: "2026-10-19",
    breakdown: [
      {
        patientRefId: "REF-8302",
        consultationType: "Classical Consultation",
        date: "2026-10-09",
        status: "Completed",
        pointsAwarded: 10,
      },
    ],
  },
];
