const express = require('express');
const {
	getAllBanks,
	createTransferRecipient,
	moveMoneyFromCircleToWallet,
	initiateTransfer,
	verifyTransfer,
	transferWebhook,
	lookup,
	sendFunds
} = require('../controllers/transfers');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
	.route('/getallbanks')
	.get(protect, authorize('User', 'Admin'), getAllBanks);
router
	.route('/transferrecipient/:circleId')
	.post(protect, authorize('User', 'Admin'), createTransferRecipient);
router
	.route('/movemoneytowallet/:circleId')
	.put(protect, authorize('User', 'Admin'), moveMoneyFromCircleToWallet);
router
	.route('/initiatetransfer/:recipientCode')
	.post(protect, authorize('User', 'Admin'), initiateTransfer);
router
	.route('/verifytransfer/:transactionId')
	.get(protect, authorize('User', 'Admin'), verifyTransfer);
router
	.route('/send_funds')
	.post(protect, authorize('User', 'Admin'), sendFunds);
router
	.route('/transferwebhook')
	.post(protect, authorize('User', 'Admin'), transferWebhook);
router
	.route('/lookup')
	.post(protect, authorize('User', 'Admin'), lookup);

module.exports = router;
