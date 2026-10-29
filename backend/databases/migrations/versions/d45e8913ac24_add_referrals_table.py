"""add_referrals_table

Revision ID: d45e8913ac24
Revises: c18e2469ab51
Create Date: 2026-10-21 13:38:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd45e8913ac24'
down_revision: Union[str, Sequence[str], None] = 'c18e2469ab51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'referrals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('referring_doctor_id', sa.String(length=36), nullable=False),
        sa.Column('referred_name', sa.String(length=200), nullable=False),
        sa.Column('referred_contact', sa.String(length=320), nullable=False),
        sa.Column('reason', sa.String(length=2000), nullable=False),
        sa.Column('status', sa.Enum('submitted', 'accepted', 'completed', 'declined', name='referral_status'), nullable=False),
        sa.Column('score_awarded', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['referring_doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('referring_doctor_id', 'referred_contact', name='uq_doctor_referred_contact')
    )
    op.create_index(op.f('ix_referrals_referring_doctor_id'), 'referrals', ['referring_doctor_id'], unique=False)
    op.create_index(op.f('ix_referrals_referred_contact'), 'referrals', ['referred_contact'], unique=False)
    op.create_index(op.f('ix_referrals_status'), 'referrals', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_referrals_status'), table_name='referrals')
    op.drop_index(op.f('ix_referrals_referred_contact'), table_name='referrals')
    op.drop_index(op.f('ix_referrals_referring_doctor_id'), table_name='referrals')
    op.drop_table('referrals')
