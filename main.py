# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Plataforma Colaborativa de Tareas", version="7.0.0")

# --- Autenticación ---
@app.post("/users/register", response_model=schemas.User, tags=["Autenticación"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user: raise HTTPException(status_code=400, detail="El email ya está registrado")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token, tags=["Autenticación"])
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos", headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Tareas ---
@app.post("/tareas", response_model=schemas.Tarea, tags=["Tareas"])
def crear_una_tarea(tarea: schemas.TareaCreacion, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_tarea(db=db, tarea=tarea, user_id=current_user.id)

@app.get("/tareas", response_model=List[schemas.Tarea], tags=["Tareas"])
def leer_tareas_del_usuario(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_tareas_for_user(db, user_id=current_user.id)

@app.put("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["Tareas"])
def actualizar_una_tarea(tarea_id: int, tarea_data: schemas.TareaCreacion, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_tarea = crud.get_tarea_by_id(db, tarea_id=tarea_id)
    if not db_tarea: raise HTTPException(status_code=404, detail="Tarea no encontrada")
    # Solo el creador o un asignado puede editar
    if current_user not in db_tarea.assignees and db_tarea.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta tarea")
    return crud.update_tarea(db, tarea=db_tarea, tarea_data=tarea_data)

@app.delete("/tareas/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tareas"])
def eliminar_una_tarea(tarea_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_tarea = crud.get_tarea_by_id(db, tarea_id=tarea_id)
    if not db_tarea: raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if db_tarea.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el creador puede eliminar la tarea")
    crud.delete_tarea(db, tarea=db_tarea)
    return

# --- Asignaciones ---
@app.post("/tareas/{tarea_id}/assign", response_model=schemas.Tarea, tags=["Asignaciones"])
def asignar_usuario(tarea_id: int, request: schemas.AssignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_tarea = crud.get_tarea_by_id(db, tarea_id=tarea_id)
    if not db_tarea: raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if db_tarea.creator_id != current_user.id: raise HTTPException(status_code=403, detail="Solo el creador puede asignar usuarios")
    user_to_assign = crud.get_user_by_email(db, email=request.email)
    if not user_to_assign: raise HTTPException(status_code=404, detail="Usuario a asignar no encontrado")
    return crud.assign_user_to_task(db, tarea=db_tarea, user_to_assign=user_to_assign)

@app.post("/tareas/{tarea_id}/unassign", response_model=schemas.Tarea, tags=["Asignaciones"])
def quitar_asignacion(tarea_id: int, request: schemas.AssignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_tarea = crud.get_tarea_by_id(db, tarea_id=tarea_id)
    if not db_tarea: raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if db_tarea.creator_id != current_user.id: raise HTTPException(status_code=403, detail="Solo el creador puede quitar asignaciones")
    user_to_remove = crud.get_user_by_email(db, email=request.email)
    if not user_to_remove: raise HTTPException(status_code=404, detail="Usuario a quitar no encontrado")
    if db_tarea.creator_id == user_to_remove.id: raise HTTPException(status_code=400, detail="No se puede quitar al creador de la tarea")
    return crud.remove_user_from_task(db, tarea=db_tarea, user_to_remove=user_to_remove)

# --- Frontend y Health Check ---
@app.get("/health", tags=["Supervisión"])
def health_check(): return {"status": "ok"}
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/", response_class=FileResponse, include_in_schema=False)
async def root(): return "static/index.html"