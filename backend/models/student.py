import uuid
import enum
from datetime import datetime, date
from typing import List
from sqlalchemy import String, Boolean, DateTime, Date, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STUDENT = "student"

class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(100), default='Development')
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    joining_date: Mapped[date] = mapped_column(Date, default=date.today)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student_tasks: Mapped[List["StudentTask"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan"
    )
