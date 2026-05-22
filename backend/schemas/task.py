from datetime import datetime, date
import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Literal
from models.task import PlatformType
from models.trainee_task import TaskStatus

# For input validation
Status = Literal['Completed', 'In Progress', 'Not Started', 'Does Not Apply']

class TaskBase(BaseModel):
    task_name: str
    platform: str
    category: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    # assign_to_all=True → assign to all active trainees (backward compatible default)
    # assign_to_all=False + assign_to=[...] → assign to specific trainees only
    # assign_to_all=False + assign_to=[] → create task with no assignments
    assign_to_all: bool = True
    assign_to: Optional[List[uuid.UUID]] = None

class AssignTaskRequest(BaseModel):
    trainee_ids: List[uuid.UUID]

class TaskAssignmentResponse(BaseModel):
    trainee_id: uuid.UUID
    trainee_name: str
    status: str
    assigned_date: date
    model_config = ConfigDict(from_attributes=True)

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