from datetime import datetime, date
import uuid
from pydantic import BaseModel
from typing import Optional, Literal
from models.task import PlatformType

# Status must be Literal['Completed', 'In Progress', 'Not Started', 'Does Not Apply']
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

    class Config:
        from_attributes = True

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
    status: Status
    assigned_date: date
    completion_date: Optional[date] = None
    notes: Optional[str] = None
    task: TaskResponse

    class Config:
        from_attributes = True
