const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all transactions for a particular user
// @route   GET /api/v2/transaction/getusertransactions/:userId
// @access  Private

exports.getUserTransactions = async (req, res, next) => {
	const userId = req.params.id;

	let { page, limit, sort, asc } = req.query;

	if (!page) page = 1;
	if (!limit) limit = 10;

	const skip = (page - 1) * 10;

	const transactionData = await Transaction.find({
		user: userId,
	})
		.sort({ [sort]: asc })
		.skip(skip)
		.limit(limit);

	if (!transactionData || transactionData === []) {
		return next(
			new ErrorResponse(`No transaction data with user Id ${userId}`),
			400
		);
	}

	res.status(200).json({
		success: true,
		message: 'User transactions fetched successfully',
		count: transactionData.length,
		pagination: {
			page: page,
			limit: limit,
		},
		data: transactionData,
	});
};

// @desc    Get all transactions for a particular user circle
// @route   GET /api/v2/transaction/getusertransactions/:circleId
// @access  Private

exports.getCircleTransactions = async (req, res, next) => {
	const circleId = req.params.id;

	let { page, limit, sort, asc } = req.query;

	if (!page) page = 1;
	if (!limit) limit = 10;

	const skip = (page - 1) * 10;

	const transactionData = await Transaction.find({
		circle: circleId,
	})
		.sort({ [sort]: asc })
		.skip(skip)
		.limit(limit);

	if (!transactionData || transactionData === []) {
		return next(
			new ErrorResponse(`No transaction data with circle Id ${circleId}`),
			400
		);
	}

	res.status(200).json({
		success: true,
		message: 'User circle transactions fetched successfully',
		count: transactionData.length,
		pagination: {
			page: page,
			limit: limit,
		},
		data: transactionData,
	});
};
