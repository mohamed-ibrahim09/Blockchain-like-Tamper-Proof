const express = require('express');
const router = express.Router();
const chainController = require('../controllers/chainController');

// GET /api/chain - Get entire blockchain
router.get('/', chainController.getChain);

// GET /api/chain/:id - Get specific block
router.get('/:id', chainController.getBlock);

module.exports = router;
