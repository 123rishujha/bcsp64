const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required'],
  },
  questionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
  ],
  duration: {
    type: Number,
    required: [true, 'Exam duration in minutes is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  passingPercentage: {
    type: Number,
    required: true,
    default: 40,
    min: [0, 'Passing percentage cannot be negative'],
    max: [100, 'Passing percentage cannot exceed 100'],
  },
  startTime: {
    type: Date,
    required: [true, 'Exam availability start date/time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'Exam availability end date/time is required'],
  },
  eligibility: {
    targetCourse: {
      type: String,
      default: 'ALL',
      trim: true,
    },
    targetSemester: {
      type: String,
      default: 'ALL',
      trim: true,
    },
    accessType: {
      type: String,
      enum: ['open', 'batch', 'passcode'],
      default: 'open',
    },
    passcode: {
      type: String,
      trim: true,
      default: '',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Exam', examSchema);
