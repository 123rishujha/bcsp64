import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  ArrowLeft,
  Calendar,
  Clock,
  Check,
  X,
  GraduationCap,
} from 'lucide-react';

const ResultView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/results/${id}`);
        if (res.data.success) {
          setResult(res.data.result);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch scorecard');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl text-center border border-slate-200 shadow-sm">
        <XCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Scorecard Not Available</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'Could not load examination evaluation.'}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPass = result.status === 'pass';
  const candidate = result.student || {};
  const exam = result.exam || {};
  const breakdown = result.detailedBreakdown || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 printable-card">
      {/* Top Bar Navigation (Hidden when printing) */}
      <div className="flex items-center justify-between no-print">
        <Link
          to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print / Save Scorecard as PDF
        </button>
      </div>

      {/* Main Official Scorecard Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Certificate / Evaluation Header */}
        <div className={`p-8 text-white ${isPass ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-red-800'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-white/20 text-white border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                Official Examination Scorecard
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{exam.title}</h1>
              <p className="text-xs text-white/80">
                Discipline: <span className="font-semibold text-white">{exam.subjectId?.name || 'Academic Assessment'}</span>
              </p>
            </div>

            {/* Pass/Fail Large Badge */}
            <div className="text-center sm:text-right bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 self-start sm:self-center">
              <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest block">Qualification Outcome</span>
              <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2 justify-center sm:justify-end mt-0.5">
                {isPass ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                {isPass ? 'PASSED' : 'NEEDS REVISION'}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Identity Meta Strip */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Candidate Name</span>
            <p className="font-bold text-slate-900 mt-0.5">{candidate.name}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Enrolment Number</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{candidate.enrolmentNo || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Course & Semester</span>
            <p className="font-semibold text-slate-800 mt-0.5">{candidate.course} &middot; Sem {candidate.semester}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Submitted At</span>
            <p className="font-medium text-slate-700 mt-0.5">
              {new Date(result.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Performance Metric Tiles */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Score Earned</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {result.score} <span className="text-sm font-normal text-slate-500">/ {exam.totalMarks}</span>
            </p>
          </div>

          <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
            <span className="text-xs font-semibold text-blue-700 uppercase">Percentage</span>
            <p className="text-3xl font-black text-blue-950 mt-1">{result.percentage}%</p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Passing Threshold</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{exam.passingPercentage}%</p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Exam Duration</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{exam.duration}m</p>
          </div>
        </div>

        {/* Detailed Item-by-Item Question Audit Table */}
        <div className="px-8 pb-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Item-by-Item Evaluation Breakdown
          </h2>

          <div className="space-y-4">
            {breakdown.map((item, idx) => (
              <div
                key={item.questionId}
                className={`p-5 rounded-2xl border transition ${
                  item.isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : item.selectedOption === -1
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold flex items-center justify-center text-slate-700">
                      {idx + 1}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        item.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.selectedOption === -1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.isCorrect ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Correct (+{item.marksAwarded})
                        </>
                      ) : item.selectedOption === -1 ? (
                        'Unattempted (0)'
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" /> Incorrect (0/{item.maxMarks})
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    Max: {item.maxMarks} Mark{item.maxMarks > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="font-semibold text-slate-900 text-sm">{item.questionText}</p>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2">
                  {item.options.map((opt, optIdx) => {
                    const isCandidateChoice = optIdx === item.selectedOption;
                    const isCorrectAnswer = optIdx === item.correctOption;

                    let optStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isCorrectAnswer) {
                      optStyle = 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-950';
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      optStyle = 'bg-rose-100/70 border-rose-400 font-bold text-rose-950';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </span>

                        <div className="flex items-center gap-1 text-[11px]">
                          {isCandidateChoice && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-semibold">
                              Your Choice
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Correct Key
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
