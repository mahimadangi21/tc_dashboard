import uuid
import enum
from datetime import datetime, date
from typing import List
from sqlalchemy import String, Boolean, DateTime, Date, Enum, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TRAINEE = "trainee"

class Trainee(Base):
    __tablename__ = "trainees"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(100), default='Development')
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.TRAINEE, nullable=False)
    joining_date: Mapped[date] = mapped_column(Date, default=date.today)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Assigned Technologies: stored as a JSON array of strings e.g. ['Python', 'React']
    technologies: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    # HackerRank statistics
    hackerrank_username: Mapped[str] = mapped_column(String(100), nullable=True)
    hackerrank_score: Mapped[int] = mapped_column(default=0, nullable=False)
    hackerrank_solved: Mapped[int] = mapped_column(default=0, nullable=False)

    # Relationships
    trainee_tasks: Mapped[List["TraineeTask"]] = relationship(
        back_populates="trainee",
        cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="trainee",
        cascade="all, delete-orphan"
    )
