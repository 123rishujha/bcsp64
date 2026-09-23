import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { Clock, RefreshCw, LogOut, CheckCircle2, ShieldAlert, GraduationCap, School } from 'lucide-react';

const PendingAdmission = () => {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const checkStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await axiosInstance.get('/auth/me');
      if (res.data.success) {
        const updated = res.data.user;
        localStorage.setItem('user', JSON.stringify(updated));

        if (updated.isApproved && updated.semester) {
          window.location.reload(); // Reloads to unlock the full Student Dashboard!
        } else {
          setStatusMessage('Your application is still under review by the department coordinator. Please check back shortly.');
        }
      }
    } catch (err) {
      setStatusMessage('Unable to connect to verification server. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-amber-50/30 to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-slate-200/70 p-8 border border-amber-200/80 text-center space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 shadow-md">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase">
            Pending
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admission Verification Pending</h2>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed">
            Welcome, <strong className="text-slate-900">{user?.name}</strong>. Your enrolment application has been received and is currently in the administrative verification queue.
          </p>
        </div>

        {/* Academic Application Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Name:</span>
            <span className="font-bold text-slate-900">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Enrolment Number:</span>
            <span className="font-mono font-bold text-slate-800">{user?.enrolmentNo || 'Under Verification'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Registered Course:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {user?.course || 'BCA'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Assigned Semester:</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Awaiting Admin Allocation
            </span>
          </div>
        </div>

        {/* Status Alert Note */}
        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 text-left space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <School className="w-4 h-4 text-amber-600" /> Administrative Protocol
          </p>
          <p className="text-[11px] text-amber-800 leading-normal">
            As soon as the examination controller approves your credentials and assigns your official academic semester, your testing portal and scheduled assessments will unlock automatically.
          </p>
        </div>

        {statusMessage && (
          <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl font-medium">
            {statusMessage}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Records...' : 'Check Approval Status'}
          </button>

          <button
            onClick={logout}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingAdmission;
