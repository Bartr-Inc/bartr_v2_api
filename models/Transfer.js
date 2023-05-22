const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  recipientAccountNumber: {
    type: String,
  },
  recipientAccountName: {
    type: String,
  },
  recipientBankCode: {
    type: String,
  },
  recipientBankName: {
    type: String,
  },
  currency: {
    type: String,
  },
  recipientCode: {
    type: String,
  },
  reference: {
    type: String,
  },
  integration: {
    type: String,
  },
  domain: {
    type: String,
  },
  amount: {
    type: String,
  },
  source: {
    type: String,
  },
  reason: {
    type: String,
  },
  transferCode: {
    type: String,
  },
  id: {
    type: String,
  },
  transferStatus: {
    type: [String],
    enum: ['Init', 'Success', 'Failed', 'Reversed'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Transfer', TransferSchema);
