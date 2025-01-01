const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: '需要管理員權限' });
  }
};

// 獲取用戶的訂單
router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'items.product',
                select: 'name price imageUrl'
            });
        res.json(orders);
    } catch (error) {
        console.error('獲取訂單失敗:', error);
        res.status(500).json({ error: '獲取訂單失敗' });
    }
});

// 創建新訂單
router.post('/', authMiddleware, async (req, res) => {
    console.log('收到訂單請求 - 開始處理');
    console.log('請求頭:', req.headers);
    console.log('用戶信息:', req.user);
    
    try {
        const { items, shippingInfo, paymentMethod } = req.body;
        console.log('訂單數據:', { items, shippingInfo, paymentMethod });

        // 驗證必要資料
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.log('訂單驗證失敗: 沒有商品');
            return res.status(400).json({ error: '訂單必須包含商品' });
        }

        if (!shippingInfo || !shippingInfo.name || !shippingInfo.phone || !shippingInfo.email) {
            console.log('訂單驗證失敗: 收件資訊不完整');
            return res.status(400).json({ error: '請提供完整的收件資訊' });
        }

        if (!paymentMethod) {
            console.log('訂單驗證失敗: 未選擇付款方式');
            return res.status(400).json({ error: '請選擇付款方式' });
        }

        // 計算訂單總金額
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            try {
                console.log('處理商品:', item);
                
                if (!item.productId || !item.quantity || !item.price) {
                    throw new Error(`商品資料不完整: ${JSON.stringify(item)}`);
                }

                const product = await Product.findById(item.productId);
                if (!product) {
                    console.log('找不到商品:', item.productId);
                    return res.status(400).json({ error: `找不到商品: ${item.productId}` });
                }

                console.log('找到商品:', product);

                // 驗證價格
                if (product.price !== item.price) {
                    console.log('價格不符:', { 商品價格: product.price, 訂單價格: item.price });
                    return res.status(400).json({ error: `商品 ${product.name} 價格不符` });
                }

                orderItems.push({
                    product: product._id,
                    quantity: parseInt(item.quantity),
                    price: product.price
                });

                totalAmount += product.price * parseInt(item.quantity);
            } catch (error) {
                console.error('處理商品時出錯:', error);
                return res.status(400).json({ error: `處理商品時出錯: ${error.message}` });
            }
        }

        console.log('準備創建訂單:', { orderItems, totalAmount });

        // 創建訂單
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            shippingInfo,
            paymentMethod,
            status: 'pending'
        });

        await order.save();
        console.log('訂單創建成功:', order._id);
        
        // 返回訂單資訊
        res.status(201).json({
            _id: order._id,
            orderNumber: `CF${Date.now()}-${order._id.toString().slice(-6)}`,
            totalAmount: order.totalAmount,
            status: order.status
        });
    } catch (error) {
        console.error('創建訂單失敗:', error);
        res.status(500).json({ 
            error: '創建訂單失敗', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 獲取單個訂單
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: '找不到訂單' });
        }

        // 設置 CORS 頭
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.json(order);
    } catch (error) {
        console.error('獲取訂單失敗:', error);
        res.status(500).json({ error: '獲取訂單失敗' });
    }
});

// 取消訂單
router.post('/:orderId/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ error: '找不到訂單' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ error: '只能取消待處理的訂單' });
        }

        order.status = 'cancelled';
        await order.save();

        res.json(order);
    } catch (error) {
        console.error('取消訂單失敗:', error);
        res.status(500).json({ error: '取消訂單失敗' });
    }
});

// Get all orders (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('items.product', 'name price imageUrl')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '獲取訂單失敗：' + error.message });
  }
});

// Get single order
router.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ error: '找不到訂單' });
    }

    res.json(order);
  } catch (error) {
    console.error('獲取訂單失敗:', error);
    res.status(500).json({ error: '獲取訂單失敗' });
  }
});

// Update order status (admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // 驗證狀態值
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '無效的訂單狀態' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email')
     .populate('items.product', 'name price imageUrl');
    
    if (!order) {
      return res.status(404).json({ error: '找不到訂單' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete order (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: '找不到訂單' });
    }
    
    res.json({ message: '訂單已刪除' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
