from typing import AsyncGenerator
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import AsyncSessionLocal
from models.trainee import Trainee
from auth.jwt_handler import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Trainee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(token)
    
    # Try trainee_id first, fallback to student_id for backward compatibility
    id_str = getattr(token_data, "trainee_id", None) or getattr(token_data, "student_id", None)
    if not id_str:
        raise credentials_exception

    try:
        trainee_id = uuid.UUID(id_str)
    except (ValueError, TypeError):
        raise credentials_exception
        
    result = await db.execute(select(Trainee).where(Trainee.id == trainee_id))
    trainee = result.scalars().first()
    
    if trainee is None:
        raise credentials_exception
        
    if not trainee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Trainee account is inactive"
        )
        
    return trainee

def require_admin(current_user: Trainee = Depends(get_current_user)) -> Trainee:
    role_str = getattr(current_user.role, "value", current_user.role)
    if role_str != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return current_user

# Maintain backward compatibility aliases
get_current_student = get_current_user
