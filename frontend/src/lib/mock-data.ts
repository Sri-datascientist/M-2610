// Illustrative, fictional data for the Phase 1 prototype.
// Nothing here represents an official approval, verified lab result or authentic citation.

export type VerificationStatus =
  | "Not Submitted"
  | "Pending Verification"
  | "Additional Information Required"
  | "Verified"
  | "Rejected"
  | "Suspended";

export type EvidenceStatus =
  "Reference documented" | "Evidence available" | "Review pending" | "Evidence unavailable";

export interface Ingredient {
  id: string;
  name: string;
  latin: string;
  part: string;
  synonyms: string[];
  rasa: string[];
  guna: string[];
  virya: string;
  vipaka: string;
  karma: string[];
}

export interface Medicine {
  id: string;
  name: string;
  synonyms: string[];
  form: "Churna" | "Vati" | "Kwatha" | "Ghrita" | "Taila" | "Arishta" | "Asava";
  category: string;
  manufacturerId: string;
  evidence: EvidenceStatus;
  summary: string;
  ingredients: { ingredientId: string; quantity: string; ratio: string }[];
  rasa: string[];
  guna: string[];
  virya: string;
  vipaka: string;
  karma: string[];
  traditionalIndications: string[];
  clinicalEvidenceNote: string;
  referenceIds: string[];
  related: string[];
  image?: "triphala" | "herbs" | undefined;
  anupana?: string[] | undefined;
  contraindications?: string[] | undefined;
}

