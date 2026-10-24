import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Award,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Test } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const AdminTests: React.FC = () => {
  useDocumentTitle('Test Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 40,
    questionsCount: 25,
    targetCategory: 'School Mock Test',
    isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTests() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getTests();
        if (isMounted) {
          setTests(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminTests] Error loading tests:', err);
          setError('Failed to fetch tests from database.');
          setLoading(false);
        }
      }
    }

    loadTests();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const testPayload = {
        ...formData,
        instructorId: user?.uid || 'admin_academic_lead',
        instructorName: user?.displayName || 'Academic Director',
      };
      const id = await adminService.createTest(testPayload, user?.email || 'admin');
      const newTest: Test = {
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...testPayload,
      };
      setTests((prev) => [newTest, ...prev]);
      setModalOpen(false);
    } catch (err) {
      alert('Could not save test.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (test: Test) => {
    const nextState = !test.isPublished;
    try {
      await adminService.toggleTestPublish(test.id, nextState, user?.email || 'admin');
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, isPublished: nextState } : t))
      );
    } catch (err) {
      alert('Could not toggle publish state.');
    }
  };

  const handleDelete = async (test: Test) => {
    if (!confirm(`Permanently delete assessment "${test.title}"?`)) return;
    try {
      await adminService.deleteTest(test.id, user?.email || 'admin');
      setTests((prev) => prev.filter((t) => t.id !== test.id));
    } catch (err) {
      alert('Failed to delete test.');
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.targetCategory && t.targetCategory.toLowerCase().includes(q))
      );
    });
  }, [tests, searchQuery]);

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE) || 1;
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
            <span>Assessment Management</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Test & Assessment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Author and publish mock tests, configure passing criteria, and manage student practice exams.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              durationMinutes: 60,
              totalMarks: 100,
              passingMarks: 40,
              questionsCount: 25,
              targetCategory: 'School Mock Test',
              isPublished: true,
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm hover:shadow w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tests by title or exam..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
          />
        </div>
        <span className="text-xs text-slate-500">
          Total: <strong className="text-blue-600 font-bold">{tests.length}</strong> Assessments
        </span>
      </div>

      {/* Tests Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-2.5 border-b border-slate-100">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 mb-1">
            No Tests Created Yet
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Click "Create New Test" to build timed mock exams for students.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assessment Title</th>
                  <th className="py-3.5 px-6">Target Category</th>
                  <th className="py-3.5 px-6">Duration & Marks</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-sm text-slate-900">{t.title}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                        {t.targetCategory || 'Mock Test'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {t.durationMinutes} mins • {t.totalMarks} marks ({t.questionsCount || 25} Qs)
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleTogglePublish(t)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer transition ${
                          t.isPublished
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {t.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{t.isPublished ? 'PUBLISHED' : 'DRAFT'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg cursor-pointer transition"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <p className="text-xs text-slate-500">
                Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-4">
              Create New Mock Test
            </h3>

            <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mathematics Board Practice Exam 1"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Category</label>
                <input
                  type="text"
                  value={formData.targetCategory}
                  onChange={(e) => setFormData({ ...formData, targetCategory: e.target.value })}
                  placeholder="e.g. CBSE 10, BPSC TRE, AMU Entrance"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Questions Count</label>
                  <input
                    type="number"
                    value={formData.questionsCount}
                    onChange={(e) => setFormData({ ...formData, questionsCount: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Creating...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;
