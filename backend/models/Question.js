const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Question must be associated with a Subject'],
  },
  questionText: {
    type: String,
    required: [true, 'Question statement cannot be blank'],
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length === 4 && v.every(opt => typeof opt === 'string' && opt.trim().length > 0);
      },
      message: 'Question must contain exactly 4 non-empty answer options',
    },
    required: [true, 'Four options are required'],
  },
  correctOption: {
    type: Number,
    required: [true, 'Correct option index (0-3) is required'],
    min: [0, 'Index must be between 0 and 3'],
    max: [3, 'Index must be between 0 and 3'],
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Marks cannot be negative or zero'],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Question', questionSchema);