export const ingredients: Ingredient[] = [
  {
    id: "haritaki",
    name: "Haritaki",
    latin: "Terminalia chebula",
    part: "Fruit pericarp",
    synonyms: ["Abhaya", "Pathya"],
    rasa: ["Kashaya", "Madhura", "Amla", "Tikta", "Katu"],
    guna: ["Laghu", "Ruksha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Anulomana", "Rasayana", "Deepana"],
  },
  {
    id: "bibhitaki",
    name: "Bibhitaki",
    latin: "Terminalia bellirica",
    part: "Fruit pericarp",
    synonyms: ["Aksha", "Karshaphala"],
    rasa: ["Kashaya"],
    guna: ["Ruksha", "Laghu"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Kaphahara", "Chakshushya", "Bhedana"],
  },
  {
    id: "amalaki",
    name: "Amalaki",
    latin: "Phyllanthus emblica",
    part: "Fruit pericarp",
    synonyms: ["Dhatri", "Amrita"],
    rasa: ["Amla", "Madhura", "Kashaya", "Tikta", "Katu"],
    guna: ["Guru", "Ruksha", "Sheeta"],
    virya: "Sheeta",
    vipaka: "Madhura",
    karma: ["Rasayana", "Vayasthapana", "Pittahara"],
  },
  {
    id: "shunthi",
    name: "Shunthi",
    latin: "Zingiber officinale",
    part: "Rhizome",
    synonyms: ["Nagara", "Vishvabheshaja"],
    rasa: ["Katu"],
    guna: ["Laghu", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Deepana", "Pachana", "Amanashaka"],
  },
  {
    id: "pippali",
    name: "Pippali",
    latin: "Piper longum",
    part: "Fruit",
    synonyms: ["Magadhi", "Krishna"],
    rasa: ["Katu"],
    guna: ["Laghu", "Snigdha", "Tikshna"],
    virya: "Anushna",
    vipaka: "Madhura",
    karma: ["Deepana", "Rasayana", "Kasahara"],
  },
  {
    id: "maricha",
    name: "Maricha",
    latin: "Piper nigrum",
    part: "Fruit",
    synonyms: ["Ushana", "Vellaja"],
    rasa: ["Katu"],
    guna: ["Laghu", "Tikshna"],
    virya: "Ushna",
    vipaka: "Katu",
    karma: ["Deepana", "Kaphahara"],
  },
  {
    id: "guduchi",
    name: "Guduchi",
    latin: "Tinospora cordifolia",
    part: "Stem",
    synonyms: ["Amrita", "Chinnaruha"],
    rasa: ["Tikta", "Kashaya"],
    guna: ["Guru", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Rasayana", "Jvaraghna", "Tridoshahara"],
  },
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    latin: "Withania somnifera",
    part: "Root",
    synonyms: ["Varahakarni", "Hayagandha"],
    rasa: ["Tikta", "Kashaya", "Madhura"],
    guna: ["Laghu", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Balya", "Rasayana", "Vatahara"],
  },
  {
    id: "go-ghrita",
    name: "Go Ghrita",
    latin: "Clarified cow butter",
    part: "—",
    synonyms: ["Ghee"],
    rasa: ["Madhura"],
    guna: ["Guru", "Snigdha"],
    virya: "Sheeta",
    vipaka: "Madhura",
    karma: ["Medhya", "Vatapittahara"],
  },
];

export interface ManufacturerDocument {
  id: string;
  title: string;
  type: "GMP Certificate" | "AYUSH Licence" | "ISO Certificate" | "Audit Record";
  date: string;
  status: string;
  fileSize: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  licence: string;
  licenceType: string;
  issuingAuthority: string;
  licenceValid: string;
  certifications: string[];
  since: number;
  products: number;
  gmp: string;
  labFacilities: string;
  documents: ManufacturerDocument[];
  verificationStatus:
    "Verified Directory Listing" | "Verification Under Review" | "Licence Audit Pending";
}

export const manufacturers: Manufacturer[] = [
  {
    id: "m1",
    name: "Sahyadri Aushadhi Pvt. Ltd.",
    city: "Pune, Maharashtra",
    state: "Maharashtra",
    address: "Plot 14-B, Hadapsar Industrial Estate, Pune, Maharashtra 411013",
    licence: "MH/AYU/1986/25D-0042",
    licenceType: "Form 25-D (Classical & Proprietary AYUSH Formulations)",
    issuingAuthority: "State Licensing Authority (AYUSH), Food & Drug Administration, Maharashtra",
    licenceValid: "2027-03-31",
    certifications: ["GMP (Schedule T) — sample record", "ISO 9001:2015 — sample record"],
    since: 1986,
    products: 42,
    gmp: "Schedule T GMP Certified",
    labFacilities: "In-house Chemical, Instrumental & Microbiological QC Laboratory",
    verificationStatus: "Verified Directory Listing",
    documents: [
      {
        id: "doc-m1-gmp",
        title: "Schedule T Good Manufacturing Practices (GMP) Certificate",
        type: "GMP Certificate",
        date: "2024-03-15",
        status: "Active — Valid until 2027",
        fileSize: "1.2 MB PDF",
      },
      {
        id: "doc-m1-lic",
        title: "Form 25-D AYUSH Manufacturing Licence Grant",
        type: "AYUSH Licence",
        date: "2022-04-01",
        status: "Active — Renewed",
        fileSize: "2.4 MB PDF",
      },
      {
        id: "doc-m1-iso",
        title: "ISO 9001:2015 Quality Management Systems Accreditation",
        type: "ISO Certificate",
        date: "2023-08-20",
        status: "Active — Surveillance Audit Cleared",
        fileSize: "850 KB PDF",
      },
    ],
  },
  {
    id: "m2",
    name: "Kerala Vaidyashala Collective",
    city: "Thrissur, Kerala",
    state: "Kerala",
    address: "Kizhakkumpattukara Road, Thrissur, Kerala 680005",
    licence: "KL/AYU/1952/25D-0118",
    licenceType: "Form 25-D (Traditional Ayurvedic Medicines & Kashayas)",
    issuingAuthority: "Department of AYUSH, Government of Kerala",
    licenceValid: "2026-11-30",
    certifications: ["GMP (Schedule T) — sample record"],
    since: 1952,
    products: 118,
    gmp: "Schedule T GMP Certified",
    labFacilities: "In-house Classical Testing & NABL Accredited Partner Laboratory",
    verificationStatus: "Verified Directory Listing",
    documents: [
      {
        id: "doc-m2-gmp",
        title: "Schedule T GMP Compliance Certificate (Kerala)",
        type: "GMP Certificate",
        date: "2023-11-10",
        status: "Active — Valid until Nov 2026",
        fileSize: "1.4 MB PDF",
      },
      {
        id: "doc-m2-lic",
        title: "Form 25-D Heritage Ayurveda Manufacturing Endorsement",
        type: "AYUSH Licence",
        date: "2021-12-01",
        status: "Active — Current",
        fileSize: "3.1 MB PDF",
      },
    ],
  },
  {
    id: "m3",
    name: "Ganga Herbals & Rasashala",
    city: "Haridwar, Uttarakhand",
    state: "Uttarakhand",
    address: "Industrial Area Phase II, Bahadrabad, Haridwar, Uttarakhand 249402",
    licence: "UK/AYU/2004/25D-0067",
    licenceType: "Form 25-D (Classical Extract, Churna & Rasashala Formulations)",
    issuingAuthority: "Ayurvedic and Unani Services Directorate, Uttarakhand",
    licenceValid: "2026-06-30",
    certifications: ["GMP (Schedule T) — sample record", "WHO-GMP — document pending review"],
    since: 2004,
    products: 67,
    gmp: "Schedule T GMP Certified",
    labFacilities: "In-house Physicochemical Laboratory (Microbial testing partner outsourced)",
    verificationStatus: "Verification Under Review",
    documents: [
      {
        id: "doc-m3-gmp",
        title: "Schedule T Compliance Verification",
        type: "GMP Certificate",
        date: "2023-06-15",
        status: "Active — Scheduled Audit 2026",
        fileSize: "1.1 MB PDF",
      },
      {
        id: "doc-m3-who",
        title: "WHO-GMP Export Inspection Submission File",
        type: "Audit Record",
        date: "2024-01-20",
        status: "Pending Verification — Under Review",
        fileSize: "4.8 MB PDF",
      },
    ],
  },
  {
    id: "m4",
    name: "Narmada Ayurvedic Works",
    city: "Jabalpur, Madhya Pradesh",
    state: "Madhya Pradesh",
    address: "Richhai Industrial Area Sector 3, Jabalpur, Madhya Pradesh 482010",
    licence: "MP/AYU/1999/25D-0023",
    licenceType: "Form 25-D (Traditional Herbal Churna Manufacturing)",
    issuingAuthority: "Directorate of AYUSH, Government of Madhya Pradesh",
    licenceValid: "2025-12-31",
    certifications: [],
    since: 1999,
    products: 23,
    gmp: "Inspection Scheduled (Renewal Overdue)",
    labFacilities: "Basic in-house quality check (third-party testing mandated)",
    verificationStatus: "Licence Audit Pending",
    documents: [
      {
        id: "doc-m4-lic",
        title: "Form 25-D State Licence Record (Historical Archive)",
        type: "AYUSH Licence",
        date: "2020-12-15",
        status: "Renewal Notice Issued",
        fileSize: "1.8 MB PDF",
      },
    ],
  },
];

export interface Reference {
  id: string;
  code: "AFI" | "API" | "SPI" | "UPI" | "HPI" | "Classical";
  title: string;
  part: string;
  volume: string;
  edition: string;
  kind: "Pharmacopoeia" | "Classical text" | "Nighantu" | "Formulary";
  entry: string;
  provenance: string;
  ingredientIds: string[];
  section?: string | undefined;
  chapter?: string | undefined;
  shlokaNumber?: string | undefined;
  sanskritVerse?: string | undefined;
  transliteration?: string | undefined;
  translation?: string | undefined;
  translator?: string | undefined;
  verificationStatus?:
    "Verified Source" | "Corpus Import Pending" | "Standard Reference" | undefined;
}

export const references: Reference[] = [
  {
    id: "r-afi-1",
    code: "AFI",
    title: "Ayurvedic Formulary of India",
    part: "Part I, Formulations",
    volume: "Section 7:33 (Churna)",
    edition: "Second Revised English Edition, Ministry of AYUSH, Govt. of India",
    kind: "Formulary",
    entry: "Triphala Churna (AFI Formulary Standard)",
    provenance: "Statutory AFI Monograph Ref 7:33 (Bhavaprakasha Samhita source)",
    ingredientIds: ["haritaki", "bibhitaki", "amalaki"],
    section: "Churna Kalpana (Powder Formulations)",
    chapter: "Formulation 7:33 Triphala Churna",
    shlokaNumber: "AFI Part I, 7:33",
    sanskritVerse: "हरीतकी बिभीतकी धात्री समभागेन चूर्णिता । त्रिफला नाम विख्याता सर्वरोगविनाशिनी ॥",
    transliteration: "harītakī bibhītakī dhātrī samabhāgena cūrṇitā | triphalā nāma vikhyātā sarvarogavināśinī ||",
    translation:
      "Equal parts of dried pericarp of Haritaki, Bibhitaki, and Amalaki pulverized and sieved to uniform fineness. Indicated for Anaha, Prameha, Netra roga, and as Rasayana. Dosage: 3 to 6 g with madhu, ghrita, or warm water.",
    translator: "Ministry of AYUSH Ayurvedic Pharmacopoeia Committee (APC)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-afi-2",
    code: "AFI",
    title: "Ayurvedic Formulary of India",
    part: "Part I, Formulations",
    volume: "Section 3:11 (Avaleha)",
    edition: "Second Revised English Edition, Ministry of AYUSH, Govt. of India",
    kind: "Formulary",
    entry: "Chyawanprasha Avaleha (AFI Formulary Standard)",
    provenance: "Statutory AFI Monograph Ref 3:11 (Charaka Samhita Chikitsa 1.1 source)",
    ingredientIds: ["amalaki", "guduchi", "pippali"],
    section: "Avaleha & Paka Kalpana (Confectioneries)",
    chapter: "Formulation 3:11 Chyawanprasha",
    shlokaNumber: "AFI Part I, 3:11",
    sanskritVerse: "च्यवनप्राशः परं प्रोक्तं रसायनानामुत्तमम् । कासश्वासहरं चैव विशेषेणोपदिश्यते ॥",
    transliteration: "cyavanaprāśaḥ paraṁ proktaṁ rasāyanānāmuttamam | kāsaśvāsaharaṁ caiva viśeṣeṇopadiśyate ||",
    translation:
      "Prepared from fresh mature Amalaki fruits processed with Dashamoola, Ashtavarga, Pippali, and standard aromatic prakshepa dravyas in pure sesame oil and cow's ghrita. Supreme rejuvenative for respiratory vitality and tissue immunity (Ojas).",
    translator: "Ayurvedic Pharmacopoeia Committee (APC)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-afi-3",
    code: "AFI",
    title: "Ayurvedic Formulary of India",
    part: "Part I, Formulations",
    volume: "Section 7:37 (Churna)",
    edition: "Second Revised English Edition, Ministry of AYUSH, Govt. of India",
    kind: "Formulary",
    entry: "Sitopaladi Churna (AFI Formulary Standard)",
    provenance: "Statutory AFI Monograph Ref 7:37 (Sharangadhara Samhita source)",
    ingredientIds: ["pippali"],
    section: "Churna Kalpana (Powder Formulations)",
    chapter: "Formulation 7:37 Sitopaladi Churna",
    shlokaNumber: "AFI Part I, 7:37",
    sanskritVerse: "सितोपला तुगाक्षीरी पिप्पली बहुला त्वचः । अंत्यादूर्ध्वं द्विगुणितं चूर्णं कृत्वा प्रयोजयेत् ॥",
    transliteration: "sitopalā tugākṣīrī pippalī bahulā tvacaḥ | antyādūrdhvaṁ dviguṇitaṁ cūrṇaṁ kṛtvā prayojayet ||",
    translation:
      "Formulated in classical proportion: 16 parts Sitopala (sugar candy), 8 parts Vamshalochana, 4 parts Pippali, 2 parts Ela (cardamom), and 1 part Twak (cinnamon). Relieves Kasa, Shwasa, Kshaya, and Mandagni.",
    translator: "Ayurvedic Pharmacopoeia Committee (APC)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-afi-4",
    code: "AFI",
    title: "Ayurvedic Formulary of India",
    part: "Part I, Formulations",
    volume: "Section 5:6 (Guggulu)",
    edition: "Second Revised English Edition, Ministry of AYUSH, Govt. of India",
    kind: "Formulary",
    entry: "Yogaraja Guggulu (AFI Formulary Standard)",
    provenance: "Statutory AFI Monograph Ref 5:6 (Bhavaprakasha Samhita source)",
    ingredientIds: ["guduchi", "pippali", "shunthi"],
    section: "Guggulu Kalpana (Purified Guggulu Formulations)",
    chapter: "Formulation 5:6 Yogaraja Guggulu",
    shlokaNumber: "AFI Part I, 5:6",
    sanskritVerse: "योगराज इति ख्यातो गुग्गुलुः परमौषधम् । वातरक्ते तथा वाते सन्धिगतेऽपि च ॥",
    transliteration: "yogarāja iti khyāto gugguluḥ paramauṣadham | vātarakte tathā vāte sandhigate'pi ca ||",
    translation:
      "Compounded from Shuddha Guggulu, Chitraka, Pippalimoola, Yavani, Jeeraka, Vidanga, and Triphala. Indicated for Amavata, Vatarakta, Sandhigatavata, and all chronic neuro-musculoskeletal disorders.",
    translator: "Ayurvedic Pharmacopoeia Committee (APC)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-api-1",
    code: "API",
    title: "Ayurvedic Pharmacopoeia of India",
    part: "Part I, Volume I",
    volume: "Monograph 24 (Single Drugs)",
    edition: "First Edition, Dept. of AYUSH, Govt. of India",
    kind: "Pharmacopoeia",
    entry: "Haritaki (Terminalia chebula Retz. pericarp)",
    provenance: "Official AYUSH Pharmacopoeia monograph standard",
    ingredientIds: ["haritaki"],
    section: "Single Drugs of Plant Origin",
    chapter: "Terminalia chebula Monograph",
    shlokaNumber: "API Monograph Ref #24",
    sanskritVerse: "हरीतकी फलमज्जा शुष्का परिपक्वा ग्राह्या ।",
    transliteration: "harītakī phalamajjā śuṣkā paripakvā grāhyā |",
    translation:
      "The dried, mature pericarp of the fruit of Terminalia chebula Retz. (Fam. Combretaceae) complies with macro- and microscopic, physicochemical, and assay limits specified in the Pharmacopoeia.",
    translator: "Pharmacopoeia Commission for Indian Medicine & Homoeopathy (PCIM&H)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-api-2",
    code: "API",
    title: "Ayurvedic Pharmacopoeia of India",
    part: "Part II, Volume I",
    volume: "Formulations Monograph 12 (Churna Kalpana)",
    edition: "First Edition, Dept. of AYUSH, Govt. of India",
    kind: "Pharmacopoeia",
    entry: "Triphala Churna (Formulation specification)",
    provenance: "Standard formulation monograph with equal-proportion ratio specifications",
    ingredientIds: ["haritaki", "bibhitaki", "amalaki"],
    section: "Churna Kalpana",
    chapter: "Triphala Churna Standard",
    shlokaNumber: "API Formulations Vol. I, 7:33",
    sanskritVerse: "हरीतकीबिभीतक्यामलकीनां समभागचूर्णं त्रिफलाचूर्णं भवति ।",
    transliteration: "harītakī-bibhītakī-āmalakīnāṁ samabhāga-cūrṇaṁ triphalā-cūrṇaṁ bhavati |",
    translation:
      "Triphala Churna is a fine powder prepared from equal parts by weight of the pericarp of dried fruits of Haritaki, Bibhitaki, and Amalaki. Total ash not more than 9%, acid-insoluble ash not more than 2%.",
    translator: "Pharmacopoeial Laboratory for Indian Medicines (PLIM)",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-spi-1",
    code: "SPI",
    title: "Siddha Pharmacopoeia of India",
    part: "Part I, Volume I",
    volume: "Monograph 18",
    edition: "First Edition, Ministry of AYUSH",
    kind: "Pharmacopoeia",
    entry: "Kadukkai (Terminalia chebula in Siddha Materia Medica)",
    provenance: "Siddha Formulary & Pharmacopoeia documentation",
    ingredientIds: ["haritaki"],
    section: "Thavarangal (Plant Origin)",
    chapter: "Kadukkai Thol",
    shlokaNumber: "SPI Ref #18",
    translation:
      "Kadukkai (dried pericarp of Terminalia chebula) used in Kayakarpam preparations according to Agathiyar Gunavagadam.",
    verificationStatus: "Standard Reference",
  },
  {
    id: "r-upi-1",
    code: "UPI",
    title: "Unani Pharmacopoeia of India",
    part: "Part I, Volume II",
    volume: "Monograph 14",
    edition: "Ministry of Health and Family Welfare",
    kind: "Pharmacopoeia",
    entry: "Halela Zard (Terminalia chebula yellow fruit)",
    provenance: "Unani classical single drug monograph",
    ingredientIds: ["haritaki"],
    section: "Adviyah Mufradah (Single Drugs)",
    chapter: "Halela Zard Monograph",
    shlokaNumber: "UPI Vol. II, p. 58",
    translation:
      "Halela Zard comprises the dried pericarp of unripe fruit of Terminalia chebula Retz. Mizaj: Cold in 1st degree, Dry in 2nd degree. Mushil-e-Safra wa Balgham (purgative of bile and phlegm).",
    verificationStatus: "Standard Reference",
  },
  {
    id: "r-hpi-1",
    code: "HPI",
    title: "Homoeopathic Pharmacopoeia of India",
    part: "Volume III",
    volume: "Monograph 45",
    edition: "Dept. of Health, Government of India",
    kind: "Pharmacopoeia",
    entry: "Emblica officinalis (Mother Tincture & Trituration)",
    provenance: "Official Homoeopathic standard monograph",
    ingredientIds: ["amalaki"],
    section: "Botanical Monographs",
    chapter: "Emblica officinalis",
    shlokaNumber: "HPI Vol. III, Monograph #45",
    translation:
      "Prepared from the fresh mature fruit pulp of Phyllanthus emblica L. Standardized for ascorbic acid equivalents and extractive values.",
    verificationStatus: "Standard Reference",
  },
  {
    id: "r-cs-1",
    code: "Classical",
    title: "Charaka Samhita",
    part: "Chikitsa Sthana",
    volume: "Adhyaya 1.1 (Rasayana Adhyaya)",
    edition: "Chaukhambha Sanskrit Sansthan (Ed. Acharya P.V. Sharma)",
    kind: "Classical text",
    entry: "Abhayāmalakīya Rasayana — verses on Haritaki & Amalaki virtues",
    provenance: "Brihat-Trayi canonical medical scripture",
    ingredientIds: ["amalaki", "haritaki"],
    section: "Chikitsa Sthana (Internal Medicine / Therapeutics)",
    chapter: "Abhayāmalakīya Rasayana Pāda (Adhyaya 1.1)",
    shlokaNumber: "Shlokas 29–34",
    sanskritVerse:
      "हरीतकीं पञ्चरसामलवणामशिवां हराम् ।\nस्निग्धोष्णां दीपनीं मेध्यां वयसः स्थापनीं पराम् ॥\nदोषानुलोमनीं लघ्वीं विद्यात् स्वादुविपाकिनीम् ।\nयथाऽमृतं सुरपतेस्तथा पथ्या भिषग्जितम् ॥",
    transliteration:
      "harītakīṁ pañcarasāmalavaṇāmaśivāṁ harām |\nsnigdhoṣṇāṁ dīpanīṁ medhyāṁ vayasaḥ sthāpanīṁ parām ||\ndoṣānulomanīṁ laghvīṁ vidyāt svāduvipākinīm |\nyathā'mṛtaṁ surapatestathā pathyā bhiṣagjitam ||",
    translation:
      "Haritaki possesses five of the six tastes (lacking only salty). It is beneficial, pacifying, unctuous, warm in virya, digestive-stimulant (deepani), intellect-promoting (medhya), supreme in preserving youth (vayas-sthapani), normalizing downward movement of doshas (anulomani), light, and has sweet post-digestive effect (madhura vipaka). As nectar is to Indra, so is Haritaki to mankind.",
    translator: "Acharya P.V. Sharma Translation & Commentary",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-ss-1",
    code: "Classical",
    title: "Sushruta Samhita",
    part: "Sutra Sthana",
    volume: "Adhyaya 38 (Dravya Samgrahaniya Adhyaya)",
    edition: "Chaukhambha Orientalia (Ed. Kaviraj Ambikadatta Shastri)",
    kind: "Classical text",
    entry: "Trikatu Dravya grouping and physiological karma",
    provenance: "Brihat-Trayi canonical surgical and pharmacological scripture",
    ingredientIds: ["pippali", "shunthi", "maricha"],
    section: "Sutra Sthana (Foundational Principles)",
    chapter: "Dravya Samgrahaniya (Classification of Drugs, Adhyaya 38)",
    shlokaNumber: "Shloka 22",
    sanskritVerse:
      "पिप्पली मरिचं शुण्ठी त्रिकटुकं विदुः ।\nदीपनं कफवातघ्नं मेदोघ्नं श्वासकासजित् ॥",
    transliteration:
      "pippalī maricaṁ śuṇṭhī trikaṭukaṁ viduḥ |\ndīpanaṁ kaphavātaghnaṁ medoghnaṁ śvāsakāsajit ||",
    translation:
      "Pippali, Maricha, and Shunthi together are known as Trikatu. It kindle digestive fire (deepana), pacifies Kapha and Vata, reduces excess medas (fat), and overcomes dyspnea and cough.",
    translator: "Kaviraj Kunjalal Bhishagratna & Shastri Edition",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-ah-1",
    code: "Classical",
    title: "Ashtanga Hridaya",
    part: "Uttara Sthana",
    volume: "Adhyaya 39 (Rasayana Vidhi)",
    edition: "Varanasi: Chaukhambha (Ed. Dr. K.R. Srikantha Murthy)",
    kind: "Classical text",
    entry: "Guduchi & Amalaki Rasayana formulations",
    provenance: "Brihat-Trayi core synthesis of Charaka and Sushruta",
    ingredientIds: ["guduchi", "amalaki"],
    section: "Uttara Sthana (Supplemental / Advanced Specialties)",
    chapter: "Rasayana Vidhi (Rejuvenative Protocols, Adhyaya 39)",
    shlokaNumber: "Shlokas 44–46",
    sanskritVerse:
      "गुड़ूची त्रिफला धात्री पिप्पलीनां रसायनम् ।\nआयुष्यं बलकृन्मेध्यं सर्वरोगप्रणाशनम् ॥",
    transliteration:
      "guḍūcī triphalā dhātrī pippalīnāṁ rasāyanam |\nāyuṣyaṁ balakṛnmedhyaṁ sarvarogapraṇāśanam ||",
    translation:
      "Rasayana prepared from Guduchi, Triphala, Dhatri (Amalaki), and Pippali bestows longevity (ayushya), strength (bala), intellect (medha), and alleviates all obstinate imbalances.",
    translator: "Dr. K.R. Srikantha Murthy English Translation",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-bp-1",
    code: "Classical",
    title: "Bhavaprakasha Nighantu",
    part: "Haritakyadi Varga",
    volume: "Materia Medica Classic",
    edition: "Chaukhambha Bharati Academy (Ed. Dr. K.C. Chunekar)",
    kind: "Nighantu",
    entry: "Triphala definition, properties and indications",
    provenance: "Laghutrayi & canonical Nighantu pharmacology",
    ingredientIds: ["haritaki", "bibhitaki", "amalaki"],
    section: "Haritakyadi Varga (Chapter on Myrobalans & Herbs)",
    chapter: "Phalatrika / Triphala Prakarana",
    shlokaNumber: "Shlokas 42–44",
    sanskritVerse:
      "हरीतकी बिभीतक्यौ आमलकी च त्रिफला मता ।\nत्रिफला कफपित्तघ्नी मेहकुष्ठहरा सरा ॥\nचक्षुष्या दीपनी चैव विषमज्वरनाशिनी ॥",
    transliteration:
      "harītakī bibhītakhyau āmalakī ca triphalā matā |\ntriphalā kaphapittaghnī mehakuṣṭhaharā sarā ||\ncakṣuṣyā dīpanī caiva viṣamajvaranāśinī ||",
    translation:
      "Haritaki, Bibhitaki, and Amalaki together are termed Triphala. Triphala destroys morbid Kapha and Pitta, cures urinary anomalies (meha) and dermatoses (kushtha), is laxative/carminative (sara), beneficial for eyes (chakshushya), kindles appetite (deepani), and overcomes chronic fevers.",
    translator: "Dr. K.C. Chunekar & Dr. G.S. Pandey Translation",
    verificationStatus: "Verified Source",
  },
  {
    id: "r-sh-1",
    code: "Classical",
    title: "Sharangadhara Samhita",
    part: "Madhyama Khanda",
    volume: "Adhyaya 6 (Churna Kalpana)",
    edition: "Chaukhambha Sanskrit Bhawan (Ed. Prof. K.R. Srikanta Murthy)",
    kind: "Classical text",
    entry: "Principles of Churna & Kwatha Kalpana processing",
    provenance: "Laghutrayi pharmaceutical standard classic",
    ingredientIds: [],
    section: "Madhyama Khanda (Pharmaceutical Formulations)",
    chapter: "Churna Kalpana (Powder Preparations, Adhyaya 6)",
    shlokaNumber: "Shlokas 1–3",
    sanskritVerse:
      "अत्यन्तशुष्कं यद् द्रव्यं सुपिष्टं वस्त्रगालितम् ।\nतत् स्याच्चूर्णं रजः क्षोदः स च तन्मात्रया भजेत् ॥",
    transliteration:
      "atyantaśuṣkaṁ yad dravyaṁ supiṣṭaṁ vastragālitam |\ntat syāccūrṇaṁ rajaḥ kṣodaḥ sa ca tanmātrayā bhajet ||",
    translation:
      "A drug that is thoroughly dried, pulverized fine, and strained through clean woven cloth is designated as Churna, Rajas, or Kshoda; it should be consumed in prescribed therapeutic doses with suited anupana.",
    translator: "Prof. K.R. Srikantha Murthy Edition",
    verificationStatus: "Verified Source",
  },
];

export const LIBRARY_TOTAL = 57;

export const medicines: Medicine[] = [
  {
    id: "triphala-churna",
    name: "Triphala Churna",
    synonyms: ["Phalatrika", "Varaa"],
    form: "Churna",
    category: "Rasayana",
    manufacturerId: "m1",
    evidence: "Evidence available",
    image: "triphala",
    summary:
      "Classical equal-part powder of the three myrobalans, documented across classical texts as a gentle rasayana and anulomana.",
    ingredients: [
      { ingredientId: "haritaki", quantity: "1 part", ratio: "33.3%" },
      { ingredientId: "bibhitaki", quantity: "1 part", ratio: "33.3%" },
      { ingredientId: "amalaki", quantity: "1 part", ratio: "33.3%" },
    ],
    rasa: ["Kashaya", "Madhura", "Amla", "Tikta", "Katu"],
    guna: ["Laghu", "Ruksha"],
    virya: "Anushna-sheeta",
    vipaka: "Madhura",
    karma: ["Rasayana", "Anulomana", "Chakshushya", "Tridoshahara"],
    traditionalIndications: [
      "Vibandha (mild constipation)",
      "Netra roga support (ocular health)",
      "General rasayana (tissue rejuvenation)",
      "Agni deepana (mild digestive ignition)",
    ],
    anupana: [
      "Ushnodaka (Warm water) — for gentle anulomana and bowel regularity",
      "Madhu (Raw honey) — when aiming for Kapha pacification and ocular support",
      "Go Ghrita (Cow's ghee) — for Pitta rasayana and tissue nourishment",
    ],
    clinicalEvidenceNote:
      "Clinical evidence summaries are illustrative in this prototype. Traditional indications above are documented in API Part II and Bhavaprakasha Nighantu.",
    referenceIds: ["r-api-2", "r-bp-1", "r-cs-1"],
    related: ["haritaki-churna", "trikatu-churna", "amalaki-rasayana", "triphala-ghrita"],
  },
  {
    id: "haritaki-churna",
    name: "Haritaki Churna",
    synonyms: ["Abhaya Churna", "Pathya Churna"],
    form: "Churna",
    category: "Anulomana",
    manufacturerId: "m2",
    evidence: "Reference documented",
    image: "herbs",
    summary:
      "Single-herb powder of Terminalia chebula pericarp, venerated in Charaka Samhita as the mother among herbs for gut health.",
    ingredients: [{ ingredientId: "haritaki", quantity: "100 g", ratio: "100%" }],
    rasa: ["Kashaya", "Madhura", "Amla", "Tikta", "Katu"],
    guna: ["Laghu", "Ruksha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Anulomana", "Deepana", "Rasayana", "Tridoshahara"],
    traditionalIndications: [
      "Vibandha (sluggish elimination)",
      "Agnimandya (impaired digestive fire)",
      "Arshas (hemorrhoidal discomfort)",
      "Shotha (inflammatory swelling)",
    ],
    anupana: [
      "Koshna Jala (Lukewarm water) — general laxative vehicle",
      "Saindhava Lavana (Rock salt) — during rainy season (Varsha)",
      "Sharkara (Raw unrefined sugar) — during autumn season (Sharad)",
    ],
    clinicalEvidenceNote:
      "Documented in API Part I Monograph #24. Traditional seasonal anupana (Ritu Haritaki) noted in Bhavaprakasha.",
    referenceIds: ["r-api-1", "r-spi-1", "r-upi-1", "r-bp-1", "r-cs-1"],
    related: ["triphala-churna"],
  },
  {
    id: "trikatu-churna",
    name: "Trikatu Churna",
    synonyms: ["Vyosha", "Katutrika"],
    form: "Churna",
    category: "Deepana-Pachana",
    manufacturerId: "m3",
    evidence: "Review pending",
    summary:
      "Equal-part blend of the three pungents — Shunthi, Pippali and Maricha. The premier synergistic formulation for igniting Jatharagni.",
    ingredients: [
      { ingredientId: "shunthi", quantity: "1 part", ratio: "33.3%" },
      { ingredientId: "pippali", quantity: "1 part", ratio: "33.3%" },
      { ingredientId: "maricha", quantity: "1 part", ratio: "33.3%" },
    ],
    rasa: ["Katu"],
    guna: ["Laghu", "Tikshna"],
    virya: "Ushna",
    vipaka: "Katu",
    karma: ["Deepana", "Pachana", "Kaphahara", "Srotoshodhana"],
    traditionalIndications: [
      "Agnimandya (sluggish digestion)",
      "Kaphaja kasa (productive cough)",
      "Peenasa (rhinitis & sinus congestion)",
      "Sthaulya (metabolic sluggishness)",
    ],
    anupana: [
      "Madhu (Honey) — synergizes pungent herbs and scrapes mucus",
      "Koshna Jala (Warm water) — promotes rapid absorption and Agni ignition",
    ],
    contraindications: [
      "Amlapitta (severe hyperacidity / active peptic ulceration)",
      "Raktapitta (active hemorrhagic disorders)",
      "Acute febrile conditions with severe Pitta aggravation",
    ],
    clinicalEvidenceNote:
      "Documented in Sushruta Samhita Sutra Sthana 38:22. Safety review pending for batch GH-TK-2501.",
    referenceIds: ["r-ss-1"],
    related: ["triphala-churna"],
  },
  {
    id: "amalaki-rasayana",
    name: "Amalaki Rasayana",
    synonyms: ["Dhatri Rasayana"],
    form: "Churna",
    category: "Rasayana",
    manufacturerId: "m2",
    evidence: "Evidence available",
    image: "herbs",
    summary:
      "Amalaki-based rejuvenative preparation repeatedly processed with fresh Amalaki svarasa (juice bhavana) to potentiate Sheeta virya.",
    ingredients: [{ ingredientId: "amalaki", quantity: "100 g", ratio: "100%" }],
    rasa: ["Amla", "Madhura", "Kashaya", "Tikta", "Katu"],
    guna: ["Guru", "Ruksha", "Sheeta"],
    virya: "Sheeta",
    vipaka: "Madhura",
    karma: ["Rasayana", "Vayasthapana", "Pittahara", "Chakshushya"],
    traditionalIndications: [
      "Rasayana (longevity & cellular vigor)",
      "Amlapitta support (hyperacidity)",
      "Daha (internal burning sensations)",
      "Netra roga (ocular support)",
    ],
    anupana: [
      "Godugdha (Warm cow milk) — optimal rasayana vehicle for cooling virya",
      "Madhu & Ghrita (in unequal proportion) — classical rasayana anupana",
    ],
    clinicalEvidenceNote:
      "Documented in Charaka Samhita Chikitsa Sthana 1.1 and HPI Vol. III. Evidence dossier on file.",
    referenceIds: ["r-cs-1", "r-ah-1", "r-hpi-1"],
    related: ["triphala-churna", "guduchi-ghana-vati"],
  },
  {
    id: "guduchi-ghana-vati",
    name: "Guduchi Ghana Vati",
    synonyms: ["Amrita Ghana Vati", "Samshamani Vati"],
    form: "Vati",
    category: "Jvaraghna",
    manufacturerId: "m3",
    evidence: "Reference documented",
    summary:
      "Potent extract tablet prepared by boiling fresh Guduchi stem into a concentrated aqueous water extract (ghana) and tableting.",
    ingredients: [{ ingredientId: "guduchi", quantity: "250 mg extract", ratio: "100%" }],
    rasa: ["Tikta", "Kashaya"],
    guna: ["Guru", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Rasayana", "Jvaraghna", "Tridoshahara", "Dahaprashamana"],
    traditionalIndications: [
      "Jvara (pyrexia and post-febrile weakness)",
      "Rasayana (immunomodulatory support)",
      "Prameha (metabolic glucose imbalance)",
      "Kushtha (dermatological conditions)",
    ],
    anupana: [
      "Koshna Jala (Lukewarm water) — general vehicle",
      "Madhu (Honey) — for Jvara and Pitta-Kapha balance",
    ],
    clinicalEvidenceNote:
      "Documented in Ashtanga Hridaya Uttara Sthana 39. Analytical specification on file.",
    referenceIds: ["r-ah-1"],
    related: ["amalaki-rasayana"],
  },
  {
    id: "ashwagandha-churna",
    name: "Ashwagandha Churna",
    synonyms: ["Varahakarni Churna", "Hayagandha Churna"],
    form: "Churna",
    category: "Balya",
    manufacturerId: "m4",
    evidence: "Evidence unavailable",
    summary:
      "Pure micro-pulverized root powder of Withania somnifera Dunal. Classical Balya and Vata-pacifying adaptogen.",
    ingredients: [{ ingredientId: "ashwagandha", quantity: "100 g", ratio: "100%" }],
    rasa: ["Tikta", "Kashaya", "Madhura"],
    guna: ["Laghu", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    karma: ["Balya", "Rasayana", "Vatahara", "Vrishya", "Nidrajanana"],
    traditionalIndications: [
      "Daurbalya (general debility)",
      "Vataja disorders (nervous fatigue, joint stiffness)",
      "Kshaya (emaciation)",
      "Anidra (sleep disturbances)",
    ],
    anupana: [
      "Koshna Dugdha (Warm milk with a pinch of nutmeg) — classical bed-time vehicle",
      "Go Ghrita (Clarified butter) — for neuromuscular strength",
    ],
    clinicalEvidenceNote:
      "Evidence documents currently unavailable. Licence renewal date for manufacturer m4 is under audit.",
    referenceIds: [],
    related: ["triphala-ghrita"],
  },
  {
    id: "triphala-ghrita",
    name: "Triphala Ghrita",
    synonyms: ["Phalatrikadi Ghrita"],
    form: "Ghrita",
    category: "Chakshushya",
    manufacturerId: "m1",
    evidence: "Review pending",
    image: "triphala",
    summary:
      "Medicated ghee processed with Triphala decoction (kwatha) and paste (kalka) according to classical Sneha Kalpana rules.",
    ingredients: [
      { ingredientId: "go-ghrita", quantity: "1 part", ratio: "62.5%" },
      { ingredientId: "haritaki", quantity: "¼ part (kalka)", ratio: "12.5%" },
      { ingredientId: "bibhitaki", quantity: "¼ part (kalka)", ratio: "12.5%" },
      { ingredientId: "amalaki", quantity: "¼ part (kalka)", ratio: "12.5%" },
    ],
    rasa: ["Madhura", "Kashaya"],
    guna: ["Guru", "Snigdha"],
    virya: "Sheeta",
    vipaka: "Madhura",
    karma: ["Chakshushya", "Rasayana", "Pittashamana", "Vatapittahara"],
    traditionalIndications: [
      "Netra roga support (Timira, dry eye, computer vision strain)",
      "Kacha / Linganasha support",
      "Vatapitta rasayana",
    ],
    anupana: [
      "Sukhoshna Jala (Warm water) — ensures clear emulsification without ama",
      "Koshna Dugdha (Warm milk) — for ocular nourishing protocols",
    ],
    clinicalEvidenceNote:
      "Documented in Bhavaprakasha Nighantu. Analytical CoA pending batch renewal.",
    referenceIds: ["r-bp-1"],
    related: ["triphala-churna"],
  },
  {
    id: "dashamoola-kwatha",
    name: "Dashamoola Kwatha",
    synonyms: ["Dashamula Kashaya", "Dashamula Decocotion"],
    form: "Kwatha",
    category: "Vatahara",
    manufacturerId: "m2",
    evidence: "Reference documented",
    summary:
      "Decoction coarse blend of ten classical roots — 5 Brihat Panchamoola and 5 Laghu Panchamoola. Sovereign for Vata alleviation.",
    ingredients: [],
    rasa: ["Tikta", "Kashaya"],
    guna: ["Laghu"],
    virya: "Ushna",
    vipaka: "Katu",
    karma: ["Vatahara", "Shothahara", "Shulaprashamana", "Kasaswasahara"],
    traditionalIndications: [
      "Vataja conditions (radicular pain, postpartum convalescence)",
      "Shotha (inflammatory swelling)",
      "Kasa & Shwasa (bronchial and cough distress)",
    ],
    anupana: ["Sukhoshna Jala (Warm water) — freshly boiled and consumed warm"],
    clinicalEvidenceNote:
      "Classical formulation in Sharangadhara Samhita. Single drug ingredient monographs currently pending digitized import.",
    referenceIds: ["r-sh-1"],
    related: [],
  },
];

export const AYURVEDIC_GLOSSARY: Record<
  "rasa" | "guna" | "virya" | "vipaka" | "karma" | "anupana",
  Record<string, { sanskrit: string; english: string; desc: string }>
> = {
  rasa: {
    Madhura: {
      sanskrit: "मधुर",
      english: "Sweet",
      desc: "Composed of Earth + Water (Prithvi + Jala). Nourishing, building, promotes longevity, soothes tissues, pacifies Vata & Pitta.",
    },
    Amla: {
      sanskrit: "अम्ल",
      english: "Sour",
      desc: "Composed of Earth + Fire (Prithvi + Tejas). Ignites digestive fire (Agni), carminative, enhances salivation and metabolism.",
    },
    Lavana: {
      sanskrit: "लवण",
      english: "Salty",
      desc: "Composed of Water + Fire (Jala + Tejas). Hydrophilic, softens tissues, aids digestion, liquefies Kapha.",
    },
    Katu: {
      sanskrit: "कटु",
      english: "Pungent",
      desc: "Composed of Fire + Air (Tejas + Vayu). Piercing, clears channels (srotas), burns toxins (Ama), stimulates circulation.",
    },
    Tikta: {
      sanskrit: "तिक्त",
      english: "Bitter",
      desc: "Composed of Air + Ether (Vayu + Akasha). Deeply detoxifying, dries fat, cools burning sensations, cleanses blood (Rakta).",
    },
    Kashaya: {
      sanskrit: "कषाय",
      english: "Astringent",
      desc: "Composed of Air + Earth (Vayu + Prithvi). Constricting, stops discharges, heals ulcers (Vranaropana), absorbs excess moisture.",
    },
  },
  guna: {
    Laghu: {
      sanskrit: "लघु",
      english: "Light",
      desc: "Easily digested, produces agility and clarity; pacifies Kapha, aggravates Vata.",
    },
    Guru: {
      sanskrit: "गुरु",
      english: "Heavy",
      desc: "Slow to digest, builds tissue mass, grounding; pacifies Vata & Pitta, aggravates Kapha.",
    },
    Ruksha: {
      sanskrit: "रूक्ष",
      english: "Dry",
      desc: "Absorbs fluids, produces stiffness; pacifies Kapha, aggravates Vata.",
    },
    Snigdha: {
      sanskrit: "स्निग्ध",
      english: "Unctuous / Oily",
      desc: "Lubricating, smooth, promotes strength and softness; pacifies Vata, aggravates Kapha.",
    },
    Sheeta: {
      sanskrit: "शीत",
      english: "Cold",
      desc: "Cools burning sensations, halts hemorrhage, compacts tissues; pacifies Pitta.",
    },
    Ushna: {
      sanskrit: "उष्ण",
      english: "Hot",
      desc: "Increases heat, promotes sweating, kindles digestion; pacifies Vata & Kapha.",
    },
    Tikshna: {
      sanskrit: "तीक्ष्ण",
      english: "Sharp / Piercing",
      desc: "Penetrates deep tissues, causes quick dispersal; clears obstinate blockages.",
    },
    Manda: {
      sanskrit: "मन्द",
      english: "Dull / Slow",
      desc: "Acts gradually, pacifies acute flare-ups, stabilizes bodily elements.",
    },
  },
  virya: {
    Ushna: {
      sanskrit: "उष्ण वीर्य",
      english: "Heating Potency",
      desc: "Stimulates Pitta, kindles digestive fire, liquefies Kapha, relieves coldness and Vata pain.",
    },
    Sheeta: {
      sanskrit: "शीत वीर्य",
      english: "Cooling Potency",
      desc: "Pacifies Pitta, strengthens and nourishes Dhatus, alleviates thirst, burning sensation and bleeding.",
    },
    "Anushna-sheeta": {
      sanskrit: "अनुष्णशीत वीर्य",
      english: "Temperate / Neutral",
      desc: "Neither intensely heating nor cooling; harmoniously tolerated by all constitutions (Tridosha samana).",
    },
  },
  vipaka: {
    Madhura: {
      sanskrit: "मधुर विपाक",
      english: "Sweet Post-Digestive",
      desc: "Nourishing post-digestive end-product; builds tissues, promotes reproductive fluids, calms Vata & Pitta.",
    },
    Amla: {
      sanskrit: "अम्ल विपाक",
      english: "Sour Post-Digestive",
      desc: "Fermentative post-digestive transformation; stimulates secretions, slightly Pitta-aggravating.",
    },
    Katu: {
      sanskrit: "कटु विपाक",
      english: "Pungent Post-Digestive",
      desc: "Catabolic post-digestive transformation; dries fluids, scrapes fat, pacifies Kapha, stimulates excretion.",
    },
  },
  karma: {
    Rasayana: {
      sanskrit: "रसायन",
      english: "Rejuvenative",
      desc: "Enhances longevity, memory, cellular immunity (Ojas), and optimum tissue nourishment (Rasadayaha).",
    },
    Deepana: {
      sanskrit: "दीपन",
      english: "Agni-Kindling",
      desc: "Stimulates appetite and ignites Jatharagni without digesting existing toxins.",
    },
    Pachana: {
      sanskrit: "पाचन",
      english: "Toxin-Digesting",
      desc: "Digests endogenous toxins (Ama) without necessarily stimulating hunger.",
    },
    Anulomana: {
      sanskrit: "अनुलोमन",
      english: "Carminative / Aperient",
      desc: "Directs Apana Vayu downward, gently softens and expels fecal matter without harsh purgation.",
    },
    Chakshushya: {
      sanskrit: "चक्षुष्य",
      english: "Ocular Tonic",
      desc: "Beneficial for vision, ocular tissues, and reducing eye fatigue or inflammation.",
    },
    Tridoshahara: {
      sanskrit: "त्रिदोषहर",
      english: "Tridoshic Balancer",
      desc: "Harmonizes Vata, Pitta, and Kapha simultaneously without provoking any single dosha.",
    },
    Balya: {
      sanskrit: "बल्य",
      english: "Strength-Promoting",
      desc: "Nourishes muscle and structural tissues, increasing stamina and resistance.",
    },
    Jvaraghna: {
      sanskrit: "ज्वरघ्न",
      english: "Anti-Pyretic",
      desc: "Relieves fevers, clears pathogenic heat and restores normal tissue temperature.",
    },
    Medhya: {
      sanskrit: "मेध्य",
      english: "Nootropic / Intellect Tonic",
      desc: "Nourishes Majja Dhatu, enhancing cognitive retention, recall, and mental calmness.",
    },
    Vatahara: {
      sanskrit: "वातहर",
      english: "Vata Pacifier",
      desc: "Alleviates pain, spasms, tremors, and dryness born of aggravated Vata.",
    },
    Kaphahara: {
      sanskrit: "कफहर",
      english: "Kapha Pacifier",
      desc: "Reduces heaviness, excess mucus, stagnation, and lethargy born of Kapha.",
    },
    Pittahara: {
      sanskrit: "पित्तहर",
      english: "Pitta Pacifier",
      desc: "Alleviates inflammation, acid reflux, burning sensation, and bilious disorders.",
    },
    Shothahara: {
      sanskrit: "शोथहर",
      english: "Anti-Edematous",
      desc: "Resolves tissue swelling, fluid retention, and cellular inflammation.",
    },
    Vayasthapana: {
      sanskrit: "वयःस्थापन",
      english: "Anti-Aging / Preservative",
      desc: "Arrests biological aging and maintains youthfulness of senses and tissues.",
    },
  },
  anupana: {
    "Warm water": {
      sanskrit: "उष्णोदक",
      english: "Ushnodaka (Warm water)",
      desc: "Universal vehicle; penetrates micro-channels, removes ama, aids assimilation without aggravating Pitta.",
    },
    Honey: {
      sanskrit: "मधु",
      english: "Madhu (Raw honey)",
      desc: "Yogavahi (catalytic vehicle); scrapes Kapha, enters deep srotas, but must never be heated.",
    },
    Ghee: {
      sanskrit: "घृत",
      english: "Go Ghrita (Cow ghee)",
      desc: "Pacifies Pitta and Vata; crosses blood-brain barrier, enhances Ojas and lipophilic nutrient uptake.",
    },
    Milk: {
      sanskrit: "दुग्ध",
      english: "Godugdha (Warm milk)",
      desc: "Supreme rasayana vehicle; cooling, nourishing, pacifies Vata-Pitta, builds Shukra and Ojas.",
    },
  },
};

export interface CoaParameter {
  parameter: string;
  specification: string;
  result: string;
  status: "Complies" | "Information Only";
}

export interface CoaDetails {
  labName: string;
  testingDate: string;
  sampleReceiptDate: string;
  analyst: string;
  parameters: CoaParameter[];
}

export interface Batch {
  id: string;
  medicineId: string;
  manufacturerId: string;
  mfg: string;
  exp: string;
  packSize?: string | undefined;
  coa: boolean;
  tests: string[];
  review: string;
  flags: string[];
  sampleStatus?: string | undefined;
  coaDetails?: CoaDetails | undefined;
}

export const batches: Batch[] = [
  {
    id: "SA-TC-2409",
    medicineId: "triphala-churna",
    manufacturerId: "m1",
    mfg: "2024-09-12",
    exp: "2027-09-11",
    packSize: "100 g HDPE container",
    coa: true,
    tests: [
      "Heavy metals (sample record)",
      "Microbial limits (sample record)",
      "Aflatoxins (sample record)",
    ],
    review: "Reviewed",
    flags: [],
    sampleStatus: "Analytical Testing Cleared (Sample Record)",
    coaDetails: {
      labName: "Sahyadri Analytical & Quality Testing Laboratory (Schedule T Approved)",
      testingDate: "2024-09-18",
      sampleReceiptDate: "2024-09-14",
      analyst: "M. G. Joshi (Senior QC Analyst)",
      parameters: [
        {
          parameter: "Organoleptic: Appearance & Odor",
          specification: "Fine light-brownish powder with characteristic herbal astringent aroma",
          result: "Complies",
          status: "Complies",
        },
        {
          parameter: "Loss on Drying (Moisture Content)",
          specification: "Not more than 8.0% w/w",
          result: "5.4% w/w",
          status: "Complies",
        },
        {
          parameter: "Total Ash",
          specification: "Not more than 9.0% w/w",
          result: "6.8% w/w",
          status: "Complies",
        },
        {
          parameter: "Acid-Insoluble Ash",
          specification: "Not more than 2.0% w/w",
          result: "0.68% w/w",
          status: "Complies",
        },
        {
          parameter: "Water-Soluble Extractive",
          specification: "Not less than 35.0% w/w",
          result: "41.2% w/w",
          status: "Complies",
        },
        {
          parameter: "Heavy Metals: Lead (Pb)",
          specification: "Not more than 10.0 ppm",
          result: "1.2 ppm",
          status: "Complies",
        },
        {
          parameter: "Heavy Metals: Arsenic (As)",
          specification: "Not more than 3.0 ppm",
          result: "0.45 ppm",
          status: "Complies",
        },
        {
          parameter: "Heavy Metals: Cadmium (Cd)",
          specification: "Not more than 0.3 ppm",
          result: "0.08 ppm",
          status: "Complies",
        },
        {
          parameter: "Heavy Metals: Mercury (Hg)",
          specification: "Not more than 1.0 ppm",
          result: "Not detected (<0.05 ppm)",
          status: "Complies",
        },
        {
          parameter: "Total Microbial Count (TPC)",
          specification: "Not more than 10^5 CFU/g",
          result: "2.1 × 10^3 CFU/g",
          status: "Complies",
        },
        {
          parameter: "Total Yeast & Mould Count",
          specification: "Not more than 10^3 CFU/g",
          result: "80 CFU/g",
          status: "Complies",
        },
        {
          parameter: "Specific Pathogens (E. coli, Salmonella)",
          specification: "Absent in 1 g",
          result: "Absent",
          status: "Complies",
        },
        {
          parameter: "Aflatoxins (Total B1+B2+G1+G2)",
          specification: "Not more than 10.0 ppb",
          result: "Not detected (<1.0 ppb)",
          status: "Complies",
        },
      ],
    },
  },
  {
    id: "SA-TC-2502",
    medicineId: "triphala-churna",
    manufacturerId: "m1",
    mfg: "2025-02-03",
    exp: "2028-02-02",
    packSize: "250 g HDPE container",
    coa: true,
    tests: ["Heavy metals (sample record)"],
    review: "Review pending",
    flags: [],
    sampleStatus: "Review in Progress by Medical Quality Desk",
    coaDetails: {
      labName: "Sahyadri Analytical Quality Testing Laboratory",
      testingDate: "2025-02-08",
      sampleReceiptDate: "2025-02-05",
      analyst: "R. P. Deshmukh (QC Inspector)",
      parameters: [
        {
          parameter: "Appearance",
          specification: "Brownish powder",
          result: "Complies",
          status: "Complies",
        },
        {
          parameter: "Moisture Content",
          specification: "Not more than 8.0% w/w",
          result: "6.1% w/w",
          status: "Complies",
        },
        {
          parameter: "Heavy Metals (Pb, As, Cd, Hg)",
          specification: "Within Pharmacopoeial limits",
          result: "Complies",
          status: "Complies",
        },
      ],
    },
  },
  {
    id: "KV-HC-2411",
    medicineId: "haritaki-churna",
    manufacturerId: "m2",
    mfg: "2024-11-20",
    exp: "2027-11-19",
    packSize: "100 g sealed pouch",
    coa: false,
    tests: [],
    review: "Evidence unavailable",
    flags: [],
    sampleStatus: "Certificate of Analysis Not Uploaded by Manufacturer",
  },
  {
    id: "GH-TK-2501",
    medicineId: "trikatu-churna",
    manufacturerId: "m3",
    mfg: "2025-01-15",
    exp: "2027-01-14",
    packSize: "100 g glass bottle",
    coa: true,
    tests: ["Microbial limits (sample record)"],
    review: "Review pending",
    flags: ["ADR reports under review"],
    sampleStatus: "Pharmacovigilance Alert Active — Quality Evaluation Pending",
    coaDetails: {
      labName: "Ganga Rasashala Internal QC Division",
      testingDate: "2025-01-22",
      sampleReceiptDate: "2025-01-18",
      analyst: "K. N. Bhattacharya",
      parameters: [
        {
          parameter: "Description & Pungency",
          specification: "Sharp pungent powder with pungent warming odor",
          result: "Complies",
          status: "Complies",
        },
        {
          parameter: "Loss on Drying",
          specification: "Not more than 9.0% w/w",
          result: "5.8% w/w",
          status: "Complies",
        },
        {
          parameter: "Microbial Plate Count",
          specification: "Not more than 10^5 CFU/g",
          result: "3.2 × 10^3 CFU/g",
          status: "Complies",
        },
      ],
    },
  },
  {
    id: "NA-AC-2408",
    medicineId: "ashwagandha-churna",
    manufacturerId: "m4",
    mfg: "2024-08-05",
    exp: "2026-08-04",
    packSize: "100 g carton",
    coa: false,
    tests: [],
    review: "Evidence unavailable",
    flags: ["Licence renewal date passed (sample)"],
    sampleStatus: "Manufacturer Licence Expired — Documentation On Hold",
  },
];

export interface ClinicalCasePosology {
  dosage: string;
  route: string;
  frequency: string;
  anupana: string;
  duration: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  patientCode: string;
  age: string;
  sex: "F" | "M" | "Other";
  condition: string;
  dosha: string;
  medicineId: string;
  referenceId?: string;
  context: string;
  treatment: string;
  posology: ClinicalCasePosology;
  outcome: string;
  outcomeCategory:
    "Marked improvement" | "Moderate improvement" | "Partial improvement" | "Stable / No change";
  followUp: string;
  adverseEvents: string;
  limitations: string;
  review: "Approved for library" | "Peer-reviewed";
  verificationStatus: "Verified Demonstration Record" | "Illustrative Peer Contribution";
  contributor: string;
  dateReported: string;
  isDeidentified: boolean;
}

export const clinicalCases: ClinicalCase[] = [
  {
    id: "CC-0142",
    title: "Chronic vibandha in a sedentary adult",
    patientCode: "PT-7F3A",
    age: "40–49",
    sex: "F",
    condition: "Vibandha (Constipation)",
    dosha: "Vata pradhana",
    medicineId: "triphala-churna",
    referenceId: "r-api-2",
    context:
      "Long-standing constipation with irregular diet and desk-bound lifestyle; no red-flag symptoms recorded.",
    treatment: "Triphala Churna 5 g at bedtime with warm water (anupana), 8 weeks.",
    posology: {
      dosage: "5 g",
      route: "Oral",
      frequency: "Once daily at bedtime",
      anupana: "Warm water (Ushnodaka)",
      duration: "8 weeks",
    },
    outcome: "Self-reported improvement in bowel regularity by week 4, sustained through week 8.",
    outcomeCategory: "Marked improvement",
    followUp: "12 weeks",
    adverseEvents: "None reported during observation period.",
    limitations:
      "Single case, observational without control arm; outcome based on self-reported stool log.",
    review: "Approved for library",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. A. Kulkarni",
    dateReported: "2026-07-15",
    isDeidentified: true,
  },
  {
    id: "CC-0138",
    title: "Agnimandya with post-prandial heaviness",
    patientCode: "PT-32B1",
    age: "30–39",
    sex: "M",
    condition: "Agnimandya (Dyspepsia)",
    dosha: "Kapha-Vata",
    medicineId: "trikatu-churna",
    referenceId: "r-api-1",
    context:
      "Reduced appetite and persistent epigastric heaviness 1–2 hours after meals with cold intolerance.",
    treatment: "Trikatu Churna 1 g twice daily before meals with honey (anupana), 3 weeks.",
    posology: {
      dosage: "1 g",
      route: "Oral",
      frequency: "Twice daily (Pragbhakta)",
      anupana: "Raw honey (Madhu)",
      duration: "3 weeks",
    },
    outcome: "Reported reduction in heaviness and noticeable improvement in appetite by day 10.",
    outcomeCategory: "Moderate improvement",
    followUp: "6 weeks",
    adverseEvents: "Mild transient sensation of warmth; resolved with water ingestion.",
    limitations:
      "Concomitant dietary adjustments advised simultaneously; treatment effect confounded.",
    review: "Approved for library",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. S. Menon",
    dateReported: "2026-06-28",
    isDeidentified: true,
  },
  {
    id: "CC-0131",
    title: "Recurrent fatigue during post-febrile convalescence",
    patientCode: "PT-94C8",
    age: "50–59",
    sex: "F",
    condition: "Daurbalya (Fatigue/Debility)",
    dosha: "Vata-Pitta",
    medicineId: "guduchi-ghana-vati",
    referenceId: "r-api-1",
    context:
      "Generalised debility, low energy, and mild evening subfebrile sensations following viral illness 6 weeks prior.",
    treatment: "Guduchi Ghana Vati 500 mg twice daily with lukewarm water after meals, 6 weeks.",
    posology: {
      dosage: "500 mg",
      route: "Oral",
      frequency: "Twice daily (Adhona)",
      anupana: "Lukewarm water",
      duration: "6 weeks",
    },
    outcome:
      "Partial improvement reported in fatigue scoring and energy levels by week 3; fever sensation subsided.",
    outcomeCategory: "Partial improvement",
    followUp: "8 weeks",
    adverseEvents: "None observed; liver biochemical panel within normal limits at week 6.",
    limitations:
      "Natural post-viral recovery trajectory cannot be excluded without comparative controls.",
    review: "Approved for library",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. R. Iyer",
    dateReported: "2026-05-19",
    isDeidentified: true,
  },
  {
    id: "CC-0127",
    title: "Amlapitta symptoms with irregular sleep patterns",
    patientCode: "PT-11D5",
    age: "20–29",
    sex: "M",
    condition: "Amlapitta (Hyperacidity)",
    dosha: "Pitta pradhana",
    medicineId: "amalaki-rasayana",
    referenceId: "r-api-2",
    context:
      "Sour eructations, retrosternal burning sensation, and disturbed sleep attributed to shift work.",
    treatment: "Amalaki Rasayana 3 g twice daily with milk, 4 weeks; sleep hygiene guidance.",
    posology: {
      dosage: "3 g",
      route: "Oral",
      frequency: "Twice daily",
      anupana: "Warm milk (Godugdha)",
      duration: "4 weeks",
    },
    outcome:
      "Symptom diary showed frequency of burning episodes reduced from daily to once weekly.",
    outcomeCategory: "Marked improvement",
    followUp: "8 weeks",
    adverseEvents: "None reported.",
    limitations:
      "Sleep hygiene and dietary timing intervention co-administered; individual drug effect isolated.",
    review: "Approved for library",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. P. Deshpande",
    dateReported: "2026-04-12",
    isDeidentified: true,
  },
  {
    id: "CC-0155",
    title: "Sandhivata stiffness and crepitus in a 58-year-old female",
    patientCode: "PT-58E2",
    age: "50–59",
    sex: "F",
    condition: "Sandhivata (Osteoarthritis)",
    dosha: "Vata pradhana",
    medicineId: "triphala-ghrita",
    referenceId: "r-api-2",
    context:
      "Bilateral knee joint stiffness worse in the morning, mild joint crepitus without inflammatory effusion.",
    treatment: "Triphala Ghrita 10 ml in morning on empty stomach with warm water, 6 weeks.",
    posology: {
      dosage: "10 ml",
      route: "Oral",
      frequency: "Once daily morning (Niranna)",
      anupana: "Warm water",
      duration: "6 weeks",
    },
    outcome:
      "Walking distance before stiffness onset improved from 200m to 600m; crepitus unchanged.",
    outcomeCategory: "Moderate improvement",
    followUp: "10 weeks",
    adverseEvents:
      "None; lipid profile monitored before and after 6 weeks showed no clinically significant changes.",
    limitations:
      "Open-label clinical observation; crepitus objective parameter did not show resolution.",
    review: "Peer-reviewed",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. A. Kulkarni",
    dateReported: "2026-08-01",
    isDeidentified: true,
  },
  {
    id: "CC-0160",
    title: "Chittodvega and sleep onset latency in high-stress profession",
    patientCode: "PT-43K9",
    age: "40–49",
    sex: "M",
    condition: "Chittodvega (Mild Anxiety / Insomnia)",
    dosha: "Vata-Pitta",
    medicineId: "haritaki-churna",
    referenceId: "r-api-1",
    context:
      "Difficulty falling asleep (latency > 60 mins), restless mind and daytime tension for 3 months.",
    treatment: "Haritaki Churna 3 g at bedtime with warm cow's milk and ghee, 4 weeks.",
    posology: {
      dosage: "3 g",
      route: "Oral",
      frequency: "Once daily bedtime",
      anupana: "Warm milk with 5g ghee",
      duration: "4 weeks",
    },
    outcome: "Sleep onset latency reduced to approx 25 minutes; daytime calmness improved.",
    outcomeCategory: "Moderate improvement",
    followUp: "8 weeks",
    adverseEvents: "None reported.",
    limitations: "Subjective patient rating scales only; no polysomnography or blinded control.",
    review: "Approved for library",
    verificationStatus: "Illustrative Peer Contribution",
    contributor: "Dr. V. Joshi",
    dateReported: "2026-08-22",
    isDeidentified: true,
  },
  {
    id: "CC-0168",
    title: "Kasa (cough) associated with seasonal weather change",
    patientCode: "PT-29L4",
    age: "18–29",
    sex: "F",
    condition: "Kasa (Cough)",
    dosha: "Kapha-Vata",
    medicineId: "trikatu-churna",
    referenceId: "r-api-1",
    context:
      "Dry irritating cough following monsoon-to-winter seasonal transition; no fever, wheezing or breathlessness.",
    treatment: "Trikatu Churna 500 mg with raw honey every 6 hours, 7 days.",
    posology: {
      dosage: "500 mg",
      route: "Oral",
      frequency: "Four times daily with honey",
      anupana: "Madhu (Raw Honey)",
      duration: "7 days",
    },
    outcome:
      "Cough frequency substantially reduced by day 3; complete resolution of irritation by day 6.",
    outcomeCategory: "Marked improvement",
    followUp: "4 weeks",
    adverseEvents: "Mild throat burning if taken without sufficient honey.",
    limitations:
      "Self-limiting upper respiratory complaint; spontaneous resolution probable factor.",
    review: "Peer-reviewed",
    verificationStatus: "Verified Demonstration Record",
    contributor: "Dr. S. Menon",
    dateReported: "2026-09-05",
    isDeidentified: true,
  },
  {
    id: "CC-0175",
    title: "Sthaulya and lethargy in metabolic sluggishness",
    patientCode: "PT-66M7",
    age: "30–39",
    sex: "F",
    condition: "Sthaulya (Metabolic Sluggishness)",
    dosha: "Kapha pradhana",
    medicineId: "triphala-churna",
    referenceId: "r-api-2",
    context: "Post-prandial lethargy, heaviness in body (Gaurava), and sluggish bowel habits.",
    treatment:
      "Triphala Churna 4 g morning and night with warm honey-water, 12 weeks; brisk walking.",
    posology: {
      dosage: "4 g",
      route: "Oral",
      frequency: "Twice daily",
      anupana: "Warm water with honey (Ushnodaka + Madhu)",
      duration: "12 weeks",
    },
    outcome: "Subjective reduction in lethargy; waist circumference decreased by 2 cm at 12 weeks.",
    outcomeCategory: "Partial improvement",
    followUp: "16 weeks",
    adverseEvents: "None reported.",
    limitations:
      "Concomitant daily walking and dietary portion control make drug-specific attribution unfeasible.",
    review: "Approved for library",
    verificationStatus: "Illustrative Peer Contribution",
    contributor: "Dr. R. Iyer",
    dateReported: "2026-09-18",
    isDeidentified: true,
  },
];

export type CaseFilterParams = {
  q?: string | undefined;
  medicine?: string | undefined;
  condition?: string | undefined;
  outcome?: string | undefined;
  age?: string | undefined;
  review?: string | undefined;
  sort?: string | undefined;
};

export function filterClinicalCases(list: ClinicalCase[], s: CaseFilterParams): ClinicalCase[] {
  const q = (s.q ?? "").trim().toLowerCase();
  const res = list.filter((c) => {
    if (s.medicine && c.medicineId !== s.medicine) return false;
    if (
      s.condition &&
      !c.condition.toLowerCase().includes(s.condition.toLowerCase()) &&
      !c.dosha.toLowerCase().includes(s.condition.toLowerCase())
    )
      return false;
    if (
      s.outcome &&
      c.outcomeCategory !== s.outcome &&
      !c.outcome.toLowerCase().includes(s.outcome.toLowerCase())
    )
      return false;
    if (s.age && c.age !== s.age) return false;
    if (s.review && c.review !== s.review) return false;
    if (!q) return true;
    const medName = medById(c.medicineId)?.name ?? "";
    const haystack =
      `${c.id} ${c.title} ${c.patientCode} ${c.context} ${c.condition} ${c.dosha} ${c.treatment} ${c.outcome} ${c.contributor} ${medName}`.toLowerCase();
    return haystack.includes(q);
  });

  if (s.sort === "title") {
    res.sort((a, b) => a.title.localeCompare(b.title));
  } else if (s.sort === "followup") {
    const parseWeeks = (str: string) => {
      const m = str.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    res.sort((a, b) => parseWeeks(b.followUp) - parseWeeks(a.followUp));
  } else {
    // Default newest
    res.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
  }

  return res;
}

export const caseById = (id: string) => clinicalCases.find((c) => c.id === id);

export const ADR_STATUSES = [
  "Received",
  "Being Reviewed",
  "More Details Needed",
  "Under Investigation",
  "Review Completed",
  "Case Closed",
] as const;
export type AdrStatus = (typeof ADR_STATUSES)[number];

export const defaultDoctor = {
  name: "Dr. Ananya Kulkarni",
  initials: "AK",
  email: "ananya.k@example.in",
  mobile: "+91 98•••• 2210",
  qualification: "BAMS, MD (Kayachikitsa)",
  institution: "Illustrative Ayurveda College, Pune",
  graduationYear: "2014",
  system: "Ayurveda",
  council: "Maharashtra Council of Indian Medicine",
  registrationNo: "Submitted — awaiting verification",
  verification: "Pending Verification" as VerificationStatus,
  bio: "Practising Kayachikitsa physician with an interest in rasayana and digestive health research.",
  interests: ["Rasayana", "Annavaha srotas", "Pharmacovigilance"],
};

export const medById = (id: string) => medicines.find((m) => m.id === id);
export const ingById = (id: string) => ingredients.find((i) => i.id === id);
export const mfrById = (id: string) => manufacturers.find((m) => m.id === id);
export const refById = (id: string) => references.find((r) => r.id === id);

// ==========================================
// Doctor Library Contributions
// ==========================================

export type ContributionType =
  "Missing Information" | "Proposed Correction" | "Additional Explanation";

export type ContributionStatus =
  "Draft" | "Submitted for Review" | "Approved" | "Returned for Changes" | "Rejected";

export interface LibraryContribution {
  id: string;
  referenceId: string;
  referenceTitle: string;
  edition: string;
  chapterSection?: string | undefined;
  verseOrShloka?: string | undefined;
  type: ContributionType;
  proposedContent: string;
  sourceCitation: string;
  clinicalNotes?: string | undefined;
  contributorName: string;
  contributorId: string;
  status: ContributionStatus;
  submittedAt: string;
  updatedAt: string;
  reviewFeedback?: string | undefined;
}

export const INITIAL_LIBRARY_CONTRIBUTIONS: LibraryContribution[] = [
  {
    id: "CONTRIB-LIB-001",
    referenceId: "r-ah-1",
    referenceTitle: "Ashtanga Hridaya (Uttara Sthana 39)",
    edition: "Chaukhambha (Ed. Dr. K.R. Srikantha Murthy)",
    chapterSection: "Uttara Sthana, Adhyaya 39",
    verseOrShloka: "Shlokas 47–48",
    type: "Additional Explanation",
    proposedContent:
      "Clarification on anupana: Warm honey-water (Madhu-udaka) vehicle optimizes assimilation of Amalaki-Guduchi compound specifically during Sharad ritu.",
    sourceCitation:
      "Ashtanga Hridaya, Arundatta commentary (Sarvanga Sundara), Uttara Sthana 39/47.",
    clinicalNotes: "Documented in clinical rasayana cohort for digestive tolerance.",
    contributorName: "Dr. Ananya Kulkarni",
    contributorId: "doc-ak-1",
    status: "Approved",
    submittedAt: "2026-08-15",
    updatedAt: "2026-08-28",
    reviewFeedback:
      "Approved by platform classical editorial committee with contributor attribution.",
  },
  {
    id: "CONTRIB-LIB-002",
    referenceId: "r-spi-1",
    referenceTitle: "Siddha Pharmacopoeia of India (Part I, Vol I)",
    edition: "First Edition, Ministry of AYUSH",
    chapterSection: "Thavarangal / Kadukkai Thol",
    verseOrShloka: "SPI Ref #18 footnote",
    type: "Missing Information",
    proposedContent:
      "Missing classical citation for detoxification: Terminalia chebula seed removal (vithai neekiya kadukkai) before therapeutic processing according to Agathiyar Gunavagadam.",
    sourceCitation: "Agathiyar Gunavagadam, Thavaravamism section, verse 142.",
    clinicalNotes: "Essential processing step to prevent gastric irritation.",
    contributorName: "Dr. Ananya Kulkarni",
    contributorId: "doc-ak-1",
    status: "Submitted for Review",
    submittedAt: "2026-10-12",
    updatedAt: "2026-10-12",
  },
];

// ==========================================
// Doctor Referrals & Early Access Module
// ==========================================

export type ReferralStatus =
  "Invitation Sent" | "Registered" | "Council Verified" | "Access Active" | "Expired";

export interface DoctorReferral {
  id: string;
  invitedEmail: string;
  invitedName?: string | undefined;
  invitedSpecialty?: string | undefined;
  invitedCouncil?: string | undefined;
  dateInvited: string;
  status: ReferralStatus;
  statusUpdatedDate: string;
  notes?: string | undefined;
  isDemoSample: boolean;
}

export interface DoctorReferralAccount {
  doctorId: string;
  // Prototype status: indicates whether backend referral code generation is active
  isReferralActive: boolean;
  referralCode?: string | undefined;
  referralLink?: string | undefined;
  programStatus: "Upcoming Preview" | "Pilot Active" | "Waitlist Open";
  eligibleCohorts: string[];
  termsNotice: string;
  totalInvited?: number;
  referralPoints?: number;
}

export const INITIAL_REFERRAL_ACCOUNT: DoctorReferralAccount = {
  doctorId: "doc-ak-1",
  isReferralActive: false, // Honest prototype: backend code generation is not yet enabled
  programStatus: "Upcoming Preview",
  eligibleCohorts: [
    "Registered BAMS / MD / MS (Ayurveda) Physicians",
    "State AYUSH Council Registration Certificate Holders",
    "Clinical Institutional Researchers & Faculty",
  ],
  termsNotice:
    "Early access cohorts are admitted on a rolling basis subject to manual verification of State AYUSH Council credentials. No commercial referral commission, monetary compensation, or automated admission is guaranteed.",
};

export const SAMPLE_DEMO_REFERRALS: DoctorReferral[] = [
  {
    id: "REF-DEMO-001",
    invitedEmail: "dr.sharma.ayur@example.in",
    invitedName: "Dr. Sudhir Sharma",
    invitedSpecialty: "Kayachikitsa",
    invitedCouncil: "Delhi Bharatiya Chikitsa Parishad",
    dateInvited: "2026-09-10",
    status: "Council Verified",
    statusUpdatedDate: "2026-09-18",
    notes: "Credentials verified by platform verification team. Early access cohort 2.",
    isDemoSample: true,
  },
  {
    id: "REF-DEMO-002",
    invitedEmail: "dr.priya.deshmukh@example.in",
    invitedName: "Dr. Priya Deshmukh",
    invitedSpecialty: "Dravyaguna Vijnana",
    invitedCouncil: "Maharashtra Council of Indian Medicine",
    dateInvited: "2026-10-02",
    status: "Registered",
    statusUpdatedDate: "2026-10-04",
    notes: "Registration submitted; awaiting manual council credential review.",
    isDemoSample: true,
  },
  {
    id: "REF-DEMO-003",
    invitedEmail: "vaidya.karthik.r@example.in",
    invitedName: "Dr. Karthik R.",
    invitedSpecialty: "Panchakarma",
    invitedCouncil: "Karnataka Ayurvedic and Unani Practitioners Board",
    dateInvited: "2026-10-14",
    status: "Invitation Sent",
    statusUpdatedDate: "2026-10-14",
    notes: "Invitation link dispatched; pending recipient registration.",
    isDemoSample: true,
  },
];

// ==========================================
// Doctor Community & Publications Module
// ==========================================

export type PublicationType = "Article" | "Journal Reference" | "Research Insight";

export type PublicationCategory =
  "Ayurveda" | "Formulations" | "Clinical Practice" | "Pharmacology" | "Research Methodology";

export type PublicationStatus =
  "Draft" | "Submitted for Review" | "Needs Changes" | "Published" | "Rejected" | "Withdrawn";

export interface PublicationAuthor {
  name: string;
  qualification: string;
  institution?: string;
  avatarInitials: string;
  isCurrentUser?: boolean;
}

export interface PublicationJournalSource {
  journalName: string;
  authors: string;
  year: number;
  volumeIssue?: string | undefined;
  doi?: string | undefined;
  url?: string | undefined;
  accessStatus: "Open Access Abstract" | "External Citation Index" | "Preprint Archive";
}

export interface PublicationVersion {
  version: number;
  date: string;
  changeSummary: string;
}

export interface Publication {
  id: string;
  title: string;
  summary: string;
  type: PublicationType;
  status: PublicationStatus;
  category:
    "Ayurveda" | "Formulations" | "Clinical Practice" | "Pharmacology" | "Research Methodology";
  tags: string[];
  author: PublicationAuthor;
  datePublished?: string | undefined;
  dateCreated: string;
  dateUpdated: string;
  content: string; // Structured Markdown / prose with headings
  journalSource?: PublicationJournalSource | undefined;
  references: string[];
  methodology?: string | undefined;
  limitations?: string | undefined;
  supportingLinks?: string[] | undefined;
  attachments?: string[] | undefined;
  reviewFeedback?: string | undefined;
  usefulCount: number;
  viewsCount: number;
  isPrototypeDemo: boolean;
}

export const PUBLICATION_CATEGORIES = [
  "Ayurveda",
  "Formulations",
  "Clinical Practice",
  "Pharmacology",
  "Research Methodology",
] as const;

export const INITIAL_PUBLICATIONS: Publication[] = [
  {
    id: "PUB-2026-001",
    title: "Standardization Metrics and Quality Parameters for Classical Kwatha Preparations",
    summary:
      "A clinical pharmacological evaluation of decoction reduction ratios (16:4 vs 8:2) and their correlation with total tannin content and organoleptic stability.",
    type: "Article",
    status: "Published",
    category: "Formulations",
    tags: ["Kwatha", "Standardization", "Dravyaguna", "Stability"],
    author: {
      name: "Dr. Rajesh V. Shastri",
      qualification: "BAMS, MD (Dravyaguna)",
      institution: "Government Ayurveda Research Institute, Bengaluru",
      avatarInitials: "RS",
    },
    datePublished: "2026-09-12",
    dateCreated: "2026-09-02",
    dateUpdated: "2026-09-12",
    content: `## Abstract & Scope
The classical Samhitas specify a 16-part reduction rule for dry herbs (Kashaya Vidhi), yet modern pharmaceutical manufacturing frequently applies thermal evaporation under reduced pressure. This article contrasts traditional open-pan mandagni reduction with closed-circuit rotary extraction.

### Key Analytical Findings
1. **Total Tannin Preservation**: Open gentle heating over 3.5 hours yielded 18.4% higher bioavailable polyphenol fractions in Triphala Kwatha compared to accelerated heating.
2. **Sedimentation Index**: Rapid thermal boil resulted in premature particulate agglomeration within 48 hours of cold storage.
3. **Clinical Implication**: For Rasayana and Deepana-Pachana actions, adherence to mandagni open-vessel heating maintains the intended Virya and Vipaka balance.

### Recommendations for Vaidyas
- Ensure consistent particle size (yavakuta coarse grind, sieve 20-40) prior to boiling.
- Avoid over-reduction beyond 1/4th volume to prevent bitter glycoside caramelization.`,
    references: [
      "Sharangadhara Samhita, Madhyama Khanda 2/1-4",
      "Ayurvedic Pharmacopoeia of India (API), Part II, Vol. II",
      "Laboratory analytical reports on tannin kinetics, MVG Archives 2026",
    ],
    supportingLinks: ["https://example.org/api-guidelines-kwatha"],
    usefulCount: 42,
    viewsCount: 318,
    isPrototypeDemo: true,
  },
  {
    id: "PUB-2026-002",
    title:
      "Immunomodulatory and Anti-inflammatory Biomarkers of Tinospora cordifolia in Febrile Recovery",
    summary:
      "Systematic journal review summarizing macrophage activation, cytokine modulation (IL-6, TNF-alpha), and safe posology in post-viral convalescence.",
    type: "Journal Reference",
    status: "Published",
    category: "Pharmacology",
    tags: ["Guduchi", "Immunomodulation", "Jvara", "Cytokines"],
    author: {
      name: "Dr. Meera Nambiar",
      qualification: "BAMS, PhD (Ayurveda Pharmacology)",
      institution: "Amrita Center for Nanosciences and Molecular Medicine",
      avatarInitials: "MN",
    },
    datePublished: "2026-08-28",
    dateCreated: "2026-08-20",
    dateUpdated: "2026-08-28",
    content: `## Journal Abstract Review
*Curated from peer-reviewed ethnopharmacology literature.*

### Background & Objective
Guduchi (*Tinospora cordifolia*) is categorized as *Vayasthapana* and *Jvaraghna* in classical Ayurvedic texts. This journal review synthesizes recent multicentric clinical investigations on aqueous stem extracts.

### Synthesized Evidence
- **Macrophage Priming**: Oral administration of standardized aqueous extract demonstrated significant enhancement of phagocytic indices (*p < 0.01*).
- **Safety Window**: Hepatic enzymes (ALT/AST) monitored across 90 days showed no statistically significant elevation within classical therapeutic dosage ranges (250–500 mg ghana tablet BID).
- **Publisher Link**: Readers are directed to the publisher repository below for the full study methodology and trial design.`,
    journalSource: {
      journalName: "Journal of Ethnopharmacology & Integrative Biomedicine",
      authors: "Nambiar M., Kulkarni V., Chenthil S. et al.",
      year: 2026,
      volumeIssue: "Vol. 44(3), pp. 112–124",
      doi: "10.1016/j.jep.2026.04.019",
      url: "https://doi.org/10.1016/j.jep.2026.04.019",
      accessStatus: "Open Access Abstract",
    },
    references: [
      "Ashtanga Hridaya, Uttara Sthana 39 (Rasayana Vidhi)",
      "Charaka Samhita, Chikitsa Sthana 1.3",
      "WHO Traditional Medicine Strategy 2025-2034 Evidence Dossier",
    ],
    usefulCount: 68,
    viewsCount: 520,
    isPrototypeDemo: true,
  },
  {
    id: "PUB-2026-003",
    title:
      "Clinical Observational Practice Patterns in Annavaha Srotas Disorders: Triphala Posology Nuances",
    summary:
      "Observations from 140 ambulatory patients on tailoring anupana (lukewarm water vs madhu vs ghrita) according to Kostha and Prakriti.",
    type: "Research Insight",
    status: "Published",
    category: "Clinical Practice",
    tags: ["Annavaha Srotas", "Triphala", "Anupana", "Kostha"],
    author: {
      name: "Dr. Ananya Kulkarni",
      qualification: "BAMS, MD (Kayachikitsa)",
      institution: "Illustrative Ayurveda College, Pune",
      avatarInitials: "AK",
      isCurrentUser: true,
    },
    datePublished: "2026-10-01",
    dateCreated: "2026-09-24",
    dateUpdated: "2026-10-01",
    content: `## Clinical Context & Practice Observation
In outpatient Kayachikitsa practice, Triphala is frequently prescribed as a generic bedtime laxative (*Anulomana*). However, patient responses vary markedly depending on the individual's *Kostha* and accompanying vehicle (*Anupana*).

### Observational Takeaways
1. **Krura Kostha (Vata-predominant)**: Coarse powder with warm water frequently provoked mild colicky griping without complete evacuation. Switching to Triphala Ghrita (5–10 ml with warm milk) achieved smooth evacuation without discomfort in 88% of cases.
2. **Mridu Kostha (Pitta-predominant)**: Reduced dosage (1.5–2 g) with room temperature water or honey avoided loose stools.
3. **Madhya Kostha (Kapha-predominant)**: Warm water with a quarter teaspoon of raw honey produced optimal *Laghuta* (lightness) and metabolic stimulation.

### Practice Disclaimer
These are field observations from private ambulatory consultation and do not constitute a controlled randomized comparative trial.`,
    references: [
      "Charaka Samhita, Sutra Sthana 25 (Yajjah Purushiya)",
      "Bhavaprakasha Nighantu, Haritakyadi Varga",
    ],
    methodology:
      "Prospective observational documentation across 140 ambulatory adult patients (aged 24-68) presenting with functional constipation or agnimandya over a 6-month clinical evaluation period.",
    limitations:
      "Single-center observational study without randomized control cohort or placebo arms. Self-reported adherence and bowel diary tracking.",
    usefulCount: 54,
    viewsCount: 412,
    isPrototypeDemo: true,
  },
  {
    id: "PUB-2026-004",
    title: "Methodological Framework for Documenting Single-Herb Observational Registry Records",
    summary:
      "Practical guideline for Ayurvedic clinicians to maintain reproducible, de-identified clinical registry dossiers without risking patient privacy.",
    type: "Article",
    status: "Published",
    category: "Research Methodology",
    tags: ["Research Methodology", "Registry", "De-identification", "Ethics"],
    author: {
      name: "Dr. Harish C. Bhatt",
      qualification: "BAMS, MD, FIM",
      institution: "National Council for Clinical Ayurveda Studies",
      avatarInitials: "HB",
    },
    datePublished: "2026-07-15",
    dateCreated: "2026-07-01",
    dateUpdated: "2026-07-15",
    content: `## Purpose of Standardized Registry Notes
Observational data from routine AYUSH clinical practice is a vital resource for reverse pharmacology. However, lack of structured documentation limits peer utility.

### Three Golden Rules for Clinical Notes
1. **Strict De-identification**: Replace all name, date of birth, and location tokens with random alphanumeric case codes (e.g. \`PT-48K2\`).
2. **Explicit Posology & Batch**: Document exact botanical parts, extract ratio, manufacturer or self-preparation lot number, and anupana.
3. **Standardized Outcome Markers**: Utilize validated classical symptom scoring alongside contemporary biochemical indices where available.`,
    references: [
      "ICMR Ethical Guidelines for Biomedical Research Involving Human Participants",
      "Good Clinical Practice in Traditional Medicine Systems (AYUSH GCP)",
    ],
    usefulCount: 31,
    viewsCount: 240,
    isPrototypeDemo: true,
  },
  {
    id: "PUB-2026-005",
    title: "Investigational Ashwagandha-Brahmi Synergistic Extracts in Cognitive Fatigue",
    summary:
      "Draft research notes summarizing pilot biochemical synergy and protocol design for cognitive endurance in sedentary professionals.",
    type: "Research Insight",
    status: "Draft",
    category: "Ayurveda",
    tags: ["Medhya Rasayana", "Ashwagandha", "Brahmi", "Synergy"],
    author: {
      name: "Dr. Ananya Kulkarni",
      qualification: "BAMS, MD (Kayachikitsa)",
      institution: "Illustrative Ayurveda College, Pune",
      avatarInitials: "AK",
      isCurrentUser: true,
    },
    dateCreated: "2026-10-14",
    dateUpdated: "2026-10-18",
    content: `## Draft Protocol Formulation
Exploring a dual-extract combination of *Withania somnifera* (aqueous root, 5% withanolides) and *Bacopa monnieri* (standardized 20% bacosides).

### Draft Formulation Parameters
- Target ratio: 2:1 (Ashwagandha : Brahmi)
- Preliminary dosage test: 300 mg capsule once daily after morning meal.
- Target endpoints: Visual working memory index and daytime alertness.`,
    references: ["Charaka Samhita, Chikitsa Sthana 1.3 (Medhya Rasayana)"],
    usefulCount: 0,
    viewsCount: 1,
    isPrototypeDemo: true,
  },
  {
    id: "PUB-2026-006",
    title:
      "Comparative Dissolution Profiles of Vati Prepared with Classical Guggulu vs Synthetic Binders",
    summary:
      "Submitted review document examining disintegration times, hardness testing, and active marker dissolution rates.",
    type: "Article",
    status: "Submitted for Review",
    category: "Formulations",
    tags: ["Vati", "Guggulu", "Binders", "Dissolution"],
    author: {
      name: "Dr. Ananya Kulkarni",
      qualification: "BAMS, MD (Kayachikitsa)",
      institution: "Illustrative Ayurveda College, Pune",
      avatarInitials: "AK",
      isCurrentUser: true,
    },
    dateCreated: "2026-10-08",
    dateUpdated: "2026-10-09",
    content: `## Document Submitted to Platform Editorial Board
### Summary
Investigation into how purified Guggulu (*Commiphora mukul*) serves as an active therapeutic binder while impacting tablet disintegration time compared to microcrystalline cellulose.

*Awaiting peer review confirmation. Visible only to author and reviewing editors.*`,
    references: ["Sharangadhara Samhita, Madhyama Khanda 7 (Vati Kalpana)"],
    usefulCount: 0,
    viewsCount: 3,
    isPrototypeDemo: true,
  },
];

export function pubById(list: Publication[], id: string): Publication | undefined {
  return list.find((p) => p.id === id);
}

// ==========================================
// Scientific Journals & Literature Adapter
// ==========================================

export type JournalProvider =
  "Elsevier" | "Winlui" | "PubMed / PMC" | "AYUSH Portal" | "Open Access";

export interface JournalArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  volume?: string | undefined;
  issue?: string | undefined;
  pages?: string | undefined;
  year: number;
  publishedDate: string;
  doi?: string | undefined;
  url?: string | undefined;
  abstract?: string | undefined; // Provided only when permitted by provider licence
  abstractPermitted: boolean;
  provider: JournalProvider;
  isMockAdapter: boolean; // Honest disclosure of prototype vs real provider adapter
  indexedCategory:
    | "Phytochemistry"
    | "Clinical Trials"
    | "Pharmacology"
    | "Quality & Standardization"
    | "Toxicology";
  openAccess: boolean;
  keywords: string[];
  relatedMedicineIds?: string[] | undefined;
  relatedIngredientIds?: string[] | undefined;
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: "JRN-ELS-2024-001",
    title:
      "Standardization and Chromatographic Profiling of Polyphenolic Constituents in Classical Triphala Churna",
    authors: ["R. S. Sharma", "A. K. Mukherjee", "V. K. Joshi"],
    journal: "Journal of Ethnopharmacology",
    volume: "318",
    pages: "116842",
    year: 2024,
    publishedDate: "2024-01-10",
    doi: "10.1016/j.jep.2023.116842",
    url: "https://doi.org/10.1016/j.jep.2023.116842",
    abstract:
      "Ethnopharmacological relevance: Triphala is one of the most extensively utilized Rasayana formulations in Ayurveda. Aim of the study: To establish rigorous high-performance thin-layer chromatography (HPTLC) and LC-MS fingerprint profiles for gallic acid, ellagic acid, and chebulinic acid across diverse commercial and classical lab-formulated batches. Results demonstrate consistent antioxidant capacity correlated directly with total phenolic ratios.",
    abstractPermitted: true,
    provider: "Elsevier",
    isMockAdapter: true,
    indexedCategory: "Phytochemistry",
    openAccess: false,
    keywords: ["Triphala", "Gallic acid", "Ellagic acid", "HPTLC", "Pharmacopoeial Quality"],
    relatedMedicineIds: ["triphala-churna"],
    relatedIngredientIds: ["ing-amalaki", "ing-bibhitaki", "ing-haritaki"],
  },
  {
    id: "JRN-WIN-2023-002",
    title:
      "Efficacy of Tinospora cordifolia (Guduchi) in Modulating Inflammatory Biomarkers in Chronic Hepatic Stress: A Randomized Controlled Pilot Study",
    authors: ["S. V. Patil", "M. R. Kulkarni", "D. N. Date"],
    journal: "Journal of Ayurveda and Integrative Medicine",
    volume: "14",
    issue: "3",
    pages: "100714",
    year: 2023,
    publishedDate: "2023-05-18",
    doi: "10.1016/j.jaim.2023.100714",
    url: "https://doi.org/10.1016/j.jaim.2023.100714",
    abstract:
      "A double-blind, randomized controlled clinical investigation assessing aqueous extracts of Guduchi stem (500 mg b.i.d.) versus placebo over 12 weeks. Significant reductions in serum ALT/AST and hs-CRP were observed, confirming Rasayana hepatoprotective actions noted in classical texts.",
    abstractPermitted: true,
    provider: "Winlui",
    isMockAdapter: true,
    indexedCategory: "Clinical Trials",
    openAccess: true,
    keywords: ["Guduchi", "Tinospora cordifolia", "Hepatoprotection", "hs-CRP", "Clinical Trial"],
    relatedMedicineIds: ["guduchi-ghrita"],
    relatedIngredientIds: ["ing-guduchi"],
  },
  {
    id: "JRN-ELS-2023-003",
    title:
      "Heavy Metal Safety Verification and Microbial Limit Tolerances in Classical Bhasma Preparations",
    authors: ["K. P. Singh", "N. H. Ravishankar"],
    journal: "Regulatory Toxicology and Pharmacology",
    volume: "141",
    pages: "105401",
    year: 2023,
    publishedDate: "2023-07-01",
    doi: "10.1016/j.yrtph.2023.105401",
    abstract:
      "Nanoparticulate metallic bhasmas undergo multi-stage calcination (putapaka). This paper investigates analytical compliance using ICP-MS and XRD to demonstrate that authentic classical incineration converts raw toxic sulfides into non-toxic organo-metallic complexes within statutory AYUSH Schedule T limits.",
    abstractPermitted: true,
    provider: "Elsevier",
    isMockAdapter: true,
    indexedCategory: "Toxicology",
    openAccess: false,
    keywords: ["Bhasma", "Heavy Metals", "Schedule T", "ICP-MS", "Safety"],
    relatedMedicineIds: [],
    relatedIngredientIds: [],
  },
  {
    id: "JRN-PMC-2022-004",
    title:
      "Neuroprotective and Anxiolytic Actions of Withania somnifera (Ashwagandha) Root Extracts in Stress-Induced Cortisol Dysregulation",
    authors: ["B. Auddy", "J. Hazra", "A. Mitra"],
    journal: "Phytomedicine",
    volume: "29",
    issue: "2",
    pages: "211–219",
    year: 2022,
    publishedDate: "2022-09-15",
    doi: "10.1016/j.phymed.2022.153982",
    url: "https://doi.org/10.1016/j.phymed.2022.153982",
    abstract:
      "Stress induces sustained HPA axis hyper-activation. This multi-center prospective trial monitored 120 adults administered standardized Withania somnifera (300 mg twice daily) against placebo for 60 days. Serum cortisol decreased by 27.9% with significant improvement in sleep architecture scores.",
    abstractPermitted: true,
    provider: "PubMed / PMC",
    isMockAdapter: true,
    indexedCategory: "Pharmacology",
    openAccess: true,
    keywords: ["Ashwagandha", "Withania somnifera", "Cortisol", "Anxiolytic", "HPA axis"],
    relatedMedicineIds: ["ashwagandhadi-lehya"],
    relatedIngredientIds: ["ing-ashwagandha"],
  },
  {
    id: "JRN-WIN-2024-005",
    title:
      "Comparative Gas Chromatography Analysis of Volatile Terpenoids in Pippali (Piper longum) Subjected to Classical Shodhana",
    authors: ["T. M. Gopinath", "C. K. Narayana"],
    journal: "Indian Journal of Traditional Knowledge",
    volume: "23",
    issue: "1",
    pages: "88–95",
    year: 2024,
    publishedDate: "2024-02-28",
    doi: "10.56042/ijtk.v23i1.68421",
    url: "https://doi.org/10.56042/ijtk.v23i1.68421",
    abstract: undefined, // Provider licence restricts abstract reproduction
    abstractPermitted: false,
    provider: "Winlui",
    isMockAdapter: true,
    indexedCategory: "Quality & Standardization",
    openAccess: false,
    keywords: ["Pippali", "Piper longum", "Shodhana", "Terpenoids", "GC-MS"],
    relatedMedicineIds: ["triphala-churna"],
    relatedIngredientIds: ["ing-pippali"],
  },
  {
    id: "JRN-AYU-2023-006",
    title:
      "Clinical Evaluation of Bilva Taila and Karnapoorana in Chronic Tinnitus (Karna-Nada): An Open-Label Prospective Study",
    authors: ["H. M. Chandola", "K. S. Dhiman"],
    journal: "AYU (An International Quarterly Journal of Research in Ayurveda)",
    volume: "44",
    issue: "2",
    pages: "45–52",
    year: 2023,
    publishedDate: "2023-11-20",
    doi: "10.4103/ayu.AYU_112_23",
    url: "https://doi.org/10.4103/ayu.AYU_112_23",
    abstract:
      "Tinnitus (Karna-Nada) represents a classical Vata disturbance in Shalakya Tantra. Forty patients underwent daily Karnapoorana with classical Bilva Taila over 21 days. Audiometric evaluation recorded marked decibel threshold improvement in 68% of participating cases with zero reported adverse events.",
    abstractPermitted: true,
    provider: "AYUSH Portal",
    isMockAdapter: true,
    indexedCategory: "Clinical Trials",
    openAccess: true,
    keywords: ["Karna-Nada", "Bilva Taila", "Karnapoorana", "Tinnitus", "Vata Vyadhi"],
    relatedMedicineIds: [],
    relatedIngredientIds: [],
  },
];

export function journalById(id: string): JournalArticle | undefined {
  return JOURNAL_ARTICLES.find((j) => j.id === id);
}
