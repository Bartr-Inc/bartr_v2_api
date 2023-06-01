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

// @desc    Delete a circle
// @route   POST /api/v2/circle/deletecircle/:id
// @access  Private
// exports.deleteCircle = asyncHandler(async (req, res, next) => {

//   const circleId = req.params.id
//   const userId = req.user.id

//   // Transfer any remaining money to wallet
//   const circleData = await Circle.findOne({
//     _id: circleId
//   })

//   const walletData = await Wallet.findOne({
//     user: userId
//   })

//   if (!circleData) {
//     return next(
//       new ErrorResponse(`No circle data with Id ${circleId}`),
//       404
//     );
//   }

//   if (!walletData) {
//     return next(
//       new ErrorResponse(`No wallet data with Id ${userId}`),
//       404
//     );
//   }

//   const refundAmountToWallet = walletData.amount + circleData.amount;

//   if (circleData.amount > 0) {
//     const walletRes = await Wallet.findOneAndUpdate(
//       {
//         user: userId,
//       },
//       {
//         amount: refundAmountToWallet,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//   }

//   await Circle.findByIdAndDelete(req.params.id);

  
// })