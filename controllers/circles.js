const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Circle = require('../models/Circle');

// @desc    Create a circle
// @route   POST /api/v2/circle/createcircle
// @access  Private
exports.createCircle = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  // Check the user wallet to make sure they have enough funds to add to add their circle
  const walletBalance = await Wallet.findOne({
    user: userId,
  });

  if (!walletBalance) {
    return next(
      new ErrorResponse(`No wallet balance with user Id ${req.user.id}`),
      404
    );
  }

  const { name, amount, duration } = req.body;

  if (amount > walletBalance.amount) {
    return next(
      new ErrorResponse(
        `Sorry can't create circle. Insufficient funds in your wallet. Please top up your wallet`
      ),
      400
    );
  }

  const circle = await Circle.create({
    name,
    amount,
    duration,
    user: req.user.id,
  });

  // Deduct the amount transfered from to circle from wallet and update wallet db.
  const finalWalletBalance = walletBalance.amount - amount;

  const walletRes = await Wallet.findOneAndUpdate(
    {
      user: userId,
    },
    {
      amount: finalWalletBalance,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    success: true,
    data: circle,
    walletRes: walletRes,
  });
});
