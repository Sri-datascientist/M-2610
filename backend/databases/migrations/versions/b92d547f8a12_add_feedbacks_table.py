"""add_feedbacks_table

Revision ID: b92d547f8a12
Revises: f868b14d9c0d
Create Date: 2026-10-21 13:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b92d547f8a12'
down_revision: Union[str, Sequence[str], None] = 'f868b14d9c0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'feedbacks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('doctor_id', sa.String(length=36), nullable=False),
        sa.Column('category', sa.Enum('product', 'service', 'website', 'other', name='feedback_category'), nullable=False),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('new', 'in_review', 'resolved', 'dismissed', name='feedback_status'), nullable=False),
        sa.Column('admin_notes', sa.String(length=2000), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_feedbacks_doctor_id'), 'feedbacks', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_feedbacks_category'), 'feedbacks', ['category'], unique=False)
    op.create_index(op.f('ix_feedbacks_status'), 'feedbacks', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_feedbacks_status'), table_name='feedbacks')
    op.drop_index(op.f('ix_feedbacks_category'), table_name='feedbacks')
    op.drop_index(op.f('ix_feedbacks_doctor_id'), table_name='feedbacks')
    op.drop_table('feedbacks')
