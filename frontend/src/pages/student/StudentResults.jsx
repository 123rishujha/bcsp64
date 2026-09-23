import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Award, FileCheck, CheckCircle2, XCircle, Calendar, ArrowRight, BookOpen } from 'lucide-react';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/results/my-results');
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch scorecards');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-7 h-7 text-blue-600" /> My Examination Scorecards
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Historical record of all evaluated academic tests, score summaries, and performance breakdowns.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm text-slate-500 text-sm">
          You haven't completed any examinations yet. When you submit a test, your evaluation scorecard will be archived here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((result) => {
            const isPass = result.status === 'pass';
            const exam = result.examId || {};

            return (
              <div
                key={result._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {exam.subjectId?.name || 'Subject'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isPass
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPass ? 'PASSED' : 'REVISION'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 py-3 bg-slate-50 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">
                      {result.score} / {exam.totalMarks}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Percentage</span>
                    <p className="text-xl font-bold text-blue-700 mt-0.5">{result.percentage}%</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Submitted:{' '}
                  {new Date(result.submittedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                <Link
                  to={`/student/results/${result._id}`}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1 transition"
                >
                  <FileCheck className="w-4 h-4" /> View Detailed Review <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentResults;
