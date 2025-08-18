# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Lee la URL de la base de datos desde la variable de entorno de Render
# Si no la encuentra, usa un archivo SQLite local (útil para desarrollo en tu PC)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sqlitedb.db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ESTA ES LA FUNCIÓN QUE FALTABA
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()