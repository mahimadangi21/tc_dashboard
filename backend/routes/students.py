import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.student import Student
from auth.dependencies import get_current_user, require_admin
from schemas.student import StudentResponse, StudentUpdate, StudentCreate, StudentFullDetail
from services.student_service import StudentService
from typing import List, Optional

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me", response_model=StudentResponse)
async def get_me(current_user: Student = Depends(get_current_user)):
    """
    Get the profile of the currently logged-in student.
    """
    return current_user

@router.put("/me", response_model=StudentResponse)
async def update_me(
    student_in: StudentUpdate,
    current_user: Student = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the profile of the currently logged-in student.
    """
    return await StudentService.update_student(db, current_user.id, student_in)

@router.get("/", response_model=List[StudentResponse])
async def list_students(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Student = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. List all students, supporting search (case-insensitive on name) and status filter ('active' or 'inactive').
    """
    is_active_filter = None
    if status is not None:
        if status.lower() == "active":
            is_active_filter = True
        elif status.lower() == "inactive":
            is_active_filter = False
            
    return await StudentService.get_students_filtered(db, search=search, is_active=is_active_filter)

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_in: StudentCreate,
    current_user: Student = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Create a new student, hashes their password, and auto-assigns all tasks with 'Not Started'.
    """
    return await StudentService.create_student(db, student_in)

@router.get("/{student_id}", response_model=StudentFullDetail)
async def get_student_detail(
    student_id: uuid.UUID,
    current_user: Student = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin or own student. Get the detailed profile of a specific student, including all task assignments.
    """
    # Enforce Admin or Own Student restriction
    if current_user.role != "admin" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only access your own profile."
        )
        
    student = await StudentService.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: uuid.UUID,
    student_in: StudentUpdate,
    current_user: Student = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Update any student profile record.
    """
    return await StudentService.update_student(db, student_id, student_in)

@router.delete("/{student_id}", response_model=StudentResponse)
async def delete_student(
    student_id: uuid.UUID,
    current_user: Student = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin only. Soft delete student by setting is_active = False.
    """
    return await StudentService.delete_student(db, student_id)
