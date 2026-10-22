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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-[#CCFF00] tracking-widest uppercase font-bold bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/20">
              FACULTY CURRICULUM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-tight">
            Assigned Courses & Batches
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
            Manage your teaching batches, syllabus structure, and active student cohorts.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Courses</p>
          <p className="text-2xl font-black font-display text-white mt-0.5">{courses.length}</p>
        </div>

        <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Students</p>
          <p className="text-2xl font-black font-display text-white mt-0.5">{totalStudents}</p>
        </div>

        <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
            <PlayCircle className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Lectures Published</p>
          <p className="text-2xl font-black font-display text-white mt-0.5">{totalLessons}</p>
        </div>

        <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Live Batches</p>
          <p className="text-2xl font-black font-display text-white mt-0.5">
            {courses.filter((c) => c.isPublished).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, subject, grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#060C17] border border-white/15 focus:border-[#CCFF00] rounded-xl text-white placeholder-slate-500 outline-none transition font-sans"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-[#060C17] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#CCFF00]"
            >
              <option value="All">All Grades</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#060C17] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#CCFF00]"
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
            <Skeleton key={i} className="h-64 rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-display font-bold text-lg text-white uppercase">No Courses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || gradeFilter !== 'All'
              ? 'No courses matched your current filter criteria. Clear filters to see all assigned courses.'
              : 'You have not been assigned any courses yet. Click the button below to add your first course.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2 rounded-xl bg-white text-black font-mono font-bold text-xs uppercase hover:bg-[#CCFF00] transition"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-[#0E121A] border border-white/10 hover:border-[#CCFF00]/40 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl group relative"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[9px] uppercase font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/20">
                      {c.subjectName || 'ACADEMIC'}
                    </span>
                    {c.classGrade && (
                      <span className="font-mono text-[9px] uppercase text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                        {c.classGrade}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTogglePublish(c)}
                    className={`font-mono text-[9px] uppercase px-2.5 py-0.5 rounded-full font-bold border transition ${
                      c.isPublished
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-300'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-emerald-500/10 hover:text-emerald-300'
                    }`}
                    title="Click to toggle publish status"
                  >
                    {c.isPublished ? '● Live' : '○ Draft'}
                  </button>
                </div>

                <h3 className="font-display font-bold text-base text-white group-hover:text-[#CCFF00] transition-colors line-clamp-1 uppercase">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mt-2 font-sans leading-relaxed">
                  {c.description || 'Comprehensive curriculum with video lectures, notes, and tests.'}
                </p>

                {/* Course Metadata Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 font-mono text-[10px] text-slate-400 text-center">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="block text-white font-bold">{c.enrolledStudentsCount || 0}</span>
                    <span>Students</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="block text-white font-bold">{c.totalLessons || 0}</span>
                    <span>Lessons</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="block text-white font-bold">{c.durationHours || 40}h</span>
                    <span>Duration</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <Link
                  to={`/courses/${c.id}`}
                  target="_blank"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition"
                  title="View Public Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard/teacher/lessons"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono uppercase transition border border-white/10"
                  >
                    <PlayCircle className="w-3 h-3 text-[#CCFF00]" />
                    <span>Lessons</span>
                  </Link>

                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#CCFF00] hover:bg-[#CCFF00]/10 border border-transparent hover:border-[#CCFF00]/20 transition"
                    title="Edit Course Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0E121A] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#CCFF00]" />
                <h3 className="font-display font-black text-white text-lg uppercase tracking-tight">
                  {editingCourse ? 'Update Course Details' : 'Create New Teaching Course'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Class 10 Board Mathematics (Samarth Batch)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Subject
                  </label>
                  <select
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
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
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Grade / Target Class
                  </label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
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
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Stream / Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science PCM / Boards"
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Target Examination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CBSE 2027 Boards"
                    value={formData.targetExam}
                    onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, key highlights, and expected student takeaways..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#060C17] border border-white/15 text-white text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Pricing
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      className="accent-[#CCFF00]"
                    />
                    <label htmlFor="isFree" className="text-xs font-mono text-slate-300">
                      100% Free
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="accent-[#CCFF00]"
                    />
                    <label htmlFor="isPublished" className="text-xs font-mono text-slate-300">
                      Published
                    </label>
                  </div>
                </div>
              </div>

              {!formData.isFree && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                      Course Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#060C17] border border-white/15 text-white text-xs font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
                      MRP / Original Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#060C17] border border-white/15 text-white text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-mono text-xs uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer"
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
