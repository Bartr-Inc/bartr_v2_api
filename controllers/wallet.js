const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Create wallet for user on signup
// @route   POST /api/v2/wallet/createwallet
// @access  Private
exports.createWallet = asyncHandler(async (req, res, next) => {
	req.body.user = req.user.id;

	const wallet = await Wallet.create(req.body);

	const userRes = await User.findOneAndUpdate(
		{ _id: req.user.id },
		{
			walletId: wallet._id,
		},
		{
			new: true,
			runValidators: true,
		}
	);

	res.status(201).json({
		success: true,
		data: wallet,
		userRes: userRes,
	});
});

// @desc    Get all wallets
// @route   GET /api/v2/wallet/getwallets
// @route   GET /api/v2/user/:userId/getwallet
// @access  Private/Admin
exports.getWallets = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults);
});

// @desc    Get single wallet
// @route   Get /api/v2//wallet/:id
// @access  Private
exports.getWallet = asyncHandler(async (req, res, next) => {
	const wallet = await Wallet.findById(req.params.id).populate({
		path: 'user',
		select: 'fullName',
	});

	if (!wallet) {
		return next(
			new ErrorResponse(`No wallet with id of ${req.params.id}`),
			404
		);
	}

	res.status(200).json({
		success: true,
		message: 'User wallet fetched successfully',
		data: wallet,
	});
});
