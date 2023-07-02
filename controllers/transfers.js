const https = require('https');
const crypto = require('crypto');
const paystack = require('paystack')(process.env.SECRET_KEY);

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transfer = require('../models/Transfer');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Circle = require('../models/Circle');
const Transaction = require('../models/Transaction');

// @desc    Move money from user circle to user wallet
// @route   PUT /api/v2/transfer/movemoneytowallet/:circleId
// @access  Private
exports.moveMoneyFromCircleToWallet = asyncHandler(async (req, res, next) => {
	const { amount } = req.body;

	const circleId = req.params.circleId;
	const userId = req.user.id;

	if (circleId == '' || undefined) {
		return next(new ErrorResponse(`Please enter a Circle Id`, 400));
	}

	const circle = await Circle.findOne({
		_id: circleId,
	});

	const wallet = await Wallet.findOne({
		user: userId,
	});

	if (!circle) {
		return next(
			new ErrorResponse(`No circle details with id of ${circleId}`),
			404
		);
	}

	if (!wallet) {
		return next(
			new ErrorResponse(`No wallet details with id of ${userId}`),
			404
		);
	}

	// Check if amount to be moved to wallet is greater than the circle balance
	if (amount > circle.amount) {
		return next(
			new ErrorResponse(
				`Amount to be transferred is greater than ${circle.name} circle amount`
			),
			401
		);
	}

	const circleBalance = circle.amount - amount;
	const walletBalance = amount + wallet.amount;

	// Move money to wallet and update update circle & wallet amount
	const walletData = await Wallet.findOneAndUpdate(
		{
			user: userId,
		},
		{
			amount: walletBalance,
		},
		{
			new: true,
			runValidators: true,
		}
	);

	const circleData = await Circle.findOneAndUpdate(
		{
			_id: circleId,
		},
		{
			// amount: circleBalance,
			balanceAmount: circleBalance,
		},
		{
			new: true,
			runValidators: true,
		}
	);

	await Transaction.create({
		user: userId,
		amount,
		description: 'Moved money to wallet',
		transactionType: 'MovedMoneyToWallet',
		status: 'Success',
	});

	res.status(200).json({
		success: true,
		message: `${amount} moved to wallet successfully`,
		data: {
			walletData,
			circleData,
		},
	});
});

// @desc    Get list of banks
// @route   GET /api/v2/transfers/getallbanks
// @access  Private
exports.getAllBanks = asyncHandler(async (req, res, next) => {
	const options = {
		hostname: process.env.PAYMENT_HOST,
		port: 443,
		path: '/bank?currency=NGN',
		method: 'GET',
		headers: {
			Authorization: `Bearer ${process.env.SECRET_KEY}`,
		},
	};

	const getAllBanksReq = https
		.request(options, (getAllBanksRes) => {
			let data = '';

			getAllBanksRes.on('data', (chunk) => {
				data += chunk;
			});

			getAllBanksRes.on('end', () => {
				let dataRes = '';
				dataRes = JSON.parse(data);
				res.status(200).json(dataRes);
			});
		})
		.on('error', (error) => {
			res.json(error);
			return;
		});
	getAllBanksReq.end();
});

// @desc    Create a transfer recipient
// @route   POST /api/v2/transfers/transferrecipient/:circleId
// @access  Private
exports.createTransferRecipient = asyncHandler(async (req, res, next) => {
	const { accountNumber, bankCode } = req.body;

	const userId = req.user.id;
	const circleId = req.params.circleId;

	const userDetail = await User.findById({
		_id: userId,
	});

	const userName = userDetail.fullName;

	const params = JSON.stringify({
		type: 'nuban',
		name: userName,
		account_number: accountNumber,
		bank_code: bankCode,
		currency: 'NGN',
	});

	const options = {
		hostname: process.env.PAYMENT_HOST,
		port: 443,
		path: '/transferrecipient',
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
	};

	const transferRecipientReq = https
		.request(options, (transferRecipientRes) => {
			let data = '';

			transferRecipientRes.on('data', (chunk) => {
				data += chunk;
			});

			transferRecipientRes.on('end', async () => {
				let dataRes = '';
				dataRes = JSON.parse(data);
				// res.status(200).json(dataRes);

				// Check if recipient_code already exist in db and update, else create a new one
				const transferDetails = await Transfer.findOne({
					recipientCode: dataRes.data.recipient_code,
				});

				if (!transferDetails) {
					let createTransferDetails = await Transfer.create({
						user: userId,
						type: 'nuban',
						name: userName,
						recipientAccountNumber: dataRes.data.details.account_number,
						recipientAccountName: dataRes.data.details.account_name,
						recipientBankCode: dataRes.data.details.bank_code,
						recipientBankName: dataRes.data.details.bank_name,
						currency: dataRes.data.currency,
						recipientCode: dataRes.data.recipient_code,
					});

					let updateCircle = await Circle.findOneAndUpdate(
						{
							_id: circleId,
						},
						{
							recipientCode: dataRes.data.recipient_code,
						}
					);

					// Update transactions db
					await Transaction.create({
						user: userId,
						recipientCode: dataRes.data.recipient_code,
					});

					// res.status(200).json({
					// 	status: 'success',
					// 	message: 'Transfer recipient created successfully',
					// 	data: dataRes,
					// });
					res.status(200).json(dataRes);
				} else {
					await Circle.findOneAndUpdate(
						{
							_id: circleId,
						},
						{
							recipientCode: dataRes.data.recipient_code,
						}
					);

					res.status(200).json(dataRes);
				}
			});
		})
		.on('error', (error) => {
			res.json(error);
			return;
		});

	transferRecipientReq.write(params);
	transferRecipientReq.end();
});

