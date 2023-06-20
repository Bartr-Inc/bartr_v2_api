const express = require('express');
const { getUserTransactions } = require('../controllers/transactions');
const Transaction = require('../models/Transaction');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
	.route('/allusertransactions/:userId')
	.get(authorize('Admin', 'User'), getUserTransactions);

module.exports = router;
