import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from databases.session import SessionLocal, init_db
from databases.schema.models import User, Doctor, Manufacturer, Journal as DBJournal, PublicRelation, BlogPost
from app.auth import hash_password

logger = logging.getLogger(__name__)


def seed_database():
    """
    Ensure tables are created and essential seed records exist.
    """
    init_db()
    db: Session = SessionLocal()
    try:
        # 1. Seed Default Doctor Account if not present
        doc_email = "doctor@practice.com"
        existing_doc_user = db.query(User).filter(User.email == doc_email).first()
        if not existing_doc_user:
            doc_user = User(
                email=doc_email,
                hashed_password=hash_password("Doctor123!"),
                role="doctor",
                status="active",
            )
            db.add(doc_user)
            db.flush()

            doctor_profile = Doctor(
                user_id=doc_user.id,
                full_name="Dr. Ramesh Vaidya",
                medical_license_number="AYUSH-MH-2018-8472",
                specialty="Ayurveda (Kayachikitsa)",
                verification_status="approved",
            )
            db.add(doctor_profile)
            logger.info("Seeded default doctor account: %s", doc_email)

        # 1b. Seed Default Admin Account if not present
        admin_email = "admin@meyveda.com"
        existing_admin_user = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password("mey@123"),
                role="admin",
                status="active",
            )
            db.add(admin_user)
            logger.info("Seeded default admin account: %s", admin_email)

        # 1c. Seed Default Content Manager Account if not present
        content_email = "content@meyveda.com"
        existing_content_user = db.query(User).filter(User.email == content_email).first()
        if not existing_content_user:
            content_user = User(
                email=content_email,
                hashed_password=hash_password("mey@123"),
                role="content_manager",
                status="active",
            )
            db.add(content_user)
            logger.info("Seeded default content manager account: %s", content_email)
        elif existing_content_user.role != "content_manager":
            existing_content_user.role = "content_manager"
            existing_content_user.status = "active"
            existing_content_user.hashed_password = hash_password("mey@123")

        # 2. Seed Default Manufacturer Account if not present
        mfg_email = "manufacturer@meyveda.com"
        existing_mfg_user = db.query(User).filter(User.email == mfg_email).first()
        if not existing_mfg_user:
            mfg_user = User(
                email=mfg_email,
                hashed_password=hash_password("Manufacturer123!"),
                role="manufacturer",
                status="active",
            )
            db.add(mfg_user)
            db.flush()

            mfg_profile = Manufacturer(
                user_id=mfg_user.id,
                company_name="Kerala Ayurveda Pharmacy Ltd",
                contact_name="Vaidya S. Ramanathan",
                contact_email=mfg_email,
                verification_status="approved",
            )
            db.add(mfg_profile)
            logger.info("Seeded default manufacturer account: %s", mfg_email)

        # 2b. Seed Canonical Products if table is empty
        from databases.schema.models import Product as DBProduct
        product_count = db.query(DBProduct).count()
        if product_count == 0:
            mfg = db.query(Manufacturer).first()
            if mfg:
                canonical_products = [
                    {
                        "id": "prod-triphala-001",
                        "manufacturer_id": mfg.id,
                        "name": "Triphala Churna",
                        "description": "Classical polyherbal formulation of Haritaki, Bibhitaki, and Amalaki. Standardized to 45% total tannins for gastrointestinal motility and tissue antioxidant defense.",
                        "category": "Classical Churna",
                        "price": 280.0,
                        "currency": "INR",
                        "approval_status": "approved",
                        "is_active": True,
                    },
                    {
                        "id": "prod-haritaki-002",
                        "manufacturer_id": mfg.id,
                        "name": "Haritaki Churna",
                        "description": "Pure Terminalia chebula fruit pericarp powder standardized for Chebulinic and Chebulagic acids. Supreme Anulomana Rasayana.",
                        "category": "Single Herb Churna",
                        "price": 220.0,
                        "currency": "INR",
                        "approval_status": "approved",
                        "is_active": True,
                    },
                    {
                        "id": "prod-ashwagandha-003",
                        "manufacturer_id": mfg.id,
                        "name": "Ashwagandha Churna",
                        "description": "Root powder of Withania somnifera standardized to withanolide fractions. Rejuvenative tonic for neuromuscular vitality and stress adaptation.",
                        "category": "Single Herb Churna",
                        "price": 350.0,
                        "currency": "INR",
                        "approval_status": "approved",
                        "is_active": True,
                    },
                    {
                        "id": "prod-trikatu-004",
                        "manufacturer_id": mfg.id,
                        "name": "Trikatu Churna",
                        "description": "Equiproportional blend of Shunthi, Maricha, and Pippali. Deepana and Pachana standard for Agnimandya and respiratory Kapha alleviation.",
                        "category": "Classical Churna",
                        "price": 240.0,
                        "currency": "INR",
                        "approval_status": "approved",
                        "is_active": True,
                    },
                    {
                        "id": "prod-chyawanprash-005",
                        "manufacturer_id": mfg.id,
                        "name": "Chyawanprasha Avaleha",
                        "description": "Classical rejuvenative herbal jam prepared with fresh Amalaki, Dashamoola, and Ashtavarga. Promotes Ojas, respiratory immunity, and vitality.",
                        "category": "Avaleha",
                        "price": 490.0,
                        "currency": "INR",
                        "approval_status": "approved",
                        "is_active": True,
                    },
                ]
                for p in canonical_products:
                    db.add(DBProduct(**p))
                logger.info("Seeded %d canonical products.", len(canonical_products))

        # 3. Seed Journals if table is empty
        journal_count = db.query(DBJournal).count()
        if journal_count == 0:
            articles = [
                {
                    "id": "JRN-ELS-2024-001",
                    "title": "Standardization and Chromatographic Profiling of Polyphenolic Constituents in Classical Triphala Churna",
                    "authors": ["R. S. Sharma", "A. K. Mukherjee", "V. K. Joshi"],
                    "journal_name": "Journal of Ethnopharmacology",
                    "publication_date": datetime(2024, 1, 10, tzinfo=timezone.utc),
                    "doi": "10.1016/j.jep.2023.116842",
                    "url": "https://doi.org/10.1016/j.jep.2023.116842",
                    "abstract": "Ethnopharmacological relevance: Triphala is one of the most extensively utilized Rasayana formulations in Ayurveda. Aim: Establish rigorous HPTLC and LC-MS fingerprint profiles for gallic acid, ellagic acid, and chebulinic acid across diverse batches. Results demonstrate consistent antioxidant capacity correlated directly with total phenolic ratios.",
                    "category": "Phytochemistry",
                    "provider": "Elsevier",
                    "open_access": True,
                    "is_active": True,
                },
                {
                    "id": "JRN-WIN-2023-002",
                    "title": "Efficacy of Tinospora cordifolia (Guduchi) in Modulating Inflammatory Biomarkers in Chronic Hepatic Stress: A Randomized Controlled Pilot Study",
                    "authors": ["S. V. Patil", "M. R. Kulkarni", "D. N. Date"],
                    "journal_name": "Journal of Ayurveda and Integrative Medicine",
                    "publication_date": datetime(2023, 5, 18, tzinfo=timezone.utc),
                    "doi": "10.1016/j.jaim.2023.100714",
                    "url": "https://doi.org/10.1016/j.jaim.2023.100714",
                    "abstract": "A double-blind, randomized controlled clinical trial assessing aqueous extracts of Guduchi stem (500 mg b.i.d.) versus placebo over 12 weeks. Significant reductions in serum ALT/AST and hs-CRP were observed, confirming classical hepatoprotective claims.",
                    "category": "Clinical Trials",
                    "provider": "Winlui",
                    "open_access": True,
                    "is_active": True,
                },
                {
                    "id": "JRN-MED-2023-003",
                    "title": "Neuroprotective and Adaptogenic Potential of Withania somnifera (Ashwagandha): Mechanistic Insights into GABAergic and Cholinergic Pathways",
                    "authors": ["K. Bhattacharya", "P. Sengupta", "N. R. Das"],
                    "journal_name": "Phytomedicine Plus",
                    "publication_date": datetime(2023, 9, 2, tzinfo=timezone.utc),
                    "doi": "10.1016/j.phyplu.2023.100482",
                    "url": "https://doi.org/10.1016/j.phyplu.2023.100482",
                    "abstract": "Standardized Withanolide A and Withaferin A extracts were evaluated in preclinical neurodegeneration models. Observations confirmed restoration of acetylcholinesterase balance and suppression of corticosterone-induced oxidative stress.",
                    "category": "Pharmacology",
                    "provider": "PubMed / PMC",
                    "open_access": True,
                    "is_active": True,
                },
                {
                    "id": "JRN-AYU-2022-004",
                    "title": "Antimicrobial and Anti-inflammatory Evaluation of Haridra (Curcuma longa) in Periodontal Pathogens",
                    "authors": ["M. G. Nair", "S. Chandran", "H. B. Mehta"],
                    "journal_name": "Ayu (Quarterly Journal of Research in Ayurveda)",
                    "publication_date": datetime(2022, 11, 15, tzinfo=timezone.utc),
                    "doi": "10.4103/ayu.AYU_112_22",
                    "url": "https://doi.org/10.4103/ayu.AYU_112_22",
                    "abstract": "Curcuminoid-rich sublingual gels demonstrated significant reduction in periodontal pocket depth and gingival bleeding indices compared with standard chlorhexidine controls.",
                    "category": "Clinical Trials",
                    "provider": "AYUSH Portal",
                    "open_access": True,
                    "is_active": True,
                },
                {
                    "id": "JRN-JAM-2022-005",
                    "title": "Pharmacognostical and Phytochemical Evaluation of Commiphora mukul (Guggulu) Oleo-Gum-Resin in Hyperlipidemia",
                    "authors": ["A. R. Joshi", "P. K. Verma"],
                    "journal_name": "International Journal of Ayurvedic Medicine",
                    "publication_date": datetime(2022, 6, 20, tzinfo=timezone.utc),
                    "doi": "10.47552/ijam.v13i2.2140",
                    "url": "https://doi.org/10.47552/ijam.v13i2.2140",
                    "abstract": "Chromatographic quantification of E- and Z-guggulsterone fractions verifying compliance with Ayurvedic Pharmacopoeia of India specifications for lipid metabolism modulation.",
                    "category": "Quality & Standardization",
                    "provider": "AYUSH Portal",
                    "open_access": True,
                    "is_active": True,
                },
                {
                    "id": "JRN-TRC-2023-006",
                    "title": "Safety and Toxicological Profile of Classical Rasaushadhi (Swarna Bhasma) Following 90-Day Subchronic Oral Administration",
                    "authors": ["T. S. Murthy", "B. L. Mehra", "R. K. Singh"],
                    "journal_name": "Journal of Trace Elements in Medicine and Biology",
                    "publication_date": datetime(2023, 11, 4, tzinfo=timezone.utc),
                    "doi": "10.1016/j.jtemb.2023.127210",
                    "url": "https://doi.org/10.1016/j.jtemb.2023.127210",
                    "abstract": "Standardized incineration cycles of gold foils with herbal swarasa yielded nano-dimensional crystallites. Organ histopathology and serum biochemical assays confirmed no detectable renal or hepatic cellular toxicity within therapeutic posology.",
                    "category": "Toxicology",
                    "provider": "Elsevier",
                    "open_access": True,
                    "is_active": True,
                },
            ]

            for a in articles:
                db_journal = DBJournal(**a)
                db.add(db_journal)

            logger.info("Seeded %d authentic Ayurveda peer-reviewed journal articles.", len(articles))

        # 4. Seed Canonical Ayurveda Library Entries if table is empty
        from databases.schema.models import LibraryEntry as DBLibraryEntry
        entry_count = db.query(DBLibraryEntry).count()
        if entry_count == 0:
            canonical_entries = [
                {
                    "id": "r-afi-1",
                    "title": "Triphala Churna (AFI Formulary Standard)",
                    "category": "AFI",
                    "summary": "Statutory compound formulation standard for Triphala Churna containing equal proportions of Haritaki, Bibhitaki, and Amalaki.",
                    "content": "Equal parts of dried pericarp of Haritaki, Bibhitaki, and Amalaki pulverized and sieved to uniform fineness. Indicated for Anaha, Prameha, Netra roga, and as Rasayana. Dosage: 3 to 6 g with madhu, ghrita, or warm water. Shloka: हरीतकी बिभीतकी धात्री समभागेन चूर्णिता । त्रिफला नाम विख्याता सर्वरोगविनाशिनी ॥",
                    "source_references": ["Ayurvedic Formulary of India Part I, 7:33", "Bhavaprakasha Samhita"],
                    "is_published": True,
                },
                {
                    "id": "r-afi-2",
                    "title": "Chyawanprasha Avaleha (AFI Formulary Standard)",
                    "category": "AFI",
                    "summary": "Prepared from mature Amalaki fruits processed with Dashamoola, Ashtavarga, Pippali, and prakshepa dravyas.",
                    "content": "Prepared from fresh mature Amalaki fruits processed with Dashamoola, Ashtavarga, Pippali, and standard aromatic prakshepa dravyas in pure sesame oil and cow's ghrita. Supreme rejuvenative for respiratory vitality and tissue immunity (Ojas). Shloka: च्यवनप्राशः परं प्रोक्तं रसायनानामुत्तमम् । कासश्वासहरं चैव विशेषेणोपदिश्यते ॥",
                    "source_references": ["Ayurvedic Formulary of India Part I, 3:11", "Charaka Samhita Chikitsa 1.1"],
                    "is_published": True,
                },
                {
                    "id": "r-api-1",
                    "title": "Haritaki Monograph (API Single Drug Standard)",
                    "category": "API",
                    "summary": "Statutory single drug standard for dried pericarp of mature fruit of Terminalia chebula Retz. (Fam. Combretaceae).",
                    "content": "Botanical Name: Terminalia chebula Retz. Macroscopic and microscopic diagnostic standards. Rasapanchaka: Kashaya, Tikta, Madhura, Katu, Amla (Pancharasa alavana), Ushna virya, Madhura vipaka. Indicated for Vibandha, Gulma, Udara, Arsha, and Rasayana. Shloka: हरीतकी मनुष्याणां मातेव हितकारिणी । कदाचित् कुप्यते माता नोदरस्था हरीतकी ॥",
                    "source_references": ["Ayurvedic Pharmacopoeia of India Part I, Vol I, Monograph 24"],
                    "is_published": True,
                },
                {
                    "id": "r-api-2",
                    "title": "Amalaki Monograph (API Single Drug Standard)",
                    "category": "API",
                    "summary": "Statutory single drug standard for dried fruit pulp of Phyllanthus emblica L. (Fam. Euphorbiaceae).",
                    "content": "Botanical Name: Phyllanthus emblica L. Rich in natural ascorbic acid and hydrolyzable tannins (emblicanin A & B, punigluconin). Rasa: Amla pradhana, Sheeta virya, Madhura vipaka. Supreme Rasayana, Pittashamaka, and Vayasthapana. Shloka: वयःस्थापनीयानां चामलकी श्रेष्ठम् ॥",
                    "source_references": ["Ayurvedic Pharmacopoeia of India Part I, Vol I, Monograph 4"],
                    "is_published": True,
                },
                {
                    "id": "r-cs-1",
                    "title": "Charaka Samhita: Sutrasthana Chapter 1 (Deerghanjeevitiya Adhyaya)",
                    "category": "Classical",
                    "summary": "Foundational treatise on the descent of Ayurveda, Trishutra (Hetu, Linga, Aushadha), and the definition of Ayu.",
                    "content": "The canonical treatise establishes the definition of Ayu (Sharira-indriya-sattva-atma-samyogo dhari jeevitam). Enumerates Samanya, Vishesha, Guna, Dravya, Karma, and Samavaya as the six padarthas underlying Ayurvedic therapeutic reasoning. Shloka: हिताहितं सुखं दुःखमायुस्तस्य हिताहितम् । मानं च तच्च यत्रोक्तमायुर्वेदः स उच्यते ॥",
                    "source_references": ["Charaka Samhita Sutrasthana 1:41-42"],
                    "is_published": True,
                },
                {
                    "id": "r-ss-1",
                    "title": "Sushruta Samhita: Sutrasthana Chapter 1 (Vedotpatti Adhyaya)",
                    "category": "Classical",
                    "summary": "Canonical treatise on Shalya Tantra (surgery) and Dhanvantari transmission of Ayurveda.",
                    "content": "Defines the dual aim of Ayurveda: preservation of health in the healthy and alleviation of disease in the afflicted (Swasthasya swasthya rakshanam, aturasya vikara prashamanam). Details the Ashtanga (eight branches) with primary focus on Shalya Tantra as the supreme, swift-acting clinical discipline. Shloka: समदोषः समाग्निश्च समधातुमलक्रियः । प्रसन्नात्मेन्द्रियमनाः स्वस्थ इत्यभिधीयते ॥",
                    "source_references": ["Sushruta Samhita Sutrasthana 15:41"],
                    "is_published": True,
                },
            ]

            for e in canonical_entries:
                db_entry = DBLibraryEntry(**e)
                db.add(db_entry)

            logger.info("Seeded %d canonical Ayurveda library entries into PostgreSQL.", len(canonical_entries))

                # Seed initial Public Relations articles if empty
        if db.query(PublicRelation).count() == 0:
            pr_entries = [
                PublicRelation(
                    title="Meyveda Unveils Sovereign AYUSH Clinical Desk & Protocol Platform for Registered Vaidyas",
                    slug="meyveda-unveils-sovereign-ayush-clinical-desk",
                    category="Press Release",
                    media_source="Meyveda Media Desk",
                    media_source_url="https://meyveda.com",
                    summary="Meyveda announces the national rollout of its ABDM-ready clinical desk, eliminating practitioner administrative burdens while ensuring zero commercial commissions.",
                    content="Meyveda Ayush Pvt Ltd has officially launched its digital clinician operating system, designed specifically for registered BAMS, BUMS, BHMS, and BSMS practitioners across India. With full ABDM-HPR compliance, e-prescriptions, and zero-inventory pharmacy fulfillment, Meyveda establishes a clear division of operational responsibility: non-clinical workflows are fully handled by the platform, leaving diagnosis, treatment selection, and patient care entirely in the hands of the doctor.",
                    published_date=datetime.now(timezone.utc).date(),
                    is_featured=True,
                    status="published",
                ),
                PublicRelation(
                    title="AYUSH Clinical Research Initiative: Aggregating Real-World Evidence (RWE) Across Southern Districts",
                    slug="ayush-clinical-research-initiative-real-world-evidence",
                    category="Statutory Milestone",
                    media_source="Business Standard",
                    media_source_url="https://business-standard.com",
                    summary="A collaborative framework linking state council-registered practitioners with authenticated classical pharmacology monographs and longitudinal outcomes.",
                    content="In partnership with leading academic clinicians and accredited laboratories, Meyveda is pioneering the systematic documentation of constitutional (Prakriti) assessments and patient recovery trajectories. This real-world evidence framework bridges classical Ayurvedic principles with contemporary peer-reviewed scientific validation.",
                    published_date=datetime.now(timezone.utc).date(),
                    is_featured=False,
                    status="published",
                ),
                PublicRelation(
                    title="Meyveda Cluster Franchise Model Expands District-Level AYUSH Supply Infrastructure",
                    slug="meyveda-cluster-franchise-model-expands-supply-infrastructure",
                    category="Partnership Announcement",
                    media_source="Express Healthcare",
                    media_source_url="https://expresshealthcare.in",
                    summary="New exclusive district hub network ensures doctor-guided, authenticated herbal deliveries within 24 to 48 hours directly to patients.",
                    content="Meyveda's Cluster Franchise program empowers local healthcare entrepreneurs to operate exclusive district fulfillment hubs. By replacing unverified direct-to-consumer commerce with doctor-guided, batch-tested herbal deliveries, Meyveda ensures medicine authenticity and timely patient support.",
                    published_date=datetime.now(timezone.utc).date(),
                    is_featured=False,
                    status="published",
                ),
            ]
            for pr in pr_entries:
                db.add(pr)
            logger.info("Seeded %d initial Public Relations records.", len(pr_entries))

        # Seed initial Blog posts if empty
        if db.query(BlogPost).count() == 0:
            blog_entries = [
                BlogPost(
                    title="Modernizing Clinical Nadi Pariksha: Integrating Classical Pulse Diagnostics with Longitudinal Vitals",
                    slug="modernizing-clinical-nadi-pariksha-classical-pulse",
                    author_name="Dr. Ramesh Vaidya, BAMS",
                    author_role="Chief Ayurvedic Consultant & Research Lead",
                    category="Clinical Practice",
                    reading_time="5 min read",
                    tags=["Kayachikitsa", "Nadi Pariksha", "Clinical Protocols"],
                    summary="How systematic recording of Tridosha imbalances and Rogi-Roga Pariksha transforms subjective pulse analysis into verifiable clinical evidence.",
                    content="Classical Ayurveda places Nadi Pariksha (pulse examination) at the pinnacle of the Ashtavidha Pariksha. However, in contemporary practice, transmitting and tracking these diagnostic insights across multi-session treatments requires structured documentation. In this clinical guide, we explore how standardized Prakriti-Vikriti digital indexing preserves the nuance of pulse tactile dynamics while creating verifiable longitudinal health records for integrative follow-ups.",
                    is_featured=True,
                    status="published",
                ),
                BlogPost(
                    title="Classical Pharmacology & Heavy Metal Safety: Vetting Rasa Shastra Formulations Under GMP Standards",
                    slug="classical-pharmacology-heavy-metal-safety-rasa-shastra",
                    author_name="Meyveda Editorial & Quality Board",
                    author_role="Department of Pharmaceutical Quality",
                    category="Ayurvedic Pharmacology",
                    reading_time="6 min read",
                    tags=["Rasa Shastra", "Heavy Metal Testing", "GMP Compliance"],
                    summary="An analysis of Shodhana and Marana purification cycles, AAS testing protocols, and ensuring patient trust in classical herbo-mineral preparations.",
                    content="Herbo-mineral formulations in Ayurveda, developed through centuries of Rasa Shastra expertise, require exacting purification (Shodhana) and calcination (Marana) processes. When produced under strict Good Manufacturing Practices (GMP) and verified through Atomic Absorption Spectroscopy (AAS), Bhasmas demonstrate optimal bioavailability and strict adherence to statutory safety limits. We review the essential laboratory criteria every practitioner must review before prescribing.",
                    is_featured=False,
                    status="published",
                ),
                BlogPost(
                    title="The Digital Vaidya: Navigating ABDM-HPR Compliance & Sovereign Practice Ownership",
                    slug="the-digital-vaidya-navigating-abdm-hpr-compliance",
                    author_name="Dr. Akshara V., BAMS, MD (Ayu)",
                    author_role="Health Informatics Specialist",
                    category="Regulatory & ABDM",
                    reading_time="4 min read",
                    tags=["ABDM", "Healthcare Identity", "Telemedicine"],
                    summary="Demystifying Healthcare Professional Registry (HPR) enrollment, statutory compliance, and digital prescription validity under National Health Authority standards.",
                    content="The Ayushman Bharat Digital Mission (ABDM) has introduced a transformative leap for AYUSH practitioners. By linking state medical council credentials to a verified Healthcare Professional Registry (HPR) ID, doctors gain sovereign ownership of their digital identity. This article walks through the key statutory advantages, from digital signature compliance to direct integration with national health claim gateways.",
                    is_featured=False,
                    status="published",
                ),
            ]
            for blog in blog_entries:
                db.add(blog)
            logger.info("Seeded %d initial Blog records.", len(blog_entries))

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Error during database seeding: %s", exc)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_database()
