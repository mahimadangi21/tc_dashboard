import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.trainee import Trainee
from auth.dependencies import get_current_user
from schemas.notification import NotificationResponse
from services.trainee_service import TraineeService
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await TraineeService.get_notifications(db, current_user.id)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await TraineeService.mark_notification_read(db, notification_id, current_user.id)

