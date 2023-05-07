const express = require('express');
const { getCustomers } = require('../controllers/payments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/customers').get(protect, authorize('Admin'), getCustomers);

module.exports = router;
