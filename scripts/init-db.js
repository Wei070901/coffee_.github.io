require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

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

async function initDB() {
    try {
        // 連接到 MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 清空現有商品
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // 插入測試數據
        await Product.insertMany(products);
        console.log('Added test products');

        console.log('Database initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
