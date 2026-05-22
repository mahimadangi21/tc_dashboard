import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool
from alembic import context

# Add backend directory to sys.path to allow imports of local modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load environment variables
load_dotenv()

# Import database Base and models to populate metadata for autogenerate
from database import Base
import models  # Ensures all ORM models are registered on Base

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set database URL dynamically from environment variables
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    """Utility function to configure context and run migrations sync."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an async engine."""
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        raise ValueError("DATABASE_URL not found in environment or config.")
        
    if "?" in url:
        clean_url = url.split("?")[0]
    else:
        clean_url = url
        
    # Disable SQLAlchemy asyncpg dialect prepared statement caching for PgBouncer compatibility
    clean_url = f"{clean_url}?prepared_statement_cache_size=0"
        
    connectable = create_async_engine(
        clean_url,
        connect_args={"ssl": True, "statement_cache_size": 0},
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    # Run the online migrations within the asyncio event loop
    asyncio.run(run_migrations_online())
