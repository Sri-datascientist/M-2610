"""add_adr_reports_table

Revision ID: c18e2469ab51
Revises: b92d547f8a12
Create Date: 2026-10-21 13:34:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c18e2469ab51'
down_revision: Union[str, Sequence[str], None] = 'b92d547f8a12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'adr_reports',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('doctor_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('product_name', sa.String(length=300), nullable=False),
        sa.Column('reaction', sa.String(length=2000), nullable=False),
        sa.Column('occurred_on', sa.Date(), nullable=False),
        sa.Column('outcome', sa.Enum('recovered', 'recovering', 'not_recovered', 'fatal', 'unknown', name='adr_outcome'), nullable=False),
        sa.Column('seriousness', sa.Enum('non_serious', 'serious', 'life_threatening', 'fatal', name='adr_seriousness'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('submitted', 'under_review', 'closed', name='adr_status'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_adr_reports_doctor_id'), 'adr_reports', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_adr_reports_product_id'), 'adr_reports', ['product_id'], unique=False)
    op.create_index(op.f('ix_adr_reports_seriousness'), 'adr_reports', ['seriousness'], unique=False)
    op.create_index(op.f('ix_adr_reports_status'), 'adr_reports', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_adr_reports_status'), table_name='adr_reports')
    op.drop_index(op.f('ix_adr_reports_seriousness'), table_name='adr_reports')
    op.drop_index(op.f('ix_adr_reports_product_id'), table_name='adr_reports')
    op.drop_index(op.f('ix_adr_reports_doctor_id'), table_name='adr_reports')
    op.drop_table('adr_reports')
