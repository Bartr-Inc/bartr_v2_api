const mongoose = require('mongoose');

const CircleSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: [true, 'Please add a circle title'],
	},
	amount: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	recipientCode: {
		type: String,
	},
	// subscription: {
	//   type: mongoose.Schema.ObjectId,
	//   ref: 'Subscription',
	// },
});

module.exports = mongoose.model('Circle', CircleSchema);
