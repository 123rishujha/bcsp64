import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  Clock,
  Award,
  Users,
  BarChart3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${title}" and all its candidate submissions?`)) {
      return;
    }

    try {
      const res = await axiosInstance.delete(`/exams/${examId}`);
      if (res.data.success) {
        setMessage('Exam deleted successfully');
        setExams(exams.filter((e) => e._id !== examId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exam');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleActive = async (exam) => {
    try {
      const res = await axiosInstance.put(`/exams/${exam._id}`, { isActive: !exam.isActive });
      if (res.data.success) {
        setExams(exams.map((e) => (e._id === exam._id ? { ...e, isActive: !exam.isActive } : e)));
        setMessage(`Exam status toggled to ${!exam.isActive ? 'Active' : 'Inactive'}`);
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      setError('Failed to toggle exam status');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" /> Examination Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review configured examination schedules, inspect live attempts, and download gradebook analytics.
          </p>
        </div>
        <Link
          to="/admin/exams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" /> Schedule New Exam
        </Link>
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

      {/* Exams Roster */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm text-slate-500 text-sm">
          No exams scheduled yet. Click "Schedule New Exam" to create your first assessment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                    {exam.subjectId?.name || 'General Subject'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        exam.scheduleStatus === 'live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                          : exam.scheduleStatus === 'upcoming'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {exam.scheduleStatus === 'live'
                        ? '● LIVE NOW'
                        : exam.scheduleStatus === 'upcoming'
                        ? 'UPCOMING'
                        : 'CLOSED'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(exam)}
                      title="Toggle Active/Inactive"
                      className={`text-xs px-2 py-0.5 rounded font-semibold transition ${
                        exam.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {exam.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">{exam.title}</h3>

                {/* Eligibility Tag */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                    Cohort: {exam.eligibility?.targetCourse || 'ALL'} · Sem {exam.eligibility?.targetSemester || 'ALL'}
                  </span>
                  {exam.eligibility?.accessType === 'passcode' && (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                      <Key className="w-3 h-3" /> Passcode: {exam.eligibility.passcode}
                    </span>
                  )}
                </div>
              </div>

              {/* Exam Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-center">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Duration</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> {exam.duration}m
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Marks</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> {exam.totalMarks}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Questions</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{exam.questionCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Attempts</p>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {exam.submissionCount}
                  </p>
                </div>
              </div>

              {/* Schedule Timing Window */}
              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700">Window:</span>{' '}
                  {new Date(exam.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(exam.endTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <Link
                  to={`/admin/analytics/${exam._id}`}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Audit Analytics & Gradebook
                </Link>
                <button
                  onClick={() => handleDelete(exam._id, exam.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExams;
