import config from './js/config.js';

class MemberSystem {
    constructor() {
        this.apiUrl = config.apiUrl;
        this.token = null;
        this.currentUser = null;
        this.isMemberPage = window.location.pathname.endsWith('/member.html');

        // 獲取表單元素
        this.loginFormContainer = document.getElementById('login-form');
        this.registerFormContainer = document.getElementById('register-form');
        this.memberDashboard = document.getElementById('memberDashboard');
        
        // 獲取切換表單的按鈕
        this.showLoginBtn = document.getElementById('show-login');
        this.showRegisterBtn = document.getElementById('show-register');

        this.init();
    }

    async init() {
        this.setupFormSwitching();
        this.setupForms();
        const isLoggedIn = await this.checkLoginStatus();
        isLoggedIn ? this.showMemberDashboard() : this.showLoginForm();
    }

    setupFormSwitching() {
        // 切換到登入表單
        this.showLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // 切換到註冊表單
        this.showRegisterBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
    }

    setupForms() {
        // 設置註冊表單
        const registerForm = document.getElementById('registerForm');
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 獲取表單數據
            const formData = new FormData(registerForm);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirm-password');
            
            // 驗證密碼
            if (password !== confirmPassword) {
                alert('密碼和確認密碼不匹配');
                return;
            }
            
            // 準備要發送的數據
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: password,
                phone: formData.get('phone'),
                address: formData.get('address') || ''
            };

            try {
                console.log('Sending registration request:', userData);
                const response = await fetch(`${this.apiUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(userData)
                });

                console.log('Registration response status:', response.status);
                const data = await response.json();
                console.log('Registration response data:', data);

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    this.token = data.token;
                    this.currentUser = data.user;
                    alert('註冊成功！');
                    this.showMemberDashboard();
                } else {
                    throw new Error(data.error || '註冊失敗');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || '註冊過程中發生錯誤');
            }
        });

        // 設置登入表單
        const loginForm = document.getElementById('loginForm');
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                console.log('Sending login request:', credentials);
                const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(credentials)
                });

                console.log('Login response status:', response.status);
                const data = await response.json();
                console.log('Login response data:', data);

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    this.token = data.token;
                    this.currentUser = data.user;
                    this.showMemberDashboard();
                } else {
                    throw new Error(data.error || '登入失敗');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message || '登入過程中發生錯誤');
            }
        });
    }

    showLoginForm() {
        if (this.loginFormContainer) this.loginFormContainer.style.display = 'block';
        if (this.registerFormContainer) this.registerFormContainer.style.display = 'none';
        if (this.memberDashboard) this.memberDashboard.style.display = 'none';
    }

    showRegisterForm() {
        if (this.loginFormContainer) this.loginFormContainer.style.display = 'none';
        if (this.registerFormContainer) this.registerFormContainer.style.display = 'block';
        if (this.memberDashboard) this.memberDashboard.style.display = 'none';
    }

    showMemberDashboard() {
        if (this.loginFormContainer) this.loginFormContainer.style.display = 'none';
        if (this.registerFormContainer) this.registerFormContainer.style.display = 'none';
        if (this.memberDashboard) this.memberDashboard.style.display = 'block';
        this.updateMemberInfo();
    }

    async updateMemberInfo() {
        if (!this.currentUser) return;

        const nameElement = document.getElementById('memberName');
        const emailElement = document.getElementById('memberEmail');
        const phoneElement = document.getElementById('memberPhone');
        const addressElement = document.getElementById('memberAddress');

        if (nameElement) nameElement.textContent = this.currentUser.name || '';
        if (emailElement) emailElement.textContent = this.currentUser.email || '';
        if (phoneElement) phoneElement.textContent = this.currentUser.phone || '';
        if (addressElement) addressElement.textContent = this.currentUser.address || '';
    }

    async checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        this.token = token;
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Check login status error:', error);
            this.logout();
            return false;
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.currentUser = null;
        this.showLoginForm();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.memberSystem = new MemberSystem();
});