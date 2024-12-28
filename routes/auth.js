const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
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
        const user = new User({
            email,
            password: await bcrypt.hash(password, 10),
            name,
            address,
            phone
        });
        await user.save();

        // 生成 JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                address: user.address,
                phone: user.phone
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: '註冊失敗，請稍後再試' });
    }
});

// Login
router.post('/login', async (req, res) => {
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
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: '無效的登入憑證' });
        }

        // 生成 JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 設置 session
        req.session.userId = user._id;
        req.session.isAdmin = user.role === 'admin';

        console.log('Login successful:', { userId: user._id, token: token.substring(0, 10) + '...' });
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                address: user.address,
                phone: user.phone,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登入失敗，請稍後再試' });
    }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: '未提供認證令牌' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: '用戶不存在' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: '請重新登入' });
    }
};

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        req.session.destroy();
        res.json({ message: '登出成功' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: '登出失敗，請稍後再試' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            address: req.user.address,
            phone: req.user.phone,
            role: req.user.role
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: '獲取個人資料失敗' });
    }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'address', 'phone'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: '無效的更新欄位' });
    }

    try {
        const user = req.user;

        // 如果要更新密碼，需要加密
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        updates.forEach(update => user[update] = req.body[update]);
        await user.save();

        res.json({
            _id: user._id,
            email: user.email,
            name: user.name,
            address: user.address,
            phone: user.phone,
            role: user.role
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: '更新個人資料失敗' });
    }
});

module.exports = router;
