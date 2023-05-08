const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  referenceId: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  transactionTopupDate: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  topupStatus: {
    type: [String],
    enum: ['Init', 'Success', 'Cancelled'],
  },
});

// Prevent user from having more than one wallet
WalletSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', WalletSchema);
