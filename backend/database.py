import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment variables.")

# Clean URL for asyncpg compatibility (removes ?sslmode=require which raises a TypeError in asyncpg)
if "?" in DATABASE_URL:
    clean_url = DATABASE_URL.split("?")[0]
else:
    clean_url = DATABASE_URL

# Disable SQLAlchemy asyncpg dialect prepared statement caching for PgBouncer compatibility
clean_url = f"{clean_url}?prepared_statement_cache_size=0"

# Create the async engine with NeonDB optimized connection pooling and SSL connection arguments
engine = create_async_engine(
    clean_url,
    connect_args={"ssl": False if "127.0.0.1" in clean_url or "localhost" in clean_url else True, "statement_cache_size": 0},
    echo=False,
    pool_pre_ping=True,     # auto-reconnect after NeonDB sleep
    pool_size=5,
    max_overflow=10,
    pool_recycle=300
)



# Create the async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Modern SQLAlchemy 2.0 Base Class
class Base(DeclarativeBase):
    pass

# Dependency to get db session (for backward compatibility)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
