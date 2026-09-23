import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Subjects from './pages/admin/Subjects';
import QuestionBank from './pages/admin/QuestionBank';
import AdminExams from './pages/admin/AdminExams';
import CreateExam from './pages/admin/CreateExam';
import CandidateDirectory from './pages/admin/CandidateDirectory';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ExamAttempt from './pages/student/ExamAttempt';
import ResultView from './pages/student/ResultView';
import StudentResults from './pages/student/StudentResults';

// Smart Root Redirector
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subjects"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Subjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <QuestionBank />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminExams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams/create"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CreateExam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CandidateDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics/:examId"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Protected Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/results"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/results/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'student']}>
                    <ResultView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/attempt"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ExamAttempt />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
