"""add_contact_messages_table

Revision ID: c92a3481ef12
Revises: b81f3419c821
Create Date: 2026-10-30 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c92a3481ef12'
down_revision: Union[str, Sequence[str], None] = 'b81f3419c821'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'contact_messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='General Inquiry'),
        sa.Column('subject', sa.String(length=250), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='New'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_contact_messages_full_name'), 'contact_messages', ['full_name'], unique=False)
    op.create_index(op.f('ix_contact_messages_email'), 'contact_messages', ['email'], unique=False)
    op.create_index(op.f('ix_contact_messages_phone'), 'contact_messages', ['phone'], unique=False)
    op.create_index(op.f('ix_contact_messages_category'), 'contact_messages', ['category'], unique=False)
    op.create_index(op.f('ix_contact_messages_subject'), 'contact_messages', ['subject'], unique=False)
    op.create_index(op.f('ix_contact_messages_status'), 'contact_messages', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_contact_messages_status'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_subject'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_category'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_phone'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_email'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_full_name'), table_name='contact_messages')
    op.drop_table('contact_messages')

