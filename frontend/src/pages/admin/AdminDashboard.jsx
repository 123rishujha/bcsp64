import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  Users,
  FileSpreadsheet,
  HelpCircle,
  Award,
  PlusCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentActivity(res.data.recentActivity);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-blue-200 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider">
            Departmental Administrator
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">Assessment Command Center</h1>
          <p className="mt-2 text-slate-300 text-sm max-w-xl">
            Configure curricula, curate centralized MCQ banks, schedule timed examinations, and monitor real-time candidate scorecards.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/exams/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" /> Schedule New Exam
          </Link>
          <Link
            to="/admin/questions"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-semibold transition"
          >
            <HelpCircle className="w-4 h-4" /> Add MCQs
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Students</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalStudents || 0}</p>
            <Link to="/admin/students" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700">
              Manage Roster <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active / Total Exams</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalExams || 0}</p>
            <Link to="/admin/exams" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700">
              View Schedules <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question Bank Volume</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalQuestions || 0}</p>
            <Link to="/admin/questions" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700">
              Browse Bank <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Submissions</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalSubmissions || 0}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Server-Evaluated
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Access Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/subjects"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Academic Subjects</h3>
              <p className="text-xs text-slate-500">Organize subjects & courses with cascade checks</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/questions"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Centralized Question Bank</h3>
              <p className="text-xs text-slate-500">4-Option MCQs, marks, and difficulty filters</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/students"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Candidate Directory</h3>
              <p className="text-xs text-slate-500">Student rosters, batch approvals & suspensions</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Exam Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Candidate Exam Completions</h2>
            <p className="text-xs text-slate-500">Live submissions graded automatically by the server-side engine</p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No candidate submissions recorded yet. Once students take tests, their grades appear here live.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Enrolment No</th>
                  <th className="px-6 py-3.5">Examination</th>
                  <th className="px-6 py-3.5 text-center">Score Earned</th>
                  <th className="px-6 py-3.5 text-center">Percentage</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivity.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{sub.studentName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{sub.enrolmentNo}</td>
                    <td className="px-6 py-4 text-slate-700">{sub.examTitle}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{sub.score}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{sub.percentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === 'pass'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
