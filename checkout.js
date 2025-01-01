document.addEventListener('DOMContentLoaded', function() {
    const steps = document.querySelectorAll('.step');
    let currentStep = 1;
    let customerData = {};

    // 初始化訂單資料
    function initializeOrderData() {
        try {
            // 從 localStorage 獲取購物車資料
            const cart = JSON.parse(localStorage.getItem('cartItems')) || [];
            let subtotal = 0;
            const shipping = 0; // 固定運費
            let discount = 0;

            // 計算小計
            cart.forEach(item => {
                subtotal += item.price * item.quantity;

                // 檢查是否為特定商品並應用折扣
                if (item.name === '咖啡濾掛/包' && item.quantity >= 2) {
                    const itemDiscount = 10 * Math.floor(item.quantity / 2);
                    discount += itemDiscount;
                }
            });

            // 計算總計
            const total = subtotal + shipping - discount;

            // 更新側邊欄訂單摘要
            const sidebarOrderItems = document.getElementById('sidebarOrderItems');
            if (sidebarOrderItems) {
                sidebarOrderItems.innerHTML = cart.map(item => `
                    <div class="order-item">
                        <span>${item.name}</span>
                        <span>NT$ ${item.price} × ${item.quantity}</span>
                    </div>
                `).join('');

                // 更新小計、折扣和總計
                document.getElementById('sidebarSubtotal').textContent = `NT$ ${subtotal}`;
                document.getElementById('sidebarTotal').textContent = `NT$ ${total}`;
                document.getElementById('sidebarDiscount').textContent = `NT$ ${discount}`;
            }

            // 更新確認頁面的訂單摘要
            const confirmationArea = document.querySelector('.order-confirmation');
            if (confirmationArea) {
                confirmationArea.innerHTML = `
                    <div class="order-summary">
                        <h3>訂單摘要</h3>
                        <div class="order-items">
                            ${cart.map(item => `
                                <div class="order-item">
                                    <span>${item.name}</span>
                                    <span>NT$ ${item.price} × ${item.quantity}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-total">
                            <div class="subtotal">
                                <span>小計</span>
                                <span>NT$ ${subtotal}</span>
                            </div>
                            <div class="discount">
                                <span>折扣</span>
                                <span>NT$ ${discount}</span>
                            </div>
                            <div class="shipping">
                                <span>運費</span>
                                <span>NT$ ${shipping}</span>
                            </div>
                            <div class="total">
                                <span>總計</span>
                                <span>NT$ ${total}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

        } catch (error) {
            console.error('初始化訂單資料時發生錯誤:', error);
        }
    }

    // 初始化頁面
    initializeOrderData();

    // 下一步按鈕事件
    document.querySelectorAll('.next-step-btn').forEach(button => {
        button.addEventListener('click', () => {
            console.log('下一步按鈕被點擊');
            if (validateCurrentStep()) {
                goToStep(currentStep + 1);
            }
        });
    });

    // 上一步按鈕事件
    document.querySelectorAll('.prev-step-btn').forEach(button => {
        button.addEventListener('click', () => {
            goToStep(currentStep - 1);
        });
    });

    // 確認訂購按鈕事件
    const submitOrderBtn = document.querySelector('.submit-order');
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', submitOrder);
    }

    function goToStep(step) {
        console.log('切換到步驟:', step);
        
        // 驗證步驟範圍
        if (step < 1 || step > 3) {
            console.log('無效的步驟:', step);
            return;
        }

        // 隱藏當前步驟的內容
        const currentContent = document.querySelector(`#step${currentStep}`);
        if (currentContent) {
            currentContent.style.display = 'none';
        }

        // 更新步驟指示器
        steps.forEach((s, index) => {
            if (index + 1 < step) {
                s.classList.add('completed');
                s.classList.remove('active');
            } else if (index + 1 === step) {
                s.classList.add('active');
                s.classList.remove('completed');
            } else {
                s.classList.remove('completed', 'active');
            }
        });

        // 顯示新步驟的內容
        const nextContent = document.querySelector(`#step${step}`);
        if (nextContent) {
            nextContent.style.display = 'block';
            currentStep = step;
            
            // 如果是第三步，更新確認資訊
            if (step === 3) {
                updateConfirmationInfo();
            }
        }
    }

    function validateCurrentStep() {
        console.log('驗證當前步驟:', currentStep);
        
        if (currentStep === 1) {
            // 驗證個人資料
            const required = ['name', 'phone', 'email'];
            let valid = true;
            
            required.forEach(field => {
                const input = document.getElementById(field);
                if (!input || !input.value.trim()) {
                    valid = false;
                    console.log(`欄位 ${field} 驗證失敗`);
                    if (input) {
                        input.classList.add('error');
                    }
                } else {
                    if (input) {
                        input.classList.remove('error');
                    }
                }
            });

            if (valid) {
                customerData = {
                    name: document.getElementById('name').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value
                };
                console.log('個人資料驗證通過:', customerData);
            }
            return valid;
        }
        
        if (currentStep === 2) {
            // 驗證付款方式
            const paymentMethod = document.querySelector('input[name="payment"]:checked');
            const valid = !!paymentMethod;
            if (!valid) {
                console.log('請選擇付款方式');
                alert('請選擇付款方式');
            }
            return valid;
        }

        return true;
    }

    function updateConfirmationInfo() {
        try {
            const paymentMethod = document.querySelector('input[name="payment"]:checked');
            let paymentText = '';
            
            if (paymentMethod) {
                switch(paymentMethod.value) {
                    case 'cash-taipei':
                        paymentText = '現金-台北車站';
                        break;
                    case 'cash-sanchong':
                        paymentText = '現金-三重商工';
                        break;
                    default:
                        paymentText = '未選擇';
                }
            }

            // 更新確認資訊
            const confirmationArea = document.querySelector('.order-confirmation');
            if (confirmationArea) {
                const confirmationInfo = document.createElement('div');
                confirmationInfo.className = 'confirmation-info';
                confirmationInfo.innerHTML = `
                    <h3>收件資訊</h3>
                    <p><strong>姓名：</strong>${customerData.name}</p>
                    <p><strong>電話：</strong>${customerData.phone}</p>
                    <p><strong>信箱：</strong>${customerData.email}</p>
                    <p><strong>付款方式：</strong>${paymentText}</p>
                `;
                
                // 清空確認區域並添加新資訊
                confirmationArea.innerHTML = '';
                confirmationArea.appendChild(confirmationInfo);
                
                // 重新初始化訂單資料以更新訂單摘要
                initializeOrderData();
            }
        } catch (error) {
            console.error('更新確認資訊時發生錯誤:', error);
        }
    }

    async function submitOrder() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('請先登入');
            }

            const cart = JSON.parse(localStorage.getItem('cartItems')) || [];
            if (!cart.length) {
                throw new Error('購物車是空的');
            }

            // 檢查購物車數據
            console.log('原始購物車數據:', cart);
            
            // 構建訂單數據
            const orderData = {
                items: cart.map(item => {
                    console.log('處理商品:', item);
                    return {
                        productId: item.id || item._id, // 不轉換為字符串
                        quantity: Number(item.quantity),
                        price: Number(item.price)
                    };
                }),
                shippingInfo: {
                    name: customerData.name,
                    phone: customerData.phone,
                    email: customerData.email
                },
                paymentMethod: document.querySelector('input[name="payment"]:checked').value,
                totalAmount: cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
            };

            console.log('提交訂單資料:', JSON.stringify(orderData, null, 2));

            const apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3002' 
                : 'https://coffee-github-io.onrender.com';

            console.log('使用的 API URL:', apiUrl);
            console.log('Authorization Token:', `Bearer ${token.substring(0, 10)}...`);

            try {
                const response = await fetch(`${apiUrl}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify(orderData)
                });

                console.log('Response status:', response.status);
                const responseText = await response.text();
                console.log('Response text:', responseText);

                if (!response.ok) {
                    try {
                        const errorData = JSON.parse(responseText);
                        throw new Error(errorData.message || errorData.error || '創建訂單失敗');
                    } catch (e) {
                        throw new Error(`創建訂單失敗: ${responseText}`);
                    }
                }

                const responseData = JSON.parse(responseText);
                
                // 清空購物車
                localStorage.removeItem('cartItems');
                
                // 更新購物車數量顯示
                const cartCount = document.querySelector('.cart-count');
                if (cartCount) {
                    cartCount.textContent = '0';
                }
                
                // 儲存訂單資訊到 localStorage 供訂單追蹤頁面使用
                const now = new Date();
                const orderNumber = `CF${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${responseData._id.slice(-6)}`;
                const lastOrder = {
                    orderId: responseData._id,  // 添加訂單 ID
                    orderNumber: orderNumber,
                    total: responseData.totalAmount,
                    orderDate: new Date().toISOString(),
                    items: cart,
                    customerData: {
                        name: customerData.name,
                        phone: customerData.phone,
                        email: customerData.email,
                        payment: document.querySelector('input[name="payment"]:checked').value
                    }
                };
                localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
                
                // 跳轉到訂單追蹤頁面，並帶上訂單 ID
                window.location.href = `order-tracking.html?orderId=${responseData._id}`;
            } catch (error) {
                console.error('訂單提交失敗:', error);
                alert(error.message || '訂單提交失敗，請稍後再試');
            }
        } catch (error) {
            console.error('訂單提交失敗:', error);
            alert(error.message || '訂單提交失敗，請稍後再試');
        }
    }
});
