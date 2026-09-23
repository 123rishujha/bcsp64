const Result = require('../models/Result');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Question = require('../models/Question');

// @desc   Get current student's exam attempt history
// @route  GET /api/results/my-results
// @access Private (Student)
exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate({
        path: 'examId',
        select: 'title duration totalMarks passingPercentage subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student results', error: error.message });
  }
};

// @desc   Get single scorecard by Result ID
// @route  GET /api/results/:id
// @access Private (Student owner or Admin)
exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name email enrolmentNo course semester')
      .populate({
        path: 'examId',
        select: 'title duration totalMarks passingPercentage subjectId questionIds',
        populate: { path: 'subjectId', select: 'name' },
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result scorecard not found' });
    }

    // Security check: Candidate can only view their own result, Admin can view any
    if (req.user.role !== 'admin' && result.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this scorecard' });
    }

    // Fetch questions to build detailed item-by-item review
    const questions = await Question.find({ _id: { $in: result.examId.questionIds } });
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const responseMap = {};
    result.responses.forEach((r) => {
      responseMap[r.questionId.toString()] = r.selectedOption;
    });

    const detailedBreakdown = questions.map((q) => {
      const selected = responseMap[q._id.toString()] !== undefined ? responseMap[q._id.toString()] : -1;
      const isCorrect = selected !== -1 && selected === q.correctOption;
      return {
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        marksAwarded: isCorrect ? (q.marks || 1) : 0,
        maxMarks: q.marks || 1,
      };
    });

    res.json({
      success: true,
      result: {
        _id: result._id,
        student: result.studentId,
        exam: result.examId,
        score: result.score,
        percentage: result.percentage,
        status: result.status,
        submittedAt: result.submittedAt,
        detailedBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch result scorecard', error: error.message });
  }
};

// @desc   Get all candidate results for an exam (Gradebook view)
// @route  GET /api/results/exam/:examId
// @access Private (Admin)
exports.getExamResults = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { examId: req.params.examId };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const results = await Result.find(filter)
      .populate('studentId', 'name email enrolmentNo course semester')
      .populate('examId', 'title totalMarks passingPercentage')
      .sort({ submittedAt: -1 });

    let filteredResults = results;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResults = results.filter((r) => {
        const student = r.studentId;
        if (!student) return false;
        return (
          (student.name && student.name.toLowerCase().includes(searchLower)) ||
          (student.enrolmentNo && student.enrolmentNo.toLowerCase().includes(searchLower)) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
        );
      });
    }

    res.json({ success: true, count: filteredResults.length, results: filteredResults });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam results', error: error.message });
  }
};

// @desc   Get aggregate statistical analytics for an exam
// @route  GET /api/results/exam/:examId/analytics
// @access Private (Admin)
exports.getExamAnalytics = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('subjectId', 'name');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const results = await Result.find({ examId: exam._id });

    if (results.length === 0) {
      return res.json({
        success: true,
        examTitle: exam.title,
        subject: exam.subjectId?.name,
        totalMarks: exam.totalMarks,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        distribution: {
          below40: 0,
          from40to59: 0,
          from60to79: 0,
          from80to100: 0,
        },
      });
    }

    const totalAttempts = results.length;
    const scores = results.map((r) => r.score);
    const sumScore = scores.reduce((a, b) => a + b, 0);
    const averageScore = Number((sumScore / totalAttempts).toFixed(2));
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passCount = results.filter((r) => r.status === 'pass').length;
    const failCount = totalAttempts - passCount;
    const passRate = Number(((passCount / totalAttempts) * 100).toFixed(2));

    const distribution = {
      below40: 0,
      from40to59: 0,
      from60to79: 0,
      from80to100: 0,
    };

    results.forEach((r) => {
      const pct = r.percentage;
      if (pct < 40) distribution.below40 += 1;
      else if (pct < 60) distribution.from40to59 += 1;
      else if (pct < 80) distribution.from60to79 += 1;
      else distribution.from80to100 += 1;
    });

    res.json({
      success: true,
      examTitle: exam.title,
      subject: exam.subjectId?.name,
      totalMarks: exam.totalMarks,
      totalAttempts,
      averageScore,
      highestScore,
      lowestScore,
      passCount,
      failCount,
      passRate,
      distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute exam analytics', error: error.message });
  }
};

// @desc   Export exam gradebook to CSV
// @route  GET /api/results/exam/:examId/export-csv
// @access Private (Admin)
exports.exportGradebookCSV = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const results = await Result.find({ examId: exam._id })
      .populate('studentId', 'name email enrolmentNo course semester')
      .sort({ score: -1 });

    // Build CSV content
    const headers = [
      'Rank',
      'Student Name',
      'Enrolment Number',
      'Course',
      'Semester',
      'Email',
      'Score Earned',
      'Total Marks',
      'Percentage (%)',
      'Result Status',
      'Submission Timestamp',
    ];

    const rows = results.map((r, index) => {
      const s = r.studentId || {};
      return [
        index + 1,
        `"${(s.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(s.enrolmentNo || 'N/A').replace(/"/g, '""')}"`,
        `"${s.course || 'BCA'}"`,
        s.semester || 1,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        r.score,
        exam.totalMarks,
        r.percentage,
        r.status.toUpperCase(),
        `"${new Date(r.submittedAt).toISOString()}"`,
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gradebook_${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`
    );
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export CSV gradebook', error: error.message });
  }
};

// @desc   Get system-wide summary metrics for Admin Dashboard
// @route  GET /api/admin/stats
// @access Private (Admin)
exports.getAdminStats = async (req, res) => {
  try {
    const [totalStudents, totalExams, totalQuestions, totalSubmissions, recentSubmissions] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        Exam.countDocuments(),
        Question.countDocuments(),
        Result.countDocuments(),
        Result.find()
          .populate('studentId', 'name enrolmentNo')
          .populate('examId', 'title')
          .sort({ submittedAt: -1 })
          .limit(5),
      ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalExams,
        totalQuestions,
        totalSubmissions,
      },
      recentActivity: recentSubmissions.map((r) => ({
        id: r._id,
        studentName: r.studentId?.name || 'Deleted Candidate',
        enrolmentNo: r.studentId?.enrolmentNo || 'N/A',
        examTitle: r.examId?.title || 'Exam',
        score: r.score,
        percentage: r.percentage,
        status: r.status,
        submittedAt: r.submittedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  }
};
