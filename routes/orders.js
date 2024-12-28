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
    try {
        const { items, shippingInfo, paymentMethod } = req.body;

        // 驗證必要資料
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: '訂單必須包含商品' });
        }

        // 計算訂單總金額
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ error: `找不到商品: ${item.productId}` });
            }

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });

            totalAmount += product.price * item.quantity;
        }

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
        
        // 返回完整的訂單信息
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product')
            .populate('user', 'name email');

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error('創建訂單失敗:', error);
        res.status(500).json({ error: '創建訂單失敗' });
    }
});

// 獲取特定訂單
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: '找不到訂單' });
        }

        res.json(order);
    } catch (error) {
        console.error('獲取訂單詳情失敗:', error);
        res.status(500).json({ error: '獲取訂單詳情失敗' });
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
