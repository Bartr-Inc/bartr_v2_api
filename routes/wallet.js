const express = require('express');
const {
  createWallet,
  getWallets,
  getWallet,
} = require('../controllers/wallet');
const Wallet = require('../models/Wallet');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/createwallet').post(createWallet);
router
  .route('/getwallets')
  .get(advancedResults(Wallet), authorize('Admin'), getWallets);
router.route('/:id').get(getWallet);

module.exports = router;
