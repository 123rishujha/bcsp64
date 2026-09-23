const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, subjectController.getSubjects);
router.post('/', verifyToken, requireAdmin, subjectController.createSubject);
router.put('/:id', verifyToken, requireAdmin, subjectController.updateSubject);
router.delete('/:id', verifyToken, requireAdmin, subjectController.deleteSubject);

module.exports = router;
