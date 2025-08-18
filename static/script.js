// static/script.js (VERSIÓN FINALÍSIMA)
document.addEventListener("DOMContentLoaded", () => {
    const authContainer = document.getElementById("auth-container"), appContainer = document.getElementById("app-container");
    const loginForm = document.getElementById("login-form"), registerForm = document.getElementById("register-form");
    const taskListDiv = document.getElementById("task-list"), logoutButton = document.getElementById("logout-button");
    const userInfo = document.getElementById("user-info"), showRegisterLink = document.getElementById("show-register"), showLoginLink = document.getElementById("show-login");
    const spinner = document.getElementById('spinner'), toastContainer = document.getElementById('toast-container');
    const addTaskFab = document.getElementById('add-task-fab');
    const taskModal = document.getElementById('task-modal'), taskModalTitle = document.getElementById('task-modal-title');
    const taskForm = document.getElementById('task-form'), taskIdInput = document.getElementById('task-id');
    const saveTaskButton = document.getElementById('save-task-button');
    const assignModal = document.getElementById('assign-modal'), assignForm = document.getElementById('assign-form');

    const openModal = (modal) => modal.classList.add('is-active');
    const closeModal = (modal) => modal.classList.remove('is-active');
    taskModal.querySelectorAll('.modal-background, .delete, .button-close').forEach(el => el.addEventListener('click', () => closeModal(taskModal)));
    assignModal.querySelectorAll('.modal-background, .delete').forEach(el => el.addEventListener('click', () => closeModal(assignModal)));

    const showSpinner = () => spinner.classList.remove('is-hidden');
    const hideSpinner = () => spinner.classList.add('is-hidden');
    
    function showToast(message, type = 'is-success') {
        const toast = document.createElement('div');
        toast.className = `notification ${type} is-light`;
        toast.innerHTML = `${message}<button class="delete"></button>`;
        toastContainer.appendChild(toast);
        toast.querySelector('.delete').addEventListener('click', () => toast.remove());
        setTimeout(() => toast.remove(), 4000);
    }

    const saveToken = token => localStorage.setItem('authToken', token), getToken = () => localStorage.getItem('authToken'), clearToken = () => localStorage.removeItem('authToken');
    
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

    async function apiFetch(endpoint, options = {}) {
        showSpinner();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const response = await fetch(endpoint, { ...options, headers });
            if (response.status === 401) { clearToken(); updateUI(); showToast("Tu sesión ha expirado.", "is-danger"); return null; }
            return response;
        } catch (error) { showToast("Error de conexión con el servidor.", "is-danger"); return null;
        } finally { hideSpinner(); }
    }

    showRegisterLink.addEventListener('click', e => { e.preventDefault(); loginForm.classList.add('is-hidden'); registerForm.classList.remove('is-hidden'); });
    showLoginLink.addEventListener('click', e => { e.preventDefault(); registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden'); });

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
    
    logoutButton.addEventListener('click', () => { clearToken(); updateUI(); showToast("Sesión cerrada con éxito."); });

    async function cargarTareas() {
        const response = await apiFetch('/tareas');
        if (!response || !response.ok) { taskListDiv.innerHTML = '<p>No se pudieron cargar las tareas.</p>'; return; }
        const tareas = await response.json();
        taskListDiv.innerHTML = "";
        tareas.forEach(tarea => {
            const assigneesHtml = tarea.assignees.map(u => `<span class="tag is-info mr-1">${u.email}</span>`).join('');
            const taskCard = document.createElement("div");
            taskCard.className = `box ${tarea.completada ? 'completed' : ''}`;
            taskCard.innerHTML = `<div class="content">
                <p class="is-size-5 has-text-weight-semibold">${tarea.titulo}</p><p>${tarea.descripcion}</p>
                <div class="tags"><span class="tag is-light mr-2">Asignados:</span>${assigneesHtml}</div>
            </div>
            <div class="buttons is-right">
                <button class="button is-small is-light button-complete" data-id="${tarea.id}">${tarea.completada ? 'Deshacer' : 'Completar'}</button>
                <button class="b