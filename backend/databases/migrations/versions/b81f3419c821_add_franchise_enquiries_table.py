"""add_franchise_enquiries_table

Revision ID: b81f3419c821
Revises: e56f9124be35
Create Date: 2026-10-30 13:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b81f3419c821'
down_revision: Union[str, Sequence[str], None] = 'e56f9124be35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'franchise_enquiries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('mobile', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=True),
        sa.Column('territory_pincode', sa.String(length=10), nullable=False),
        sa.Column('interested_tier', sa.String(length=100), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='New'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_franchise_enquiries_full_name'), 'franchise_enquiries', ['full_name'], unique=False)
    op.create_index(op.f('ix_franchise_enquiries_mobile'), 'franchise_enquiries', ['mobile'], unique=False)
    op.create_index(op.f('ix_franchise_enquiries_email'), 'franchise_enquiries', ['email'], unique=False)
    op.create_index(op.f('ix_franchise_enquiries_territory_pincode'), 'franchise_enquiries', ['territory_pincode'], unique=False)
    op.create_index(op.f('ix_franchise_enquiries_interested_tier'), 'franchise_enquiries', ['interested_tier'], unique=False)
    op.create_index(op.f('ix_franchise_enquiries_status'), 'franchise_enquiries', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_franchise_enquiries_status'), table_name='franchise_enquiries')
    op.drop_index(op.f('ix_franchise_enquiries_interested_tier'), table_name='franchise_enquiries')
    op.drop_index(op.f('ix_franchise_enquiries_territory_pincode'), table_name='franchise_enquiries')
    op.drop_index(op.f('ix_franchise_enquiries_email'), table_name='franchise_enquiries')
    op.drop_index(op.f('ix_franchise_enquiries_mobile'), table_name='franchise_enquiries')
    op.drop_index(op.f('ix_franchise_enquiries_full_name'), table_name='franchise_enquiries')
    op.drop_table('franchise_enquiries')

