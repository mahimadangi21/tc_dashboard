from datetime import datetime, date
import uuid
from pydantic import BaseModel, EmailStr, computed_field, Field
from typing import Optional, List
from models.trainee import UserRole
from schemas.task import TraineeTaskResponse

class TraineeBase(BaseModel):
    trainee_name: str
    email: EmailStr
    department: str = "Development"
    joining_date: date = Field(default_factory=date.today)
    technologies: List[str] = []
    hackerrank_username: Optional[str] = None
    hackerrank_score: int = 0
    hackerrank_solved: int = 0

class TraineeCreate(TraineeBase):
    password: str

class TraineeUpdate(BaseModel):
    trainee_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    technologies: Optional[List[str]] = None
    hackerrank_username: Optional[str] = None
    hackerrank_score: Optional[int] = None
    hackerrank_solved: Optional[int] = None

class TraineeResponse(TraineeBase):
    id: uuid.UUID
    role: UserRole
    is_active: bool
    created_at: datetime

    @computed_field
    @property
    def overall_progress(self) -> float:
        # Prevent accessing lazy-loaded attributes in async environment
        if "trainee_tasks" in getattr(self, "__dict__", {}):
            tasks = self.trainee_tasks
            if tasks:
                # Count tasks that do not have 'Does Not Apply'
                applicable = [t for t in tasks if getattr(t, "status", None) != "Does Not Apply" and getattr(t, "status", None) is not None]
                if not applicable:
                    return 0.0
                completed = [t for t in applicable if getattr(t, "status", None) in ("Completed", "COMPLETED")]
                return round((len(completed) / len(applicable)) * 100.0, 1)
        # Return fallback value or 0.0 if not loaded
        return getattr(self, "_overall_progress", 0.0)

    class Config:
        from_attributes = True

class TraineeFullDetail(TraineeResponse):
    trainee_tasks: List[TraineeTaskResponse] = []

    class Config:
        from_attributes = True
