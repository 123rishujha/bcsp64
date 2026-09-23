import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  ShieldAlert,
  Maximize,
  Minimize,
  EyeOff,
} from 'lucide-react';

const ExamAttempt = () => {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const passcode = searchParams.get('passcode') || '';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: selectedOptionIndex }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: true }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anti-Cheat: Tab Switch & Window Focus Monitor
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef(null);
  const hasAutoSubmitted = useRef(false);

  // Storage keys for local persistence
  const STORAGE_KEY_ANSWERS = `exam_${examId}_answers_${user?._id}`;
  const STORAGE_KEY_MARKED = `exam_${examId}_marked_${user?._id}`;
  const STORAGE_KEY_START = `exam_${examId}_start_${user?._id}`;

  // 1. Fetch Exam Data & Questions
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const url = `/exams/${examId}/start${passcode ? `?passcode=${encodeURIComponent(passcode)}` : ''}`;
        const res = await axiosInstance.get(url);

        if (res.data.success) {
          const examData = res.data.exam;
          setExam(examData);
          setQuestions(examData.questions || []);

          // Calculate total duration in seconds
          const totalSeconds = (examData.duration || 30) * 60;

          // Retrieve or establish start epoch timestamp for epoch delta calculation
          let sessionStart = localStorage.getItem(STORAGE_KEY_START);
          if (!sessionStart) {
            sessionStart = Date.now().toString();
            localStorage.setItem(STORAGE_KEY_START, sessionStart);
          }

          const elapsedSeconds = Math.floor((Date.now() - parseInt(sessionStart, 10)) / 1000);
          const remaining = Math.max(0, totalSeconds - elapsedSeconds);
          setTimeLeft(remaining);

          // Restore previously cached answers & marked questions if present
          const cachedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
          if (cachedAnswers) {
            try {
              setAnswers(JSON.parse(cachedAnswers));
            } catch (e) {
              console.error('Failed to parse cached answers');
            }
          }

          const cachedMarked = localStorage.getItem(STORAGE_KEY_MARKED);
          if (cachedMarked) {
            try {
              setMarkedForReview(JSON.parse(cachedMarked));
            } catch (e) {
              console.error('Failed to parse cached marked questions');
            }
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start examination session');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, passcode]);

  // 2. Anti-Cheat: Tab Switch & Window Focus Monitor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          return next;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        setShowTabWarning(true);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 3. Automated Evaluation Submission Function
  const submitExamPayload = useCallback(async () => {
    if (isSubmitting || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    setIsSubmitting(true);

    try {
      const responseArray = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
      }));

      const res = await axiosInstance.post(`/exams/${examId}/submit`, {
        responses: responseArray,
      });

      if (res.data.success) {
        // Clear local storage cache
        localStorage.removeItem(STORAGE_KEY_ANSWERS);
        localStorage.removeItem(STORAGE_KEY_MARKED);
        localStorage.removeItem(STORAGE_KEY_START);
        navigate(`/student/results/${res.data.resultId}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert(err.response?.data?.message || 'Error submitting test responses. Please contact invigilator.');
      setIsSubmitting(false);
    }
  }, [answers, examId, isSubmitting, questions, STORAGE_KEY_ANSWERS, STORAGE_KEY_MARKED, STORAGE_KEY_START, navigate]);

  // 4. Epoch Delta Live Countdown Timer Hook
  useEffect(() => {
    if (loading || !exam || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      const sessionStart = localStorage.getItem(STORAGE_KEY_START);
      if (sessionStart) {
        const totalSeconds = (exam.duration || 30) * 60;
        const elapsed = Math.floor((Date.now() - parseInt(sessionStart, 10)) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setTimeLeft(remaining);

        // Auto-Submit Daemon on 00:00:00
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          submitExamPayload();
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, exam, timeLeft, submitExamPayload, STORAGE_KEY_START]);

  // Handle Radio Selection with Local Storage Caching
  const handleSelectOption = (optionIndex) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updatedAnswers = {
      ...answers,
      [currentQ._id]: optionIndex,
    };
    setAnswers(updatedAnswers);
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(updatedAnswers));
  };

  // Toggle "Mark for Review"
  const toggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updatedMarked = { ...markedForReview };
    if (updatedMarked[currentQ._id]) {
      delete updatedMarked[currentQ._id];
    } else {
      updatedMarked[currentQ._id] = true;
    }
    setMarkedForReview(updatedMarked);
    localStorage.setItem(STORAGE_KEY_MARKED, JSON.stringify(updatedMarked));
  };

  // Clear current question selection
  const handleClearChoice = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updatedAnswers = { ...answers };
    delete updatedAnswers[currentQ._id];
    setAnswers(updatedAnswers);
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(updatedAnswers));
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-300 font-medium text-sm">Initializing secure examination environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-rose-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  // Format Time Display (MM:SS)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300; // < 5 minutes

  const isCurrentAnswered = answers[currentQ?._id] !== undefined;
  const isCurrentMarked = Boolean(markedForReview[currentQ?._id]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 1. Sticky Examination Header with Synchronized Live Timer */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-md">
                {exam?.title}
              </h1>
              <p className="text-[11px] text-slate-400">
                Subject: <span className="text-slate-200 font-medium">{exam?.subject}</span> &middot; Total Marks: {exam?.totalMarks}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition hidden sm:flex"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Live Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-base transition ${
                isUrgent
                  ? 'bg-rose-600 text-white animate-bounce'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>

            {/* Final Submit Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* Anti-Cheat Tab Switch Warning Banner */}
      {showTabWarning && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            ⚠️ Attention: Window focus lost / Tab switch detected ({tabSwitchCount} incident{tabSwitchCount > 1 ? 's' : ''}). Please stay on the examination window.
          </span>
          <button
            onClick={() => setShowTabWarning(false)}
            className="text-[11px] underline font-semibold ml-2"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* 2. Main Test Arena Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Active Question Card & Navigation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 flex-1">
            {/* Question Counter Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-xs">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs">
                  {currentQ?.marks || 1} Mark{currentQ?.marks > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Mark for Review Button */}
                <button
                  onClick={toggleMarkForReview}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isCurrentMarked
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isCurrentMarked ? 'fill-purple-600' : ''}`} />
                  {isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}
                </button>

                {isCurrentAnswered && (
                  <button
                    onClick={handleClearChoice}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Choice
                  </button>
                )}
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-slate-900 font-semibold text-lg sm:text-xl leading-relaxed">
              {currentQ?.questionText}
            </div>

            {/* 4 Clickable Answer Options */}
            <div className="space-y-3 pt-2">
              {currentQ?.options?.map((optionText, optIndex) => {
                const isSelected = answers[currentQ._id] === optIndex;
                return (
                  <label
                    key={optIndex}
                    onClick={() => handleSelectOption(optIndex)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span className={`text-sm sm:text-base leading-snug ${isSelected ? 'font-bold text-blue-950' : 'text-slate-800'}`}>
                      {optionText}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Previous / Next Toolbar */}
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Saved in LocalStorage <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600 ml-1" />
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Question Palette Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Question Palette</span>
              <span className="text-xs font-semibold text-slate-500">
                {answeredCount}/{questions.length} Attempted
              </span>
            </h3>

            {/* Comprehensive 4-State CBT Color Legend */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500"></span>
                <span className="text-slate-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-200"></span>
                <span className="text-slate-600">Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500"></span>
                <span className="text-slate-600">Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-emerald-500 to-purple-500"></span>
                <span className="text-slate-600">Ans & Review</span>
              </div>
            </div>

            {/* Number Jump Grid */}
            <div className="grid grid-cols-5 gap-2.5 pt-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q._id] !== undefined;
                const isMarked = Boolean(markedForReview[q._id]);
                const isCurrent = idx === currentIndex;

                let btnStyle = 'bg-slate-100 hover:bg-slate-200 text-slate-700';
                if (isAnswered && isMarked) {
                  btnStyle = 'bg-gradient-to-tr from-emerald-500 to-purple-600 text-white shadow-sm';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
                } else if (isMarked) {
                  btnStyle = 'bg-purple-500 text-white shadow-sm shadow-purple-500/20';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs transition relative flex items-center justify-center ${
                      isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                    } ${btnStyle}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Candidate Identity Strip */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="font-mono text-[11px]">Enrolment: {user?.enrolmentNo || 'N/A'}</p>
              <p className="text-[11px] text-slate-500">{user?.course} Sem {user?.semester}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Confirm Final Submission</h3>
                <p className="text-xs text-slate-500">Are you sure you want to conclude your exam?</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs">
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-emerald-700 font-semibold text-[10px] uppercase">Answered</p>
                <p className="text-xl font-bold text-emerald-900 mt-0.5">{answeredCount}</p>
              </div>
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-purple-700 font-semibold text-[10px] uppercase">For Review</p>
                <p className="text-xl font-bold text-purple-900 mt-0.5">{markedCount}</p>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-700 font-semibold text-[10px] uppercase">Unanswered</p>
                <p className="text-xl font-bold text-amber-900 mt-0.5">{unansweredCount}</p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                You still have {unansweredCount} unanswered questions remaining.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={submitExamPayload}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAttempt;
