const Question = require('../models/Question');
const Exam = require('../models/Exam');

// @desc   Get questions with filters
// @route  GET /api/questions
// @access Private (Admin)
exports.getQuestions = async (req, res) => {
  try {
    const { subjectId, difficulty, search } = req.query;
    const filter = {};

    if (subjectId && subjectId !== 'ALL') {
      filter.subjectId = subjectId;
    }
    if (difficulty && difficulty !== 'ALL') {
      filter.difficulty = difficulty;
    }
    if (search) {
      filter.questionText = { $regex: search, $options: 'i' };
    }

    const questions = await Question.find(filter)
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
  }
};

// @desc   Get single question by ID
// @route  GET /api/questions/:id
// @access Private (Admin)
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('subjectId', 'name');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch question', error: error.message });
  }
};

// @desc   Create new MCQ question
// @route  POST /api/questions
// @access Private (Admin)
exports.createQuestion = async (req, res) => {
  try {
    const { subjectId, questionText, options, correctOption, marks, difficulty } = req.body;

    if (!subjectId || !questionText || !options || correctOption === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId, questionText, 4 options, and the correct option index',
      });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ success: false, message: 'Exactly 4 options are required' });
    }

    const cleanOptions = options.map((opt) => String(opt).trim());
    if (cleanOptions.some((opt) => opt === '')) {
      return res.status(400).json({ success: false, message: 'All 4 options must be non-empty text strings' });
    }

    const correctIndex = Number(correctOption);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return res.status(400).json({ success: false, message: 'Correct option index must be between 0 and 3' });
    }

    const question = await Question.create({
      subjectId,
      questionText: questionText.trim(),
      options: cleanOptions,
      correctOption: correctIndex,
      marks: marks ? Math.max(1, Number(marks)) : 1,
      difficulty: difficulty || 'medium',
    });

    const populatedQuestion = await Question.findById(question._id).populate('subjectId', 'name');

    res.status(201).json({
      success: true,
      message: 'Question created successfully in question bank',
      question: populatedQuestion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create question', error: error.message });
  }
};

// @desc   Update MCQ question
// @route  PUT /api/questions/:id
// @access Private (Admin)
exports.updateQuestion = async (req, res) => {
  try {
    const { subjectId, questionText, options, correctOption, marks, difficulty } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (subjectId) question.subjectId = subjectId;
    if (questionText) question.questionText = questionText.trim();
    if (options) {
      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({ success: false, message: 'Exactly 4 options are required' });
      }
      question.options = options.map((opt) => String(opt).trim());
    }
    if (correctOption !== undefined) {
      const correctIndex = Number(correctOption);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        return res.status(400).json({ success: false, message: 'Correct option index must be 0, 1, 2, or 3' });
      }
      question.correctOption = correctIndex;
    }
    if (marks) question.marks = Math.max(1, Number(marks));
    if (difficulty) question.difficulty = difficulty;

    await question.save();
    const updated = await Question.findById(question._id).populate('subjectId', 'name');

    res.json({ success: true, message: 'Question updated successfully', question: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update question', error: error.message });
  }
};

// @desc   Delete MCQ question
// @route  DELETE /api/questions/:id
// @access Private (Admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Check if any active exams currently use this question
    const linkedExams = await Exam.find({ questionIds: question._id });
    if (linkedExams.length > 0) {
      const examTitles = linkedExams.map((e) => e.title).join(', ');
      return res.status(400).json({
        success: false,
        message: `Cannot delete question: It is currently assigned to active exam(s): ${examTitles}. Please remove it from the exam first.`,
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Question deleted successfully from question bank' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete question', error: error.message });
  }
};
