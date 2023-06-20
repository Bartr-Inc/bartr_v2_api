const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

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
		email: email.toLowerCase(),
		password,
		otpCode: otpCode,
	});

	const message = `Hi ${fullName}, Kindly verify your email with the verification OTP code. OTP ${otpCode}`;

	try {
		await sendEmail({
			email: email,
			subject: 'Verify OTP',
			message,
		});

		console.log('Verify OTP email sent');
	} catch (err) {
		console.log(err);
		return next(new ErrorResponse('Email could not be sent', 500));
	}

	sendTokenResponse(user, 200, res, 'User registered successfully');
});

// @desc		Resend OTP
// @route		POST /api/v2/auth/resendotp
// @access	Private
exports.resendOtp = asyncHandler(async (req, res, next) => {
	const userId = req.user.id;

	const user = await User.findById(userId);

	if (!user) {
		return next(
			new ErrorResponse('User with id ${userId} does not exist', 404)
		);
	}

	const otpCode = user.otpCode;
	const fullName = user.fullName;
	const email = user.email;

	const message = `Hi ${fullName}, Kindly verify your email with the verification OTP code. OTP ${otpCode}`;

	try {
		await sendEmail({
			email: email,
			subject: 'Verify OTP',
			message,
		});

		console.log('Verify OTP email sent');
	} catch (err) {
		console.log(err);
		return next(new ErrorResponse('Email could not be sent', 500));
	}

	res.status(200).json({
		success: true,
		message: 'OTP sent',
		data: {},
	});
});

// @desc    Verify user OTP on register
// @route   PUT /api/v2/auth/verifyotp
// @access  Private
exports.verifyOTPRegisteration = asyncHandler(async (req, res, next) => {
	req.body.user = req.user.id;
	const { otp } = req.body;

	const user = await User.findById(req.user.id);

	// Check if OTP sent matches OTP saved in DB
	if (user.otpCode != otp) {
		return next(new ErrorResponse(`Incorrect OTP`, 401));
	}

	const walletDetail = await Wallet.create(req.body);

	const userDetail = await User.findByIdAndUpdate(
		req.user.id,
		{
			walletId: walletDetail._id,
			otpConfirmed: 'True',
			otpCode: null,
		},
		{ new: true, runValidators: true }
	);

	res.status(200).json({
		success: true,
		message: `OTP confirmed. Kindly login to continue`,
		data: {
			userDetail: userDetail,
			walletDetail: walletDetail,
		},
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
	if (user.otpConfirmed !== 'True') {
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
		message: 'User logged out successfully',
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
		message: 'Logged in user fetched succesfuly',
		data: { user },
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
		message: 'User details updated successfully',
		data: { user },
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

	sendTokenResponse(user, 200, res, 'Password updated succesfully');
});

// @desc      Forgot password
// @route     POST /api/v2/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const email = req.body.email;
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorResponse('There is no user with that email', 404));
	}

	// Create OTP code
	let otpCode = `${Math.floor(Math.random() * 10)}${Math.floor(
		Math.random() * 10
	)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;

	await User.findOneAndUpdate(
		{
			email: email,
		},
		{
			resetPasswordOtpCode: otpCode,
			resetPasswordOtpConfirmed: 'False',
		}
	);

	const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the OTP code ${otpCode} to reset your password`;

	try {
		await sendEmail({
			email: email,
			subject: 'Password reset OTP',
			message,
		});

		console.log('Forgot password email sent');
	} catch (err) {
		console.log(err);
		return next(new ErrorResponse('Email could not be sent', 500));
	}

	res.status(200).json({
		success: true,
		message: 'Reset password OTP sent',
		data: {},
	});
});

// @desc    Verify user OTP on reset password
// @route   PUT /api/v2/auth/verifyresetpasswordotp
// @access  Public
exports.verifyOTPResetPassword = asyncHandler(async (req, res, next) => {
	const otpCode = req.body.otp;

	const user = await User.findOne({
		resetPasswordOtpCode: otpCode,
	});

	// Check if OTP sent matches OTP saved in DB
	if (user.resetPasswordOtpCode != otpCode) {
		return next(new ErrorResponse(`Incorrect OTP`, 401));
	}

	userDetail = await User.findOneAndUpdate(
		{ resetPasswordOtpCode: otpCode },
		{
			resetPasswordOtpConfirmed: 'True',
		},
		{ new: true, runValidators: true }
	);

	res.status(200).json({
		success: true,
		message: 'OTP confirmed. Reset password to login',
		data: {},
	});
	// sendTokenResponse(user, 200, res, 'OTP confirmed. Reset password to login');
});

// @desc      Reset password
// @route     PUT /api/v2/auth/resetpassword/:otp
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
	const otp = req.params.otp;

	const user = await User.findOne({ resetPasswordOtpCode: otp });

	if (!user) {
		return next(new ErrorResponse('No user found', 404));
	}

	if (user.resetPasswordOtpCode !== otp) {
		return next(new ErrorResponse('Incorrect OTP', 400));
	}

	// if (user.resetPasswordOtpConfirmed !== 'True') {
	// 	return next(
	// 		new ErrorResponse(
	// 			'Please confirm reset password OTP before resetting you password',
	// 			400
	// 		)
	// 	);
	// }

	// Set new password
	user.password = req.body.password;
	user.resetPasswordOtpCode = null;
	user.resetPasswordOtpConfirmed = 'Confirmed';
	await user.save();

	res.status(200).json({
		success: true,
		message: `Password updated successfully. Kindly login to continue`,
		data: {},
	});
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
		message: props,
		data: {
			token,
		},
	});
};
