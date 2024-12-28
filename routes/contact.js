const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// 提交聯絡表單
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // 基本驗證
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: '請填寫所有必要欄位' });
        }

        // 驗證 email 格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '請輸入有效的電子郵件地址' });
        }

        // 創建新的聯絡紀錄
        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });

        await contact.save();

        // 返回成功訊息
        res.status(201).json({ 
            message: '感謝您的來信，我們會盡快回覆！',
            contact: contact
        });

    } catch (error) {
        console.error('提交聯絡表單時發生錯誤:', error);
        res.status(500).json({ error: '提交表單時發生錯誤，請稍後再試' });
    }
});

module.exports = router;
