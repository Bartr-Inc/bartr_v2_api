const express = require('express');
const {
	getUserTransactions,
	getCircleTransactions,
} = require('../controllers/transactions');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
	.route('/getusertransactions/:id')
	.get(authorize('Admin', 'User'), getUserTransactions);

router
	.route('/getcircletransactions/:id')
	.get(authorize('Admin', 'User'), getCircleTransactions);

module.exports = router;
