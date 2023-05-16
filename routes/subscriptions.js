const express = require('express');
const { createSub, getSub, getSubs } = require('../controllers/subscriptions');
const Subscription = require('../models/Subscription');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/createsub').post(createSub);
router
  .route('/getsubs')
  .get(advancedResults(Subscription), authorize('Admin'), getSubs);
router.route('/:id').get(getSub);

module.exports = router;
