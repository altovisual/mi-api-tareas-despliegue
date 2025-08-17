# schemas.py
from pydantic import BaseModel

class TareaBase(BaseModel):
    titulo: str
    descripcion: str
    completada: bool = False

class TareaCreacion(TareaBase):
    pass

class Tarea(TareaBase):
    id: int

    class Config:
        orm_mode = True # Permite a Pydantic leer datos de modelos ORM