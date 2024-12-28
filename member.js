class MemberSystem {
    constructor() {
        this.token = null;
        this.currentUser = null;
        this.isMemberPage = window.location.pathname.endsWith('/member.html');

        this.loginFormContainer = document.getElementById('login-form');
        this.loginForm = this.loginFormContainer?.querySelector('form');
        this.registerFormContainer = document.getElementById('register-form');
        this.registerForm = this.registerFormContainer?.querySelector('form');
        this.memberDashboard = document.getElementById('memberDashboard');

        this.init();
    }

    async init() {
        const isLoggedIn = await this.checkLoginStatus();
        this.setupEventListeners();
        isLoggedIn ? this.showMemberDashboard() : this.showLoginForm();
    }

    async checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            this.token = token;
            try {
                const response = await fetch('http://localhost:3002/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const userData = await response.json();
                    this.currentUser = userData;
                    if (this.isMemberPage) {
                        this.showMemberDashboard();
                    }
                    return true;
                } else {
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error('檢查登入狀態失敗:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }

    setupEventListeners() {
        this.loginForm?.addEventListener('submit', e => this.handleLogin(e));
        this.registerForm?.addEventListener('submit', e => this.handleRegister(e));

        const options = document.querySelectorAll('.member-option');
        options.forEach(option => {
            option.addEventListener('click', e => {
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.switchContent(option.dataset.target);
            });
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
    }

    async handleLogin(e) {
        e.preventDefault();
        try {
            const formData = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value,
                remember: document.getElementById('remember-me').checked
            };

            console.log('嘗試登入:', formData.email);
            const response = await fetch('http://localhost:3002/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('登入回應:', data);

            if (!response.ok) {
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    throw new Error('登入失敗，請稍後再試');
                }
            }

            if (formData.remember) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            this.token = data.token;
            this.currentUser = data.user;

            // 更新用戶資料顯示
            const nameElement = document.getElementById('memberName');
            const emailElement = document.getElementById('memberEmail');
            
            if (nameElement && emailElement) {
                nameElement.textContent = '名稱：' + data.user.name;
                emailElement.textContent = '信箱：' + data.user.email;
            }

            this.showNotification('登入成功！');

            if (this.isMemberPage) {
                this.showMemberDashboard();
            } else {
                window.location.href = 'member.html';
            }
        } catch (error) {
            console.error('登入失敗:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        try {
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                throw new Error('密碼不一致');
            }

            const formData = {
                email: document.getElementById('register-email').value,
                password: password,
                name: document.getElementById('register-name').value
            };

            const response = await fetch('http://localhost:3002/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '註冊失敗');

            this.showNotification('註冊成功！請登入');
            this.showLoginForm();
        } catch (error) {
            console.error('註冊失敗:', error);
            this.showNotification(error.message, 'error');
        }
    }

    showLoginForm() {
        this.loginFormContainer.style.display = 'block';
        this.registerFormContainer.style.display = 'none';
        this.memberDashboard.style.display = 'none';
    }

    showRegisterForm() {
        this.loginFormContainer.style.display = 'none';
        this.registerFormContainer.style.display = 'block';
        this.memberDashboard.style.display = 'none';
    }

    showMemberDashboard() {
        if (this.loginFormContainer) this.loginFormContainer.style.display = 'none';
        if (this.registerFormContainer) this.registerFormContainer.style.display = 'none';
        if (this.memberDashboard) {
            this.memberDashboard.style.display = 'block';
        }
        this.updateDashboard();
    }

    async updateDashboard() {
        try {
            // 更新用戶資料顯示
            const nameElement = document.getElementById('memberName');
            const emailElement = document.getElementById('memberEmail');
            
            if (nameElement && emailElement && this.currentUser) {
                nameElement.textContent = '名稱：' + this.currentUser.name;
                emailElement.textContent = '信箱：' + this.currentUser.email;
            }

            // 載入訂單歷史
            await this.switchContent('orderHistory');
        } catch (error) {
            console.error('更新儀表板失敗:', error);
            this.showNotification('更新資料失敗', 'error');
        }
    }

    switchContent(target) {
        const contents = document.querySelectorAll('.dashboard-content');
        contents.forEach(content => {
            content.style.display = 'none';
        });

        const options = document.querySelectorAll('.member-option');
        options.forEach(option => {
            option.classList.remove('active');
        });

        const selectedContent = document.getElementById(target);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }

        const selectedOption = document.querySelector(`[data-target="${target}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        if (target === 'orderHistory') {
            this.loadSectionData('orderHistory');
        } else if (target === 'profile') {
            this.loadProfileData();
        }
    }

    async loadSectionData(section) {
        if (!this.token) {
            this.showNotification('請先登入', 'error');
            return;
        }

        try {
            let response;
            const headers = {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };

            switch (section) {
                case 'orderHistory':
                    response = await fetch('http://localhost:3002/api/orders/my-orders', { headers });
                    if (!response.ok) {
                        if (response.status === 401) {
                            this.showNotification('登入已過期，請重新登入', 'error');
                            this.logout();
                        } else {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return;
                    }
                    const orders = await response.json();
                    this.displayOrders(orders);
                    break;
            }
        } catch (error) {
            console.error(`載入${section}數據失敗:`, error);
            if (error.name === 'SyntaxError') {
                this.showNotification('伺服器回應格式錯誤', 'error');
            } else {
                this.showNotification(`載入${section}失敗: ${error.message}`, 'error');
            }
        }
    }

    async loadProfileData() {
        try {
            const response = await fetch('http://localhost:3002/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to load profile data');
            }
            const userData = await response.json();
            this.currentUser = userData;

            // 更新用戶資料顯示
            const nameElement = document.getElementById('memberName');
            const emailElement = document.getElementById('memberEmail');
            
            if (nameElement && emailElement) {
                nameElement.textContent = '名稱：' + userData.name;
                emailElement.textContent = '信箱：' + userData.email;
            }
        } catch (error) {
            console.error('載入用戶資料失敗:', error);
            this.showNotification('載入用戶資料失敗', 'error');
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('orderHistory');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="text-center">目前沒有訂單記錄</p>';
            return;
        }

        // 付款方式中文對照
        const paymentMethods = {
            'cash-taipei': '現金-台北車站',
            'cash-sanchong': '現金-三重商工'
        };

        // 訂單狀態中文對照
        const orderStatus = {
            'pending': '訂單成立',
            'processing': '準備出貨',
            'shipping': '預約成功',
            'completed': '已取貨',
            'cancelled': '已取消'
        };

        const ordersList = orders.map(order => {
            const date = new Date(order.createdAt);
            const formattedDate = date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            // 生成訂單編號：訂單建立日期 + ObjectId 後6碼
            const orderDate = date.toISOString().slice(2,10).replace(/-/g, '');
            const orderIdSuffix = order._id.slice(-6);
            const formattedOrderId = `CO${orderDate}${orderIdSuffix}`;

            const itemsList = order.items.map(item => {
                const product = item.product || {};
                return `
                    <div class="order-item">
                        <img src="${product.imageUrl || '/images/no-image.jpg'}" alt="${product.name || '商品'}" class="order-item-image">
                        <div class="order-item-details">
                            <h4>${product.name || '未知商品'}</h4>
                            <p>數量: ${item.quantity}</p>
                            <p>單價: NT$ ${item.price.toLocaleString()}</p>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <h3>訂單編號: ${formattedOrderId}</h3>
                        <p>訂購時間: ${formattedDate}</p>
                    </div>
                    <div class="order-items">
                        ${itemsList}
                    </div>
                    <div class="order-footer">
                        <div>
                            <p>總金額: NT$ ${order.totalAmount.toLocaleString()}</p>
                            <p>付款方式: ${paymentMethods[order.paymentMethod] || '未知付款方式'}</p>
                            <p>訂單狀態: ${orderStatus[order.status] || '處理中'}</p>
                            <button onclick="window.location.href='order-tracking.html?orderId=${order._id}'" class="track-order-btn">追蹤訂單</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersList;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        this.token = null;
        this.currentUser = null;
        
        this.showLoginForm();
        this.showNotification('已登出');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.memberSystem = new MemberSystem();
});