import enum
import uuid
from datetime import date
from sqlalchemy import Integer, ForeignKey, Enum, Date, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class TaskStatus(str, enum.Enum):
    COMPLETED = "Completed"
    IN_PROGRESS = "In Progress"
    NOT_STARTED = "Not Started"
    DOES_NOT_APPLY = "Does Not Apply"

class TraineeTask(Base):
    __tablename__ = "trainee_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    trainee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trainees.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.NOT_STARTED, nullable=False)
    assigned_date: Mapped[date] = mapped_column(Date, default=date.today)
    completion_date: Mapped[date] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    trainee: Mapped["Trainee"] = relationship(back_populates="trainee_tasks")
    task: Mapped["Task"] = relationship(back_populates="trainee_tasks")

    __table_args__ = (
        UniqueConstraint("trainee_id", "task_id", name="uq_trainee_task"),
    )
