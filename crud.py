# crud.py
from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash

# --- CRUD Usuarios ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- CRUD Tareas ---
def get_tareas_for_user(db: Session, user_id: int):
    created = db.query(models.Tarea).filter(models.Tarea.creator_id == user_id).all()
    assigned = db.query(models.Tarea).join(models.task_assignments).filter(models.task_assignments.c.user_id == user_id).all()
    all_tasks = list(set(created + assigned))
    return sorted(all_tasks, key=lambda x: x.id)

def create_tarea(db: Session, tarea: schemas.TareaCreacion, user_id: int):
    creator = db.query(models.User).filter(models.User.id == user_id).first()
    db_tarea = models.Tarea(**tarea.dict(), creator_id=user_id)
    db_tarea.assignees.append(creator)
    db.add(db_tarea)
    db.commit()
    db.refresh(db_tarea)
    return db_tarea

def get_tarea_by_id(db: Session, tarea_id: int):
    return db.query(models.Tarea).filter(models.Tarea.id == tarea_id).first()

def update_tarea(db: Session, tarea: models.Tarea, tarea_data: schemas.TareaCreacion):
    tarea.titulo = tarea_data.titulo
    tarea.descripcion = tarea_data.descripcion
    tarea.completada = tarea_data.completada
    db.commit()
    db.refresh(tarea)
    return tarea

def delete_tarea(db: Session, tarea: models.Tarea):
    db.delete(tarea)
    db.commit()
    return

# --- Lógica de Asignaciones ---
def assign_user_to_task(db: Session, tarea: models.Tarea, user_to_assign: models.User):
    if user_to_assign not in tarea.assignees:
        tarea.assignees.append(user_to_assign)
        db.commit()
        db.refresh(tarea)
    return tarea

def remove_user_from_task(db: Session, tarea: models.Tarea, user_to_remove: models.User):
    if user_to_remove in tarea.assignees and tarea.creator_id != user_to_remove.id:
        tarea.assignees.remove(user_to_remove)
        db.commit()
        db.refresh(tarea)
    return tarea