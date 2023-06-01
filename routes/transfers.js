const express = require('express');
const {
	getAllBanks,
	createTransferRecipient,
	moveMoneyFromCircleToWallet,
	initiateTransfer,
	verifyTransfer,
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
	.route('/verifytransfer/:recipientCode')
	.post(protect, authorize('User', 'Admin'), verifyTransfer);

module.exports = router;
