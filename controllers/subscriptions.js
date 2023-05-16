const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @desc    Create subscription for user on signup
// @route   POST /api/v2/subscription/createsub
// @access  Private
exports.createSub = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const sub = await Subscription.create(req.body);

  const userRes = await User.findOneAndUpdate(
    { _id: req.user.id },
    {
      subscriptionId: sub.id,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    success: true,
    data: sub,
    userRes: userRes,
  });
});

// @desc    Get all subscriptions
// @route   Get /api/v2/subscription/getsubs
// @route   Get /api/v2/user/:userId/getsub
// @access  Private/Admin
exports.getSubs = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get signle subscription
// @route   Get /api/v2/subscription/:id
// @access  Private
exports.getSub = asyncHandler(async (req, res, next) => {
  const sub = await Subscription.findById(req.params.id).populate({
    path: 'user',
    select: 'fullName',
  });

  if (!sub) {
    return next(
      new ErrorResponse(`No subscription with id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    subData: sub,
  });
});
