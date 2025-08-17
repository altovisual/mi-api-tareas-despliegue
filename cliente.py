# cliente.py

import requests
import json # Para imprimir diccionarios de forma legible

# La URL base donde está corriendo nuestra API
BASE_URL = "http://127.0.0.1:8000"

def obtener_tareas():
    """Función para pedir todas las tareas a la API."""
    print("--- Obteniendo todas las tareas ---")
    try:
        response = requests.get(f"{BASE_URL}/tareas")
        
        # Si la petición fue exitosa (código 200)
        if response.status_code == 200:
            tareas = response.json()
            print("¡Tareas obtenidas con éxito!")
            for tarea in tareas:
                print(f"  ID: {tarea['id']}, Título: {tarea['titulo']}, Completada: {tarea['completada']}")
            print("-" * 20)
            return tareas
        else:
            print(f"Error al obtener tareas. Código: {response.status_code}")
            return None
            
    except requests.exceptions.ConnectionError as e:
        print(f"\nERROR: No se pudo conectar a la API. ¿Está el servidor corriendo en {BASE_URL}?")


def crear_una_tarea(titulo, descripcion):
    """Función para enviar una nueva tarea a la API."""
    print(f"--- Creando nueva tarea: '{titulo}' ---")
    
    # Los datos que enviaremos en el cuerpo de la petición POST
    datos_nueva_tarea = {
        "titulo": titulo,
        "descripcion": descripcion
        # No enviamos 'completada' para usar el valor por defecto (False)
    }
    
    try:
        # Hacemos la petición POST, enviando los datos en formato JSON
        response = requests.post(f"{BASE_URL}/tareas", json=datos_nueva_tarea)
        
        # Si la creación fue exitosa (código 201)
        if response.status_code == 201:
            tarea_creada = response.json()
            print("¡Tarea creada con éxito!")
            print(f"  Detalles: {json.dumps(tarea_creada, indent=4)}")
            print("-" * 20)
        else:
            print(f"Error al crear la tarea. Código: {response.status_code}")
            print(f"  Respuesta: {response.text}")

    except requests.exceptions.ConnectionError as e:
        print(f"\nERROR: No se pudo conectar a la API. ¿Está el servidor corriendo en {BASE_URL}?")


# --- Programa Principal del Cliente ---
if __name__ == "__main__":
    # 1. Primero, vamos a ver qué tareas hay al principio
    obtener_tareas()
    
    # 2. Ahora, vamos a crear una nueva tarea
    crear_una_tarea(titulo="Pasear al perro", descripcion="Dar una vuelta a la manzana.")
    
    # 3. Finalmente, volvemos a pedir la lista para ver si se añadió la nueva tarea
    obtener_tareas()