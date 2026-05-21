from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    student_id: uuid.UUID # backward compatibility
    student_name: str # backward compatibility
    trainee_id: uuid.UUID
    trainee_name: str

    class Config:
        from_attributes = True

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    student_id: Optional[str] = None
    trainee_id: Optional[str] = None

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
