from datetime import datetime, date
import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from models.task import PlatformType
from models.trainee_task import TaskStatus

# For input validation
Status = Literal['Completed', 'In Progress', 'Not Started', 'Does Not Apply']

class TaskBase(BaseModel):
    task_name: str
    platform: PlatformType
    category: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class TraineeTaskBase(BaseModel):
    trainee_id: uuid.UUID
    task_id: int
    status: Status
    notes: Optional[str] = None

class TraineeTaskCreate(TraineeTaskBase):
    pass

class TraineeTaskUpdate(BaseModel):
    status: Status
    notes: Optional[str] = None
    completion_date: Optional[date] = None

class TraineeTaskResponse(BaseModel):
    id: int
    trainee_id: uuid.UUID
    task_id: int
    status: TaskStatus
    assigned_date: date
    completion_date: Optional[date] = None
    notes: Optional[str] = None
    task: TaskResponse
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)