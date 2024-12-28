require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Product = require('./models/Product');

// 初始化產品數據
const initializeProducts = async () => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            const products = [
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
            await Product.insertMany(products);
            console.log('初始化產品數據完成');
        }
    } catch (error) {
        console.error('初始化產品數據失敗:', error);
    }
};

// 在路由之前先連接數據庫
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await initializeProducts();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// 在數據庫連接之後再引入路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const app = express();

// 設置 CORS - 必須在所有路由之前
app.use((req, res, next) => {
    const allowedOrigins = ['https://coffee-github-io.onrender.com', 'http://localhost:5500'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// 調試中間件 - 記錄所有請求
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Authorization:', req.headers.authorization);
    next();
});

// 解析 JSON
app.use(express.json());

// Session 配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// 設置靜態文件服務
app.use(express.static(__dirname));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// 所有其他路由都返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit your website at http://localhost:${PORT}`);
});
