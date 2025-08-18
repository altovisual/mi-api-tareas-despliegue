# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

# Importamos todos nuestros módulos
import crud, models, schemas, auth
from database import engine, get_db

# Crea las tablas en la base de datos (incluida la nueva tabla de usuarios)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plataforma Modular con Autenticación",
    version="6.0.0"
)

# =============================================================================
# SECCIÓN 1: AUTENTICACIÓN (Rutas públicas)
# =============================================================================

@app.post("/users/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Autenticación"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario."""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token, tags=["Autenticación"])
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Inicia sesión con email (en el campo username) y contraseña.
    Devuelve un token de acceso.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# =============================================================================
# SECCIÓN 2: TAREAS (Rutas protegidas)
# =============================================================================

@app.post("/tareas", response_model=schemas.Tarea, status_code=status.HTTP_201_CREATED, tags=["Tareas"])
def crear_una_tarea(
    tarea: schemas.TareaCreacion, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Crea una nueva tarea para el usuario autenticado."""
    return crud.create_tarea(db=db, tarea=tarea, user_id=current_user.id)

@app.get("/tareas", response_model=List[schemas.Tarea], tags=["Tareas"])
def leer_tareas(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Obtiene las tareas del usuario autenticado."""
    return crud.get_tareas(db, user_id=current_user.id)

@app.get("/tareas/{tarea_id}", response_model=schemas.Tarea, tags=["Tareas"])
def leer_una_tarea(
    tarea_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Obtiene una tarea específica del usuario autenticado."""
    db_tarea = crud.get_tarea_by_id(db, tarea_id=tarea_id, user_id=current_user.id)
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return db_tarea

# ... (Las rutas PUT y DELETE se protegen de la misma manera, pero las omito para brevedad)
# ... Asegúrate de añadir la dependencia 'current_user' y pasar 'user_id' a las funciones CRUD

# =============================================================================
# SECCIÓN 3: OTROS ENDPOINTS Y FRONTEND
# =============================================================================

@app.get("/health", status_code=status.HTTP_200_OK, tags=["Supervisión"])
def health_check():
    return {"status": "ok"}

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse, include_in_schema=False)
async def root():
    return "static/index.html"