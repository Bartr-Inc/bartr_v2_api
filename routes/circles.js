const express = require('express');
const {
	createCircle,
	deleteCircle,
	getAllUserCircles,
	getUserCircles,
} = require('../controllers/circles');
const Circle = require('../models/Circle');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/createcircle').post(createCircle);
router.route('/:circleId').delete(deleteCircle);
router
	.route('/usercircles')
	.get(advancedResults(Circle), authorize('Admin'), getAllUserCircles);
router
	.route('/usercircles/:id')
	.get(authorize('Admin', 'User'), getUserCircles);

module.exports = router;
