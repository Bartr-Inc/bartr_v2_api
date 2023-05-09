const express = require('express');
const { createWallet, getWallets } = require('../controllers/wallet');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/createwallet', protect, createWallet);
router.get('/getwallets', protect, getWallets);

module.exports = router;
