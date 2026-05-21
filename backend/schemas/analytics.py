from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import uuid

class TaskSummary(BaseModel):
    task_name: str
    platform: str
    completed_count: int
    in_progress_count: int
    not_started_count: int
    does_not_apply_count: int
    completion_rate: float
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class StudentSummary(BaseModel):
    student_name: str
    completed: int
    in_progress: int
    not_started: int
    does_not_apply: int
    overall_progress: float
    student_id: Optional[uuid.UUID] = None
    email: Optional[str] = None
    total_tasks: Optional[int] = None
    completion_rate: Optional[float] = None
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class DashboardSummary(BaseModel):
    total_students: int
    total_tasks: int
    total_assignments: int
    total_completed: int
    total_in_progress: int
    total_not_started: int
    total_does_not_apply: int
    overall_completion_rate: float
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class PlatformSummary(BaseModel):
    platform: str
    total_tasks: int
    avg_completion_rate: float
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class GridStudent(BaseModel):
    student_name: str
    statuses: List[str]

class GridResponse(BaseModel):
    tasks: List[str]
    students: List[GridStudent]
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)