import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  FileSpreadsheet,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  Key,
} from 'lucide-react';

const CreateExam = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [targetCourse, setTargetCourse] = useState('BCA');
  const [targetSemester, setTargetSemester] = useState('6');
  const [accessType, setAccessType] = useState('open');
  const [passcode, setPasscode] = useState('');

  // Default dates: Start now, End in 48 hours
  const now = new Date();
  const defaultStart = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const future = new Date(now.getTime() + 48 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(future);

  // Selected Question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axiosInstance.get('/subjects');
        if (res.data.success && res.data.subjects.length > 0) {
          setSubjects(res.data.subjects);
          setSubjectId(res.data.subjects[0]._id);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!subjectId) return;

    const fetchSubjectQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const res = await axiosInstance.get(`/questions?subjectId=${subjectId}`);
        if (res.data.success) {
          setAvailableQuestions(res.data.questions);
          // Auto-select all questions by default for quick creation
          setSelectedQuestionIds(res.data.questions.map((q) => q._id));
        }
      } catch (err) {
        console.error('Error loading subject questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchSubjectQuestions();
  }, [subjectId]);

  const toggleQuestion = (qId) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const selectAll = () => {
    setSelectedQuestionIds(availableQuestions.map((q) => q._id));
  };

  const deselectAll = () => {
    setSelectedQuestionIds([]);
  };

  // Compute live total marks
  const totalMarks = availableQuestions
    .filter((q) => selectedQuestionIds.includes(q._id))
    .reduce((sum, q) => sum + (q.marks || 1), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedQuestionIds.length === 0) {
      return setError('Please select at least 1 question for the examination');
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return setError('Exam closing time must be strictly after the start time');
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        subjectId,
        questionIds: selectedQuestionIds,
        duration: Number(duration),
        passingPercentage: Number(passingPercentage),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        targetCourse,
        targetSemester,
        accessType,
        passcode: accessType === 'passcode' ? passcode : '',
      };

      const res = await axiosInstance.post('/exams', payload);
      if (res.data.success) {
        navigate('/admin/exams');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule examination');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/admin/exams"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Examinations List
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" /> Configure & Schedule Examination
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define testing duration, specify eligible student cohorts, set calendar windows, and pick questions from the bank.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Exam Metadata */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
            Exam Details & Academic Discipline
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Examination Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. BCA-601: Computer Networks Final Assessment"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Subject
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Duration (in Minutes)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="300"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Passing Benchmark Percentage (%)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <Award className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Eligibility & Calendar Window */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
            Candidate Eligibility & Access Window
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Eligible Target Course
              </label>
              <select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Courses (Universal)</option>
                <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                <option value="MCA">MCA (Master of Computer Applications)</option>
                <option value="B.Tech">B.Tech (Computer Science)</option>
                <option value="B.Sc IT">B.Sc IT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Semester / Batch
              </label>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Active Window Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Active Window End Time
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Security Access Control
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="accessType"
                  value="open"
                  checked={accessType === 'open'}
                  onChange={() => setAccessType('open')}
                  className="w-4 h-4 text-blue-600"
                />
                Open to all eligible enrolled students
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="accessType"
                  value="passcode"
                  checked={accessType === 'passcode'}
                  onChange={() => setAccessType('passcode')}
                  className="w-4 h-4 text-blue-600"
                />
                Protected with Room / Invigilator Passcode
              </label>
            </div>

            {accessType === 'passcode' && (
              <div className="mt-3 max-w-xs">
                <div className="relative rounded-xl shadow-sm">
                  <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-amber-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. NET2026, JAVA_EXAM"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-900 font-mono rounded-xl text-sm focus:ring-2 focus:ring-amber-500 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Candidates must enter this passcode to launch the exam.</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Question Selection & Auto-Tally Total Marks */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
              Select Questions from Repository
            </h2>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                Selected: {selectedQuestionIds.length} / {availableQuestions.length} Questions
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                Total Marks: {totalMarks}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {loadingQuestions ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : availableQuestions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No questions found for the selected subject. Please add questions to the Question Bank first.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {availableQuestions.map((q, index) => {
                const isChecked = selectedQuestionIds.includes(q._id);
                return (
                  <div
                    key={q._id}
                    onClick={() => toggleQuestion(q._id)}
                    className={`p-4 rounded-2xl border text-sm cursor-pointer transition flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 text-blue-600 flex-shrink-0">
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-700">Q{index + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                          {q.marks} Mark{q.marks > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-sm leading-snug">{q.questionText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/exams"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition disabled:opacity-60"
          >
            {submitting ? 'Publishing Exam...' : 'Publish & Schedule Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
