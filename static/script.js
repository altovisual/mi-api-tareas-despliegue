// static/script.js
document.addEventListener("DOMContentLoaded", () => {
    const taskListDiv = document.getElementById("task-list");
    const taskForm = document.getElementById("task-form");
    const tituloInput = document.getElementById("titulo");
    const descripcionInput = document.getElementById("descripcion");

    const apiUrl = "/tareas";

    // --- FUNCIÓN PRINCIPAL PARA CARGAR Y MOSTRAR TAREAS ---
    async function cargarTareas() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Error al cargar tareas.");
            const tareas = await response.json();
            
            taskListDiv.innerHTML = ""; // Limpiar la lista antes de redibujar

            if (tareas.length === 0) {
                taskListDiv.innerHTML = '<p class="has-text-centered">¡Felicidades! No tienes tareas pendientes.</p>';
            } else {
                tareas.forEach(tarea => {
                    const taskCard = document.createElement("div");
                    taskCard.className = `card mb-4 ${tarea.completada ? 'completed' : ''}`;
                    
                    taskCard.innerHTML = `
                        <div class="card-content">
                            <div class="content">
                                <p class="title is-5">${tarea.titulo}</p>
                                <p class="subtitle is-6">${tarea.descripcion}</p>
                            </div>
                        </div>
                        <footer class="card-footer">
                            <a href="#" class="card-footer-item button-complete" data-id="${tarea.id}" data-completed="${tarea.completada}">
                                <span class="icon is-small"><i class="fas ${tarea.completada ? 'fa-undo' : 'fa-check'}"></i></span>
                                <span>${tarea.completada ? 'Deshacer' : 'Completar'}</span>
                            </a>
                            <a href="#" class="card-footer-item button-edit" data-id="${tarea.id}" data-titulo="${tarea.titulo}" data-descripcion="${tarea.descripcion}">
                                <span class="icon is-small"><i class="fas fa-edit"></i></span>
                                <span>Editar</span>
                            </a>
                            <a href="#" class="card-footer-item button-delete" data-id="${tarea.id}">
                                <span class="icon is-small"><i class="fas fa-trash"></i></span>
                                <span>Eliminar</span>
                            </a>
                        </footer>
                    `;
                    taskListDiv.appendChild(taskCard);
                });
            }
        } catch (error) {
            console.error("Error:", error);
            taskListDiv.innerHTML = '<p class="has-text-centered has-text-danger">No se pudieron cargar las tareas. ¿Está el servidor funcionando?</p>';
        }
    }

    // --- MANEJADORES DE EVENTOS PARA LOS BOTONES ---

    taskListDiv.addEventListener("click", async (e) => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (!target) return;

        const id = target.dataset.id;

        // Botón de Completar/Deshacer
        if (target.classList.contains("button-complete")) {
            const isCompleted = target.dataset.completed === "true";
            const response = await fetch(`${apiUrl}/${id}`);
            const tarea = await response.json();
            
            await fetch(`${apiUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...tarea, completada: !isCompleted }),
            });
            cargarTareas();
        }

        // Botón de Editar
        if (target.classList.contains("button-edit")) {
            const nuevoTitulo = prompt("Edita el título:", target.dataset.titulo);
            const nuevaDescripcion = prompt("Edita la descripción:", target.dataset.descripcion);

            if (nuevoTitulo !== null && nuevaDescripcion !== null) {
                const response = await fetch(`${apiUrl}/${id}`);
                const tarea = await response.json();

                await fetch(`${apiUrl}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...tarea, titulo: nuevoTitulo, descripcion: nuevaDescripcion }),
                });
                cargarTareas();
            }
        }

        // Botón de Eliminar
        if (target.classList.contains("button-delete")) {
            if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
                await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
                cargarTareas();
            }
        }
    });

    // --- MANEJADOR PARA CREAR UNA NUEVA TAREA ---
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nuevaTarea = {
            titulo: tituloInput.value,
            descripcion: descripcionInput.value,
            completada: false,
        };

        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaTarea),
        });

        tituloInput.value = "";
        descripcionInput.value = "";
        cargarTareas();
    });

    // Carga inicial de las tareas
    cargarTareas();
});