# models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from database import Base

# Tabla de Asociación para la relación Muchos-a-Muchos
task_assignments = Table('task_assignments', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('task_id', Integer, ForeignKey('tareas.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    created_tasks = relationship("Tarea", back_populates="creator")
    assigned_tasks = relationship("Tarea", secondary=task_assignments, back_populates="assignees")

class Tarea(Base):
    __tablename__ = "tareas"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True)
    descripcion = Column(String, index=True)
    completada = Column(Boolean, default=False)
    
    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="created_tasks")

    assignees = relationship("User", secondary=task_assignments, back_populates="assigned_tasks")