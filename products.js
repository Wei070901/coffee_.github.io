document.addEventListener('DOMContentLoaded', function() {
    class ProductSystem {
        constructor() {
            this.products = [];
            this.init();
        }

        async init() {
            await this.fetchProducts();
            this.setupEventListeners();
        }

        async fetchProducts() {
            try {
                const apiUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:3000/api/products'
                    : 'https://coffee.up.railway.app/api/products';
                const response = await fetch(apiUrl);
                const data = await response.json();
                this.products = data;
                this.renderProducts(this.products);
            } catch (error) {
                console.error('獲取商品失敗:', error);
                // 如果 API 失敗，使用預設數據
                this.products = [
                    {
                        name: '經典黑咖啡',
                        description: '使用優質阿拉比卡豆烘焙，口感醇厚',
                        price: 120,
                        imageUrl: 'https://via.placeholder.com/300',
                        category: '咖啡',
                        stock: 100
                    },
                    {
                        name: '拿鐵咖啡',
                        description: '完美比例的濃縮咖啡與蒸煮牛奶',
                        price: 150,
                        imageUrl: 'https://via.placeholder.com/300',
                        category: '咖啡',
                        stock: 100
                    },
                    {
                        name: '卡布奇諾',
                        description: '濃縮咖啡、蒸煮牛奶和奶泡的經典組合',
                        price: 150,
                        imageUrl: 'https://via.placeholder.com/300',
                        category: '咖啡',
                        stock: 100
                    }
                ];
                this.renderProducts(this.products);
            }
        }

        renderProducts(productsToRender) {
            const productsGrid = document.querySelector('.products-grid');
            productsGrid.innerHTML = '';

            productsToRender.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'coffee-card';
                productCard.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') {
                        window.location.href = `product-detail.html?id=${product._id}`;
                    }
                });

                productCard.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price">NT$ ${product.price}</p>
                    <button onclick="cart.addItem(${JSON.stringify({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl
                    }).replace(/"/g, '&quot;')})">加入購物車</button>
                `;
                productsGrid.appendChild(productCard);
            });
        }

        setupEventListeners() {
            const sortFilter = document.getElementById('sortFilter');

            sortFilter?.addEventListener('change', (e) => {
                let sortedProducts = [...this.products];
                switch(e.target.value) {
                    case 'price-low':
                        sortedProducts.sort((a, b) => a.price - b.price);
                        break;
                    case 'price-high':
                        sortedProducts.sort((a, b) => b.price - a.price);
                        break;
                    case 'name':
                        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                }
                this.renderProducts(sortedProducts);
            });
        }
    }

    class ShoppingCart {
        constructor() {
            const savedCart = localStorage.getItem('cartItems');
            this.items = savedCart ? JSON.parse(savedCart) : [];
            this.total = 0;
            this.init();
            this.updateCart();
        }

        init() {
            this.cartIcon = document.getElementById('cartIcon');
            this.cartModal = document.getElementById('cartModal');
            this.closeCart = document.getElementById('closeCart');
            this.cartItems = document.getElementById('cartItems');
            this.cartTotal = document.getElementById('cartTotal');
            this.cartCount = document.querySelector('.cart-count');
            this.checkoutBtn = document.getElementById('checkoutBtn');

            this.cartIcon.addEventListener('click', () => this.openCart());
            this.closeCart.addEventListener('click', () => this.closeCartModal());
            this.checkoutBtn.addEventListener('click', () => this.checkout());
        }

        addItem(product) {
            const existingItem = this.items.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.items.push({ 
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    quantity: 1 
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(this.items));

            this.cartIcon.classList.add('bounce');
            setTimeout(() => {
                this.cartIcon.classList.remove('bounce');
            }, 500);

            const flyingItem = document.createElement('div');
            flyingItem.className = 'flying-item';
            flyingItem.innerHTML = '<i class="fas fa-coffee"></i>';

            const buttonRect = event.target.getBoundingClientRect();
            flyingItem.style.left = `${buttonRect.left}px`;
            flyingItem.style.top = `${buttonRect.top}px`;

            document.body.appendChild(flyingItem);

            setTimeout(() => {
                flyingItem.remove();
            }, 800);

            this.updateCart();
            this.showNotification('商品已加入購物車！');
        }

        removeItem(id) {
            this.items = this.items.filter(item => item.id !== id);
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
                    localStorage.setItem('cartItems', JSON.stringify(this.items));
                    this.updateCart();
                }
            }
        }

        updateCart() {
            this.cartItems.innerHTML = '';
            this.total = 0;

            this.items.forEach(item => {
                this.total += item.price * item.quantity;
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">NT$ ${item.price}</p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="cart.removeItem('${item.id}')">&times;</button>
                `;
                this.cartItems.appendChild(itemElement);
            });

            this.cartTotal.textContent = `NT$ ${this.total}`;
            this.cartCount.textContent = this.items.reduce((sum, item) => sum + item.quantity, 0);
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
            localStorage.setItem('cartItems', JSON.stringify(this.items));
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

    class ProductManager {
        constructor() {
            this.products = [];
            this.init();
        }

        async init() {
            await this.loadProducts();
            this.setupEventListeners();
        }

        async loadProducts() {
            try {
                const products = await api.products.getAll();
                this.products = products;
                this.displayProducts();
            } catch (error) {
                console.error('Error loading products:', error);
                // 顯示錯誤信息給用戶
                this.showError('無法載入產品資料');
            }
        }

        async loadProductDetails(productId) {
            try {
                const product = await api.products.getOne(productId);
                this.displayProductDetails(product);
            } catch (error) {
                console.error('Error loading product details:', error);
                this.showError('無法載入產品詳情');
            }
        }

        displayProducts() {
            const productsContainer = document.querySelector('.products-container');
            if (!productsContainer) return;

            productsContainer.innerHTML = this.products.map(product => `
                <div class="product-card" data-id="${product._id}">
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">NT$ ${product.price}</p>
                    <button class="add-to-cart-btn" data-id="${product._id}">加入購物車</button>
                </div>
            `).join('');
        }

        displayProductDetails(product) {
            const detailsContainer = document.querySelector('.product-details');
            if (!detailsContainer) return;

            detailsContainer.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="price">NT$ ${product.price}</p>
                    <p class="description">${product.description}</p>
                    <div class="quantity-selector">
                        <button class="quantity-btn minus">-</button>
                        <input type="number" value="1" min="1" max="${product.stock}">
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <button class="add-to-cart-btn" data-id="${product._id}">加入購物車</button>
                </div>
            `;
        }

        setupEventListeners() {
            // 產品卡片點擊事件
            document.addEventListener('click', async (e) => {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.dataset.id;
                    window.location.href = `product-detail.html?id=${productId}`;
                }
            });

            // 加入購物車按鈕點擊事件
            document.addEventListener('click', async (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    const productId = e.target.dataset.id;
                    const quantity = document.querySelector('.quantity-selector input')?.value || 1;
                    this.addToCart(productId, parseInt(quantity));
                }
            });

            // 數量選擇器事件
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('quantity-btn')) {
                    const input = e.target.parentElement.querySelector('input');
                    const currentValue = parseInt(input.value);
                    const max = parseInt(input.max);

                    if (e.target.classList.contains('plus') && currentValue < max) {
                        input.value = currentValue + 1;
                    } else if (e.target.classList.contains('minus') && currentValue > 1) {
                        input.value = currentValue - 1;
                    }
                }
            });
        }

        addToCart(productId, quantity) {
            // 檢查是否登入
            const token = localStorage.getItem('token');
            if (!token) {
                alert('請先登入');
                window.location.href = 'member.html';
                return;
            }

            // 將商品加入購物車
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.productId === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                const product = this.products.find(p => p._id === productId);
                cart.push({
                    productId,
                    name: product.name,
                    price: product.price,
                    quantity,
                    imageUrl: product.imageUrl
                });
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            this.showSuccess('商品已加入購物車');
        }

        showError(message) {
            // 實現錯誤提示UI
            alert(message);
        }

        showSuccess(message) {
            // 實現成功提示UI
            alert(message);
        }
    }

    // 初始化
    const productSystem = new ProductSystem();
    if (!window.cart) {
        window.cart = new ShoppingCart();
    }

    // 漢堡選單功能
    const hamburger = document.getElementById('hamburger');
    const navContainer = document.querySelector('.nav-container');
    const body = document.body;

    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hamburger.classList.toggle('active');
        navContainer.classList.toggle('active');
        body.classList.toggle('menu-open');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navContainer.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });

    document.addEventListener('click', (e) => {
        if (navContainer.classList.contains('active') && 
            !navContainer.contains(e.target) && 
            !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navContainer.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });

    navContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    }); 
});