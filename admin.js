// 管理員帳號資訊（實際應用中應該存在後端資料庫）
const API_BASE_URL = 'https://coffee.up.railway.app';

// DOM 元素
const loginForm = document.getElementById('adminLoginForm');
const loginContainer = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const orderTableBody = document.getElementById('orderTableBody');
const statusFilter = document.getElementById('statusFilter');

// 檢查登入狀態
async function checkLoginStatus() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/check-auth`, {
            headers: token ? {
                'Authorization': `Bearer ${token}`
            } : {}
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
            headers: token ? {
                'Authorization': `Bearer ${token}`
            } : {}
        });

        if (!response.ok) {
            throw new Error('獲取訂單列表失敗');
        }

        const orders = await response.json();
        console.log('Loaded orders:', orders);
        renderOrders(orders);
    } catch (error) {
        console.error('載入訂單失敗:', error);
        alert('載入訂單失敗，請稍後再試');
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
    if (!order || !order.createdAt || !order._id) return '';
    const date = new Date(order.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const idSuffix = order._id.slice(-5);
    return `CO${year}${month}${day}${idSuffix}`;
}

// 渲染訂單列表
function renderOrders(orders) {
    const orderTableBody = document.querySelector('#orderTableBody');
    if (!orderTableBody) {
        console.error('找不到訂單表格');
        return;
    }

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="8" class="no-orders">目前沒有訂單</td></tr>';
        return;
    }

    const orderHTML = orders.map(order => {
        const orderDate = new Date(order.createdAt);
        const formattedDate = `${orderDate.getFullYear()}/${String(orderDate.getMonth() + 1).padStart(2, '0')}/${String(orderDate.getDate()).padStart(2, '0')} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;

        // 格式化商品資訊
        const itemsInfo = order.items.map(item => 
            `${item.product.name} x ${item.quantity}`
        ).join(', ');

        return `
            <tr>
                <td>${formatOrderId(order)}</td>
                <td>${formattedDate}</td>
                <td>${order.shippingInfo?.name || ''}</td>
                <td>${itemsInfo}</td>
                <td>NT$ ${order.totalAmount.toLocaleString()}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>訂單成立</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>準備中</option>
                        <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>預約成功</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>已收到</option>
                    </select>
                </td>
                <td>${order.shippingInfo?.note || '-'}</td>
                <td>
                    <button onclick="viewOrderDetails('${order._id}')" class="view-btn">查看詳情</button>
                </td>
            </tr>
        `;
    }).join('');

    orderTableBody.innerHTML = orderHTML;
}

// 更新訂單狀態
async function updateOrderStatus(orderId, newStatus) {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('請先登入');
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('更新訂單狀態失敗');
        }

        // 重新載入訂單列表
        loadOrders();
        alert('訂單狀態更新成功');
    } catch (error) {
        console.error('更新訂單狀態失敗:', error);
        alert(error.message);
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
            localStorage.removeItem('adminToken');
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
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});
