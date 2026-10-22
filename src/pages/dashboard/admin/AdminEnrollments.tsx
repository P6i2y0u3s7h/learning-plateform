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
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>[ ADMISSIONS INDEX · ENROLLMENT DESK ]</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              Enrollment Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
              Authorize student access to courses, monitor completion rates, and manage admission lifecycle.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer shadow-lg w-fit self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Manual Student Enrollment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Enrollments Table */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-white/5">
              <Skeleton className="h-4 w-40 bg-white/5" />
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-4 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white mb-1">
            No Active Enrollments
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-5">
            Students who enroll or are manually assigned will appear here with progress tracking.
          </p>
        </div>
      ) : (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Course Program</th>
                  <th className="py-3.5 px-6">Student ID</th>
                  <th className="py-3.5 px-6">Progress</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6 font-bold text-sm text-white">{e.courseTitle}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{e.userId}</td>
                    <td className="py-4 px-6 text-xs font-mono font-bold text-[#CCFF00]">
                      {e.progressPercentage || 0}% Complete
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={e.status}
                        onChange={(evt) => handleChangeStatus(e, evt.target.value as any)}
                        className="text-xs font-mono font-bold py-1.5 px-3 rounded-lg bg-[#060C17] border border-white/15 text-[#CCFF00] outline-none cursor-pointer focus:border-[#CCFF00]"
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
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-4">
              Manually Enroll Student
            </h3>

            <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Select Student</label>
                {students.length === 0 ? (
                  <p className="text-rose-400 font-mono">No students registered yet.</p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
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
                <label className="block font-mono text-slate-400 mb-1">Select Course</label>
                {courses.length === 0 ? (
                  <p className="text-rose-400 font-mono">No courses created yet.</p>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || students.length === 0 || courses.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer disabled:opacity-50"
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
