// 從API獲取商品數據
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        console.log('Fetched products:', products);
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// 渲染商品到頁面
async function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.error('Product grid element not found');
        return;
    }

    const products = await fetchProducts();
    
    productGrid.innerHTML = products.map(product => {
        return `
            <div class="coffee-card" style="cursor: default;">
                <img src="${product.imageUrl}" alt="${product.name}" style="cursor: default;">
                <h3 style="cursor: default;">${product.name}</h3>
                <p style="cursor: default;">${product.description}</p>
                <p class="price">NT$ ${product.price}</p>
                <button 
                    data-id="${product._id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-image="${product.imageUrl}"
                    class="add-to-cart-btn">
                    加入購物車
                </button>
            </div>
        `;
    }).join('');

    // 移除所有商品卡片的點擊事件
    productGrid.querySelectorAll('.coffee-card').forEach(card => {
        card.onclick = null;
        card.style.cursor = 'default';
        
        // 移除所有子元素的點擊事件
        card.querySelectorAll('*').forEach(element => {
            if (element.tagName !== 'BUTTON') {
                element.onclick = null;
                element.style.cursor = 'default';
            }
        });
    });

    // 為所有加入購物車按鈕添加事件監聽器
    productGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productData = {
                id: this.dataset.id,
                name: this.dataset.name,
                price: parseInt(this.dataset.price),
                imageUrl: this.dataset.image,
                quantity: 1
            };
            if (window.cart) {
                window.cart.addItem(productData);
            } else {
                console.error('購物車系統未初始化');
            }
        });
    });
}

// 當頁面加載完成時渲染商品
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    renderProducts();
});
