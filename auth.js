// --- Arquivo: auth.js ---
// (Usado por login.html e register.html)

// 1. Conexão com o Supabase
// COLOQUE AQUI AS CHAVES DO SEU PROJETO (Passo 13)
const SUPABASE_URL = 'https://kdjpboltryumsteldayy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanBib2x0cnl1bXN0ZWxkYXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzQ5MDIsImV4cCI6MjA3NjkxMDkwMn0.pVOVUAfyxywkLPiDe9OTJVg3VJBwL1LA0fotPVmj8sU';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const errorEl = document.getElementById('auth-error');

// 2. Lógica de Registro
async function handleRegister(event) {
    event.preventDefault();
    errorEl.textContent = ''; // Limpa erros anteriores

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: { display_name: name } }
    });

    if (error) {
        console.error('Erro no registro:', error);
        // Mensagens mais específicas
        if (error.message.includes("already registered")) {
            errorEl.textContent = 'Este email já está cadastrado.';
        } else if (error.message.includes("Password should be at least 6 characters")) {
             errorEl.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
            errorEl.textContent = 'Erro ao registrar. Tente novamente.';
        }
    } else {
        console.log('Registro bem-sucedido!', data.user);
        // Mensagem de sucesso (e instrução sobre email, se aplicável)
        alert('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta antes de fazer login.');
        window.location.href = 'login.html';
    }
}

// 3. Lógica de Login
async function handleLogin(event) {
    event.preventDefault();
    errorEl.textContent = ''; // Limpa erros anteriores

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Erro no login:', error);
        // Mensagem específica para credenciais inválidas
        if (error.message.includes("Invalid login credentials")) {
            errorEl.textContent = 'Email ou senha inválidos.';
        } else if (error.message.includes("Email not confirmed")) {
             errorEl.textContent = 'Por favor, confirme seu email antes de fazer login.';
        } else {
            errorEl.textContent = 'Erro ao fazer login. Tente novamente.';
        }
    } else {
        console.log('Login bem-sucedido!', data.user);
        window.location.href = 'index.html';
    }
}

// 4. Adiciona os listeners corretos
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});