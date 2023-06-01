const express = require('express');
const {
	getAllBanks,
	createTransferRecipient,
	moveMoneyFromCircleToWallet,
} = require('../controllers/transfers');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
	.route('/getallbanks')
	.get(protect, authorize('User', 'Admin'), getAllBanks);
router
	.route('/transferrecipient')
	.post(protect, authorize('User', 'Admin'), createTransferRecipient);
router
	.route('/movemoneytowallet/:circleId')
	.put(protect, authorize('User', 'Admin'), moveMoneyFromCircleToWallet);

module.exports = router;
