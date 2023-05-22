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
      Authorization: `Bearer ${process.env.SECRET_KEY}`,
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
      res.json(error);
      return;
    });
  getAllBanksReq.end();
});

// @desc    Create a transfer recipient
// @route   POST /api/v2/transfers/transferrecipient
// @access  Private
exports.createTransferRecipient = asyncHandler(async (req, res, next) => {
  const { accountNumber, bankCode } = req.body;

  const userId = req.user.id;

  const userDetail = await User.findById({
    _id: userId,
  });

  const userName = userDetail.fullName;

  const params = JSON.stringify({
    type: 'nuban',
    name: userName,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  });

  const options = {
    hostname: process.env.PAYMENT_HOST,
    port: 443,
    path: '/transferrecipient',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  const transferRecipientReq = https
    .request(options, (transferRecipientRes) => {
      let data = '';

      transferRecipientRes.on('data', (chunk) => {
        data += chunk;
      });

      transferRecipientRes.on('end', async () => {
        let dataRes = '';
        dataRes = JSON.parse(data);
        // res.status(200).json(dataRes);

        // Check if recipient_code already exist in db and update, else create a new one
        const transferDetails = await Transfer.findOne({
          recipientCode: dataRes.data.recipient_code,
        });

        if (!transferDetails) {
          let createTransferDetails = await Transfer.create({
            user: userId,
            type: 'nuban',
            name: userName,
            recipientAccountNumber: dataRes.data.details.account_number,
            recipientAccountName: dataRes.data.details.account_name,
            recipientBankCode: dataRes.data.details.bank_code,
            recipientBankName: dataRes.data.details.bank_name,
            currency: dataRes.data.currency,
            recipientCode: dataRes.data.recipient_code,
          });

          console.log(createTransferDetails);
          res.status(200).json(dataRes);
        } else {
          res.status(200).json(dataRes);
        }
      });
    })
    .on('error', (error) => {
      res.json(error);
      return;
    });

  transferRecipientReq.write(params);
  transferRecipientReq.end();
});
