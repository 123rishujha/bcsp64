const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, questionController.getQuestions);
router.get('/:id', verifyToken, requireAdmin, questionController.getQuestionById);
router.post('/', verifyToken, requireAdmin, questionController.createQuestion);
router.put('/:id', verifyToken, requireAdmin, questionController.updateQuestion);
router.delete('/:id', verifyToken, requireAdmin, questionController.deleteQuestion);

module.exports = router;
