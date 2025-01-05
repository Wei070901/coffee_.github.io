import config from './js/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // 從 URL 獲取訂單 ID
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
        alert('找不到訂單資訊');
        return;
    }

    try {
        // 從後端獲取訂單資訊
        const headers = {
            'Content-Type': 'application/json'
        };

        // 如果有登入token，加入到請求頭中
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${config.apiUrl}/orders/${orderId}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('獲取訂單資訊失敗');
        }

        const order = await response.json();
        
        // 更新訂單編號和金額
        const date = new Date(order.createdAt);
        const orderDate = date.toISOString().slice(2,10).replace(/-/g, '');
        const orderIdSuffix = order._id.slice(-6);
        const formattedOrderId = `CO${orderDate}${orderIdSuffix}`;

        document.getElementById('trackingOrderNumber').textContent = formattedOrderId;
        document.getElementById('trackingOrderAmount').textContent = `NT$ ${order.totalAmount.toLocaleString()}`;
        
        // 格式化並顯示訂單日期
        document.getElementById('orderDate').textContent = new Date(order.createdAt).toLocaleDateString('zh-TW');

        // 顯示訂單商品
        const orderItemsContainer = document.getElementById('trackingOrderItems');
        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = ''; // 清空容器
            order.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'tracking-item';
                itemElement.innerHTML = `
                    <img src="${item.product.imageUrl || '/images/no-image.jpg'}" alt="${item.product.name}">
                    <div class="item-details">
                        <h4>${item.product.name}</h4>
                        <p>數量：${item.quantity}</p>
                        <p>單價：NT$ ${item.price.toLocaleString()}</p>
                    </div>
                `;
                orderItemsContainer.appendChild(itemElement);
            });
        }

        // 顯示收件資訊
        const deliveryDetails = document.getElementById('deliveryDetails');
        if (deliveryDetails) {
            const paymentMethods = {
                'cash-taipei': '現金-台北車站',
                'cash-sanchong': '現金-三重商工'
            };
            
            deliveryDetails.innerHTML = `
                <p><strong>收件人：</strong>${order.shippingInfo.name}</p>
                <p><strong>電話：</strong>${order.shippingInfo.phone}</p>
                <p><strong>付款方式：</strong>${paymentMethods[order.paymentMethod] || order.paymentMethod}</p>
            `;
        }

        // 更新訂單狀態和時間
        const orderStatus = {
            'pending': '訂單成立',
            'processing': '準備中',
            'shipping': '預約成功',
            'completed': '已收到',
        };

        // 更新每個狀態的時間
        if (order.statusHistory && Array.isArray(order.statusHistory)) {
            order.statusHistory.forEach(history => {
                const timeElement = document.getElementById(`${history.status}Time`);
                if (timeElement) {
                    timeElement.textContent = new Date(history.timestamp).toLocaleString('zh-TW');
                }
            });
        }

        // 如果沒有狀態歷史，至少顯示訂單建立時間
        document.getElementById('orderPlacedTime').textContent = new Date(order.createdAt).toLocaleString('zh-TW');

        // 更新進度條
        updateOrderProgress(order.status);
        
        // 顯示當前狀態
        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus) {
            currentStatus.textContent = orderStatus[order.status] || '處理中';
        }
        
        // 更新訂單追蹤狀態
        updateOrderStatus(order);
        
    } catch (error) {
        console.error('獲取訂單資訊失敗:', error);
        alert('獲取訂單資訊失敗，請稍後再試');
    }
});

function updateOrderProgress(status) {
    const statusOrder = ['pending', 'processing', 'shipping', 'completed'];
    const currentIndex = statusOrder.indexOf(status);
    
    if (currentIndex === -1) return; // 如果是取消狀態，不更新進度條
    
    const statusSteps = document.querySelectorAll('.status-step');
    statusSteps.forEach((step, index) => {
        if (index <= currentIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function updateOrderStatus(order) {
    const statusSteps = [
        { status: 'created', text: '訂單成立' },
        { status: 'preparing', text: '準備中' },
        { status: 'booked', text: '預約成功' },
        { status: 'received', text: '已收到' }
    ];

    const currentStatusIndex = statusSteps.findIndex(step => step.status === order.status);
    
    const trackingSteps = document.querySelectorAll('.tracking-step');
    trackingSteps.forEach((step, index) => {
        if (index <= currentStatusIndex) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
        step.querySelector('.step-text').textContent = statusSteps[index].text;
    });
}
