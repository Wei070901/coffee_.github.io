const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const { requireAdmin } = require('../middleware/auth');

// 管理員登入
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 在實際應用中，這些憑證應該存儲在資料庫中並加密
        if (username === 'coffee' && password === 'coffeecoffee') {
            // 生成 JWT token
            const token = jwt.sign(
                { isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            req.session.isAdmin = true;
            await req.session.save();
            console.log('Admin login successful. Session:', req.session);
            
            res.json({
                success: true,
                token: token,
                message: '登入成功'
            });
        } else {
            res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登入失敗'
        });
    }
});

// 檢查管理員登入狀態
router.get('/check-auth', (req, res) => {
    console.log('Checking auth. Session:', req.session);
    res.json({ isLoggedIn: req.session.isAdmin === true });
});

// 管理員登出
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: '登出失敗' });
        }
        res.json({ success: true });
    });
});

// 獲取所有訂單
router.get('/orders', requireAdmin, async (req, res) => {
    try {
        console.log('Fetching orders. Session:', req.session);
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name price')
            .select('orderNumber createdAt items totalAmount status shippingInfo');
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: '獲取訂單失敗', error: error.message });
    }
});

// 更新訂單狀態
router.put('/orders/:orderId/status', requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: '找不到訂單' });
        }

        order.status = status;
        await order.save();

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: '更新訂單狀態失敗', error: error.message });
    }
});

// 獲取訂單詳情
router.get('/orders/:orderId', requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name price');
        
        if (!order) {
            return res.status(404).json({ message: '找不到訂單' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: '獲取訂單詳情失敗', error: error.message });
    }
});

module.exports = router;
