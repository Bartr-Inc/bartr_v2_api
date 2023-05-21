const express = require('express');
const { createCircle } = require('../controllers/circles');
const Circle = require('../models/Circle');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/createcircle').post(createCircle);

module.exports = router;
