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

        // 如果沒有管理員權限
        console.log('Admin authentication failed');
        throw new Error('需要管理員權限');
    } catch (error) {
        console.error('管理員認證失敗:', error);
        res.status(403).json({ error: '需要管理員權限' });
    }
};

module.exports = {
    auth,
    requireAdmin
};
