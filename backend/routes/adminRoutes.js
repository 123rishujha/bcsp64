const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, requireAdmin, resultController.getAdminStats);

module.exports = router;
