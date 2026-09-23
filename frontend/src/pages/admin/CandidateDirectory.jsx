import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  ArrowUpRight,
  TrendingUp,
  X,
  Award,
  Layers,
  Calendar,
} from 'lucide-react';

const CandidateDirectory = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Edit / Assign Semester Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalForm, setModalForm] = useState({
    semester: 1,
    isApproved: true,
    enrolmentNo: '',
    course: 'BCA',
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Batch Promote Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    course: 'BCA',
    currentSemester: 3,
    targetSemester: 4,
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Student Dossier Modal
  const [dossierStudent, setDossierStudent] = useState(null);
  const [dossierResults, setDossierResults] = useState([]);
  const [dossierSummary, setDossierSummary] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (courseFilter !== 'ALL') params.course = courseFilter;
      if (semesterFilter !== 'ALL') params.semester = semesterFilter;
      if (statusFilter !== 'ALL') params.isApproved = statusFilter === 'approved';

      const res = await axiosInstance.get('/users/students', { params });
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch candidate directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseFilter, semesterFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setModalForm({
      semester: student.semester || 1,
      isApproved: student.isApproved,
      enrolmentNo: student.enrolmentNo || '',
      course: student.course || 'BCA',
    });
    setIsEditModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      const res = await axiosInstance.patch(`/users/students/${selectedStudent._id}`, modalForm);
      if (res.data.success) {
        setMessage(res.data.message);
        setIsEditModalOpen(false);
        fetchStudents();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update candidate record');
      setTimeout(() => setError(null), 3500);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleBatchPromoteSubmit = async (e) => {
    e.preventDefault();
    setBatchSubmitting(true);
    try {
      const res = await axiosInstance.post('/users/students/promote-batch', batchForm);
      if (res.data.success) {
        setMessage(res.data.message);
        setIsBatchModalOpen(false);
        fetchStudents();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to batch promote cohort');
      setTimeout(() => setError(null), 3500);
    } finally {
      setBatchSubmitting(false);
    }
  };

  const openDossier = async (studentId) => {
    try {
      setLoadingDossier(true);
      const res = await axiosInstance.get(`/users/students/${studentId}`);
      if (res.data.success) {
        setDossierStudent(res.data.student);
        setDossierResults(res.data.results);
        setDossierSummary(res.data.summary);
      }
    } catch (err) {
      setError('Failed to fetch candidate performance dossier');
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${studentName}" and all associated test records?`)) {
      return;
    }

    try {
      const res = await axiosInstance.delete(`/users/students/${studentId}`);
      if (res.data.success) {
        setMessage(res.data.message);
        setStudents(students.filter((s) => s._id !== studentId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" /> Candidate Directory, Onboarding & Promotion
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review pending admission applications, allocate semesters, promote batches, and audit academic dossiers.
          </p>
        </div>

        <button
          onClick={() => setIsBatchModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
        >
          <TrendingUp className="w-4 h-4" /> Batch Promote Semester
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by Name, Enrolment Number, or Email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5" /> Filter Cohorts:
          </span>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Courses</option>
            <option value="BCA">BCA</option>
            <option value="MCA">MCA</option>
            <option value="B.Tech">B.Tech</option>
            <option value="B.Sc IT">B.Sc IT</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Semesters</option>
            <option value="unassigned">⚠️ Unassigned (Pending Allocation)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Approved & Active</option>
            <option value="suspended">Pending Verification / Suspended</option>
          </select>

          <span className="ml-auto text-slate-500 font-semibold">
            Registered Candidates: {students.length}
          </span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No student candidates match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Enrolment Number</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Assigned Semester</th>
                  <th className="px-6 py-4 text-center">Admission Status</th>
                  <th className="px-6 py-4 text-center">Exams Taken</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const hasSemester = student.semester && student.semester >= 1;
                  const isReady = student.isApproved && hasSemester;

                  return (
                    <tr key={student._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDossier(student._id)}
                          className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-2.5 text-left group"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="group-hover:underline">{student.name}</p>
                            <p className="text-[11px] text-slate-400 font-normal">{student.email}</p>
                          </div>
                        </button>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        {student.enrolmentNo || <span className="text-slate-400 italic">Not Provided</span>}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                          {student.course}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {hasSemester ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                            Semester {student.semester}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 w-max">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            student.isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {student.isApproved ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Approved
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" /> Pending Verification
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDossier(student._id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        >
                          {student.totalAttempts || 0} Attempts <ArrowUpRight className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {!hasSemester || !student.isApproved ? 'Approve / Assign' : 'Change Sem'}
                        </button>

                        <button
                          onClick={() => handleDelete(student._id, student.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Edit / Assign Semester Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Manage Enrolment & Semester</h3>
                <p className="text-xs text-slate-500">{selectedStudent.name}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Enrolment Number
                </label>
                <input
                  type="text"
                  value={modalForm.enrolmentNo}
                  onChange={(e) => setModalForm({ ...modalForm, enrolmentNo: e.target.value })}
                  placeholder="e.g. 2400042128"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Course Degree
                  </label>
                  <select
                    value={modalForm.course}
                    onChange={(e) => setModalForm({ ...modalForm, course: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.Sc IT">B.Sc IT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Assign / Change Semester
                  </label>
                  <select
                    value={modalForm.semester}
                    onChange={(e) => setModalForm({ ...modalForm, semester: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 uppercase mb-2">
                  Admission Verification Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="statusChoice"
                      checked={modalForm.isApproved === true}
                      onChange={() => setModalForm({ ...modalForm, isApproved: true })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="font-semibold text-emerald-700">Approve & Unlock Exams</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="statusChoice"
                      checked={modalForm.isApproved === false}
                      onChange={() => setModalForm({ ...modalForm, isApproved: false })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-amber-700 font-semibold">Pending / Suspend</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {modalSubmitting ? 'Saving Changes...' : 'Save & Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Batch Promotion Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Batch Semester Promotion</h3>
                <p className="text-xs text-slate-500">Promote an entire cohort into their subsequent semester</p>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchPromoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Target Degree Program
                </label>
                <select
                  value={batchForm.course}
                  onChange={(e) => setBatchForm({ ...batchForm, course: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                >
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.Sc IT">B.Sc IT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    From Current Semester
                  </label>
                  <select
                    value={batchForm.currentSemester}
                    onChange={(e) => setBatchForm({ ...batchForm, currentSemester: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Promote To Semester
                  </label>
                  <select
                    value={batchForm.targetSemester}
                    onChange={(e) => setBatchForm({ ...batchForm, targetSemester: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-indigo-50 border border-indigo-300 text-indigo-900 rounded-xl text-sm font-bold"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-800 text-[11px] leading-relaxed">
                All approved candidates currently in <strong>{batchForm.course} Semester {batchForm.currentSemester}</strong> will immediately have their eligibility updated to <strong>Semester {batchForm.targetSemester}</strong>.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {batchSubmitting ? 'Promoting Cohort...' : 'Execute Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Candidate Academic Dossier Modal */}
      {dossierStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] uppercase">
                  Candidate Academic Dossier
                </span>
                <h3 className="font-extrabold text-slate-900 text-xl mt-1">{dossierStudent.name}</h3>
                <p className="text-xs text-slate-500">
                  {dossierStudent.course} &middot; Semester {dossierStudent.semester || 'Unassigned'} &middot; Enrolment: {dossierStudent.enrolmentNo || 'N/A'}
                </p>
              </div>
              <button onClick={() => setDossierStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Summary Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tests</span>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dossierSummary?.totalExamsAttempted || 0}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Passed</span>
                <p className="text-2xl font-black text-emerald-900 mt-0.5">{dossierSummary?.passedCount || 0}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] text-rose-700 font-bold uppercase">Failed</span>
                <p className="text-2xl font-black text-rose-900 mt-0.5">{dossierSummary?.failedCount || 0}</p>
              </div>
            </div>

            {/* Test Attempts List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Historical Assessment Submissions</h4>
              {dossierResults.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No test submissions on record yet for this candidate.</p>
              ) : (
                <div className="space-y-2.5">
                  {dossierResults.map((r) => (
                    <div
                      key={r._id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{r.examId?.title || 'Examination'}</p>
                        <p className="text-[11px] text-slate-500">
                          {r.examId?.subjectId?.name} &middot; {new Date(r.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-slate-900">{r.score} / {r.examId?.totalMarks}</p>
                          <p className="text-[11px] text-blue-700 font-semibold">{r.percentage}%</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDossierStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDirectory;
