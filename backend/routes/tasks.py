import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.trainee import Trainee
from auth.dependencies import get_current_user, require_admin
from schemas.task import TaskResponse, TaskCreate, AssignTaskRequest
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
    Admin only. Create a new task.
    Pass assign_to_all=true (default) to assign to all active trainees,
    or assign_to_all=false with a list of trainee UUIDs to assign selectively,
    or assign_to_all=false with an empty list to create without any assignment.
    """
    return await TraineeService.create_task(db, task_in)

@router.get("/{task_id}/assignments")
async def get_task_assignments(
    task_id: int,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. List all trainees currently assigned to a task.
    """
    return await TraineeService.get_task_assignments(db, task_id)

@router.post("/{task_id}/assign")
async def assign_task(
    task_id: int,
    body: AssignTaskRequest,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Assign a task to one or more trainees.
    Already-assigned trainees are silently skipped.
    """
    return await TraineeService.assign_task_to_trainees(db, task_id, body.trainee_ids)

@router.post("/{task_id}/unassign")
async def unassign_task(
    task_id: int,
    body: AssignTaskRequest,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Remove a task assignment from one or more trainees.
    All progress data for those trainees on this task is permanently deleted.
    """
    return await TraineeService.unassign_task_from_trainees(db, task_id, body.trainee_ids)

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
