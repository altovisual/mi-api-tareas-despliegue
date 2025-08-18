// static/script.js
document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a elementos del DOM ---
    const authContainer = document.getElementById("auth-container"), appContainer = document.getElementById("app-container");
    const loginForm = document.getElementById("login-form"), registerForm = document.getElementById("register-form");
    const taskListDiv = document.getElementById("task-list"), logoutButton = document.getElementById("logout-button");
    const userInfo = document.getElementById("user-info"), showRegisterLink = document.getElementById("show-register"), showLoginLink = document.getElementById("show-login");
    const spinner = document.getElementById('spinner'), toastContainer = document.getElementById('toast-container');
    
    // Elementos de la nueva UI
    const addTaskFab = document.getElementById('add-task-fab');
    const taskModal = document.getElementById('task-modal'), taskModalTitle = document.getElementById('task-modal-title');
    const taskForm = document.getElementById('task-form'), taskIdInput = document.getElementById('task-id');
    const saveTaskButton = document.getElementById('save-task-button');
    const assignModal = document.getElementById('assign-modal'), assignForm = document.getElementById('assign-form');

    // --- Lógica para mostrar/ocultar modales ---
    const openModal = (modal) => modal.classList.add('is-active');
    const closeModal = (modal) => modal.classList.remove('is-active');
    taskModal.querySelectorAll('.modal-background, .delete, .button-close').forEach(el => el.addEventListener('click', () => closeModal(taskModal)));
    assignModal.querySelectorAll('.modal-background, .delete').forEach(el => el.addEventListener('click', () => closeModal(assignModal)));

    // --- Helpers de UI ---
    const showSpinner = () => spinner.classList.remove('is-hidden');
    const hideSpinner = () => spinner.classList.add('is-hidden');
    
    function showToast(message, type = 'is-success') {
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        toast.innerHTML = `${message}<button class="delete"></button>`;
        toastContainer.appendChild(toast);
        toast.querySelector('.delete').addEventListener('click', () => toast.remove());
        setTimeout(() => toast.remove(), 4000);
    }

    // --- Gestión del Token (sin cambios) ---
    const saveToken = token => localStorage.setItem('authToken', token), getToken = () => localStorage.getItem('authToken'), clearToken = () => localStorage.removeItem('authToken');
    
    // --- Lógica de UI Principal ---
    function updateUI() {
        const token = getToken();
        if (token) {
            authContainer.classList.add("is-hidden"); appContainer.classList.remove("is-hidden");
            try { const payload = JSON.parse(atob(token.split('.')[1])); userInfo.textContent = `Sesión: ${payload.sub}`; } catch (e) { console.error("Token inválido", e); clearToken(); updateUI(); }
            cargarTareas();
        } else {
            appContainer.classList.add("is-hidden"); authContainer.classList.remove("is-hidden");
        }
    }

    // --- Función Genérica de Fetch API (con Spinner) ---
    async function apiFetch(endpoint, options = {}) {
        showSpinner();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const response = await fetch(endpoint, { ...options, headers });
            if (response.status === 401) { clearToken(); updateUI(); showToast("Tu sesión ha expirado.", "is-danger"); return null; }
            return response;
        } catch (error) {
            showToast("Error de conexión con el servidor.", "is-danger");
            return null;
        } finally {
            hideSpinner();
        }
    }

    // --- Lógica de Autenticación (sin cambios en la lógica, solo feedback) ---
    loginForm.addEventListener('submit', async e => { /* ... */ });
    registerForm.addEventListener('submit', async e => { /* ... */ });
    logoutButton.addEventListener('click', () => { clearToken(); updateUI(); showToast("Sesión cerrada con éxito."); });

    // --- Lógica de Tareas (CRUD Completo y Mobile-Optimized) ---
    async function cargarTareas() {
        const response = await apiFetch('/tareas');
        if (!response || !response.ok) return;
        const tareas = await response.json();
        taskListDiv.innerHTML = "";
        tareas.forEach(tarea => {
            const assigneesHtml = tarea.assignees.map(u => `<span class="tag is-info mr-1">${u.email}</span>`).join('');
            const taskCard = document.createElement("div");
            taskCard.className = `box ${tarea.completada ? 'completed' : ''}`; // Usamos 'box' para un mejor estilo móvil
            taskCard.innerHTML = `
                <div class="content">
                    <p class="is-size-5 has-text-weight-semibold">${tarea.titulo}</p>
                    <p>${tarea.descripcion}</p>
                    <div class="tags"><span class="tag is-light mr-2">Asignados:</span>${assigneesHtml}</div>
                </div>
                <div class="buttons is-right">
                    <button class="button is-small is-light button-complete" data-id="${tarea.id}">${tarea.completada ? 'Deshacer' : 'Completar'}</button>
                    <button class="button is-small is-light button-edit" data-id="${tarea.id}">Editar</button>
                    <button class="button is-small is-light button-assign" data-id="${tarea.id}">Asignar</button>
                    <button class="button is-small is-danger is-light button-delete" data-id="${tarea.id}">Eliminar</button>
                </div>`;
            taskListDiv.appendChild(taskCard);
        });
    }

    // Abrir modal para NUEVA tarea
    addTaskFab.addEventListener('click', () => {
        taskModalTitle.textContent = "Nueva Tarea";
        taskForm.reset();
        taskIdInput.value = ''; // Limpiar el ID
        openModal(taskModal);
    });

    // Guardar (Crear o Editar) Tarea
    saveTaskButton.addEventListener('click', async () => {
        const id = taskIdInput.value;
        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        const body = { titulo, descripcion, completada: false }; // 'completada' se maneja por su propio botón
        
        let response;
        if (id) { // Estamos editando
            const res = await apiFetch(`/tareas/${id}`); if(!res || !res.ok) return; const t = await res.json();
            body.completada = t.completada; // Conservar el estado 'completada'
            response = await apiFetch(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        } else { // Estamos creando
            response = await apiFetch('/tareas', { method: 'POST', body: JSON.stringify(body) });
        }

        if(response && response.ok) {
            closeModal(taskModal);
            cargarTareas();
            showToast(`Tarea ${id ? 'actualizada' : 'creada'} con éxito.`);
        } else {
            showToast("Error al guardar la tarea.", "is-danger");
        }
    });

    // Event Delegation para botones de las tarjetas
    taskListDiv.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.dataset.id;

        if (button.classList.contains('button-delete')) {
            if (confirm("¿Estás seguro?")) { await apiFetch(`/tareas/${id}`, { method: 'DELETE' }); cargarTareas(); showToast("Tarea eliminada."); }
        } else if (button.classList.contains('button-complete')) {
            const res = await apiFetch(`/tareas/${id}`); if (!res || !res.ok) return; const t = await res.json();
            await apiFetch(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify({ ...t, completada: !t.completada }) });
            cargarTareas();
        } else if (button.classList.contains('button-edit')) {
            const res = await apiFetch(`/tareas/${id}`); if (!res || !res.ok) return; const t = await res.json();
            taskModalTitle.textContent = "Editar Tarea";
            taskIdInput.value = t.id;
            document.getElementById('titulo').value = t.titulo;
            document.getElementById('descripcion').value = t.descripcion;
            openModal(taskModal);
        } else if (button.classList.contains('button-assign')) {
            assignForm.dataset.taskId = id; openModal(assignModal);
        }
    });

    // Lógica del Modal de Asignación (sin cambios)
    assignForm.addEventListener('submit', async e => { /* ... */ });

    // --- INICIALIZACIÓN ---
    updateUI();
});