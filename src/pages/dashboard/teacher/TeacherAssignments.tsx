import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  Award,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseworkService } from '../../../services/courseworkService';
import { cacheManager } from '../../../utils/cacheManager';
import type { Assignment, AssignmentSubmission } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const COURSE_CHOICES = [
  { id: 'school-10', title: 'Class 10 CBSE & State Board — Complete Foundation', subject: 'Mathematics' },
  { id: 'ent-amu-11', title: 'AMU 11th Science & Diploma Entrance Crash Course', subject: 'Physics & Chemistry' },
  { id: 'comp-bpsc-tre', title: 'BPSC TRE 4.0 Teacher Recruitment Master Batch', subject: 'General Studies' },
  { id: 'school-12-pcm', title: 'Class 12 Science PCM — Board & JEE Foundation', subject: 'Mathematics' },
];

export const TeacherAssignments: React.FC = () => {
  useDocumentTitle('Teacher Assignment Management — Brainstorm Academy');
  const { user, userProfile } = useAuth();

  const cachedAssignments = cacheManager.get<Assignment[]>('assignments:all');

  const [loading, setLoading] = useState(() => !cachedAssignments);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>(() => cachedAssignments || []);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Assignment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: COURSE_CHOICES[0].id,
    subjectName: COURSE_CHOICES[0].subject,
    chapterName: '',
    instructions: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    totalMarks: 30,
    attachmentUrl: '',
    attachmentName: '',
    allowFileUploads: true,
    maxFileSizeMb: 10,
    isPublished: true,
  });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Review Submissions Modal
  const [reviewAssignment, setReviewAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Grading Modal / Drawer
  const [gradingSub, setGradingSub] = useState<AssignmentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<number | ''>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  const fetchAssignments = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (assignments.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<Assignment[]>((_, reject) =>
        setTimeout(() => reject(new Error('Assignments fetch timed out')), 8000)
      );

      const list = await Promise.race([courseworkService.getAllAssignments(), timeoutPromise]);
      if (isMountedCheck()) {
        setAssignments(list);
      }
    } catch (err) {
      if (isMountedCheck()) {
        console.warn('Error fetching teacher assignments:', err);
        if (assignments.length === 0) {
          setError('Failed to fetch assignments.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [assignments.length]);

  useEffect(() => {
    let isMounted = true;
    fetchAssignments(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchAssignments]);

  const handleOpenReview = async (asg: Assignment) => {
    setReviewAssignment(asg);
    setLoadingSubs(true);
    try {
      const subs = await courseworkService.getAssignmentSubmissionsForTeacher(asg.id);
      setSubmissions(subs);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setCreating(true);
    setCreateSuccess(false);

    try {
      const selectedCourse = COURSE_CHOICES.find((c) => c.id === formData.courseId);
      const teacherName = userProfile?.displayName || user?.displayName || 'Faculty Member';

      await courseworkService.createAssignment({
        title: formData.title.trim(),
        courseId: formData.courseId,
        courseTitle: selectedCourse?.title || 'Academic Course',
        subjectName: formData.subjectName,
        chapterName: formData.chapterName.trim() || 'Unit Exercise',
        instructions: formData.instructions.trim(),
        dueDate: formData.dueDate,
        totalMarks: Number(formData.totalMarks) || 30,
        attachmentUrls: formData.attachmentUrl.trim() ? [formData.attachmentUrl.trim()] : [],
        attachmentNames: formData.attachmentName.trim() ? [formData.attachmentName.trim()] : ['Resource Worksheet'],
        allowFileUploads: formData.allowFileUploads,
        maxFileSizeMb: Number(formData.maxFileSizeMb) || 10,
        isPublished: formData.isPublished,
        teacherId: user?.uid || 'teacher_01',
        teacherName,
      });

      setCreateSuccess(true);
      await fetchAssignments();

      setTimeout(() => {
        setCreateSuccess(false);
        setIsCreateOpen(false);
        setFormData({
          title: '',
          courseId: COURSE_CHOICES[0].id,
          subjectName: COURSE_CHOICES[0].subject,
          chapterName: '',
          instructions: '',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          totalMarks: 30,
          attachmentUrl: '',
          attachmentName: '',
          allowFileUploads: true,
          maxFileSizeMb: 10,
          isPublished: true,
        });
      }, 1500);
    } catch (err) {
      console.error('Create assignment failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await courseworkService.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to delete assignment.');
    }
  };

  const handleStartGrading = (sub: AssignmentSubmission) => {
    setGradingSub(sub);
    setGradeInput(sub.grade !== undefined ? sub.grade : '');
    setFeedbackInput(sub.feedback || '');
    setGradeSuccess(false);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub || gradeInput === '') return;

    setSavingGrade(true);
    setGradeSuccess(false);

    try {
      const teacherName = userProfile?.displayName || user?.displayName || 'Faculty Member';
      await courseworkService.gradeSubmission(
        gradingSub.id,
        Number(gradeInput),
        feedbackInput.trim(),
        user?.uid || 'teacher_01',
        teacherName
      );

      setGradeSuccess(true);

      // Update submissions list in modal
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradingSub.id
            ? {
                ...s,
                status: 'graded',
                grade: Number(gradeInput),
                feedback: feedbackInput.trim(),
                gradedByName: teacherName,
                gradedAt: new Date().toISOString(),
              }
            : s
        )
      );

      setTimeout(() => {
        setGradeSuccess(false);
        setGradingSub(null);
      }, 1200);
    } catch (err) {
      alert('Failed to save grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  const filtered = assignments.filter((a) => {
    return (
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.courseTitle && a.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.subjectName && a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Coursework & Evaluations
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Assignments & Submissions Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author coursework, attach reference problem sheets, and grade student submissions with personalized feedback.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Assignment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title or subject..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-blue-600 font-bold">{assignments.length}</strong>
        </div>
      </div>

      {/* Assignments Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">
            No Assignments Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Create an assignment for your students to assign homework or problem sets.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Assignment</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-4 px-5">Assignment Title</th>
                  <th className="py-4 px-4">Course & Subject</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4 text-center">Total Marks</th>
                  <th className="py-4 px-4 text-center">Submissions</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="max-w-xs sm:max-w-md">
                        <p className="line-clamp-1">{asg.title}</p>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {asg.instructions}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{asg.subjectName || 'General'}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{asg.courseTitle}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <span>
                        {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Flexible'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-blue-600">
                      {asg.totalMarks} pts
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenReview(asg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Review ({asg.submissionsCount || 0})</span>
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDelete(asg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* Create Assignment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Coursework Authoring
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">
              Create New Assignment
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Set problem guidelines, deadline, maximum marks, and attached worksheets.
            </p>

            {createSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Assignment published and accessible to enrolled students!</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Assignment 5: Trigonometric Identities & Heights"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Associated Course
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => {
                      const course = COURSE_CHOICES.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        courseId: e.target.value,
                        subjectName: course?.subject || 'General',
                      });
                    }}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition cursor-pointer"
                  >
                    {COURSE_CHOICES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 font-bold outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Instructions & Problem Statement
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Detail the questions to solve, formatting instructions, and expectations..."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    Attached Worksheet URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.attachmentUrl}
                    onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                    placeholder="https://drive.google.com/worksheet.pdf"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    Attachment Label
                  </label>
                  <input
                    type="text"
                    value={formData.attachmentName}
                    onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                    placeholder="e.g. Chapter_5_Problem_Set.pdf"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submissions Modal */}
      {reviewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setReviewAssignment(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Max Marks: {reviewAssignment.totalMarks}
              </span>
              <h3 className="font-bold text-xl text-slate-900 mt-1">
                Submissions: {reviewAssignment.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review student answers, inspect uploaded files, and provide grades & feedback.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {loadingSubs ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-sm text-slate-900">No Submissions Yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Student solutions will appear here as soon as they submit their assignments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => {
                    const isGraded = sub.status === 'graded';

                    return (
                      <div
                        key={sub.id}
                        className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">
                              {sub.studentName || 'Student'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {sub.studentEmail} • Submitted {new Date(sub.submittedAt).toLocaleString()}
                              {sub.isLate && (
                                <span className="ml-2 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Late
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isGraded ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                                <Award className="w-3.5 h-3.5 text-emerald-600" />
                                {sub.grade} / {reviewAssignment.totalMarks} Marks
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                                <Clock className="w-3.5 h-3.5" />
                                Awaiting Grading
                              </span>
                            )}

                            <button
                              onClick={() => handleStartGrading(sub)}
                              className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                            >
                              {isGraded ? 'Edit Grade' : 'Grade Submission'}
                            </button>
                          </div>
                        </div>

                        {sub.answerText && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            <p className="font-bold text-blue-700 mb-1 uppercase text-[10px]">
                              Student Written Solution:
                            </p>
                            {sub.answerText}
                          </div>
                        )}

                        {sub.submissionUrls && sub.submissionUrls.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                              Submitted Files / Evidence:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sub.submissionUrls.map((url, uIdx) => (
                                <a
                                  key={uIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{sub.attachmentNames?.[uIdx] || `Attachment #${uIdx + 1}`}</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs">
                            <p className="font-bold text-emerald-800">Current Feedback:</p>
                            <p className="italic text-slate-700 mt-0.5">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade & Feedback Drawer Modal */}
      {gradingSub && reviewAssignment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setGradingSub(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-1">
              Grade Submission: {gradingSub.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign marks out of {reviewAssignment.totalMarks} and provide feedback to help the student improve.
            </p>

            {gradeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Grade and feedback recorded successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Marks Scored (Max {reviewAssignment.totalMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={reviewAssignment.totalMarks}
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`0 - ${reviewAssignment.totalMarks}`}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 font-bold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Qualitative Teacher Feedback & Comments
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Acknowledge strengths and pinpoint specific areas for revision or calculation errors..."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {savingGrade ? 'Saving Grade...' : 'Save & Publish Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
