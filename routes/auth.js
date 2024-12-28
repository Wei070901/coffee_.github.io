const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      throw new Error('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Please authenticate', details: error.message });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const { email, password, name, address, phone } = req.body;
    
    // 基本驗證
    if (!email || !password || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ error: '請填寫所有必要欄位' });
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ error: '請輸入有效的電子郵件地址' });
    }

    // 驗證密碼長度
    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({ error: '密碼長度必須至少為 6 個字符' });
    }
    
    // 檢查是否已存在相同的電子郵件
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: '此電子郵件已被註冊' });
    }
    
    // 創建新用戶
    const user = new User({ email, password, name, address, phone });
    console.log('Creating new user:', { email, name, address, phone });
    
    await user.save();
    console.log('User saved successfully');
    
    // 生成 JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    
    // 設置 session
    req.session.userId = user._id;
    req.session.isAdmin = user.role === 'admin';
    
    // 返回用戶信息和 token
    res.status(201).json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone
      },
      token 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: '註冊過程中發生錯誤',
      details: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    // 驗證請求數據
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: '請提供電子郵件和密碼' });
    }

    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: '無效的登入憑證' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(401).json({ error: '無效的登入憑證' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    console.log('Token generated');

    // 設置 session
    req.session.userId = user._id;
    req.session.isAdmin = user.role === 'admin';
    
    console.log('Sending response');
    res.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗，請稍後再試' });
  }
});

// Check login status
router.get('/check-status', auth, async (req, res) => {
  try {
    console.log('Checking status for user:', req.user._id);
    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        address: req.user.address,
        phone: req.user.phone
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      address: req.user.address,
      phone: req.user.phone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token and get user info
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({ 
      valid: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        address: req.user.address,
        phone: req.user.phone
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(401).json({ valid: false, error: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'address', 'phone'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      address: req.user.address,
      phone: req.user.phone
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
