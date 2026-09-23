import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PendingAdmission from '../pages/student/PendingAdmission';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account approval & semester allocation check for students
  if (user.role === 'student' && (!user.isApproved || !user.semester)) {
    return <PendingAdmission />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-rose-200">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">403 Access Forbidden</h2>
          <p className="mt-2 text-slate-600 text-sm">
            You do not possess the required credentials to view this administrative resource.
          </p>
          <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
