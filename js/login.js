document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://menu-trabajo.onrender.com';
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const togglePasswordIcon = document.getElementById('togglePassword');
    const statusButton = document.getElementById('server-status-button');

    async function pingServer() {
        if (!statusButton) return;
        statusButton.classList.remove('online');
        statusButton.classList.add('checking');
        try {
            const response = await fetch(`${API_URL}/ping`);
            if (response.ok) {
                statusButton.classList.add('online');
            }
        } catch (error) {
            // Silencio intencional
        } finally {
            statusButton.classList.remove('checking');
        }
    }

    if (statusButton) {
        statusButton.addEventListener('click', pingServer);
    }
    pingServer();

    if (togglePasswordIcon) {
        togglePasswordIcon.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = passwordInput.value;
            errorMessage.textContent = '';
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Error en el servidor');
                }
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('adminUser', username);
                window.location.href = '/admin.html';
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }
});