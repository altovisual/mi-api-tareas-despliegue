# main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

# Importamos los módulos de nuestra aplicación
import crud
import models
import schemas
from database import engine, get_db

# Esta línea le dice a SQLAlchemy que cree las tablas definidas en models.py
# en la base de datos si aún no existen.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Modular Siempre Encendida",
    description="Una API robusta con arquitectura modular, base de datos persistente y que se mantiene activa 24/7.",
    version="5.0.0"
)

# =============================================================================
# SECCIÓN 1: ENDPOINT DE SUPERVISIÓN (HEALTH CHECK)
# =============================================================================

@app.get("/health", status_code=status.HTTP_200_OK, tags=["Supervisión"])
def health_check():
    """
    Endpoint simple que los servicios externos (como UptimeRobot) pueden
    visitar para mantener la API activa.
    """
    return {"status": "ok"}


# =============================================================================
# SECCIÓN 2: ENDPOINTS DE LA API PARA TAREAS
# =============================================================================

@app.post("/tareas", response_model=schemas.Tarea, status_code=status.HTTP_201_CREATED, tags=["Tareas"])
def crear_una_tarea(tarea: schemas.TareaCreacion, db: Session = Depends(get_db)):
    """Crea una nueva tarea y la guarda en la base de datos."""
    return crud.create_tarea(db=db, tarea=tarea)

@app.get("/tareas", response_model=List[schemas.Tarea], tags=["Tareas"])
def leer_tareas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtiene una lista de todas las tareas."""
    tareas = crud.get_tareas(db, skip=skip, limit=limit)
    return tareas

@app.get("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["Tareas"])
def leer_una_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Obtiene una única tarea por su ID."""
    db_tarea = crud.get_tarea(db, tarea_id=tarea_id)
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return db_tarea

@app.put("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["Tareas"])
def actualizar_una_tarea(tarea_id: int, tarea: schemas.TareaCreacion, db: Session = Depends(get_db)):
    """Actualiza una tarea existente por su ID."""
    db_tarea = crud.update_tarea(db, tarea_id=tarea_id, tarea_data=tarea)
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return db_tarea

@app.delete("/tareas/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tareas"])
def eliminar_una_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Elimina una tarea por su ID."""
    db_tarea = crud.get_tarea(db, tarea_id=tarea_id)
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    crud.delete_tarea(db, tarea_id=tarea_id)
    return # No se devuelve contenido en un DELETE exitoso


# =============================================================================
# SECCIÓN 3: SERVIR LA INTERFAZ DE USUARIO (FRONTEND)
# =============================================================================

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse, include_in_schema=False)
async def root():
    """Sirve el archivo principal de la interfaz de usuario."""
    return "static/index.html"