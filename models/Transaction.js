const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	circle: {
		type: mongoose.Schema.ObjectId,
		ref: 'Circle',
		required: true,
	},
	amount: {
		type: Number,
	},
	description: {
		type: String,
	},
	transactionType: {
		type: [String],
		enum: ['Debit', 'Credit', 'Moved Money to Wallet'],
	},
	transactionMethod: {
		type: [String],
		enum: ['Circle', 'Others'],
	},
	status: {
		type: [String],
		enum: ['Pending', 'Success', 'Cancelled'],
	},
	referenceId: {
		type: String,
	},
	recipientCode: {
		type: String,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('Transaction', TransactionSchema);
