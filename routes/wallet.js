const express = require('express');
const { createWallet } = require('../controllers/wallet');

const router = express.Router();

// const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

// router.post('/createwallet', protect, createWallet);

router.post('/createwallet', protect, createWallet);

module.exports = router;