//  @desc    Initiate a transfer
//  @route   POST /api/v2/transfers/initiatetransfer/:recipientCode
// @access  Private
exports.initiateTransfer = asyncHandler(async (req, res, next) => {
	const { amount, reason } = req.body;
	const recipientCode = req.params.recipientCode;
	const userId = req.user.id;

	const referenceId =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);

	// Check if the amount in the wallet/circle is equal to the amount to be transfered
	const transferData = await Transfer.findOne({
		recipientCode,
	});

	const walletData = await Wallet.findOne({
		user: userId,
	});

	const circleData = await Circle.findOne({
		recipientCode,
	});

	if (!circleData) {
		return next(
			new ErrorResponse(
				`No circle details with recipient code of ${recipientCode}`
			),
			404
		);
	}

	if (!transferData) {
		return next(
			new ErrorResponse(
				`No transfer details with recipient code of ${recipientCode}`
			),
			404
		);
	}

	if (!walletData) {
		return next(
			new ErrorResponse(
				`No wallet details with user id of ${req.params.recipientCode}`
			),
			404
		);
	}

	if (transferData.amount > circleData.amount) {
		return next(
			new ErrorResponse(
				`Amount to be transferred is greater than amount in ${circleData.name} circle`,
				401
			)
		);
	}

	// Make transfer from circle and wallet
	const params = JSON.stringify({
		source: 'balance',
		amount: amount * 100,
		reference: referenceId,
		recipient: transferData.recipientCode,
		reason: reason,
	});

	const options = {
		hostname: process.env.PAYMENT_HOST,
		port: 443,
		path: '/transfer',
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
	};

	// Update the circle amount with the updated amount balance
	const initiateTransferReq = https
		.request(options, (initiateTransferRes) => {
			let data = '';

			initiateTransferRes.on('data', (chunk) => {
				data += chunk;
			});

			initiateTransferRes.on('end', async () => {
				let dataRes = '';
				dataRes = JSON.parse(data);

				// Update the transfer db
				await Transfer.findOneAndUpdate(
					{
						recipientCode: transferData.recipientCode,
					},
					{
						amount: amount,
						reason: reason,
						reference: referenceId,
						transferStatus: 'Init',
					}
				);

				// Update the circle db when transfer is successful
				const circleRes = await Circle.findOneAndUpdate(
					{
						recipientCode: transferData.recipientCode,
					},
					{
						// amount: circleData.amount - amount,
						balanceAmount: circleData.amount - amount,
					},
					{
						new: true,
						runValidators: true,
					}
				);

				// Update transactions db
				await Transaction.findOneAndUpdate(
					{
						recipientCode: transferData.recipientCode,
					},
					{
						user: userId,
						circle: circleRes.id,
						amount,
						description: reason,
						transactionType: 'Debit',
						status: 'Pending',
						transactionMethod: 'Circle',
						referenceId,
					}
				);

				res.status(200).json(dataRes);

				// res.status(200).json({
				// 	status: 'success',
				// 	message: 'Transfer initiated successfully',
				// 	data: {
				// 		dataRes,
				// 	},
				// });
			});
		})
		.on('error', (error) => {
			res.json(error);
			return;
		});

	initiateTransferReq.write(params);
	initiateTransferReq.end();
});

//  @desc    Verify transfer
//  @route   POST /api/v2/transfers/verifytransfer/:recipientCode
// @access  Private
exports.verifyTransfer = asyncHandler(async (req, res, next) => {
	const recipientCode = req.params.recipientCode;

	const transferData = await Transfer.findOne({
		recipientCode,
	});

	if (!transferData) {
		return next(
			new ErrorResponse(
				`No transfer details with recipient code of ${recipientCode}`
			),
			404
		);
	}

	const options = {
		hostname: process.env.PAYMENT_HOST,
		port: 443,
		path: `/transfer/verify/${transferData.reference}`,
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
	};

	const verifyTransferReq = https

		.request(options, (verifyTransferRes) => {
			let data = '';

			verifyTransferRes.on('data', (chunk) => {
				data += chunk;
			});

			verifyTransferRes.on('end', async () => {
				let dataRes = '';
				dataRes = JSON.parse(data);

				if (dataRes['data']['status'] === 'success') {
					const TransferResData = await Transfer.findOneAndUpdate(
						{
							reference: transferData.reference,
						},
						{
							transferStatus: 'Success',
							updatedAt: dataRes['data']['updatedAt'],
						}
					);

					const CircleResData = await Circle.findOneAndUpdate(
						{
							recipientCode: recipientCode,
						},
						{
							recipientCode: null,
						}
					);

					await Transaction.findOneAndUpdate(
						{
							referenceId: transferData.reference,
						},
						{
							status: 'Success',
						}
					);

					res.status(200).json(dataRes);

					// res.status(200).json({
					// 	status: 'success',
					// 	message: 'Transfer successful',
					// 	data: {
					// 		dataRes: dataRes,
					// 		TransferResData: TransferResData,
					// 		CircleResData: CircleResData,
					// 	},
					// });
				}
			});
		})
		.on('error', (error) => {
			res.json(error);
			return;
		});
});

// @desc    Webhook to verify transfer
// @route   GET /api/v2/transfers/webhook
// @access  Private
exports.transferWebhook = asyncHandler(async (req, res, next) => {
	//validate event
	const hash = crypto
		.createHmac('sha512', process.env.SECRET_KEY)
		.update(JSON.stringify(req.body))
		.digest('hex');
	if (hash == req.headers['x-paystack-signature']) {
		// Retrieve the request's body
		const event = req.body;
		console.log(event);
		// Do something with event
	}

	res.status(200).json({
		success: true,
	});
});
