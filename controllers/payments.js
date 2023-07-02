const https = require('https');
const paystack = require('paystack')(process.env.SECRET_KEY);
const axios = require('axios');

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// @desc    Get all customers
// @route   GET /api/v2/payments/customers
// @access  Private/Admin
exports.getCustomers = asyncHandler(async (req, res, next) => {
	paystack.customer
		.list()
		.then((body) => {
			res.status(200).json(body);
		})
		.catch((err) => {
			res.status(404).json(err);
		});
});

// @desc    Initialize wallet topup payment
// @route   GET /api/v2/payments/initialize/:walletId
// @access  Private

exports.initializeWalletTopupPayment = asyncHandler(async (req, res, next) => {
	let walletId = req.params.walletId;
	walletId.trim();

	if (walletId == '') {
		return next(new ErrorResponse(`Please enter a Wallet Id`, 400));
	}

	let wallet = await Wallet.findById(walletId);

	let getExistingWalletAmount = wallet.amount;

	if (!wallet) {
		return next(
			new ErrorResponse(`No wallet with the id of ${req.params.walletId}`, 404)
		);
	}

	const { amount } = req.body;

	const ref = crypto.randomBytes(15).toString('base64').slice(0, 15);

	let referenceId =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);

	const payload = {
		tx_ref: ref,
		amount: amount,
		currency: 'NGN',
		redirect_url: `${req.protocol}:${req.get(
			'host'
		)}/api/v2/payments/verify/${referenceId}`,
		payment_options: 'card,mobilemoney,ussd,banktransfer',
		customer: {
			email: req.user.email,
			phonenumber: req.user.phone,
			name: req.user.fullName,
		},
		meta: {
			original_ammount: amount,
		},
		customizations: {
			title: 'Wallet Topup',
			// logo: `${process.env.LOGO}`,
		},
	};

	const config = {
		method: 'post',
		url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/payments`,
		headers: {
			Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
		data: payload,
	};

	axios(config)
		.then(function (response) {
			return res.status(200).json({
				success: true,
				data: response.data,
			});
		})
		.catch(function (error) {
			return next(new ErrorResponse('An error occured', 500));
		});
});

// @desc    Verify payment
// @route   GET /api/v2/payments/verify/:referenceId
// @access  Private/User
exports.verifyWalletTopup = asyncHandler(async (req, res, next) => {});

// exports.initializeWalletTopupPayment = asyncHandler(async (req, res, next) => {
// 	let walletId = req.params.walletId;
// 	walletId.trim();

// 	if (walletId == '') {
// 		return next(new ErrorResponse(`Please enter a Wallet Id`, 400));
// 	}

// 	let wallet = await Wallet.findById(walletId);

// 	let getExistingWalletAmount = wallet.amount;

// 	if (!wallet) {
// 		return next(
// 			new ErrorResponse(`No wallet with the id of ${req.params.walletId}`, 404)
// 		);
// 	}

// 	const { amount } = req.body;

// 	const options = {
// 		host: process.env.PAYMENT_HOST,
// 		path: `/transaction/initialize/`,
// 		method: 'POST',
// 		headers: {
// 			Authorization: `Bearer ${process.env.SECRET_KEY}`,
// 			'Content-Type': 'application/json',
// 		},
// 	};

// 	let referenceId =
// 		Math.random().toString(36).substring(2, 15) +
// 		Math.random().toString(36).substring(2, 15);

// 	let walletTopupData = JSON.stringify({
// 		reference: referenceId,
// 		amount: amount * 100,
// 		email: req.user.email,
// 		callback_url: `${req.protocol}://${req.get(
// 			'host'
// 		)}/api/v2/payments/verify/${referenceId}`,
// 	});

// 	let data = '';

// 	const topupReq = https.request(options, (topupRes) => {
// 		topupRes.on('data', (chunk) => {
// 			data += chunk;
// 		});
// 		topupRes.on('end', async () => {
// 			data = JSON.parse(data);

// 			if (data['status']) {
// 				// Credit the user's wallet and keep 3% for Bartr
// 				const netWalletTopup = (97 / 100) * amount;

// 				// Make sure user owns the wallet
// 				if (
// 					wallet.user.toString() !== req.user.id &&
// 					req.user.role !== 'Admin'
// 				) {
// 					return next(
// 						new ErrorResponse(
// 							`User ${req.user.id} is not authorized to topup wallet ${wallet._id}`,
// 							401
// 						)
// 					);
// 				}

// 				await Payment.create({
// 					user: req.user.id,
// 					amount: netWalletTopup,
// 					wallet: walletId,
// 					referenceId,
// 					accessCode: data['data']['access_code'],
// 					transactionStatus: 'Init',
// 				});

// 				// Update Wallet with topup amount. set to Init
// 				let walletRes = await Wallet.findByIdAndUpdate(
// 					walletId,
// 					{
// 						amount: getExistingWalletAmount + netWalletTopup,
// 						topupStatus: 'Init',
// 						referenceId,
// 					},
// 					{
// 						new: true,
// 						runValidators: true,
// 					}
// 				);

// 				// Update transactions db
// 				const TransactionsRes = await Transaction.create({
// 					user: req.user.id,
// 					amount: netWalletTopup,
// 					description: 'Wallet topup',
// 					transactionType: 'Credit',
// 					status: 'Pending',
// 					referenceId,
// 				});

// 				let responseData = {
// 					payment_url: data['data']['authorization_url'],
// 					reference_id: referenceId,
// 				};

// 				res.status(200).json({
// 					status: 'success',
// 					message: 'Payment initialized successfully',
// 					data: {
// 						paymentRes: responseData,
// 						walletRes: walletRes,
// 						TransactionsRes: TransactionsRes,
// 					},
// 				});
// 			} else {
// 				res.status(400).json({ status: 'failed', message: data['message'] });
// 			}

// 			return;
// 		});
// 	});

// 	topupReq.on('error', (e) => {
// 		res.json(e);
// 		return;
// 	});

// 	// Write data to request body
// 	topupReq.write(walletTopupData);
// 	topupReq.end();
// });

// @desc    Verify payment
// @route   GET /api/v2/payments/verify/:referenceId
// @access  Private/User
exports.verifyWalletTopup = asyncHandler(async (req, res, next) => {
	let walletTopData = await Payment.findOne({
		referenceId: req.params.referenceId,
	});

	if (!walletTopData) {
		return next(
			new ErrorResponse(
				`No wallet topup with reference Id of ${req.params.referenceId}`
			),
			404
		);
	}

	if (walletTopData['transactionStatus'][0] === 'Success') {
		res.status(200).json({
			success: true,
			message: 'Payment verified successfully',
			data: {
				TransactionResdata: walletTopData,
			},
		});
		return;
	}

	// Verify transaction
	let options = {
		hostname: process.env.PAYMENT_HOST,
		path: `/transaction/verify/${walletTopData['referenceId']}`,
		headers: {
			Authorization: `Bearer ${process.env.SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
	};

	let data = '';

	let topupVar = https.get(options, (topupRes) => {
		topupRes.on('data', (chunk) => {
			data += chunk;
		});
		topupRes.on('end', async () => {
			verifiedData = JSON.parse(data);

			if (
				verifiedData['status'] &&
				verifiedData['data']['status'] === 'success'
			) {
				const TransactionResdata = await Payment.findOneAndUpdate(
					{ referenceId: walletTopData['referenceId'] },
					{
						transactionStatus: 'Success',
						transactionDate: verifiedData['data']['paid_at'],
					},
					{
						new: true,
						runValidators: true,
					}
				);

				// Update Wallet with topup amount. set status to success
				const walletRes = await Wallet.findOneAndUpdate(
					{ referenceId: walletTopData['referenceId'] },
					{
						topupStatus: 'Success',
						transactionTopupDate: verifiedData['data']['paid_at'],
					},
					{
						new: true,
						runValidators: true,
					}
				);

				// Update Transaction DB. set status to success
				const TransactionRes = await Transaction.findOneAndUpdate(
					{ referenceId: walletTopData['referenceId'] },
					{
						status: 'Success',
					},
					{
						new: true,
						runValidators: true,
					}
				);

				res.status(200).json({
					success: true,
					message: 'Payment verified successfully',
					data: {
						TransactionResdata: TransactionResdata,
						walletResData: walletRes,
						TransactionRes: TransactionRes,
					},
				});
			}
		});
	});
});
