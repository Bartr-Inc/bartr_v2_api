const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/v2/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { fullName, phone, email, password } = req.body;

  // Check if user already created an account and OTP sent
  const userData = await User.findOne({ email }).select('+password');

  // Check if user email already exist in DB
  if (userData) {
    return next(new ErrorResponse(`User with email ${email} already exist`));
  }

  // Create OTP code
  let otpCode = `${Math.floor(Math.random() * 10)}${Math.floor(
    Math.random() * 10
  )}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;

  // Create user
  const user = await User.create({
    fullName,
    phone,
    email,
    password,
    otpCode: otpCode,
  });

  const message = `User registered. Verification OTP sent. OTP ${otpCode}`;

  sendTokenResponse(user, 200, res, message);
});

// @desc    Verify user OTP on register
// @route   PUT /api/v2/auth/verifyotp
// @access  Private
exports.verifyOTPRegisteration = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  const user = await User.findById(req.user.id);

  console.log('OTP from body', otp);
  console.log('OTP from db', user.otpCode.trim());

  // Check if OTP sent matches OTP saved in DB
  if (user.otpCode != otp) {
    return next(new ErrorResponse(`Incorrect OTP`, 401));
  }

  const userDetail = await User.findByIdAndUpdate(
    req.user.id,
    {
      otpConfirmed: 'Yes',
      otpCode: null,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `OTP confirmed. Kindly login to continue`,
  });
});

// @desc    Login user
// @route   POST /api/v2/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('invalid credentials', 401));
  }

  // Check if user already verified OTP
  if (user.otpConfirmed !== 'Yes') {
    return next(
      new ErrorResponse('Please confirm OTP for registration before login', 400)
    );
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/v2/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Update user details
// @route     PUT /api/v2/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/v2/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Forgot password
// @route     POST /api/v2/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v2/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Password reset token',
  //     message,
  //   });

  //   res.status(200).json({ success: true, data: 'Email sent' });
  // } catch (err) {
  //   console.log(err);
  //   user.resetPasswordToken = undefined;
  //   user.resetPasswordExpire = undefined;

  //   await user.save({ validateBeforeSave: false });

  //   return next(new ErrorResponse('Email could not be sent', 500));
  // }

  res.status(200).json({
    success: true,
    data: user,
    message: message,
  });
});

// @desc      Reset password
// @route     PUT /api/v2/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, props) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    message: props,
  });
};
