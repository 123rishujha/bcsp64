const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  responses: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
      selectedOption: {
        type: Number,
        default: -1, // -1 signifies unanswered question
      },
    },
  ],
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Enforce single-attempt policy: each student can submit an exam only once!
resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
