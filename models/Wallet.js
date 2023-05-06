const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Prevent user from having more than one wallet
WalletSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', WalletSchema);
