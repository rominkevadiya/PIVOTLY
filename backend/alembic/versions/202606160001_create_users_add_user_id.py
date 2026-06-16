"""create users table and add user_id to reports

Revision ID: 202606160001
Revises: 202606150001
Create Date: 2026-06-16 09:15:00.000000+05:30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "202606160001"
down_revision: Union[str, None] = "202606150001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create users table and add user_id FK to reports."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # Add user_id to reports (nullable for existing data)
    op.add_column(
        "reports",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_reports_user_id",
        "reports",
        "users",
        ["user_id"],
        ["id"],
    )
    op.create_index(op.f("ix_reports_user_id"), "reports", ["user_id"])


def downgrade() -> None:
    """Remove user_id from reports and drop users table."""
    op.drop_index(op.f("ix_reports_user_id"), table_name="reports")
    op.drop_constraint("fk_reports_user_id", "reports", type_="foreignkey")
    op.drop_column("reports", "user_id")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
