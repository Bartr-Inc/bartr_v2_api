const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
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
		enum: ['Debit', 'Credit'],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('Transaction', TransactionSchema);
