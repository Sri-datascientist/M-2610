"""add_colleague_invitations_table

Revision ID: e56f9124be35
Revises: d45e8913ac24
Create Date: 2026-10-30 12:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e56f9124be35'
down_revision: Union[str, Sequence[str], None] = 'd45e8913ac24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'colleague_invitations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('referring_doctor_id', sa.String(length=36), nullable=True),
        sa.Column('inviting_doctor_name', sa.String(length=200), nullable=False),
        sa.Column('inviting_doctor_qualification', sa.String(length=100), nullable=True),
        sa.Column('invite_code', sa.String(length=50), nullable=False),
        sa.Column('colleague_name', sa.String(length=200), nullable=False),
        sa.Column('colleague_email', sa.String(length=320), nullable=False),
        sa.Column('colleague_mobile', sa.String(length=50), nullable=False),
        sa.Column('qualification', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Invitation Sent'),
        sa.Column('email_dispatched', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('registration_url', sa.String(length=1000), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['referring_doctor_id'], ['doctors.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_colleague_invitations_referring_doctor_id'), 'colleague_invitations', ['referring_doctor_id'], unique=False)
    op.create_index(op.f('ix_colleague_invitations_invite_code'), 'colleague_invitations', ['invite_code'], unique=False)
    op.create_index(op.f('ix_colleague_invitations_colleague_name'), 'colleague_invitations', ['colleague_name'], unique=False)
    op.create_index(op.f('ix_colleague_invitations_colleague_email'), 'colleague_invitations', ['colleague_email'], unique=False)
    op.create_index(op.f('ix_colleague_invitations_status'), 'colleague_invitations', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_colleague_invitations_status'), table_name='colleague_invitations')
    op.drop_index(op.f('ix_colleague_invitations_colleague_email'), table_name='colleague_invitations')
    op.drop_index(op.f('ix_colleague_invitations_colleague_name'), table_name='colleague_invitations')
    op.drop_index(op.f('ix_colleague_invitations_invite_code'), table_name='colleague_invitations')
    op.drop_index(op.f('ix_colleague_invitations_referring_doctor_id'), table_name='colleague_invitations')
    op.drop_table('colleague_invitations')

