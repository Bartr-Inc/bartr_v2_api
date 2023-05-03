const express = require('express');
const { register } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);

module.exports = router;
