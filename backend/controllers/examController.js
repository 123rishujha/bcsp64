const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

// @desc   Create and schedule a new examination
// @route  POST /api/exams
// @access Private (Admin)
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      questionIds,
      duration,
      passingPercentage,
      startTime,
      endTime,
      targetCourse,
      targetSemester,
      accessType,
      passcode,
    } = req.body;

    if (!title || !subjectId || !questionIds || !duration || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, subjectId, questionIds, duration, startTime, and endTime',
      });
    }

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one question for the exam' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format' });
    }

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be strictly after start time' });
    }

    // Retrieve questions to verify and calculate totalMarks automatically
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected questions do not exist' });
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const exam = await Exam.create({
      title: title.trim(),
      subjectId,
      questionIds,
      duration: Math.max(1, Number(duration)),
      totalMarks,
      passingPercentage: passingPercentage !== undefined ? Number(passingPercentage) : 40,
      startTime: start,
      endTime: end,
      eligibility: {
        targetCourse: targetCourse ? targetCourse.trim() : 'ALL',
        targetSemester: targetSemester ? String(targetSemester).trim() : 'ALL',
        accessType: accessType || 'open',
        passcode: passcode ? passcode.trim() : '',
      },
      createdBy: req.user._id,
      isActive: true,
    });

    const populatedExam = await Exam.findById(exam._id).populate('subjectId', 'name');

    res.status(201).json({
      success: true,
      message: 'Examination configured and scheduled successfully',
      exam: populatedExam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }
};

// @desc   Get all exams (Admin view)
// @route  GET /api/exams
// @access Private (Admin)
exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('subjectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);
    const submissionCounts = await Result.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: '$examId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    submissionCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const examsWithStats = exams.map((exam) => {
      const now = new Date();
      let scheduleStatus = 'upcoming';
      if (now > exam.endTime) {
        scheduleStatus = 'closed';
      } else if (now >= exam.startTime && now <= exam.endTime) {
        scheduleStatus = 'live';
      }

      return {
        ...exam.toObject(),
        submissionCount: countMap[exam._id.toString()] || 0,
        questionCount: exam.questionIds.length,
        scheduleStatus,
      };
    });

    res.json({ success: true, count: examsWithStats.length, exams: examsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

// @desc   Get single exam details
// @route  GET /api/exams/:id
// @access Private (Admin)
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subjectId', 'name')
      .populate('questionIds');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
  }
};

// @desc   Update exam configuration
// @route  PUT /api/exams/:id
// @access Private (Admin)
exports.updateExam = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      questionIds,
      duration,
      passingPercentage,
      startTime,
      endTime,
      targetCourse,
      targetSemester,
      accessType,
      passcode,
      isActive,
    } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (title) exam.title = title.trim();
    if (subjectId) exam.subjectId = subjectId;
    if (duration) exam.duration = Math.max(1, Number(duration));
    if (passingPercentage !== undefined) exam.passingPercentage = Number(passingPercentage);
    if (startTime) exam.startTime = new Date(startTime);
    if (endTime) exam.endTime = new Date(endTime);
    if (isActive !== undefined) exam.isActive = Boolean(isActive);

    if (exam.endTime <= exam.startTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    if (questionIds && Array.isArray(questionIds)) {
      const questions = await Question.find({ _id: { $in: questionIds } });
      exam.questionIds = questionIds;
      exam.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    if (targetCourse || targetSemester || accessType !== undefined || passcode !== undefined) {
      exam.eligibility = {
        targetCourse: targetCourse !== undefined ? targetCourse.trim() : exam.eligibility.targetCourse,
        targetSemester: targetSemester !== undefined ? String(targetSemester).trim() : exam.eligibility.targetSemester,
        accessType: accessType !== undefined ? accessType : exam.eligibility.accessType,
        passcode: passcode !== undefined ? passcode.trim() : exam.eligibility.passcode,
      };
    }

    await exam.save();
    const updated = await Exam.findById(exam._id).populate('subjectId', 'name');

    res.json({ success: true, message: 'Exam updated successfully', exam: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
  }
};

// @desc   Delete exam and associated results
// @route  DELETE /api/exams/:id
// @access Private (Admin)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    await Result.deleteMany({ examId: exam._id });
    await Exam.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Exam and related results deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }
};

