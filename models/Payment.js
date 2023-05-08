const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  referenceId: {
    type: String,
    required: true,
  },
  accessCode: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
  },
  transactionStatus: {
    type: [String],
    enum: ['Init', 'Success', 'Cancelled'],
    required: true,
  },
  transactionDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
