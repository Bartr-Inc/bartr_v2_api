const mongoose = require('mongoose');

const CircleSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please add a circle title'],
  },
  amout: {
    type: Number,
    required: true,
  },
  duration: {
    type: [String],
    required: true,
    enum: ['1 Week', '2 Weeks', '3 Weeks', '1 Month', '2 Months', '3 Months'],
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
  subscription: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subscription',
  },
});

module.exports = mongoose.model('Circle', CircleSchema);