# crud.py
from sqlalchemy.orm import Session

import models, schemas
from auth import get_password_hash # Importamos la función para hashear contraseñas

# --- Funciones CRUD para Usuarios ---

def get_user_by_email(db: Session, email: str):
    """Busca un usuario por su dirección de email."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario con una contraseña hasheada."""
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Funciones CRUD para Tareas (Ahora asociadas a un usuario) ---

def get_tareas(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Obtiene solo las tareas que pertenecen a un usuario específico."""
    return db.query(models.Tarea).filter(models.Tarea.owner_id == user_id).offset(skip).limit(limit).all()

def create_tarea(db: Session, tarea: schemas.TareaCreacion, user_id: int):
    """Crea una nueva tarea y la asigna a un usuario."""
    db_tarea = models.Tarea(**tarea.dict(), owner_id=user_id)
    db.add(db_tarea)
    db.commit()
    db.refresh(db_tarea)
    return db_tarea

def get_tarea_by_id(db: Session, tarea_id: int, user_id: int):
    """Obtiene una tarea específica, asegurándose de que pertenece al usuario correcto."""
    return db.query(models.Tarea).filter(models.Tarea.id == tarea_id, models.Tarea.owner_id == user_id).first()

def update_tarea(db: Session, tarea_id: int, tarea_data: schemas.TareaCreacion, user_id: int):
    """Actualiza una tarea, asegurándose de que pertenece al usuario correcto."""
    db_tarea = get_tarea_by_id(db, tarea_id, user_id)
    if db_tarea:
        db_tarea.titulo = tarea_data.titulo
        db_tarea.descripcion = tarea_data.descripcion
        db_tarea.completada = tarea_data.completada
        db.commit()
        db.refresh(db_tarea)
    return db_tarea

def delete_tarea(db: Session, tarea_id: int, user_id: int):
    """Elimina una tarea, asegurándose de que pertenece al usuario correcto."""
    db_tarea = get_tarea_by_id(db, tarea_id, user_id)
    if db_tarea:
        db.delete(db_tarea)
        db.commit()
    return db_tarea