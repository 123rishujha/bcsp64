import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  BarChart3,
  ArrowLeft,
  Download,
  Users,
  Award,
  TrendingUp,
  Percent,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';

const AdminAnalytics = () => {
  const { examId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, resultsRes] = await Promise.all([
          axiosInstance.get(`/results/exam/${examId}/analytics`),
          axiosInstance.get(`/results/exam/${examId}`),
        ]);

        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data);
        }
        if (resultsRes.data.success) {
          setResults(resultsRes.data.results);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handleExportCSV = () => {
    // Direct browser download
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/results/exam/${examId}/export-csv`;

    // Download using fetch with Authorization header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `gradebook_${examId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error('CSV export failed:', err));
  };

  const filteredResults = results.filter((r) => {
    const s = r.studentId || {};
    const matchesSearch =
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.enrolmentNo && s.enrolmentNo.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/admin/exams"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Examinations List
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            {analytics?.subject || 'Academic Discipline'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
            {analytics?.examTitle || 'Exam Analytics'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total Max Marks: {analytics?.totalMarks} &middot; Total Attempts Recorded: {analytics?.totalAttempts}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={results.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export Gradebook to CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Candidate Score</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
            {analytics?.averageScore || 0}{' '}
            <span className="text-xs font-normal text-slate-500">/ {analytics?.totalMarks}</span>
          </p>
          <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Mean performance
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Pass Rate</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{analytics?.passRate || 0}%</p>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {analytics?.passCount} Passed &middot; {analytics?.failCount} Failed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Highest Score Attained</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-1">
            {analytics?.highestScore || 0}{' '}
            <span className="text-xs font-normal text-slate-500">/ {analytics?.totalMarks}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 font-medium">Top candidate score</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lowest Score</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">
            {analytics?.lowestScore || 0}{' '}
            <span className="text-xs font-normal text-slate-500">/ {analytics?.totalMarks}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 font-medium">Minimum candidate score</p>
        </div>
      </div>

      {/* Score Distribution Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Score Distribution Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <p className="text-xs font-semibold text-rose-700 uppercase">Below 40% (Fail)</p>
            <p className="text-2xl font-black text-rose-900 mt-1">{analytics?.distribution?.below40 || 0}</p>
            <p className="text-[11px] text-rose-600">Candidates</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <p className="text-xs font-semibold text-amber-700 uppercase">40% - 59% (Pass)</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{analytics?.distribution?.from40to59 || 0}</p>
            <p className="text-[11px] text-amber-600">Candidates</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
            <p className="text-xs font-semibold text-blue-700 uppercase">60% - 79% (First Div)</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{analytics?.distribution?.from60to79 || 0}</p>
            <p className="text-[11px] text-blue-600">Candidates</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <p className="text-xs font-semibold text-emerald-700 uppercase">80% - 100% (Distinction)</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{analytics?.distribution?.from80to100 || 0}</p>
            <p className="text-[11px] text-emerald-600">Candidates</p>
          </div>
        </div>
      </div>

      {/* Candidate Gradebook Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Candidate Gradebook Roster</h2>
            <p className="text-xs text-slate-500">Individual candidate results with timestamps and score breakdowns</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Outcomes</option>
              <option value="pass">Passed Only</option>
              <option value="fail">Failed Only</option>
            </select>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No submissions recorded yet for this examination.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4">Enrolment No</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Submission Time</th>
                  <th className="px-6 py-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result, index) => (
                  <tr key={result._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-400 font-mono text-xs">#{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{result.studentId?.name || 'Candidate'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{result.studentId?.enrolmentNo || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {result.score} / {analytics?.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">{result.percentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          result.status === 'pass'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(result.submittedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/student/results/${result._id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Scorecard
                      </Link>
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

export default AdminAnalytics;