// @desc   Get candidate-eligible examinations (Live, Upcoming, Completed)
// @route  GET /api/exams/available
// @access Private (Student)
exports.getAvailableExams = async (req, res) => {
  try {
    const student = req.user;
    const now = new Date();

    // Fetch active exams
    const allActiveExams = await Exam.find({ isActive: true })
      .populate('subjectId', 'name')
      .sort({ startTime: 1 });

    // Filter by student eligibility (Course & Semester matching)
    const eligibleExams = allActiveExams.filter((exam) => {
      const matchCourse =
        !exam.eligibility ||
        exam.eligibility.targetCourse === 'ALL' ||
        exam.eligibility.targetCourse.toUpperCase() === (student.course || 'BCA').toUpperCase();

      const matchSemester =
        !exam.eligibility ||
        exam.eligibility.targetSemester === 'ALL' ||
        String(exam.eligibility.targetSemester) === String(student.semester || 1);

      return matchCourse && matchSemester;
    });

    // Fetch past results of this student
    const studentResults = await Result.find({ studentId: student._id });
    const resultMap = {};
    studentResults.forEach((r) => {
      resultMap[r.examId.toString()] = r;
    });

    const categorized = {
      live: [],
      upcoming: [],
      completed: [],
    };

    eligibleExams.forEach((exam) => {
      const examIdStr = exam._id.toString();
      const priorResult = resultMap[examIdStr];

      if (priorResult) {
        categorized.completed.push({
          ...exam.toObject(),
          hasAttempted: true,
          resultId: priorResult._id,
          score: priorResult.score,
          percentage: priorResult.percentage,
          status: priorResult.status,
          submittedAt: priorResult.submittedAt,
        });
      } else if (now < exam.startTime) {
        categorized.upcoming.push({
          ...exam.toObject(),
          hasAttempted: false,
        });
      } else if (now >= exam.startTime && now <= exam.endTime) {
        categorized.live.push({
          ...exam.toObject(),
          hasAttempted: false,
          requiresPasscode: exam.eligibility?.accessType === 'passcode',
        });
      }
      // If now > exam.endTime and not attempted, exam has expired for this student
    });

    res.json({
      success: true,
      studentBatch: { course: student.course, semester: student.semester },
      counts: {
        live: categorized.live.length,
        upcoming: categorized.upcoming.length,
        completed: categorized.completed.length,
      },
      exams: categorized,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch available exams', error: error.message });
  }
};

// @desc   Deliver sanitized exam payload to student (ANTI-CHEAT: strips correctOption)
// @route  GET /api/exams/:id/start
// @access Private (Student)
exports.startExam = async (req, res) => {
  try {
    const { passcode } = req.query;
    const student = req.user;

    const exam = await Exam.findById(req.params.id)
      .populate('subjectId', 'name')
      .populate({
        path: 'questionIds',
        // CRITICAL ANTI-CHEAT: Exclude correctOption!
        select: '_id questionText options marks difficulty',
      });

    if (!exam || !exam.isActive) {
      return res.status(404).json({ success: false, message: 'Exam not found or is currently inactive' });
    }

    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      return res.status(400).json({
        success: false,
        message: `Exam is not accessible now. Active window: ${exam.startTime.toLocaleString()} to ${exam.endTime.toLocaleString()}`,
      });
    }

    // Verify passcode if required
    if (exam.eligibility?.accessType === 'passcode' && exam.eligibility.passcode) {
      if (!passcode || passcode.trim() !== exam.eligibility.passcode.trim()) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Exam Access Passcode. Please request the room invigilator for the code.',
        });
      }
    }

    // Verify student has not already attempted (Single Attempt Policy)
    const priorSubmission = await Result.findOne({ studentId: student._id, examId: exam._id });
    if (priorSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted and submitted this examination. Re-attempts are prohibited.',
        resultId: priorSubmission._id,
      });
    }

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        subject: exam.subjectId?.name || 'General',
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingPercentage: exam.passingPercentage,
        startTime: exam.startTime,
        endTime: exam.endTime,
        serverTime: new Date(),
        questions: exam.questionIds,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to launch exam session', error: error.message });
  }
};

// @desc   Submit responses, execute server-side grading, and return instant scorecard
// @route  POST /api/exams/:id/submit
// @access Private (Student)
exports.submitExam = async (req, res) => {
  try {
    const student = req.user;
    const { responses } = req.body; // Array of { questionId, selectedOption }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Enforce single-attempt policy
    const priorSubmission = await Result.findOne({ studentId: student._id, examId: exam._id });
    if (priorSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate submission rejected: You have already submitted this exam.',
        resultId: priorSubmission._id,
      });
    }

    // Retrieve master question bank keys with correctOption and marks
    const questions = await Question.find({ _id: { $in: exam.questionIds } });
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    let totalScore = 0;
    const detailedBreakdown = [];
    const sanitizedResponses = [];

    // Map responses by questionId for fast lookup
    const studentAnswerMap = {};
    if (Array.isArray(responses)) {
      responses.forEach((resp) => {
        if (resp && resp.questionId) {
          studentAnswerMap[resp.questionId.toString()] =
            resp.selectedOption !== undefined && resp.selectedOption !== null
              ? Number(resp.selectedOption)
              : -1;
        }
      });
    }

    // Grade every question in the exam
    exam.questionIds.forEach((qId) => {
      const q = questionMap[qId.toString()];
      if (q) {
        const studentChoice = studentAnswerMap[q._id.toString()] !== undefined
          ? studentAnswerMap[q._id.toString()]
          : -1;

        sanitizedResponses.push({
          questionId: q._id,
          selectedOption: studentChoice,
        });

        const isCorrect = studentChoice !== -1 && studentChoice === q.correctOption;
        const marksAwarded = isCorrect ? (q.marks || 1) : 0;
        totalScore += marksAwarded;

        detailedBreakdown.push({
          questionId: q._id,
          questionText: q.questionText,
          options: q.options,
          selectedOption: studentChoice,
          correctOption: q.correctOption,
          isCorrect,
          marksAwarded,
          maxMarks: q.marks || 1,
        });
      }
    });

    const percentage = exam.totalMarks > 0 ? Number(((totalScore / exam.totalMarks) * 100).toFixed(2)) : 0;
    const status = percentage >= exam.passingPercentage ? 'pass' : 'fail';

    const result = await Result.create({
      studentId: student._id,
      examId: exam._id,
      responses: sanitizedResponses,
      score: totalScore,
      percentage,
      status,
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Exam submitted and graded successfully',
      resultId: result._id,
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      status,
      passingPercentage: exam.passingPercentage,
      submittedAt: result.submittedAt,
      detailedBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error evaluating exam submission', error: error.message });
  }
};
