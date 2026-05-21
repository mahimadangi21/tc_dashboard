import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.trainee import Trainee
from auth.dependencies import get_current_user, require_admin
from schemas.task import TaskResponse, TaskCreate
from services.trainee_service import TraineeService
from typing import List, Optional

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all tasks.
    """
    return await TraineeService.get_tasks(db)

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Create a new task and auto-assign it to all existing trainees.
    """
    return await TraineeService.create_task(db, task_in)

@router.get("/{task_id}/progress")
async def get_task_progress(
    task_id: int,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Get per-trainee progress statistics for a specific task.
    """
    return await TraineeService.get_task_progress(db, task_id)

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Delete a task and all associated trainee assignments.
    """
    return await TraineeService.delete_task(db, task_id)

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Delete a task and all associated trainee assignments.
    """
    return await TraineeService.delete_task(db, task_id)
