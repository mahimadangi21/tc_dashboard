from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.trainee import Trainee
from schemas.trainee import TraineeCreate, TraineeResponse
from schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest
from services.trainee_service import TraineeService
from auth.dependencies import get_current_user
from auth.jwt_handler import create_access_token, verify_password, get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TraineeResponse, status_code=status.HTTP_201_CREATED)
async def register(trainee_in: TraineeCreate, db: AsyncSession = Depends(get_db)):
    """
    Registers a new trainee.
    """
    return await TraineeService.create_trainee(db, trainee_in)

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login.
    """
    # Query trainee by email
    result = await db.execute(select(Trainee).where(Trainee.email == credentials.email))
    trainee = result.scalars().first()
    
    # Verify bcrypt password
    if not trainee or not verify_password(credentials.password, trainee.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return TokenResponse including trainee_name for UI display
    access_token = create_access_token(data={
        "sub": trainee.email,
        "role": trainee.role.value if hasattr(trainee.role, "value") else trainee.role,
        "student_id": str(trainee.id), # Legacy support
        "trainee_id": str(trainee.id)
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": trainee.role,
        "student_id": trainee.id, # Legacy support
        "student_name": trainee.trainee_name, # Legacy support
        "trainee_id": trainee.id,
        "trainee_name": trainee.trainee_name
    }

@router.get("/me", response_model=TraineeResponse)
async def get_me(current_user: Trainee = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: Trainee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for the logged-in trainee.
    """
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    current_user.password = get_password_hash(body.new_password)
    await db.commit()
    return {"message": "Password updated"}
