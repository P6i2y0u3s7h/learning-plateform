import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Enrollment, UserProfile, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminEnrollments: React.FC = () => {
  useDocumentTitle('Enrollment Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [enrList, studentList, courseList] = await Promise.all([
          adminService.getEnrollments(),
          adminService.getStudents(),
          adminService.getCourses(),
        ]);
        if (isMounted) {
          setEnrollments(enrList);
          setStudents(studentList);
          setCourses(courseList);
          if (studentList.length > 0) setSelectedStudentId(studentList[0].uid);
          if (courseList.length > 0) setSelectedCourseId(courseList[0].id);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminEnrollments] Error loading enrollments:', err);
          setError('Failed to fetch enrollment records from database.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) return;
    setSaving(true);
    try {
      const crs = courses.find((c) => c.id === selectedCourseId);
      const courseTitle = crs?.title || 'Course';

      const id = await adminService.createEnrollment(
        {
          userId: selectedStudentId,
          courseId: selectedCourseId,
          courseTitle,
        },
        user?.email || 'admin'
      );

      const newEnr: Enrollment = {
        id,
        userId: selectedStudentId,
        courseId: selectedCourseId,
        courseTitle,
        enrolledAt: new Date().toISOString(),
        status: 'active',
        progressPercentage: 0,
        completedLessonIds: [],
        lastAccessedAt: new Date().toISOString(),
      };

      setEnrollments((prev) => [newEnr, ...prev]);
      setModalOpen(false);
    } catch (err) {
      alert('Could not create enrollment.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (enr: Enrollment, status: 'active' | 'completed' | 'expired' | 'cancelled') => {
    try {
      await adminService.updateEnrollmentStatus(enr.id, status, user?.email || 'admin');
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enr.id ? { ...e, status } : e))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (enr: Enrollment) => {
    if (!confirm(`Remove enrollment for ${enr.courseTitle}?`)) return;
    try {
      await adminService.deleteEnrollment(enr.id, user?.email || 'admin');
      setEnrollments((prev) => prev.filter((item) => item.id !== enr.id));
    } catch (err) {
      alert('Failed to remove enrollment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Admissions Desk</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Enrollment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authorize student access to courses, monitor completion rates, and manage admission lifecycle.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm hover:shadow w-fit self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Student Enrollment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Enrollments Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100">
              <Skeleton className="h-4 w-40 bg-slate-100" />
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-4 w-16 bg-slate-100" />
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-800 mb-1">
            No Active Enrollments
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Students who enroll or are manually assigned will appear here with progress tracking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Course Program</th>
                  <th className="py-3.5 px-6">Student ID</th>
                  <th className="py-3.5 px-6">Progress</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-sm text-slate-900">{e.courseTitle}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{e.userId}</td>
                    <td className="py-4 px-6 text-xs font-semibold text-blue-600">
                      {e.progressPercentage || 0}% Complete
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={e.status}
                        onChange={(evt) => handleChangeStatus(e, evt.target.value as any)}
                        className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none cursor-pointer focus:border-blue-600"
                      >
                        <option value="active">ACTIVE</option>
                        <option value="completed">COMPLETED</option>
                        <option value="expired">EXPIRED</option>
                        <option value="cancelled">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove Enrollment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200/80 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-lg text-slate-900 mb-4">
              Manually Enroll Student
            </h3>

            <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                {students.length === 0 ? (
                  <p className="text-rose-600">No students registered yet.</p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                  >
                    {students.map((s) => (
                      <option key={s.uid} value={s.uid}>
                        {s.displayName || s.email} ({s.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Course</label>
                {courses.length === 0 ? (
                  <p className="text-rose-600">No courses created yet.</p>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || students.length === 0 || courses.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
