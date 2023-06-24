const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all transactions for a particular user
// @route   GET /api/v2/transaction/getusertransactions/:userId
// @access  Private
exports.getUserTransactions = async (req, res, next) => {
	const userId = req.params.id;

	const transactionData = await Transaction.find({
		user: userId,
	});

	if (!transactionData) {
		return next(
			new ErrorResponse(`No transaction data with user Id ${userId}`),
			400
		);
	}

	res.status(200).json({
		success: true,
		message: 'User transactions fetched successfully',
		data: {
			transactionData,
		},
	});
};
