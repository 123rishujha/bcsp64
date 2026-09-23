const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/students', verifyToken, requireAdmin, userController.getStudents);
router.get('/students/:id', verifyToken, requireAdmin, userController.getStudentById);
router.patch('/students/:id', verifyToken, requireAdmin, userController.updateStudentStatus);
router.patch('/students/:id/status', verifyToken, requireAdmin, userController.updateStudentStatus);
router.post('/students/promote-batch', verifyToken, requireAdmin, userController.promoteBatch);
router.delete('/students/:id', verifyToken, requireAdmin, userController.deleteStudent);

module.exports = router;
