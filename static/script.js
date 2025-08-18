// static/script.js
document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a elementos del DOM ---
    const authContainer = document.getElementById("auth-container"), appContainer = document.getElementById("app-container");
    const loginForm = document.getElementById("login-form"), registerForm = document.getElementById("register-form");
    const taskListDiv = document.getElementById("task-list"), taskForm = document.getElementById("task-form");
    const logoutButton = document.getElementById("logout-button"), userInfo = document.getElementById("user-info");
    const showRegisterLink = document.getElementById("show-register"), showLoginLink = document.getElementById("show-login");
    const modal = document.getElementById('assign-modal'), modalCloseButton = modal.querySelector('.delete'), assignForm = document.getElementById('assign-form'), assigneesListDiv = document.getElementById('assignees-list');

    // --- Lógica para cambiar formularios ---
    showRegisterLink.addEventListener('click', e => { e.preventDefault(); loginForm.classList.add('is-hidden'); registerForm.classList.remove('is-hidden'); });
    showLoginLink.addEventListener('click', e => { e.preventDefault(); registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden'); });

    // --- Gestión del Token ---
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

    // --- Función Genérica de Fetch API ---
    async function apiFetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(endpoint, { ...options, headers });
        if (response.status === 401) { clearToken(); updateUI(); return null; }
        return response;
    }

    // --- Lógica de Autenticación ---
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', document.getElementById('login-email').value);
        formData.append('password', document.getElementById('login-password').value);
        const response = await fetch('/token', { method: 'POST', body: formData });
        const errorDiv = document.getElementById('login-error');
        if (response.ok) { const data = await response.json(); saveToken(data.access_token); updateUI(); errorDiv.classList.add('is-hidden'); } 
        else { const err = await response.json(); errorDiv.textContent = err.detail || "Error"; errorDiv.classList.remove('is-hidden'); }
    });
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const response = await apiFetch('/users/register', { method: 'POST', body: JSON.stringify({ email: document.getElementById('register-email').value, password: document.getElementById('register-password').value }) });
        const errorDiv = document.getElementById('register-error'), successDiv = document.getElementById('register-success');
        if (response.ok) { successDiv.textContent = "¡Registro exitoso! Inicia sesión."; successDiv.classList.remove('is-hidden'); errorDiv.classList.add('is-hidden'); registerForm.reset(); showLoginLink.click(); } 
        else { const err = await response.json(); errorDiv.textContent = err.detail || "Error"; errorDiv.classList.remove('is-hidden'); successDiv.classList.add('is-hidden'); }
    });
    logoutButton.addEventListener('click', () => { clearToken(); updateUI(); });

    // --- Lógica de Tareas (CRUD Completo) ---
    async function cargarTareas() {
        const response = await apiFetch('/tareas');
        if (!response) return;
        const tareas = await response.json();
        taskListDiv.innerHTML = "";
        tareas.forEach(tarea => {
            const assigneesHtml = tarea.assignees.map(u => `<span class="tag is-info mr-1">${u.email}<button class="delete is-small" data-task-id="${tarea.id}" data-user-email="${u.email}"></button></span>`).join('');
            const taskCard = document.createElement("div");
            taskCard.className = `card mb-4 ${tarea.completada ? 'completed' : ''}`;
            taskCard.innerHTML = `<div class="card-content">
                <p class="title is-5">${tarea.titulo}</p><p class="subtitle is-6">${tarea.descripcion}</p>
                <div class="tags"><span class="tag is-light mr-2">Asignados:</span>${assigneesHtml}</div>
            </div>
            <footer class="card-footer">
                <a href="#" class="card-footer-item button-complete" data-id="${tarea.id}">Completar/Deshacer</a>
                <a href="#" class="card-footer-item button-edit" data-id="${tarea.id}">Editar</a>
                <a href="#" class="card-footer-item button-assign" data-id="${tarea.id}">Asignar</a>
                <a href="#" class="card-footer-item button-delete" data-id="${tarea.id}">Eliminar</a>
            </footer>`;
            taskListDiv.appendChild(taskCard);
        });
    }

    taskForm.addEventListener('submit', async e => {
        e.preventDefault();
        await apiFetch('/tareas', { method: 'POST', body: JSON.stringify({ titulo: document.getElementById('titulo').value, descripcion: document.getElementById('descripcion').value }) });
        taskForm.reset();
        cargarTareas();
    });

    taskListDiv.addEventListener('click', async e => {
        const target = e.target;
        const link = target.closest('a');
        if (link) { // Clic en un botón del footer
            e.preventDefault();
            const id = link.dataset.id;
            if (link.classList.contains('button-delete')) {
                if (confirm("¿Estás seguro?")) { await apiFetch(`/tareas/${id}`, { method: 'DELETE' }); cargarTareas(); }
            } else if (link.classList.contains('button-complete')) {
                const res = await apiFetch(`/tareas/${id}`); if (!res) return; const t = await res.json();
                await apiFetch(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify({ ...t, completada: !t.completada }) });
                cargarTareas();
            } else if (link.classList.contains('button-edit')) {
                const res = await apiFetch(`/tareas/${id}`); if (!res) return; const t = await res.json();
                const newTitle = prompt("Edita el título:", t.titulo); const newDesc = prompt("Edita la descripción:", t.descripcion);
                if (newTitle !== null && newDesc !== null) { await apiFetch(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify({ ...t, titulo: newTitle, descripcion: newDesc }) }); cargarTareas(); }
            } else if (link.classList.contains('button-assign')) {
                assignForm.dataset.taskId = id; modal.classList.add('is-active');
            }
        }
        if (target.classList.contains('delete')) { // Clic en el botón de borrar asignación
            e.preventDefault();
            const taskId = target.dataset.taskId; const userEmail = target.dataset.userEmail;
            if (confirm(`¿Quitar a ${userEmail} de esta tarea?`)) { await apiFetch(`/tareas/${taskId}/unassign`, { method: 'POST', body: JSON.stringify({ email: userEmail }) }); cargarTareas(); }
        }
    });

    // --- Lógica del Modal de Asignación ---
    modalCloseButton.addEventListener('click', () => modal.classList.remove('is-active'));
    assignForm.addEventListener('submit', async e => {
        e.preventDefault();
        const taskId = e.target.dataset.taskId;
        const email = document.getElementById('assign-email').value;
        await apiFetch(`/tareas/${taskId}/assign`, { method: 'POST', body: JSON.stringify({ email }) });
        document.getElementById('assign-email').value = "";
        modal.classList.remove('is-active');
        cargarTareas();
    });

    // --- INICIALIZACIÓN ---
    updateUI();
});