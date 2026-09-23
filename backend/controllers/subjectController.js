const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

// @desc   Get all subjects with question count
// @route  GET /api/subjects
// @access Private (Admin & Student)
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });

    // Count questions per subject
    const counts = await Question.aggregate([
      { $group: { _id: '$subjectId', questionCount: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.questionCount;
    });

    const subjectsWithCount = subjects.map((sub) => ({
      ...sub.toObject(),
      questionCount: countMap[sub._id.toString()] || 0,
    }));

    res.json({ success: true, subjects: subjectsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects', error: error.message });
  }
};

// @desc   Create new academic subject
// @route  POST /api/subjects
// @access Private (Admin)
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const existingSubject = await Subject.findOne({ name: name.trim() });
    if (existingSubject) {
      return res.status(400).json({ success: false, message: 'A subject with this name already exists' });
    }

    const subject = await Subject.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create subject', error: error.message });
  }
};

// @desc   Update subject
// @route  PUT /api/subjects/:id
// @access Private (Admin)
exports.updateSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name.trim();
    if (description !== undefined) subject.description = description.trim();

    await subject.save();

    res.json({ success: true, message: 'Subject updated successfully', subject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subject', error: error.message });
  }
};

// @desc   Delete subject (with cascade safeguard)
// @route  DELETE /api/subjects/:id
// @access Private (Admin)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade protection check: Are there questions linked to this subject?
    const linkedQuestionsCount = await Question.countDocuments({ subjectId: subject._id });
    if (linkedQuestionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject: ${linkedQuestionsCount} questions are linked to this subject in the question bank. Please delete or reassign questions first.`,
      });
    }

    // Also check if any exams are linked
    const linkedExamsCount = await Exam.countDocuments({ subjectId: subject._id });
    if (linkedExamsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject: ${linkedExamsCount} exams are configured under this subject.`,
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subject', error: error.message });
  }
};
