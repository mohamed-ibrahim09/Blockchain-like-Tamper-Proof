const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

// POST /api/verify - Verify blockchain integrity
router.post('/', verifyController.verifyChain);

module.exports = router;
