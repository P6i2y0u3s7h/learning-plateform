import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  PlayCircle,
  FileText,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  Globe,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseService } from '../../../services/courseService';
import { adminService } from '../../../services/adminService';
import { cacheManager } from '../../../utils/cacheManager';
import type { Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const TeacherCourses: React.FC = () => {
  useDocumentTitle('Assigned Courses — Teacher Dashboard');
  const { user, userProfile } = useAuth();
  const teacherName = userProfile?.displayName || user?.displayName || 'Faculty Educator';

  const cachedCourses = cacheManager.get<Course[]>('courses:all');
  const initialTeacherCourses = React.useMemo(() => {
    if (!cachedCourses) return [];
    const tc = cachedCourses.filter(
      (c) => !c.instructorId || c.instructorId === user?.uid || c.instructorName?.toLowerCase().includes(teacherName.toLowerCase())
    );
    return tc.length > 0 ? tc : cachedCourses;
  }, [cachedCourses, user?.uid, teacherName]);

  const [loading, setLoading] = useState(() => initialTeacherCourses.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialTeacherCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State for Course Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subjectName: 'Mathematics',
    classGrade: 'Class 10',
    stream: 'Science PCM',
    targetExam: 'CBSE Boards',
    description: '',
    price: 0,
    originalPrice: 999,
    isFree: true,
    isPublished: true,
    durationHours: 40,
  });

  const loadCourses = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (courses.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<Course[]>((_, reject) =>
        setTimeout(() => reject(new Error('Course fetch timed out')), 8000)
      );
      const allCourses = await Promise.race([courseService.getAllCourses(), timeoutPromise]);
      if (!isMountedCheck()) return;

      // In production, courses with instructorId matching user.uid or unassigned demo
      const teacherCourses = allCourses.filter(
        (c) => !c.instructorId || c.instructorId === user?.uid || c.instructorName?.toLowerCase().includes(teacherName.toLowerCase())
      );

      setCourses(teacherCourses.length > 0 ? teacherCourses : allCourses);
    } catch (err: any) {
      if (isMountedCheck()) {
        console.warn('[TeacherCourses] load error:', err);
        if (courses.length === 0) {
          setError(err.message || 'Failed to load assigned courses');
        }
      }
    } finally {
      if (isMountedCheck()) setLoading(false);
    }
  }, [courses.length, user?.uid, teacherName]);

  useEffect(() => {
    let isMounted = true;
    loadCourses(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.classGrade && c.classGrade.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGrade = gradeFilter === 'All' || c.classGrade === gradeFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Published' && c.isPublished) ||
        (statusFilter === 'Draft' && !c.isPublished);

      return matchSearch && matchGrade && matchStatus;
    });
  }, [courses, searchQuery, gradeFilter, statusFilter]);

  const totalStudents = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.enrolledStudentsCount || 0), 0);
  }, [courses]);

  const totalLessons = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.totalLessons || 0), 0);
  }, [courses]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      subjectName: userProfile?.subjectSpecialization || 'Mathematics',
      classGrade: 'Class 10',
      stream: 'Science PCM',
      targetExam: 'CBSE Boards',
      description: '',
      price: 0,
      originalPrice: 999,
      isFree: true,
      isPublished: true,
      durationHours: 40,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (c: Course) => {
    setEditingCourse(c);
    setFormData({
      title: c.title,
      subjectName: c.subjectName || 'Mathematics',
      classGrade: c.classGrade || 'Class 10',
      stream: c.stream || 'Science PCM',
      targetExam: c.targetExam || 'CBSE Boards',
      description: c.description || '',
      price: c.price || 0,
      originalPrice: c.originalPrice || 999,
      isFree: c.isFree !== false && c.price === 0,
      isPublished: c.isPublished !== false,
      durationHours: c.durationHours || 40,
    });
    setModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingCourse) {
        // Update
        const updated = {
          ...editingCourse,
          title: formData.title.trim(),
          slug,
          subjectName: formData.subjectName,
          classGrade: formData.classGrade,
          stream: formData.stream,
          targetExam: formData.targetExam,
          description: formData.description.trim(),
          price: formData.isFree ? 0 : Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          isFree: formData.isFree,
          isPublished: formData.isPublished,
          durationHours: Number(formData.durationHours),
          updatedAt: now,
        };

        await adminService.saveCourse(updated);
        setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? updated : c)));
        setSuccessMsg('Course details successfully updated!');
      } else {
        // Create new
        const newId = `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newCourse: Course = {
          id: newId,
          title: formData.title.trim(),
          slug: `${slug}-${newId.slice(-4)}`,
          categoryId: 'cat_school',
          categoryName: 'School Academics',
          subjectId: `sub_${formData.subjectName.toLowerCase()}`,
          subjectName: formData.subjectName,
          classGrade: formData.classGrade,
          stream: formData.stream,
          targetExam: formData.targetExam,
          description: formData.description.trim() || 'Comprehensive structured academic coursework with interactive video lessons and assessments.',
          instructorId: user?.uid || 'instructor_faculty',
          instructorName: teacherName || user?.displayName || 'Faculty Instructor',
          price: formData.isFree ? 0 : Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          isFree: formData.isFree,
          isPublished: formData.isPublished,
          durationHours: Number(formData.durationHours),
          totalLessons: 0,
          totalChapters: 1,
          enrolledStudentsCount: 0,
          averageRating: 5.0,
          totalReviews: 1,
          tags: [formData.subjectName, formData.classGrade],
          createdAt: now,
          updatedAt: now,
        };

        await adminService.saveCourse(newCourse);
        setCourses((prev) => [newCourse, ...prev]);
        setSuccessMsg('New academic course created and assigned to your portfolio!');
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save course. Please verify permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const updated = {
        ...course,
        isPublished: !course.isPublished,
        updatedAt: new Date().toISOString(),
      };
      await adminService.saveCourse(updated);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      setSuccessMsg(`Course is now ${updated.isPublished ? 'PUBLISHED (live for students)' : 'UNPUBLISHED (draft mode)'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update publish state');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Quick Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Faculty Curriculum
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Assigned Courses & Batches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your teaching batches, syllabus structure, and active student cohorts.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Courses</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{courses.length}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{totalStudents}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3">
            <PlayCircle className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lectures Published</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{totalLessons}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Live Batches</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">
            {courses.filter((c) => c.isPublished).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, subject, grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition font-sans"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600"
            >
              <option value="All">All Grades</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">No Courses Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || gradeFilter !== 'All'
              ? 'No courses matched your current filter criteria. Clear filters to see all assigned courses.'
              : 'You have not been assigned any courses yet. Click the button below to add your first course.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md group relative"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                      {c.subjectName || 'ACADEMIC'}
                    </span>
                    {c.classGrade && (
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {c.classGrade}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTogglePublish(c)}
                    className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold border transition ${
                      c.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title="Click to toggle publish status"
                  >
                    {c.isPublished ? '● Live' : '○ Draft'}
                  </button>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {c.description || 'Comprehensive curriculum with video lectures, notes, and tests.'}
                </p>

                {/* Course Metadata Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-600 text-center font-medium">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="block text-slate-900 font-bold">{c.enrolledStudentsCount || 0}</span>
                    <span className="text-[10px] text-slate-400">Students</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="block text-slate-900 font-bold">{c.totalLessons || 0}</span>
                    <span className="text-[10px] text-slate-400">Lessons</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="block text-slate-900 font-bold">{c.durationHours || 40}h</span>
                    <span className="text-[10px] text-slate-400">Duration</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/courses/${c.id}`}
                  target="_blank"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                  title="View Public Page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard/teacher/lessons"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition border border-slate-200"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lessons</span>
                  </Link>

                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                    title="Edit Course Settings"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingCourse ? 'Update Course Details' : 'Create New Teaching Course'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Class 10 Board Mathematics (Samarth Batch)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Subject
                  </label>
                  <select
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Science">Science (Combined)</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Grade / Target Class
                  </label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="NEET Foundation">NEET Foundation</option>
                    <option value="JEE Foundation">JEE Foundation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Stream / Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science PCM / Boards"
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Target Examination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CBSE 2027 Boards"
                    value={formData.targetExam}
                    onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, key highlights, and expected student takeaways..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Pricing
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <label htmlFor="isFree" className="text-xs text-slate-700 font-medium">
                      100% Free
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <label htmlFor="isPublished" className="text-xs text-slate-700 font-medium">
                      Published
                    </label>
                  </div>
                </div>
              </div>

              {!formData.isFree && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      Course Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      MRP / Original Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
