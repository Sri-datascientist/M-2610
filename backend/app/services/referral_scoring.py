"""Referral scoring and leaderboard calculation service.

Encapsulates business rules for scoring referrals and computing rankings.
"""
from typing import TypedDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from databases.schema.models import Doctor, Referral as DBReferral


class DoctorScoreData(TypedDict):
    doctor_id: str
    doctor_name: str
    score: int
    referral_count: int


def calculate_doctor_referral_score(doctor_id: str, db: Session) -> tuple[int, int]:
    """Calculate the referral score and count for a given doctor.

    Scoring Rule:
    - Each referral record contains `score_awarded` (which can be awarded upon completion or status milestones).
    - If `score_awarded` has been populated, it is summed.
    - If no explicit points were assigned, each 'completed' referral yields 10 points,
      each 'accepted' referral yields 5 points, and 'submitted' yields 1 point.
    - Total count includes all active referrals initiated by the doctor.

    Returns:
        (total_score, referral_count)
    """
    referrals = db.query(DBReferral).filter(DBReferral.referring_doctor_id == doctor_id).all()
    count = len(referrals)
    total_score = 0

    for ref in referrals:
        if ref.score_awarded > 0:
            total_score += ref.score_awarded
        else:
            # Deterministic default scoring based on referral lifecycle status
            if ref.status == "completed":
                total_score += 10
            elif ref.status == "accepted":
                total_score += 5
            elif ref.status == "submitted":
                total_score += 1

    return total_score, count


def get_referral_leaderboard_data(db: Session, limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    """Compute deterministic referral leaderboard ranking across all doctors.

    Tie-breaking:
    1. Score descending
    2. Referral count descending
    3. Doctor full_name ascending (alphabetical)
    4. Doctor id ascending
    """
    doctors = db.query(Doctor).all()

    leaderboard_entries: list[DoctorScoreData] = []
    for doc in doctors:
        score, count = calculate_doctor_referral_score(doc.id, db)
        leaderboard_entries.append({
            "doctor_id": doc.id,
            "doctor_name": doc.full_name,
            "score": score,
            "referral_count": count,
        })

    # Sort deterministically
    leaderboard_entries.sort(
        key=lambda entry: (-entry["score"], -entry["referral_count"], entry["doctor_name"], entry["doctor_id"])
    )

    total = len(leaderboard_entries)
    paginated = leaderboard_entries[offset : offset + limit]

    ranked_items = []
    for idx, entry in enumerate(paginated, start=offset + 1):
        ranked_items.append({
            "doctor_id": entry["doctor_id"],
            "doctor_name": entry["doctor_name"],
            "score": entry["score"],
            "referral_count": entry["referral_count"],
            "rank": idx,
        })

    return ranked_items, total
