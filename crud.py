# crud.py
from sqlalchemy.orm import Session
import models, schemas

def get_tarea(db: Session, tarea_id: int):
    return db.query(models.Tarea).filter(models.Tarea.id == tarea_id).first()

def get_tareas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tarea).offset(skip).limit(limit).all()

def create_tarea(db: Session, tarea: schemas.TareaCreacion):
    db_tarea = models.Tarea(**tarea.dict())
    db.add(db_tarea)
    db.commit()
    db.refresh(db_tarea)
    return db_tarea

def update_tarea(db: Session, tarea_id: int, tarea_data: schemas.TareaCreacion):
    db_tarea = get_tarea(db, tarea_id)
    if db_tarea:
        db_tarea.titulo = tarea_data.titulo
        db_tarea.descripcion = tarea_data.descripcion
        db_tarea.completada = tarea_data.completada
        db.commit()
        db.refresh(db_tarea)
    return db_tarea

def delete_tarea(db: Session, tarea_id: int):
    db_tarea = get_tarea(db, tarea_id)
    if db_tarea:
        db.delete(db_tarea)
        db.commit()
    return db_tarea