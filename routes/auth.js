const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async function(req, res) {
    try {
        console.log('Registration request received:', req.body);
        const { email, password, name, address, phone } = req.body;

        // 基本驗證
        if (!email || !password || !name) {
            return res.status(400).json({ error: '請填寫所有必要欄位' });
        }

        // 驗證電子郵件格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '請輸入有效的電子郵件地址' });
        }

        // 驗證密碼長度
        if (password.length < 6) {
            return res.status(400).json({ error: '密碼長度必須至少為 6 個字符' });
        }

        // 檢查是否已存在相同的電子郵件
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: '此電子郵件已被註冊' });
        }

        // 創建新用戶
        const user = new User({ email, password, name, address, phone });
        await user.save();

        // 生成認證令牌
        const token = await user.generateAuthToken();

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: '註冊失敗，請稍後再試' });
    }
});

// Login
router.post('/login', async function(req, res) {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;

        // 驗證輸入
        if (!email || !password) {
            return res.status(400).json({ error: '請提供電子郵件和密碼' });
        }

        // 查找用戶
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: '無效的登入憑證' });
        }

        // 驗證密碼
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: '無效的登入憑證' });
        }

        // 生成新的認證令牌
        const token = await user.generateAuthToken();

        // 設置 session
        req.session.userId = user._id;
        req.session.isAdmin = user.role === 'admin';

        console.log('Login successful:', { userId: user._id, token: token.substring(0, 10) + '...' });
        res.json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登入失敗，請稍後再試' });
    }
});

// Logout
router.post('/logout', auth, async function(req, res) {
    try {
        // 移除當前令牌
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();

        // 清除 session
        req.session.destroy();

        res.json({ message: '登出成功' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: '登出失敗，請稍後再試' });
    }
});

// Logout from all devices
router.post('/logout-all', auth, async function(req, res) {
    try {
        // 清除所有令牌
        req.user.tokens = [];
        await req.user.save();

        // 清除 session
        req.session.destroy();

        res.json({ message: '已從所有裝置登出' });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ error: '登出失敗，請稍後再試' });
    }
});

// Get user profile
router.get('/profile', auth, async function(req, res) {
    try {
        res.json(req.user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: '獲取個人資料失敗' });
    }
});

// Update user profile
router.patch('/profile', auth, async function(req, res) {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'address', 'phone'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: '無效的更新欄位' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: '更新個人資料失敗' });
    }
});

module.exports = router;
