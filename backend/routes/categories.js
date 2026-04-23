const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');

router.use(protect);

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
  { name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { name: 'Healthcare', icon: '🏥', color: '#FFEAA7' },
  { name: 'Housing', icon: '🏠', color: '#DDA0DD' },
  { name: 'Education', icon: '📚', color: '#98D8C8' },
  { name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { name: 'Utilities', icon: '💡', color: '#AED6F1' },
  { name: 'Personal Care', icon: '💅', color: '#F1948A' },
  { name: 'Subscriptions', icon: '📱', color: '#BB8FCE' },
  { name: 'Investment', icon: '📈', color: '#82E0AA' },
  { name: 'Gifts', icon: '🎁', color: '#F8C471' },
  { name: 'Other', icon: '📦', color: '#ABB2B9' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💼', color: '#2ECC71' },
  { name: 'Freelance', icon: '💻', color: '#3498DB' },
  { name: 'Business', icon: '🏢', color: '#9B59B6' },
  { name: 'Investment', icon: '📈', color: '#1ABC9C' },
  { name: 'Rental', icon: '🏘️', color: '#E67E22' },
  { name: 'Gift', icon: '🎁', color: '#E74C3C' },
  { name: 'Other', icon: '💰', color: '#95A5A6' }
];

// @route GET /api/categories
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      expense: DEFAULT_EXPENSE_CATEGORIES,
      income: DEFAULT_INCOME_CATEGORIES
    }
  });
});

// @route GET /api/categories/used - get categories actually used by user
router.get('/used', async (req, res) => {
  try {
    const usedCategories = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: { category: '$category', type: '$type' }, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, data: usedCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
