const https = require('https');
const paystack = require('paystack')(process.env.SECRET_KEY);

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Get all customers
// @route   GET /api/v2/payments/customers
// @access  Private/Admin
exports.getCustomers = asyncHandler(async (req, res, next) => {
  paystack.customer
    .list()
    .then((body) => {
      res.status(200).json(body);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});
