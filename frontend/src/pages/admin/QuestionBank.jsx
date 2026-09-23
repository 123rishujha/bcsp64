import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  HelpCircle,
  PlusCircle,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1,
    difficulty: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await axiosInstance.get('/subjects');
      if (res.data.success) {
        setSubjects(res.data.subjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSubject !== 'ALL') params.subjectId = selectedSubject;
      if (selectedDifficulty !== 'ALL') params.difficulty = selectedDifficulty;
      if (search) params.search = search;

      const res = await axiosInstance.get('/questions', { params });
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      subjectId: subjects.length > 0 ? subjects[0]._id : '',
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1,
      difficulty: 'medium',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setFormData({
      subjectId: q.subjectId?._id || q.subjectId,
      questionText: q.questionText,
      options: [...q.options],
      correctOption: q.correctOption,
      marks: q.marks,
      difficulty: q.difficulty,
    });
    setIsModalOpen(true);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.options.some((opt) => !opt.trim())) {
      return setError('All 4 answer options must be filled out');
    }

    setSubmitting(true);
    try {
      if (editingQuestion) {
        const res = await axiosInstance.put(`/questions/${editingQuestion._id}`, formData);
        if (res.data.success) {
          setMessage('MCQ updated successfully');
          fetchQuestions();
        }
      } else {
        const res = await axiosInstance.post('/questions', formData);
        if (res.data.success) {
          setMessage('New MCQ added to Question Bank');
          fetchQuestions();
        }
      }
      setIsModalOpen(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question from the bank?')) {
      return;
    }

    try {
      const res = await axiosInstance.delete(`/questions/${questionId}`);
      if (res.data.success) {
        setMessage(res.data.message);
        setQuestions(questions.filter((q) => q._id !== questionId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-blue-600" /> Centralized Question Bank
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain categorized Multiple Choice Questions (MCQs) with difficulty tagging and marks allocation.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" /> Add New Question
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question statement..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <span className="ml-auto text-slate-500 font-semibold">
            Questions in View: {questions.length}
          </span>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm text-slate-500 text-sm">
          No questions match your current filters. Click "Add New Question" to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={q._id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                    {q.subjectId?.name || 'General'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      q.difficulty === 'easy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : q.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {q.difficulty.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono">
                    {q.marks} Mark{q.marks > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit MCQ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete MCQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="font-semibold text-slate-900 text-base leading-relaxed">{q.questionText}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIndex) => {
                  const isCorrect = optIndex === q.correctOption;
                  return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editingQuestion ? 'Edit Question Details' : 'Add MCQ to Question Bank'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                  >
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Marks Awarded
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Question Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Enter the complete question prompt..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Four Answer Options & Select Correct Key (Radio)
                </label>
                <div className="space-y-2.5">
                  {formData.options.map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        formData.correctOption === optIndex
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={formData.correctOption === optIndex}
                        onChange={() => setFormData({ ...formData, correctOption: optIndex })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-600 w-5">
                        {String.fromCharCode(65 + optIndex)}:
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)} text`}
                        className="flex-1 py-1 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
