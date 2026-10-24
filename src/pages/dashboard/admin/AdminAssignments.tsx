import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Assignment, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminAssignments: React.FC = () => {
  useDocumentTitle('Assignment Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    instructions: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    totalMarks: 50,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [assignList, courseList] = await Promise.all([
          adminService.getAssignments(),
          adminService.getCourses(),
        ]);
        if (isMounted) {
          setAssignments(assignList);
          setCourses(courseList);
          if (courseList.length > 0) {
            setFormData((prev) => ({ ...prev, courseId: courseList[0].id }));
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminAssignments] Error loading assignments:', err);
          setError('Failed to fetch assignments from database.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const id = await adminService.createAssignment(formData, user?.email || 'admin');
      const newAssign: Assignment = {
        id,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...formData,
      };
      setAssignments((prev) => [newAssign, ...prev]);
      setModalOpen(false);
    } catch (err) {
      alert('Could not save assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Assignment) => {
    if (!confirm(`Permanently delete assignment "${a.title}"?`)) return;
    try {
      await adminService.deleteAssignment(a.id, user?.email || 'admin');
      setAssignments((prev) => prev.filter((item) => item.id !== a.id));
    } catch (err) {
      alert('Failed to delete assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Coursework Governance</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Assignment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Author and assign coursework, problem sets, and review exercises across platform courses.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              courseId: courses[0]?.id || '',
              instructions: '',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              totalMarks: 50,
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm hover:shadow w-fit self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100">
              <Skeleton className="h-4 w-40 bg-slate-100" />
              <Skeleton className="h-4 w-20 bg-slate-100" />
              <Skeleton className="h-4 w-12 bg-slate-100" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-800 mb-1">
            No Assignments Created
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Click "+ New Assignment" to publish problem sets and coursework for students.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assignment Title</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Max Marks</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-sm text-slate-900">{a.title}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      Due: <strong className="text-slate-800 font-semibold">{a.dueDate}</strong>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-blue-600">
                      {a.totalMarks} Marks
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(a)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Assignment"
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
              Create New Assignment
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 3 Quadratic Equation Worksheet"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instructions for students regarding solving and submitting..."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 resize-none"
                />
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Creating...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;
