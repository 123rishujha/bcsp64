const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, requireAdmin, requireApprovedStudent } = require('../middleware/authMiddleware');

// Candidate routes (Protected & must be approved by admin with assigned semester)
router.get('/available', verifyToken, requireApprovedStudent, examController.getAvailableExams);
router.get('/:id/start', verifyToken, requireApprovedStudent, examController.startExam);
router.post('/:id/submit', verifyToken, requireApprovedStudent, examController.submitExam);

// Common / Admin routes
router.get('/', verifyToken, requireAdmin, examController.getExams);
router.get('/:id', verifyToken, examController.getExamById);
router.post('/', verifyToken, requireAdmin, examController.createExam);
router.put('/:id', verifyToken, requireAdmin, examController.updateExam);
router.delete('/:id', verifyToken, requireAdmin, examController.deleteExam);

module.exports = router;
