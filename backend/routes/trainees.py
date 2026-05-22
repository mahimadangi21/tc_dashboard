import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.trainee import Trainee
from auth.dependencies import get_current_user, require_admin
from schemas.trainee import TraineeResponse, TraineeUpdate, TraineeCreate, TraineeFullDetail
from schemas.task import TraineeTaskResponse, TraineeTaskUpdate
from services.trainee_service import TraineeService
from typing import List, Optional

router = APIRouter(prefix="/trainees", tags=["Trainees"])
trainee_tasks_router = APIRouter(prefix="/trainees", tags=["Trainee Tasks"])

@router.get("/me", response_model=TraineeResponse)
async def get_me(current_user: Trainee = Depends(get_current_user)):
    """
    Get the profile of the currently logged-in trainee.
    """
    return current_user

@router.put("/me", response_model=TraineeResponse)
async def update_me(
    trainee_in: TraineeUpdate,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the profile of the currently logged-in trainee.
    """
    return await TraineeService.update_trainee(db, current_user.id, trainee_in)

@router.get("/", response_model=List[TraineeResponse])
async def list_trainees(
    search: Optional[str] = None,
    status: Optional[str] = "active",
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. List all trainees, supporting search (case-insensitive on name) and status filter ('active' or 'inactive').
    """
    is_active_filter = None
    if status is not None:
        if status.lower() == "active":
            is_active_filter = True
        elif status.lower() == "inactive":
            is_active_filter = False
            
    return await TraineeService.get_trainees_filtered(db, search=search, is_active=is_active_filter)

@router.post("/", response_model=TraineeResponse, status_code=status.HTTP_201_CREATED)
async def create_trainee(
    trainee_in: TraineeCreate,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Create a new trainee, hashes their password, and auto-assigns all tasks with 'Not Started'.
    """
    return await TraineeService.create_trainee(db, trainee_in)

@router.get("/{trainee_id}", response_model=TraineeFullDetail)
async def get_trainee_detail(
    trainee_id: uuid.UUID,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin or own trainee. Get the detailed profile of a specific trainee, including all task assignments.
    """
    role_str = getattr(current_user.role, "value", current_user.role)
    if role_str != "admin" and current_user.id != trainee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only access your own profile."
        )
        
    trainee = await TraineeService.get_trainee_by_id(db, trainee_id)
    if not trainee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")
    return trainee

@router.put("/{trainee_id}", response_model=TraineeResponse)
async def update_trainee(
    trainee_id: uuid.UUID,
    trainee_in: TraineeUpdate,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Update any trainee profile record.
    """
    role_str = getattr(current_user.role, "value", current_user.role)
    return await TraineeService.update_trainee(db, trainee_id, trainee_in, updated_by_role=role_str)

@router.delete("/{trainee_id}", response_model=TraineeResponse)
async def delete_trainee(
    trainee_id: uuid.UUID,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Soft delete trainee by setting is_active = False.
    """
    return await TraineeService.delete_trainee(db, trainee_id)


# --- Trainee Tasks Routes (Restful Mapping) ---

@trainee_tasks_router.get("/{trainee_id}/tasks", response_model=List[TraineeTaskResponse])
async def get_trainee_tasks(
    trainee_id: uuid.UUID,
    status: Optional[str] = None,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task assignments for a specific trainee, with optional status filter.
    """
    role_str = getattr(current_user.role, "value", current_user.role)
    if role_str != "admin" and current_user.id != trainee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own task list."
        )
        
    return await TraineeService.get_trainee_tasks_filtered(db, trainee_id, status)

@trainee_tasks_router.put("/{trainee_id}/tasks/{task_id}", response_model=TraineeTaskResponse)
async def update_trainee_task(
    trainee_id: uuid.UUID,
    task_id: int,
    update_in: TraineeTaskUpdate,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a trainee's task assignment status and notes. Admin or the trainee themselves.
    """
    role_str = getattr(current_user.role, "value", current_user.role)
    if role_str != "admin" and current_user.id != trainee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only update your own task assignments."
        )
        
    return await TraineeService.update_trainee_task(
        db=db,
        trainee_id=trainee_id,
        task_id=task_id,
        status_val=update_in.status,
        notes_val=update_in.notes,
        updated_by_role=role_str
    )

@trainee_tasks_router.delete("/{trainee_id}/tasks/{task_id}")
async def delete_trainee_task(
    trainee_id: uuid.UUID,
    task_id: int,
    current_user: Trainee = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific task assignment. Admin only.
    """
    return await TraineeService.delete_trainee_task(db, trainee_id, task_id)

