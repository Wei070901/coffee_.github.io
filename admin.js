// 管理員帳號資訊（實際應用中應該存在後端資料庫）
const API_BASE_URL = 'https://coffee-github-io.onrender.com';

// DOM 元素
const loginForm = document.getElementById('adminLoginForm');
const loginContainer = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const orderTableBody = document.getElementById('orderTableBody');
const statusFilter = document.getElementById('statusFilter');

// 檢查登入狀態
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/check-auth`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.isLoggedIn) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadOrders();
        } else {
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
        }
    } catch (error) {
        console.error('檢查登入狀態失敗:', error);
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

// 登入表單提交處理
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.token) {
            // 保存 token
            localStorage.setItem('adminToken', data.token);
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadOrders();
        } else {
            alert(data.message || '登入失敗');
        }
    } catch (error) {
        console.error('登入失敗:', error);
        alert('登入失敗，請稍後再試');
    }
});

// 載入訂單資料
async function loadOrders() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('獲取訂單失敗');
        }
        
        const orders = await response.json();
        console.log('Rendering orders:', orders);
        renderOrders(orders);
    } catch (error) {
        console.error('載入訂單失敗:', error);
    }
}

// 格式化訂單項目
function formatOrderItems(items) {
    if (!items || !Array.isArray(items)) return '無商品資訊';
    
    return items.map(item => {
        try {
            const productName = item.product && (item.product.name || item.product.title);
            const quantity = item.quantity || 1;
            const price = item.price ? `($${item.price})` : '';
            return productName ? `${productName} x${quantity} ${price}` : '未知商品';
        } catch (error) {
            console.error('格式化訂單項目錯誤:', error);
            return '商品資訊錯誤';
        }
    }).join(', ');
}

// 格式化訂單編號
function formatOrderId(order) {
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

// 渲染訂單列表
function renderOrders(orders) {
    try {
        if (!Array.isArray(orders)) {
            console.error('訂單資料格式錯誤:', orders);
            return;
        }

        orderTableBody.innerHTML = '';
        orders.map(order => {
            const row = document.createElement('tr');
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            const formattedDate = orderDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            row.innerHTML = `
                <td>${formatOrderId(order)}</td>
                <td>${formattedDate}</td>
                <td>${order.user ? order.user.email : '訪客'}</td>
                <td>${formatOrderItems(order.items)}</td>
                <td>NT$ ${order.totalAmount.toLocaleString()}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>處理中</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>準備中</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>已出貨</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>已送達</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>已取消</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewOrderDetails('${order._id}')" class="btn-view">查看</button>
                </td>
            `;
            orderTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('渲染訂單行錯誤:', error);
    }
}

// 更新訂單狀態
async function updateOrderStatus(orderId, newStatus) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '更新失敗');
        }

        const data = await response.json();
        if (data.success) {
            alert('訂單狀態更新成功！');
            loadOrders(); // 重新載入訂單列表
        } else {
            throw new Error('更新失敗');
        }
    } catch (error) {
        console.error('更新訂單狀態失敗:', error);
        alert(error.message || '更新訂單狀態失敗，請稍後再試');
    }
}

// 查看訂單詳情
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '獲取訂單詳情失敗');
        }
        
        const order = await response.json();
        alert(JSON.stringify(order, null, 2));
    } catch (error) {
        console.error('獲取訂單詳情失敗:', error);
        alert(error.message || '獲取訂單詳情失敗，請稍後再試');
    }
}

// 登出功能
async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
        } else {
            throw new Error('登出失敗');
        }
    } catch (error) {
        console.error('登出失敗:', error);
        alert('登出失敗，請稍後再試');
    }
}

// 狀態篩選變更處理
statusFilter.addEventListener('change', loadOrders);

// 頁面載入時檢查登入狀態
document.addEventListener('DOMContentLoaded', checkLoginStatus);
