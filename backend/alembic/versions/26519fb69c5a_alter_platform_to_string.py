"""alter_platform_to_string

Revision ID: 26519fb69c5a
Revises: a2c670996f20
Create Date: 2026-05-22 11:57:36.295363

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26519fb69c5a'
down_revision: Union[str, Sequence[str], None] = 'a2c670996f20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'tasks',
        'platform',
        type_=sa.String(length=100),
        existing_nullable=False,
        postgresql_using='platform::varchar'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'tasks',
        'platform',
        type_=sa.Enum('CODECHEF', 'HACKERRANK', 'AKAMAI', 'INTERNAL', name='platformtype'),
        existing_nullable=False,
        postgresql_using='platform::platformtype'
    )

