import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  Clock,
  Award,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  CheckCircle,
  FileCheck,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Key,
  X,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-Exam Instructions & Passcode Modal
  const [instructionModalExam, setInstructionModalExam] = useState(null);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/exams/available');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const openInstructionModal = (exam) => {
    setInstructionModalExam(exam);
    setAgreedToRules(false);
    setEnteredPasscode('');
    setPasscodeError('');
  };

  const handleLaunchExam = (e) => {
    e.preventDefault();
    if (!agreedToRules) {
      return;
    }

    if (instructionModalExam.requiresPasscode && !enteredPasscode.trim()) {
      return setPasscodeError('Please enter the invigilator passcode to enter');
    }

    const query = instructionModalExam.requiresPasscode
      ? `?passcode=${encodeURIComponent(enteredPasscode.trim())}`
      : '';

    navigate(`/exam/${instructionModalExam._id}/attempt${query}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const liveExams = data?.exams?.live || [];
  const upcomingExams = data?.exams?.upcoming || [];
  const completedExams = data?.exams?.completed || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/20 text-white border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Verified Examinee Portal
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">Welcome, {user?.name}!</h1>
          <p className="mt-2 text-blue-100 text-sm max-w-xl">
            View active examinations scheduled for your cohort, review official instructions, and sit for timed assessments.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1.5 min-w-[240px]">
          <p className="text-blue-200 uppercase font-semibold text-[10px] tracking-wider">Academic Profile</p>
          <p className="font-bold text-base text-white">{user?.course} &middot; Semester {user?.semester}</p>
          <p className="text-blue-100 font-mono">Enrolment: {user?.enrolmentNo || 'N/A'}</p>
          <p className="text-blue-200 truncate">{user?.email}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* SECTION 1: LIVE NOW ASSESSMENTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-xl font-bold text-slate-900">Live Examinations Available Now</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            {liveExams.length} Live
          </span>
        </div>

        {liveExams.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm text-slate-500 text-sm">
            No active tests currently open for your cohort ({user?.course} Semester {user?.semester}). Upcoming tests will appear automatically when their window starts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-3xl p-6 border-2 border-emerald-200/80 shadow-md shadow-emerald-500/5 hover:shadow-lg transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {exam.subjectId?.name || 'Academic Subject'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-pulse">
                      ● LIVE NOW
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{exam.title}</h3>

                  {exam.requiresPasscode && (
                    <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                      <Lock className="w-3 h-3" /> Invigilator Passcode Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-2xl text-center">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Duration</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" /> {exam.duration} mins
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Marks</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> {exam.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Passing %</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{exam.passingPercentage}%</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Closes:{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(exam.endTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => openInstructionModal(exam)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" /> Start Examination
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: COMPLETED EXAMINATIONS */}
      {completedExams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" /> Completed Examinations & Scorecards
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {completedExams.length} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {completedExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {exam.subjectId?.name}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        exam.status === 'pass'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {exam.status === 'pass' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl text-xs">
                  <div>
                    <p className="text-slate-500">Score Earned</p>
                    <p className="font-bold text-base text-slate-900">
                      {exam.score} / {exam.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Percentage</p>
                    <p className="font-bold text-base text-blue-700">{exam.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Submitted</p>
                    <p className="font-medium text-slate-700">
                      {new Date(exam.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/student/results/${exam.resultId}`}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition"
                >
                  <FileCheck className="w-4 h-4 text-blue-600" /> View Detailed Scorecard
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: UPCOMING EXAMINATIONS */}
      {upcomingExams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Examinations
            </h2>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
              {upcomingExams.length} Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingExams.map((exam) => (
              <div key={exam._id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {exam.subjectId?.name}
                </span>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{exam.title}</h4>
                <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration: {exam.duration} mins
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Opens:{' '}
                    <span className="font-medium text-slate-700">
                      {new Date(exam.startTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFICIAL PRE-EXAM REGULATIONS & PASSCODE MODAL */}
      {instructionModalExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Academic Assessment Guidelines
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{instructionModalExam.title}</h3>
                <p className="text-xs text-slate-500">{instructionModalExam.subjectId?.name}</p>
              </div>
              <button
                onClick={() => setInstructionModalExam(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Duration</span>
                <p className="font-bold text-slate-900">{instructionModalExam.duration} Minutes</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Marks</span>
                <p className="font-bold text-amber-600">{instructionModalExam.totalMarks} Marks</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Pass Benchmark</span>
                <p className="font-bold text-emerald-600">{instructionModalExam.passingPercentage}%</p>
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-2 text-xs text-slate-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
              <p className="font-bold text-amber-900 text-sm flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-amber-600" /> Candidate Code of Conduct:
              </p>
              <p>• <strong>Strict Server Timer:</strong> The countdown clock will decrement in real-time. When it hits 00:00:00, answers will be submitted automatically.</p>
              <p>• <strong>Anti-Cheat & Tab Monitoring:</strong> Switching browser tabs or minimizing the test window will trigger an audit alert log.</p>
              <p>• <strong>Auto-Save Feature:</strong> Selected options are stored in your local session. Refreshing will not lose your saved answers.</p>
              <p>• <strong>Single Attempt Guarantee:</strong> Once submitted, this examination cannot be re-taken.</p>
            </div>

            {/* Passcode input if required */}
            {instructionModalExam.requiresPasscode && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Enter Invigilator Passcode
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
                  <input
                    type="text"
                    required
                    value={enteredPasscode}
                    onChange={(e) => setEnteredPasscode(e.target.value)}
                    placeholder="e.g. JAVA2026"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 font-mono uppercase tracking-wider rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {passcodeError && <p className="text-xs text-rose-600">{passcodeError}</p>}
              </div>
            )}

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none pt-1">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>
                I have thoroughly read the instructions and agree to sit for this examination under academic integrity guidelines.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInstructionModalExam(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchExam}
                disabled={!agreedToRules}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" /> Launch Examination Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
