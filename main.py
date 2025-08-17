# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List
from sqlalchemy.orm import Session

# Importamos los módulos que hemos creado (ahora funciona gracias a la estructura de paquete)
import models, schemas
from database import SessionLocal, engine
from base import Base

# Crea la tabla en la base de datos (si no existe)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Lista de Tareas - Versión Final",
    description="Proyecto completo que conecta una API a una base de datos SQLite y sirve una interfaz de usuario web.",
    version="3.0.0",
)

# Dependencia para la Sesión de la Base de Datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============================================================================
# SECCIÓN 1: ENDPOINTS DE LA API (El Backend)
# =============================================================================

@app.post("/tareas", response_model=schemas.Tarea, status_code=status.HTTP_201_CREATED, tags=["API"])
def crear_tarea(tarea: schemas.TareaCreacion, db: Session = Depends(get_db)):
    db_tarea = models.Tarea(titulo=tarea.titulo, descripcion=tarea.descripcion, completada=tarea.completada)
    db.add(db_tarea)
    db.commit()
    db.refresh(db_tarea)
    return db_tarea

@app.get("/tareas", response_model=List[schemas.Tarea], tags=["API"])
def obtener_tareas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tareas = db.query(models.Tarea).offset(skip).limit(limit).all()
    return tareas

@app.get("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["API"])
def obtener_tarea(tarea_id: int, db: Session = Depends(get_db)):
    tarea = db.query(models.Tarea).filter(models.Tarea.id == tarea_id).first()
    if tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return tarea

@app.put("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["API"])
def actualizar_tarea(tarea_id: int, tarea_actualizada: schemas.TareaCreacion, db: Session = Depends(get_db)):
    db_tarea = db.query(models.Tarea).filter(models.Tarea.id == tarea_id).first()
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    db_tarea.titulo = tarea_actualizada.titulo
    db_tarea.descripcion = tarea_actualizada.descripcion
    db_tarea.completada = tarea_actualizada.completada
    db.commit()
    db.refresh(db_tarea)
    return db_tarea

@app.delete("/tareas/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["API"])
def eliminar_tarea(tarea_id: int, db: Session = Depends(get_db)):
    db_tarea = db.query(models.Tarea).filter(models.Tarea.id == tarea_id).first()
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    db.delete(db_tarea)
    db.commit()
    return

# =============================================================================
# SECCIÓN 2: SERVIR LA INTERFAZ DE USUARIO (El Frontend)
# =============================================================================

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse, tags=["Interfaz de Usuario"])
async def read_root():
    return "static/index.html"