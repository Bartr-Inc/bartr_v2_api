const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  plan: {
    type: [String],
    required: true,
    enum: ['Free', 'Premium'],
    default: 'Free',
  },
  noOfCircles: {
    type: Number,
    required: true,
    default: 3,
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
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
