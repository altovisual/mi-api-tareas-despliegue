# models.py
from sqlalchemy import Boolean, Column, Integer, String
from base import Base  # <-- ¡CAMBIO IMPORTANTE!

class Tarea(Base):
    __tablename__ = "tareas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True)
    descripcion = Column(String, index=True)
    completada = Column(Boolean, default=False)