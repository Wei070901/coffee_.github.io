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
        this.setupDashboardTabs();
        const isLoggedIn = await this.checkLoginStatus();
        isLoggedIn ? this.showMemberDashboard() : this.showLoginForm();
    }

    setupDashboardTabs() {
        // 設置會員中心的選項卡切換
        const options = document.querySelectorAll('.member-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // 移除所有選項的 active 類
                options.forEach(opt => opt.classList.remove('active'));
                // 添加當前選項的 active 類
                option.classList.add('active');
                
                // 獲取目標內容區域
                const targetId = option.getAttribute('data-target');
                this.switchDashboardContent(targetId);
            });
        });
    }

    switchDashboardContent(targetId) {
        // 隱藏所有內容區域
        const contents = document.querySelectorAll('.dashboard-content');
        contents.forEach(content => {
            content.style.display = 'none';
        });

        // 顯示目標內容區域
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.style.display = 'block';
        }

        // 如果切換到個人資料，則填充表單
        if (targetId === 'profile') {
            this.fillProfileForm();
        }
        // 如果切換到訂單記錄，則載入訂單
        else if (targetId === 'orderHistory') {
            this.loadOrders();
        }
    }

    fillProfileForm() {
        if (!this.currentUser) return;

        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');

        if (nameInput) nameInput.value = this.currentUser.name || '';
        if (emailInput) emailInput.value = this.currentUser.email || '';
        if (phoneInput) phoneInput.value = this.currentUser.phone || '';

        // 設置個人資料表單的提交事件
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.updateProfile(new FormData(profileForm));
            };
        }
    }

    async updateProfile(formData) {
        try {
            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone')
            };

            const response = await fetch(`${this.apiUrl}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                this.currentUser = updatedUser;
                this.updateMemberInfo();
                alert('個人資料更新成功！');
            } else {
                throw new Error('更新個人資料失敗');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            alert(error.message);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch(`${this.apiUrl}/api/orders/my-orders`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const orders = await response.json();
                this.displayOrders(orders);
            } else {
                throw new Error('載入訂單失敗');
            }
        } catch (error) {
            console.error('Load orders error:', error);
            const orderList = document.querySelector('.order-list');
            if (orderList) {
                orderList.innerHTML = '<p class="error-message">載入訂單失敗</p>';
            }
        }
    }

    displayOrders(orders) {
        const orderList = document.querySelector('.order-list');
        if (!orderList) return;

        if (!orders || orders.length === 0) {
            orderList.innerHTML = '<p>目前沒有訂單記錄</p>';
            return;
        }

        const orderHTML = orders.map(order => {
            const orderDate = new Date(order.createdAt);
            const formattedDate = `${orderDate.getFullYear()}/${String(orderDate.getMonth() + 1).padStart(2, '0')}/${String(orderDate.getDate()).padStart(2, '0')} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
            const orderNumber = `CF${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${order._id.slice(-6)}`;

            // 轉換付款方式為中文
            const paymentMethodMap = {
                'cash-taipei': '台北取貨付款',
                'credit-card': '信用卡',
                'line-pay': 'Line Pay'
            };
            const paymentMethod = paymentMethodMap[order.paymentMethod] || order.paymentMethod;

            // 轉換訂單狀態為中文
            const statusMap = {
                'pending': '處理中',
                'processing': '製作中',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            const status = statusMap[order.status] || order.status;
            
            return `
                <div class="order-item">
                    <div class="order-info">
                        <span class="order-detail">訂單編號：${orderNumber}</span>
                        <span class="order-detail">訂購時間：${formattedDate}</span>
                        <span class="order-detail">總金額：NT$ ${order.totalAmount}</span>
                        <span class="order-detail">付款方式：${paymentMethod}</span>
                        <span class="order-detail status-tag status-${order.status || 'pending'}">${status}</span>
                    </div>
                    <div class="order-actions">
                        <a href="order-tracking.html?orderId=${order._id}" class="track-order-btn">追蹤訂單</a>
                    </div>
                </div>
            `;
        }).join('');

        orderList.innerHTML = orderHTML;
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
                phone: formData.get('phone')
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
        if (this.memberDashboard) {
            this.memberDashboard.style.display = 'block';
            this.updateMemberInfo();
            // 預設顯示訂單記錄
            this.switchDashboardContent('orderHistory');
        }
    }

    async updateMemberInfo() {
        if (!this.currentUser) return;

        const nameElement = document.getElementById('memberName');
        const emailElement = document.getElementById('memberEmail');

        if (nameElement) nameElement.textContent = '姓名：' + (this.currentUser.name || '');
        if (emailElement) emailElement.textContent = '電子郵件：' + (this.currentUser.email || '');
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