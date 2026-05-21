from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class NotificationBase(BaseModel):
    title: str
    message: str


class NotificationCreate(NotificationBase):
    trainee_id: UUID


class NotificationResponse(NotificationBase):
    id: UUID
    trainee_id: UUID
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
