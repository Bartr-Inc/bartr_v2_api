const express = require('express');
const { createCircle, deleteCircle } = require('../controllers/circles');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/createcircle').post(createCircle);
router.route('/:circleId').delete(deleteCircle);

module.exports = router;
