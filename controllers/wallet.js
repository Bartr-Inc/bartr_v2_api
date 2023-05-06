const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Wallet = require('../models/Wallet');

// @desc    Create wallet for user on signup
// @route   POST /api/v2/wallet
// @access  Private
exports.createWallet = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const wallet = await Wallet.create(req.body);

  res.status(201).json({
    success: true,
    data: wallet,
  });
});
