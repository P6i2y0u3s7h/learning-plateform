import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  X,
  Send,
  Trash2,
  Edit2,
  KeyRound,
  Eye,
  UserX,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import {
  listenToUsersByRole,
  toggleUserStatus,
  updateUserName,
  deleteUserAccount,
  sendUserPasswordReset,
} from '../../../services/adminAccountService';
import type { UserProfile, Course } from '../../../types';
import type { RtdbUserRecord, AccountStatus } from '../../../firebase/rtdb';
import { AddUserModal } from '../../../components/admin/AddUserModal';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const AdminTeachers: React.FC = () => {
  useDocumentTitle('Teacher & Faculty Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rtdbTeachers, setRtdbTeachers] = useState<RtdbUserRecord[]>([]);
  const [firestoreTeachers, setFirestoreTeachers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<RtdbUserRecord | null>(null);
  const [newName, setNewName] = useState('');
  const [viewingTeacher, setViewingTeacher] = useState<RtdbUserRecord | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState<UserProfile | RtdbUserRecord | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Listen to Realtime Database for all teachers in real time (Requirement #7)
  useEffect(() => {
    setLoading(true);
    const unsubscribeRtdb = listenToUsersByRole(
      'teacher',
      (teachersList) => {
        setRtdbTeachers(teachersList);
        setLoading(false);
      },
      (err) => {
        console.error('[AdminTeachers] RTDB onValue error:', err);
        setError('Realtime Database synchronization error.');
        setLoading(false);
      }
    );

    // Also fetch courses for the Assign Course modal and Firestore profile metadata
    async function loadSupplementaryData() {
      try {
        const [fsTeachers, coursesData] = await Promise.all([
          adminService.getTeachers(),
          adminService.getCourses(),
        ]);
        setFirestoreTeachers(fsTeachers);
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
        }
      } catch (err) {
        console.warn('[AdminTeachers] Supplementary data warning:', err);
      }
    }
    loadSupplementaryData();

    return () => unsubscribeRtdb();
  }, []);

  // Merge RTDB authoritative teachers with Firestore details if available
  const mergedTeachers = useMemo(() => {
    // Map Firestore profiles by UID
    const fsMap = new Map<string, UserProfile>();
    firestoreTeachers.forEach((t) => fsMap.set(t.uid, t));

    // Combine RTDB records with FS profiles
    const seenUids = new Set<string>();
    const list: Array<RtdbUserRecord & { fsProfile?: UserProfile }> = [];

    rtdbTeachers.forEach((rtdbT) => {
      seenUids.add(rtdbT.uid);
      list.push({
        ...rtdbT,
        fsProfile: fsMap.get(rtdbT.uid),
      });
    });

    // Also include any Firestore-only teacher applications that haven't been migrated yet
    firestoreTeachers.forEach((fsT) => {
      if (!seenUids.has(fsT.uid)) {
        list.push({
          uid: fsT.uid,
          name: fsT.displayName || 'Applicant',
          email: fsT.email,
          role: 'teacher',
          status: 'active',
          createdAt: fsT.createdAt ? new Date(fsT.createdAt).getTime() : Date.now(),
          fsProfile: fsT,
        });
      }
    });

    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [rtdbTeachers, firestoreTeachers]);

  const filteredTeachers = useMemo(() => {
    return mergedTeachers.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.uid && t.uid.toLowerCase().includes(q)) ||
        (t.fsProfile?.subjectSpecialization && t.fsProfile.subjectSpecialization.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return t.status === 'active';
      if (statusFilter === 'disabled') return t.status === 'disabled';
      return true;
    });
  }, [mergedTeachers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE) || 1;
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTeachers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTeachers, currentPage]);

  // Actions
  const handleToggleStatus = async (teacher: RtdbUserRecord) => {
    const nextStatus = teacher.status === 'active' ? 'Disable' : 'Activate';
    if (!window.confirm(`${nextStatus} teacher account for ${teacher.name} (${teacher.email})?`)) return;

    setActionLoading(true);
    try {
      await toggleUserStatus(teacher.uid, teacher.status, 'teacher');
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !newName.trim()) return;

    setActionLoading(true);
    try {
      await updateUserName(editingTeacher.uid, newName.trim());
      setEditingTeacher(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update name.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    try {
      await sendUserPasswordReset(email);
      alert(`Password reset instructions sent to ${email}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to send password reset email.');
    }
  };

  const handleDeleteTeacher = async (teacher: RtdbUserRecord) => {
    const confirm = window.prompt(
      `PERMANENT ACTION: To delete teacher "${teacher.name}", type "DELETE" below:`
    );
    if (confirm !== 'DELETE') return;

    setActionLoading(true);
    try {
      await deleteUserAccount(teacher.uid, 'teacher');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete teacher account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeacher || !selectedCourseId) return;
    setActionLoading(true);
    try {
      const teacherName = ('name' in assigningTeacher ? assigningTeacher.name : assigningTeacher.displayName) || 'Teacher';
      await adminService.assignTeacherToCourse(
        assigningTeacher.uid,
        teacherName,
        selectedCourseId,
        user?.email || 'admin'
      );
      alert(`Assigned ${teacherName} to course successfully!`);
      setAssigningTeacher(null);
    } catch (err) {
      alert('Failed to assign instructor to course.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shadow-xs flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Faculty Governance</span>
            </div>
            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Manage Teachers
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Provision faculty accounts, manage active statuses, and assign instructors to courses.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Teacher</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search faculty by name, email, or UID..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ALL ({mergedTeachers.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('active');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ACTIVE ({mergedTeachers.filter((t) => t.status === 'active').length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('disabled');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              statusFilter === 'disabled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            DISABLED ({mergedTeachers.filter((t) => t.status === 'disabled').length})
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 mb-1">
            No Faculty Members Found
          </h3>
          <p className="text-xs text-slate-500">
            Click "Add Teacher" above to provision a new faculty account in Realtime Database.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedTeachers.map((t) => (
                  <tr key={t.uid} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                          {(t.name || 'T')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{t.name}</p>
                          <span className="text-[10px] text-slate-400 truncate block">
                            UID: {t.uid.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
                        TEACHER
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {t.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>DISABLED</span>
                        </span>
                      )}
                    </td>

                    {/* Date Created */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setViewingTeacher(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="View Faculty Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Assign to Course */}
                        <button
                          type="button"
                          onClick={() => setAssigningTeacher(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Assign to Course"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>

                        {/* Edit Name */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher(t);
                            setNewName(t.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Password Reset */}
                        <button
                          type="button"
                          onClick={() => handleSendPasswordReset(t.email)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          title="Send Password Reset Email"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Toggle Active / Disabled */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(t)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            t.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={t.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {t.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete Account */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleDeleteTeacher(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultRole="teacher"
        onSuccess={() => {}}
      />

      {/* Edit Name Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Teacher Name</h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-slate-800 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full text-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Teacher Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400">Name: </span>
                <span className="text-slate-900 font-bold">{viewingTeacher.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="text-slate-700">{viewingTeacher.email}</span>
              </div>
              <div>
                <span className="text-slate-400">UID: </span>
                <span className="text-blue-700 select-all font-mono">{viewingTeacher.uid}</span>
              </div>
              <div>
                <span className="text-slate-400">Role: </span>
                <span className="uppercase text-blue-600 font-bold">{viewingTeacher.role}</span>
              </div>
              <div>
                <span className="text-slate-400">Status: </span>
                <span className={viewingTeacher.status === 'active' ? 'text-emerald-700 uppercase font-semibold' : 'text-rose-700 uppercase font-semibold'}>
                  {viewingTeacher.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Created: </span>
                <span className="text-slate-600">
                  {viewingTeacher.createdAt ? new Date(viewingTeacher.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Course Modal */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Assign Course to {('name' in assigningTeacher ? assigningTeacher.name : assigningTeacher.displayName) || 'Teacher'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTeacher(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-slate-800 text-xs outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.subjectName || c.categoryName || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
