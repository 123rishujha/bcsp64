const User = require('../models/User');
const Result = require('../models/Result');

// @desc   Get all registered students with filters
// @route  GET /api/users/students
// @access Private (Admin)
exports.getStudents = async (req, res) => {
  try {
    const { course, semester, isApproved, search } = req.query;
    const filter = { role: 'student' };

    if (course && course !== 'ALL') {
      filter.course = course;
    }
    if (semester && semester !== 'ALL') {
      if (semester === 'unassigned') {
        filter.$or = [{ semester: null }, { semester: { $exists: false } }];
      } else {
        filter.semester = Number(semester);
      }
    }
    if (isApproved !== undefined && isApproved !== '' && isApproved !== 'ALL') {
      filter.isApproved = isApproved === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrolmentNo: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(filter).select('-password').sort({ createdAt: -1 });

    // Fetch attempt counts for each student
    const studentIds = students.map((s) => s._id);
    const attemptCounts = await Result.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', totalAttempts: { $sum: 1 } } },
    ]);

    const countMap = {};
    attemptCounts.forEach((c) => {
      countMap[c._id.toString()] = c.totalAttempts;
    });

    const studentsWithStats = students.map((s) => ({
      ...s.toObject(),
      totalAttempts: countMap[s._id.toString()] || 0,
    }));

    res.json({ success: true, count: studentsWithStats.length, students: studentsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

// @desc   Get single student with exam attempt history & performance audit
// @route  GET /api/users/students/:id
// @access Private (Admin)
exports.getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const results = await Result.find({ studentId: student._id })
      .populate({
        path: 'examId',
        select: 'title duration totalMarks passingPercentage subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      student,
      results,
      summary: {
        totalExamsAttempted: results.length,
        passedCount: results.filter((r) => r.status === 'pass').length,
        failedCount: results.filter((r) => r.status === 'fail').length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student details', error: error.message });
  }
};

// @desc   Update student status and assign/change semester (Promotion or Approval)
// @route  PATCH /api/users/students/:id
// @access Private (Admin)
exports.updateStudentStatus = async (req, res) => {
  try {
    const { isApproved, semester, course, enrolmentNo } = req.body;
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (isApproved !== undefined) {
      student.isApproved = Boolean(isApproved);
      if (student.isApproved) {
        student.approvedAt = new Date();
        student.approvedBy = req.user._id;
      }
    }

    if (semester !== undefined && semester !== null && semester !== '') {
      const semNum = Number(semester);
      if (semNum >= 1 && semNum <= 8) {
        student.semester = semNum;
      }
    }

    if (course) student.course = course.trim();
    if (enrolmentNo !== undefined) student.enrolmentNo = enrolmentNo.trim();

    await student.save();

    res.json({
      success: true,
      message: `Student updated: ${student.name} is now ${student.isApproved ? 'Approved' : 'Pending/Suspended'} in ${student.course} Semester ${student.semester || 'Unassigned'}`,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        course: student.course,
        semester: student.semester,
        enrolmentNo: student.enrolmentNo,
        isApproved: student.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
};

// @desc   Batch promote students to next semester (e.g. BCA Sem 3 -> Sem 4)
// @route  POST /api/users/students/promote-batch
// @access Private (Admin)
exports.promoteBatch = async (req, res) => {
  try {
    const { course, currentSemester, targetSemester } = req.body;

    if (!course || !currentSemester || !targetSemester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, currentSemester, and targetSemester',
      });
    }

    const cur = Number(currentSemester);
    const tgt = Number(targetSemester);

    const result = await User.updateMany(
      {
        role: 'student',
        course,
        semester: cur,
        isApproved: true,
      },
      {
        $set: { semester: tgt },
      }
    );

    res.json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} students from ${course} Semester ${cur} to Semester ${tgt}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to batch promote students', error: error.message });
  }
};

// @desc   Delete student record
// @route  DELETE /api/users/students/:id
// @access Private (Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Also delete any existing exam results for this student
    await Result.deleteMany({ studentId: student._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student and related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
  }
};
