import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { UserProfile } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const AdminStudents: React.FC = () => {
  useDocumentTitle('Student Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    phone: '',
    classGrade: '',
    targetExam: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [deletingStudent, setDeletingStudent] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getStudents();
        if (isMounted) {
          setStudents(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminStudents] Error loading students:', err);
          setError('Could not load student directory from Firestore.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        (s.displayName && s.displayName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.classGrade && s.classGrade.toLowerCase().includes(q)) ||
        (s.targetExam && s.targetExam.toLowerCase().includes(q))
      );
    });
  }, [students, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleOpenEdit = (student: UserProfile) => {
    setEditingStudent(student);
    setEditFormData({
      displayName: student.displayName || '',
      phone: student.phone || '',
      classGrade: student.classGrade || '',
      targetExam: student.targetExam || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    try {
      await adminService.updateStudent(
        editingStudent.uid,
        {
          displayName: editFormData.displayName.trim(),
          phone: editFormData.phone.trim(),
          classGrade: editFormData.classGrade.trim(),
          targetExam: editFormData.targetExam.trim(),
        },
        user?.email || 'admin'
      );

      setStudents((prev) =>
        prev.map((s) =>
          s.uid === editingStudent.uid
            ? { ...s, ...editFormData }
            : s
        )
      );
      setEditingStudent(null);
    } catch (err) {
      alert('Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      await adminService.deleteStudent(deletingStudent.uid, user?.email || 'admin');
      setStudents((prev) => prev.filter((s) => s.uid !== deletingStudent.uid));
      setDeletingStudent(null);
    } catch (err) {
      alert('Failed to remove student record.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] mb-2">
          <Users className="w-3.5 h-3.5" />
          [ USER ADMINISTRATION · SCHOLAR DIRECTORY ]
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Student Management
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
          Search, view profile metrics, edit academic assignments, and manage student accounts in Firestore.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Search */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by student name, email, class, or phone..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 font-mono outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total: <strong className="text-[#CCFF00]">{students.length}</strong> Learners
        </span>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white mb-1">
            No Student Records Found
          </h3>
          <p className="text-xs font-mono text-slate-400">
            {students.length === 0
              ? 'There are currently no registered student accounts in Cloud Firestore.'
              : 'No students matched your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Student Name & Email</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Class / Target Exam</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {paginatedStudents.map((s) => (
                    <tr key={s.uid} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] font-bold flex items-center justify-center text-sm flex-shrink-0 font-mono shadow-[0_0_10px_rgba(204,255,0,0.15)]">
                            {(s.displayName || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white font-sans">
                              {s.displayName || 'Academic Scholar'}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-300">
                        {s.phone || '–'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block text-[11px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-0.5 rounded-full">
                          {s.classGrade || 'Class 10'}
                        </span>
                        {s.targetExam && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.targetExam}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-400">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#CCFF00] hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                          title="Delete Student"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono">
              <p className="text-xs text-slate-400">
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition font-mono ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black font-bold shadow-[0_0_12px_rgba(204,255,0,0.4)]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative text-white">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <button
              onClick={() => setEditingStudent(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-1">
              Edit Student Details
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-5">
              Account: {editingStudent.email}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFormData.displayName}
                  onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Class / Grade
                </label>
                <input
                  type="text"
                  value={editFormData.classGrade}
                  onChange={(e) => setEditFormData({ ...editFormData, classGrade: e.target.value })}
                  placeholder="Class 10 / BPSC / AMU Prep"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Target Exam
                </label>
                <input
                  type="text"
                  value={editFormData.targetExam}
                  onChange={(e) => setEditFormData({ ...editFormData, targetExam: e.target.value })}
                  placeholder="e.g. CBSE Boards 2027"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 border border-white/15 shadow-2xl space-y-4 text-white relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center font-mono">
              <h3 className="font-display font-bold text-base text-white">
                Delete Student Record
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-white">{deletingStudent.displayName || deletingStudent.email}</strong>? This action will be recorded in the administrative audit logs.
              </p>
            </div>
            <div className="flex gap-2 font-mono">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
