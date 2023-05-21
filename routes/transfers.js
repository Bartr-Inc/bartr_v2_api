const express = require('express');
const { getAllBanks } = require('../controllers/transfers');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/getallbanks')
  .get(protect, authorize('User', 'Admin'), getAllBanks);

module.exports = router;
