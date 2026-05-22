import enum
from datetime import datetime
from typing import List
from sqlalchemy import String, DateTime, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class PlatformType(str, enum.Enum):
    CODECHEF = "Codechef"
    HACKERRANK = "HackerRank"
    AKAMAI = "Akamai"
    INTERNAL = "Internal"

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    trainee_tasks: Mapped[List["TraineeTask"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan"
    )
