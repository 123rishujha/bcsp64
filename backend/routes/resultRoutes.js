const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/my-results', verifyToken, resultController.getMyResults);
router.get('/exam/:examId/analytics', verifyToken, requireAdmin, resultController.getExamAnalytics);
router.get('/exam/:examId/export-csv', verifyToken, requireAdmin, resultController.exportGradebookCSV);
router.get('/exam/:examId', verifyToken, requireAdmin, resultController.getExamResults);
router.get('/:id', verifyToken, resultController.getResultById);

module.exports = router;
