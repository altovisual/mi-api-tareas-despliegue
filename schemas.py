# schemas.py
from pydantic import BaseModel
from typing import Optional

# --- Schemas para Tareas ---
class TareaBase(BaseModel):
    titulo: str
    descripcion: str
    completada: bool = False

class TareaCreacion(TareaBase):
    pass

class Tarea(TareaBase):
    id: int
    owner_id: int
    class Config:
        orm_mode = True

# --- Schemas para Usuarios ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

# --- Schemas para Tokens ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None