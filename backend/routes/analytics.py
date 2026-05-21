from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from models.trainee import Trainee
from auth.dependencies import require_admin
from schemas.analytics import DashboardSummary, StudentSummary, TaskSummary, PlatformSummary, GridResponse
from services.trainee_service import TraineeService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Return high-level aggregated dashboard statistics.
    """
    return await TraineeService.get_dashboard_summary(db)

@router.get("/student-wise", response_model=List[StudentSummary])
async def get_student_wise(
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Return completion breakdowns per trainee, sorted by overall progress descending.
    """
    return await TraineeService.get_student_wise_summary(db)

@router.get("/task-wise", response_model=List[TaskSummary])
async def get_task_wise(
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Return completion statistics per task.
    """
    return await TraineeService.get_task_wise_summary(db)

@router.get("/platform-wise", response_model=List[PlatformSummary])
async def get_platform_wise(
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Group tasks by platform and retrieve average completion rates.
    """
    return await TraineeService.get_platform_wise_summary(db)

@router.get("/grid", response_model=GridResponse)
async def get_grid(
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Retrieve full spreadsheet matrix of current statuses.
    """
    return await TraineeService.get_grid_analytics(db)
