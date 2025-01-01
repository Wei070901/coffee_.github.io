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
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI 環境變量未設置');
        }
        console.log('正在連接到 MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB 連接成功');
    } catch (err) {
        console.error('MongoDB 連接錯誤:', err);
        process.exit(1);
    }
};

connectDB().then(async () => {
    console.log('數據庫連接成功，正在初始化產品數據...');
    await initializeProducts();
    console.log('產品數據初始化完成');
}).catch(err => {
    console.error('啟動失敗:', err);
    process.exit(1);
});

// 在數據庫連接之後再引入路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const app = express();
const port = process.env.PORT || 3000;

// 基本的 CORS 設置
const allowedOrigins = [
    'https://coffee.up.railway.app'
];

if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
}

const corsOptions = {
    origin: function (origin, callback) {
        // 在開發環境中允許沒有 origin 的請求
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
};

app.use(cors(corsOptions));

// 調試中間件 - 記錄所有請求
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
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

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('Request body:', req.body);
    console.error('Request headers:', req.headers);
    
    res.status(500).json({ 
        error: '伺服器錯誤',
        message: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 所有其他路由都返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
});
