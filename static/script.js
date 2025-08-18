// static/script.js
document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM
    const authContainer = document.getElementById("auth-container");
    const appContainer = document.getElementById("app-container");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const taskListDiv = document.getElementById("task-list");
    const taskForm = document.getElementById("task-form");
    const logoutButton = document.getElementById("logout-button");
    const userInfo = document.getElementById("user-info");
    
    // --- Lógica para cambiar entre formularios de login y registro ---
    const showRegisterLink = document.getElementById("show-register");
    const showLoginLink = document.getElementById("show-login");

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('is-hidden');
        registerForm.classList.remove('is-hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('is-hidden');
        loginForm.classList.remove('is-hidden');
    });

    // --- Gestión del Token ---
    let authToken = null;

    function saveToken(token) {
        authToken = token;
        localStorage.setItem('authToken', token);
    }

    function getToken() {
        return localStorage.getItem('authToken');
    }

    function clearToken() {
        authToken = null;
        localStorage.removeItem('authToken');
    }
    
    // --- Lógica de la UI ---
    function updateUI() {
        authToken = getToken();
        if (authToken) {
            authContainer.classList.add("is-hidden");
            appContainer.classList.remove("is-hidden");
            // Decodificar el token para obtener el email (de forma simple)
            try {
                const payload = JSON.parse(atob(authToken.split('.')[1]));
                userInfo.textContent = `Sesión iniciada como: ${payload.sub}`;
            } catch (e) {
                console.error("Error decodificando el token", e);
            }
            cargarTareas();
        } else {
            appContainer.classList.add("is-hidden");
            authContainer.classList.remove("is-hidden");
        }
    }

    // --- Funciones de la API ---
    async function apiFetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, { ...options, headers });

        if (response.status === 401) { // Si el token es inválido o expiró
            clearToken();
            updateUI();
            return; // Detener la ejecución
        }
        return response;
    }

    // --- Lógica de Autenticación ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        // La petición de token usa 'x-www-form-urlencoded', no JSON
        const response = await fetch('/token', {
            method: 'POST',
            body: formData,
        });

        const errorDiv = document.getElementById('login-error');
        if (response.ok) {
            const data = await response.json();
            saveToken(data.access_token);
            updateUI();
            errorDiv.classList.add('is-hidden');
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.detail || "Error al iniciar sesión.";
            errorDiv.classList.remove('is-hidden');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        const response = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');

        if (response.ok) {
            successDiv.textContent = "¡Registro exitoso! Ahora puedes iniciar sesión.";
            successDiv.classList.remove('is-hidden');
            errorDiv.classList.add('is-hidden');
            registerForm.reset();
            // Mostrar el formulario de login automáticamente
            showLoginLink.click();
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.detail || "Error en el registro.";
            errorDiv.classList.remove('is-hidden');
            successDiv.classList.add('is-hidden');
        }
    });
    
    logoutButton.addEventListener('click', () => {
        clearToken();
        updateUI();
    });

    // --- Lógica de Tareas (AHORA USA apiFetch para incluir el token) ---
    async function cargarTareas() {
        const response = await apiFetch('/tareas');
        if(!response) return;

        const tareas = await response.json();
        taskListDiv.innerHTML = "";
        tareas.forEach(tarea => {
            const taskCard = document.createElement("div");
            taskCard.className = `card mb-4 ${tarea.completada ? 'completed' : ''}`;
            taskCard.innerHTML = `
                <div class="card-content">
                    <p class="title is-5">${tarea.titulo}</p>
                    <p class="subtitle is-6">${tarea.descripcion}</p>
                </div>
                <footer class="card-footer">
                    <a href="#" class="card-footer-item button-complete" data-id="${tarea.id}">Completar/Deshacer</a>
                    <a href="#" class="card-footer-item button-delete" data-id="${tarea.id}">Eliminar</a>
                </footer>
            `;
            taskListDiv.appendChild(taskCard);
        });
    }

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        await apiFetch('/tareas', {
            method: 'POST',
            body: JSON.stringify({ titulo, descripcion, completada: false }),
        });
        taskForm.reset();
        cargarTareas();
    });

    taskListDiv.addEventListener('click', async (e) => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (!target) return;
        const id = target.dataset.id;
        
        // Botón Eliminar
        if (target.classList.contains('button-delete')) {
            await apiFetch(`/tareas/${id}`, { method: 'DELETE' });
            cargarTareas();
        }

        // Botón Completar
        if (target.classList.contains('button-complete')) {
            const response = await apiFetch(`/tareas/${id}`);
            if(!response) return;
            const tarea = await response.json();
            await apiFetch(`/tareas/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...tarea, completada: !tarea.completada }),
            });
            cargarTareas();
        }
    });

    // --- INICIALIZACIÓN ---
    updateUI();
});