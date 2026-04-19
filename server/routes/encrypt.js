const express = require('express');
const router = express.Router();
const encryptController = require('../controllers/encryptController');

// POST /api/encrypt - Encrypt data with specified algorithm
router.post('/', encryptController.encryptData);

module.exports = router;
