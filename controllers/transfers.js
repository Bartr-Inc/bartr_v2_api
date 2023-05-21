const https = require('https');
const paystack = require('paystack')(process.env.SECRET_KEY);

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transfer = require('../models/Transfer');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Get list of banks
// @route   GET /api/v2/transfers/getallbanks
// @access  Private
exports.getAllBanks = asyncHandler(async (req, res, next) => {
  const options = {
    hostname: process.env.PAYMENT_HOST,
    port: 443,
    path: '/bank?currency=NGN',
    method: 'GET',
    headers: {
      Authorization: 'Bearer ${process.env.SECRET_KEY}',
    },
  };

  const getAllBanksReq = https
    .request(options, (getAllBanksRes) => {
      let data = '';

      getAllBanksRes.on('data', (chunk) => {
        data += chunk;
      });

      getAllBanksRes.on('end', () => {
        let dataRes = '';
        dataRes = JSON.parse(data);
        res.status(200).json(dataRes);
      });
    })
    .on('error', (error) => {
      console.error(error);
    });
  getAllBanksReq.end();
});
