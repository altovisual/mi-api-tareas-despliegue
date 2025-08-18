# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# --- Schemas para Usuarios ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

# --- Schemas para Tareas ---
class TareaBase(BaseModel):
    titulo: str
    descripcion: str
    completada: bool = False

class TareaCreacion(TareaBase):
    pass

class Tarea(TareaBase):
    id: int
    creator_id: int
    assignees: List[User] = []
    class Config:
        orm_mode = True

# --- Schemas para Tokens ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

# --- Schema para Asignaciones ---
class AssignRequest(BaseModel):
    email: EmailStr