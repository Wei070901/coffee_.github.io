// 管理員帳號資訊（實際應用中應該存在後端資料庫）
const API_BASE_URL = 'http://localhost:3002';

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
        if (response.ok && data.success) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadOrders();
        } else {
            alert(data.message || '帳號或密碼錯誤！');
        }
    } catch (error) {
        console.error('登入失敗:', error);
        alert('登入失敗，請稍後再試');
    }
});

// 載入訂單資料
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '獲取訂單失敗');
        }
        
        const orders = await response.json();
        console.log('Received orders:', orders); // 調試用
        renderOrders(orders);
    } catch (error) {
        console.error('載入訂單失敗:', error);
        // 測試用假資料
        const mockOrders = [
            {
                id: "ORD001",
                date: "2024-12-28",
                customerName: "王小明",
                items: "商品A x1, 商品B x2",
                total: 3000,
                status: "pending"
            },
            {
                id: "ORD002",
                date: "2024-12-27",
                customerName: "李小華",
                items: "商品C x1",
                total: 1500,
                status: "shipped"
            }
        ];
        renderOrders(mockOrders);
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

// 渲染訂單列表
function renderOrders(orders) {
    console.log('Rendering orders:', orders); // 調試用
    if (!Array.isArray(orders)) {
        console.error('訂單資料格式錯誤:', orders);
        return;
    }

    const currentFilter = statusFilter.value;
    const filteredOrders = currentFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status === currentFilter);

    orderTableBody.innerHTML = filteredOrders.map(order => {
        try {
            const orderId = order._id || order.id;
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '未知日期';
            const customerName = order.shippingInfo?.name || order.customerName || '未知客戶';
            const orderItems = formatOrderItems(order.items);
            const total = order.totalAmount || order.total || 0;
            const status = order.status || 'pending';

            // 生成訂單編號：訂單建立日期 + ObjectId 後6碼
            const date = new Date(order.createdAt);
            const orderDate2 = date.toISOString().slice(2,10).replace(/-/g, '');
            const orderIdSuffix = order._id.slice(-6);
            const formattedOrderId = `CO${orderDate2}${orderIdSuffix}`;

            return `
                <tr>
                    <td>${formattedOrderId}</td>
                    <td>${orderDate}</td>
                    <td>${customerName}</td>
                    <td>${orderItems}</td>
                    <td>$${total}</td>
                    <td>
                        <select class="status-select" onchange="updateOrderStatus('${orderId}', this.value)">
                            <option value="pending" ${status === 'pending' ? 'selected' : ''}>訂單成立</option>
                            <option value="processing" ${status === 'processing' ? 'selected' : ''}>準備出貨</option>
                            <option value="shipping" ${status === 'shipping' ? 'selected' : ''}>預約成功</option>
                            <option value="completed" ${status === 'completed' ? 'selected' : ''}>已取貨</option>
                            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>已取消</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="viewOrderDetails('${orderId}')">查看詳情</button>
                    </td>
                </tr>
            `;
        } catch (error) {
            console.error('渲染訂單行錯誤:', error);
            return `
                <tr>
                    <td colspan="7">訂單資料錯誤</td>
                </tr>
            `;
        }
    }).join('');
}

// 更新訂單狀態
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
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
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
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
