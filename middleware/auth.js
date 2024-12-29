const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 通用認證中間件
const auth = async (req, res, next) => {
    try {
        // 首先檢查 session
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                return next();
            }
        }

        // 如果 session 中沒有用戶信息，則檢查 JWT
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('未提供有效的認證信息');
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('找不到用戶');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('認證失敗:', error);
        res.status(401).json({ error: '請先登入' });
    }
};

// 管理員認證中間件
const requireAdmin = async (req, res, next) => {
    console.log('Admin middleware - Session:', req.session);
    console.log('Admin middleware - Headers:', req.headers);
    
    try {
        // 檢查 session 中的管理員狀態
        if (req.session && req.session.isAdmin === true) {
            console.log('Admin authenticated via session');
            return next();
        }

        // 檢查 JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.isAdmin) {
                    console.log('Admin authenticated via JWT');
                    return next();
                }
            } catch (error) {
                console.error('JWT verification failed:', error);
            }
        }

        // 如果沒有管理員權限
        console.log('Admin authentication failed');
        res.status(401).json({ error: '需要管理員權限' });
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
};

// 新的認證中間件
const newAuth = async (req, res, next) => {
    try {
        // 獲取請求頭中的認證令牌
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            throw new Error('No token provided');
        }

        // 驗證令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded._id) {
            throw new Error('Invalid token format');
        }

        // 查找用戶
        const user = await User.findOne({
            _id: decoded._id,
            'tokens.token': token
        });

        if (!user) {
            throw new Error('User not found or token invalid');
        }

        // 檢查令牌是否過期
        const tokenData = jwt.decode(token);
        if (tokenData.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
        }

        // 將用戶和令牌添加到請求對象
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(401).json({
            error: 'Please authenticate',
            details: error.message
        });
    }
};

module.exports = {
    auth,
    requireAdmin,
    newAuth
};
