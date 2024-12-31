class ShoppingCart {
    constructor() {
        const savedCart = localStorage.getItem('cartItems');
        this.items = savedCart ? JSON.parse(savedCart) : [];
        this.total = 0;
        this.discountedProductName = '咖啡濾掛/包'; // 使用商品名稱來識別折扣商品
        this.discountQuantity = 2; // 購買幾個才有折扣
        this.discountAmount = 10; // 折扣金額
        this.init();
        this.updateCart();
    }

    init() {
        // 初始化購物車
        this.cartIcon = document.getElementById('cartIcon');
        this.cartModal = document.getElementById('cartModal');
        this.closeCart = document.getElementById('closeCart');
        this.cartItems = document.getElementById('cartItems');
        this.cartTotal = document.getElementById('cartTotal');
        this.cartCount = document.querySelector('.cart-count');
        this.checkoutBtn = document.getElementById('checkoutBtn');

        // 綁定事件
        this.cartIcon.addEventListener('click', () => this.openCart());
        this.closeCart.addEventListener('click', () => this.closeCartModal());
        this.checkoutBtn.addEventListener('click', () => this.checkout());
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push(product);
        }
        
        // 保存到 localStorage
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        
        // 添加購物車圖標彈跳動畫
        this.cartIcon.classList.add('bounce');
        setTimeout(() => {
            this.cartIcon.classList.remove('bounce');
        }, 500);

        // 創建飛入動畫元素
        const flyingItem = document.createElement('div');
        flyingItem.className = 'flying-item';
        flyingItem.innerHTML = '<i class="fas fa-coffee"></i>';
        
        // 設置初始位置（按鈕位置）
        const buttonRect = event.target.getBoundingClientRect();
        flyingItem.style.left = `${buttonRect.left}px`;
        flyingItem.style.top = `${buttonRect.top}px`;
        
        document.body.appendChild(flyingItem);

        // 移除飛入動畫元素
        setTimeout(() => {
            flyingItem.remove();
        }, 800);

        this.updateCart();
        this.showNotification('商品已加入購物車！');
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        // 更新 localStorage
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        this.updateCart();
    }

    updateQuantity(id, change) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                // 更新 localStorage
                localStorage.setItem('cartItems', JSON.stringify(this.items));
                this.updateCart();
            }
        }
    }

    calculateItemTotal(item) {
        let itemTotal = item.price * item.quantity;
        
        // 檢查是否是折扣商品且數量符合折扣條件
        if (item.name === this.discountedProductName && item.quantity >= this.discountQuantity) {
            // 計算有幾組折扣
            const discountGroups = Math.floor(item.quantity / this.discountQuantity);
            itemTotal -= discountGroups * this.discountAmount;
        }
        
        return itemTotal;
    }

    updateCart() {
        if (!this.cartItems || !this.cartCount) return;

        this.cartItems.innerHTML = '';
        this.total = 0;
        let totalItems = 0;

        this.items.forEach(item => {
            totalItems += item.quantity;
            const itemTotal = this.calculateItemTotal(item);
            this.total += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">NT$ ${item.price}</p>
                    ${item.name === this.discountedProductName ? 
                        `<p class="discount-info">買${this.discountQuantity}個折${this.discountAmount}元</p>` : ''}
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="window.cart.updateQuantity('${item._id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="window.cart.updateQuantity('${item._id}', 1)">+</button>
                    </div>
                    ${item.name === this.discountedProductName && item.quantity >= this.discountQuantity ? 
                        `<p class="discount-applied">已折扣 NT$ ${Math.floor(item.quantity / this.discountQuantity) * this.discountAmount}</p>` : ''}
                </div>
                <button class="remove-item" onclick="window.cart.removeItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            this.cartItems.appendChild(itemElement);
        });

        if (this.cartTotal) {
            this.cartTotal.textContent = this.total;
        }
        this.cartCount.textContent = totalItems;
    }

    openCart() {
        this.cartModal.classList.add('active');
    }

    closeCartModal() {
        this.cartModal.classList.remove('active');
    }

    checkout() {
        if (this.items.length === 0) {
            this.showNotification('購物車是空的！');
            return;
        }
        // 不需要重複存儲，因為已經在 localStorage 中了
        window.location.href = 'checkout.html';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
}

// 確保全局只有一個購物車實例
if (!window.cart) {
    window.cart = new ShoppingCart();
}

// 漢堡選單功能
const hamburger = document.getElementById('hamburger');
const navContainer = document.querySelector('.nav-container');
const body = document.body;

// 漢堡選單點擊事件
hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hamburger.classList.toggle('active');
    navContainer.classList.toggle('active');
    body.classList.toggle('menu-open');
    console.log('Menu toggled:', navContainer.classList.contains('active'));
});

// 點擊選單項目時關閉選單
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navContainer.classList.remove('active');
        body.classList.remove('menu-open');
    });
});

// 點擊頁面其他地方時關閉選單
document.addEventListener('click', (e) => {
    if (navContainer.classList.contains('active') && 
        !navContainer.contains(e.target) && 
        !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navContainer.classList.remove('active');
        body.classList.remove('menu-open');
    }
});

// 防止選單內部點擊事件冒泡
navContainer.addEventListener('click', (e) => {
    e.stopPropagation();
}); 

// 綁定所有加入購物車按鈕
document.querySelectorAll('.coffee-card button').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.coffee-card');
        const product = {
            id: Date.now(), // 臨時ID
            name: card.querySelector('h3').textContent,
            price: parseInt(card.querySelector('.price').textContent.replace('NT$ ', '')),
            imageUrl: card.querySelector('img').src,
            quantity: 1
        };
        window.cart.addItem(product);
    });
});
