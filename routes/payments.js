const express = require('express');
const {
  getCustomers,
  initializeWalletTopupPayment,
  verifyWalletTopup,
} = require('../controllers/payments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/customers').get(protect, authorize('Admin'), getCustomers);

router
  .route('/initialize/:walletId')
  .get(protect, authorize('User', 'Admin'), initializeWalletTopupPayment);

router.route('/verify/:referenceId').get(verifyWalletTopup);

module.exports = router;
