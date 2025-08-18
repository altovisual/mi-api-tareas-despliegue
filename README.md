# Plataforma de Tareas Colaborativa: Documento de Arquitectura

**Versión:** 1.0 (Post-implementación de colaboración)  
**Fecha:** 17 de agosto de 2025

---

## 1. Resumen del Proyecto y Visión

Este proyecto es una **Plataforma de Tareas Colaborativa** construida sobre una arquitectura de API RESTful. Su propósito es permitir a los usuarios registrarse, gestionar sus propias tareas y colaborar asignando a otros usuarios a tareas específicas.

La visión a largo plazo es evolucionar hacia una plataforma de gestión de proyectos ligera, modular y extensible, capaz de soportar diferentes tipos de clientes (web, móvil, escritorio) a través de su robusta API.

---

## 2. Filosofía y Principios de Arquitectura

- **API-First:** El backend (la API) es el cerebro y la única fuente de verdad. No contiene lógica de presentación.
- **Separación de Responsabilidades (SoC):** Cada archivo en el proyecto tiene un propósito único y bien definido:
  - `main.py`: Gestiona las rutas HTTP. Es el "controlador de tráfico".
  - `crud.py`: Contiene toda la lógica para interactuar con la base de datos.
  - `models.py`: Define la estructura de las tablas de la base de datos. Es el "plano" de los datos.
  - `schemas.py`: Define la forma de los datos de la API (Pydantic). Es el "contrato" de la API.
  - `auth.py`: Centraliza toda la lógica de seguridad, contraseñas y tokens.
  - `database.py`: Configura la conexión a la base de datos.
- **Modularidad:** Las funcionalidades están agrupadas lógicamente. Para añadir una nueva entidad (ej. "Proyectos"), se replica el patrón existente.
- **Despliegue Continuo:** Cualquier cambio subido a la rama `main` de GitHub dispara un nuevo despliegue en Render.

---

## 3. Pila Tecnológica (Stack)

### Backend
- **Lenguaje:** Python 3
- **Framework:** FastAPI
- **ORM (Base de Datos):** SQLAlchemy
- **Servidor ASGI:** Uvicorn

### Frontend
- **Lenguaje:** HTML5, CSS3, JavaScript (Vanilla JS)
- **Framework CSS:** Bulma
- **Iconos:** Font Awesome

### Base de Datos
- **Producción:** PostgreSQL (gestionado por Render)
- **Desarrollo Local:** SQLite

### Seguridad
- **Hashing de Contraseñas:** Passlib con Bcrypt
- **Autenticación por Tokens:** JWT (JSON Web Tokens) vía `python-jose`

### Infraestructura y Despliegue
- **Control de Versiones:** Git
- **Hosting de Código:** GitHub
- **Plataforma de Despliegue (PaaS):** Render
- **Monitoreo de Actividad:** UptimeRobot

---

## 4. Modelo de Datos y Relaciones Clave

- **`User`:** Tiene `id`, `email`, `hashed_password`. Un usuario puede crear muchas tareas (`created_tasks`) y ser asignado a muchas tareas (`assigned_tasks`).
- **`Tarea`:** Tiene `id`, `titulo`, `descripcion`, `completada`, `creator_id`. Una tarea tiene un único creador (`creator`) y muchos usuarios asignados (`assignees`).
- **`task_assignments` (Tabla de Asociación):** Puente invisible que conecta `User` y `Tarea` en una relación de **muchos-a-muchos**.

---

## 5. Flujo de Autenticación

1.  **Registro (`POST /users/register`):** Se crea un usuario con la contraseña hasheada.
2.  **Inicio de Sesión (`POST /token`):** Se verifica la contraseña y se genera un JWT con el email del usuario.
3.  **Peticiones Protegidas:** El cliente debe incluir el JWT en la cabecera `Authorization: Bearer <token>`.
4.  **Verificación:** La dependencia `Depends(auth.get_current_user)` decodifica el token en cada ruta protegida.

---

## 6. Guía para Escalar y Añadir Nuevas Funcionalidades

Para añadir una nueva entidad (ej. **"Comentarios"**):

1.  **`models.py`:** Crear la clase `Comment(Base)` y definir sus atributos y relaciones.
2.  **`schemas.py`:** Crear los schemas `CommentCreate`, `CommentBase`, `Comment`, etc.
3.  **`crud.py`:** Añadir las funciones CRUD para los comentarios (`create_comment`, `get_comments`, etc.).
4.  **`main.py`:** Crear los nuevos endpoints (ej. `POST /tareas/{tarea_id}/comments`).
5.  **`static/script.js`:** Añadir la lógica de frontend para mostrar y crear comentarios.
6.  **`requirements.txt`:** Añadir nuevas librerías si es necesario.
7.  **Desplegar:** Hacer `commit` y `push` a la rama `main`.


Paso 3: Sube el Nuevo Archivo a GitHub
Ahora que has creado y guardado tu archivo README.md, solo falta añadirlo a tu repositorio para que todo el mundo (y tu futuro yo) pueda verlo.
Abre tu terminal en la carpeta del proyecto.
Ejecuta los 3 comandos de Git:

git add README.md

git commit -m "Add project architecture and context documentation"

git push origin main