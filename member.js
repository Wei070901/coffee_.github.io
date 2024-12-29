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

            const response = await fetch(`${this.apiUrl}/auth/profile`, {
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
            const response = await fetch(`${this.apiUrl}/orders/my-orders`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('獲取訂單記錄失敗');
            }

            const orders = await response.json();
            this.displayOrders(orders);
        } catch (error) {
            console.error('載入訂單失敗:', error);
        }
    }

    formatOrderId(order) {
        try {
            const date = new Date(order.createdAt);
            const orderDate = date.toISOString().slice(2,10).replace(/-/g, '');
            const orderIdSuffix = order._id.slice(-6);
            return `CO${orderDate}${orderIdSuffix}`;
        } catch (error) {
            console.error('格式化訂單編號錯誤:', error);
            return order._id;
        }
    }

    displayOrders(orders) {
        const orderContainer = document.querySelector('.order-history');
        if (!orderContainer) return;

        if (!orders || orders.length === 0) {
            orderContainer.innerHTML = '<p class="no-orders">尚無訂單記錄</p>';
            return;
        }

        const ordersList = orders.map(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const orderItems = order.items.map(item => 
                `<div class="order-item">
                    <span class="item-name">${item.product.name}</span>
                    <span class="item-quantity">x ${item.quantity}</span>
                    <span class="item-price">NT$ ${item.price.toLocaleString()}</span>
                </div>`
            ).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <span class="order-id">訂單編號：${this.formatOrderId(order)}</span>
                            <span class="order-date">訂購時間：${orderDate}</span>
                        </div>
                        <div class="order-status">
                            <span class="status-badge ${order.status}">${this.getStatusText(order.status)}</span>
                        </div>
                    </div>
                    <div class="order-items">
                        ${orderItems}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <span>總金額</span>
                            <span class="total-amount">NT$ ${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <button onclick="window.location.href='/order-tracking.html?orderId=${order._id}'" class="track-order-btn">追蹤訂單</button>
                    </div>
                </div>
            `;
        }).join('');

        orderContainer.innerHTML = ordersList;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '處理中',
            'processing': '準備中',
            'shipped': '已出貨',
            'delivered': '已送達',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
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
        // 設置登入表單
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const formData = new FormData(loginForm);
                    const credentials = {
                        email: formData.get('email'),
                        password: formData.get('password')
                    };

                    console.log('Attempting login with credentials:', credentials);
                    const response = await fetch(`${this.apiUrl}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(credentials)
                    });

                    const data = await response.json();
                    console.log('Login response:', data);

                    if (!response.ok) {
                        throw new Error(data.error || '登入失敗');
                    }

                    if (!data.token) {
                        throw new Error('未收到認證令牌');
                    }

                    // 保存認證信息
                    localStorage.setItem('token', data.token);
                    this.token = data.token;
                    this.currentUser = data.user;

                    console.log('Login successful, showing dashboard...');
                    // 顯示會員中心
                    this.showMemberDashboard();
                } catch (error) {
                    console.error('Login error:', error);
                    alert(error.message || '登入失敗，請稍後再試');
                }
            });
        } else {
            console.error('Login form not found');
        }

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
                const response = await fetch(`${this.apiUrl}/auth/register`, {
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

        // 設置登出按鈕
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
            this.showLoginForm();
        });
    }

    async checkLoginStatus() {
        try {
            const token = localStorage.getItem('token');
            console.log('Checking login status, token:', token ? 'exists' : 'not found');

            if (!token) {
                return false;
            }

            const response = await fetch(`${this.apiUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            console.log('Profile response:', response.status);

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const userData = await response.json();
            console.log('User data received:', userData);

            this.token = token;
            this.currentUser = userData;

            // 如果在會員頁面，顯示會員資訊
            if (this.isMemberPage) {
                this.showMemberDashboard();
            }

            return true;
        } catch (error) {
            console.error('Check login status error:', error);
            this.logout();
            return false;
        }
    }

    showMemberDashboard() {
        console.log('Showing member dashboard...');
        if (!this.memberDashboard) {
            console.error('Member dashboard element not found');
            return;
        }

        if (!this.currentUser) {
            console.error('No user data available');
            this.showLoginForm();
            return;
        }

        console.log('Current user:', this.currentUser);

        // 隱藏登入和註冊表單
        if (this.loginFormContainer) {
            this.loginFormContainer.style.display = 'none';
        }
        if (this.registerFormContainer) {
            this.registerFormContainer.style.display = 'none';
        }

        // 顯示會員中心
        this.memberDashboard.style.display = 'block';
        
        // 更新會員資訊
        this.updateMemberInfo();
        
        // 載入訂單記錄
        this.loadOrders();
        
        console.log('Member dashboard displayed successfully');
    }

    logout() {
        console.log('Logging out...');
        localStorage.removeItem('token');
        this.token = null;
        this.currentUser = null;
        
        // 如果在會員頁面，顯示登入表單
        if (this.isMemberPage) {
            this.showLoginForm();
        } else {
            window.location.href = '/member.html';
        }
    }

    showLoginForm() {
        if (!this.loginFormContainer || !this.registerFormContainer || !this.memberDashboard) {
            console.error('Required DOM elements not found');
            return;
        }
        console.log('Showing login form');
        this.loginFormContainer.style.display = 'block';
        this.registerFormContainer.style.display = 'none';
        this.memberDashboard.style.display = 'none';
    }

    showRegisterForm() {
        if (this.loginFormContainer) this.loginFormContainer.style.display = 'none';
        if (this.registerFormContainer) this.registerFormContainer.style.display = 'block';
        if (this.memberDashboard) this.memberDashboard.style.display = 'none';
    }

    updateMemberInfo() {
        console.log('Updating member info...');
        if (!this.currentUser) {
            console.error('No user data available for update');
            return;
        }

        // 更新會員資訊顯示
        const memberInfo = document.querySelector('.member-info');
        if (memberInfo) {
            memberInfo.innerHTML = `
                <p><strong>姓名：</strong>${this.currentUser.name}</p>
                <p><strong>信箱：</strong>${this.currentUser.email}</p>
            `;
        }

        // 填充個人資料表單
        this.fillProfileForm();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.memberSystem = new MemberSystem();
});