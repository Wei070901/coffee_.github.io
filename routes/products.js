const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');

// 獲取熱門商品（根據訂單數量）
router.get('/popular', async (req, res) => {
    try {
        // 聚合訂單數據來計算每個商品的銷量
        const popularProducts = await Order.aggregate([
            // 只考慮已完成的訂單
            { $match: { status: 'completed' } },
            // 展開訂單項目
            { $unwind: '$items' },
            // 按產品ID分組並計算總數量
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            // 按銷量排序
            { $sort: { totalSold: -1 } },
            // 限制返回前3個
            { $limit: 3 },
            // 查詢產品詳細信息
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            // 展開產品信息
            { $unwind: '$product' },
            // 重塑輸出格式
            {
                $project: {
                    _id: '$product._id',
                    name: '$product.name',
                    description: '$product.description',
                    price: '$product.price',
                    imageUrl: '$product.imageUrl',
                    totalSold: 1
                }
            }
        ]);

        res.json(popularProducts);
    } catch (error) {
        console.error('Error getting popular products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (admin only - you should add admin middleware)
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
