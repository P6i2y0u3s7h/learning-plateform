import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  IndianRupee,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Course, UserProfile, Category } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const AdminCourses: React.FC = () => {
  useDocumentTitle('Course Management & Curriculum — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [filterPublish, setFilterPublish] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: 'school-courses',
    subjectName: 'Mathematics',
    classGrade: 'Class 10',
    stream: '' as 'Science PCM' | 'Science PCB' | 'Commerce' | 'Arts' | '',
    targetExam: '',
    description: '',
    price: 0,
    originalPrice: 1999,
    validityDays: 365,
    durationHours: 60,
    totalLessons: 45,
    instructorId: '',
    instructorName: '',
    isFree: true,
    isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [courseList, teacherList, catList] = await Promise.all([
          adminService.getCourses(),
          adminService.getTeachers(),
          adminService.getCategories(),
        ]);
        if (isMounted) {
          setCourses(courseList);
          setTeachers(teacherList);
          setCategories(catList);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminCourses] Error loading courses:', err);
          setError('Failed to fetch courses from database.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    const defaultCat = categories[0]?.id || 'school-courses';
    setFormData({
      title: '',
      slug: '',
      categoryId: defaultCat,
      subjectName: 'Mathematics',
      classGrade: 'Class 10',
      stream: '',
      targetExam: '',
      description: '',
      price: 0,
      originalPrice: 1999,
      validityDays: 365,
      durationHours: 60,
      totalLessons: 40,
      instructorId: teachers[0]?.uid || '',
      instructorName: teachers[0]?.displayName || '',
      isFree: true,
      isPublished: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug || '',
      categoryId: course.categoryId || 'school-courses',
      subjectName: course.subjectName || 'General',
      classGrade: course.classGrade || 'Class 10',
      stream: (course.stream as any) || '',
      targetExam: course.targetExam || '',
      description: course.description || '',
      price: course.price || 0,
      originalPrice: course.originalPrice || 1999,
      validityDays: course.validityDays || 365,
      durationHours: course.durationHours || 60,
      totalLessons: course.totalLessons || 40,
      instructorId: course.instructorId || '',
      instructorName: course.instructorName || '',
      isFree: course.isFree ?? (course.price === 0),
      isPublished: course.isPublished ?? true,
    });
    setModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const adminEmail = user?.email || 'admin@brainstorm.edu';
      const catObj = categories.find((c) => c.id === formData.categoryId);
      const categoryName = catObj?.name || formData.categoryId;

      const coursePayload: Partial<Course> = {
        ...formData,
        categoryName,
        instructorId: formData.instructorId || user?.uid || 'instructor_faculty',
        instructorName: formData.instructorName || 'Faculty Instructor',
        isFree: formData.price === 0 || formData.isFree,
        slug:
          formData.slug ||
          formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, ''),
      };

      if (editingCourse) {
        await adminService.updateCourse(editingCourse.id, coursePayload, adminEmail);
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...coursePayload } : c))
        );
      } else {
        const newId = await adminService.createCourse(coursePayload, adminEmail);
        const newCourse: Course = {
          id: newId,
          enrolledStudentsCount: 0,
          averageRating: 5.0,
          totalReviews: 0,
          totalChapters: 4,
          tags: [formData.subjectName, formData.classGrade, formData.stream].filter(Boolean) as string[],
          ...coursePayload,
        } as Course;
        setCourses((prev) => [newCourse, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('[AdminCourses] Error saving course:', err);
      alert('Failed to save course changes to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextState = !course.isPublished;
    try {
      await adminService.toggleCoursePublish(course.id, nextState, user?.email || 'admin@brainstorm.edu');
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isPublished: nextState } : c))
      );
    } catch (err) {
      alert('Could not update course publication status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      await adminService.deleteCourse(deletingCourse.id, user?.email || 'admin@brainstorm.edu');
      setCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id));
      setDeletingCourse(null);
    } catch (err) {
      alert('Failed to delete course.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(q) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q)) ||
        (c.classGrade && c.classGrade.toLowerCase().includes(q)) ||
        (c.stream && c.stream.toLowerCase().includes(q)) ||
        (c.targetExam && c.targetExam.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategoryFilter !== 'all' && c.categoryId !== selectedCategoryFilter) {
        return false;
      }

      if (filterPublish === 'published') return c.isPublished;
      if (filterPublish === 'draft') return !c.isPublished;
      return true;
    });
  }, [courses, searchQuery, selectedCategoryFilter, filterPublish]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
              [ ACADEMIC CURRICULUM · SYLLABUS REGISTRY ]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight mt-1.5">
            Course Catalog & Hierarchy
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
            Create school classes (6-12), Science PCM/PCB, Commerce, Arts streams, Competitive exams, and AMU/Jamia entrance batches.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#CCFF00] text-black text-xs font-mono font-bold uppercase tracking-wider shadow-lg hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Dynamic Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono">
        <button
          onClick={() => {
            setSelectedCategoryFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedCategoryFilter === 'all'
              ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          ALL CATEGORIES ({courses.length})
        </button>
        {categories.map((cat) => {
          const count = courses.filter((c) => c.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryFilter(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.name.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Controls: Search and Publish Filter */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, subject, grade, stream, or exam..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs md:text-sm bg-[#060C17] border border-white/15 text-white placeholder-slate-500 font-mono outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto font-mono">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilterPublish(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                filterPublish === st
                  ? 'bg-white/15 border border-white/25 text-white shadow-sm'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'published' ? 'Published' : st === 'draft' ? 'Drafts' : 'All States'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-5 border border-white/10 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-16 rounded-2xl border border-white/10 shadow-2xl text-center text-slate-400 font-mono">
          <BookMarked className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-white text-base">No Courses Found</p>
          <p className="text-xs text-slate-400 mt-1">
            Adjust your search keywords or create a new course using the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedCourses.map((c) => (
              <div
                key={c.id}
                className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 hover:border-white/20 shadow-xl flex flex-col justify-between p-5 space-y-4 group transition-all text-white relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent" />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] truncate max-w-[130px]">
                      {c.categoryName || c.categoryId}
                    </span>
                    <button
                      onClick={() => handleTogglePublish(c)}
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                        c.isPublished
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      }`}
                      title={c.isPublished ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
                    >
                      {c.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{c.isPublished ? 'PUBLISHED' : 'DRAFT'}</span>
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-[#CCFF00] transition-colors">
                    {c.title}
                  </h3>

                  <p className="text-xs font-mono text-slate-400 line-clamp-2 mt-1.5">
                    {c.description || 'Comprehensive curriculum with video lessons and assessments.'}
                  </p>

                  <div className="bg-[#060C17]/90 rounded-xl p-3 text-xs font-mono text-slate-300 space-y-1 mt-3 border border-white/5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grade / Class:</span>
                      <span className="font-semibold text-white">{c.classGrade || 'Class 10'}</span>
                    </div>
                    {c.stream && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stream:</span>
                        <span className="font-semibold text-[#CCFF00]">{c.stream}</span>
                      </div>
                    )}
                    {c.targetExam && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Exam:</span>
                        <span className="font-semibold text-amber-400">{c.targetExam}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validity:</span>
                      <span className="text-slate-400">{c.validityDays ? `${c.validityDays} Days` : '365 Days'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-white/10">
                      <span className="text-slate-400">Tuition Fee:</span>
                      <span className="font-bold text-white font-mono">
                        {c.price === 0 || c.isFree ? (
                          <span className="text-[#CCFF00]">Free</span>
                        ) : (
                          `₹${c.price.toLocaleString('en-IN')}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 font-mono">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-white/5 border border-white/10 hover:border-[#CCFF00]/40 hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingCourse(c)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono">
              <p className="text-xs text-slate-400">
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong> ({filteredCourses.length} Courses)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition cursor-pointer"
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
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-white">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl text-white mb-1">
              {editingCourse ? 'Edit Course Curriculum' : 'Create New Course Offering'}
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-5">
              Configure course metadata, category, pricing, validity duration, and assigned instructor.
            </p>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Class 11 Science (PCM) — Physics, Chemistry & Math"
                  className="w-full py-2.5 px-3.5 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Category (Firestore Collection)
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#0E121A] text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    School Class / Grade Level
                  </label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  >
                    <option value="Class 6" className="bg-[#0E121A] text-white">Class 6</option>
                    <option value="Class 7" className="bg-[#0E121A] text-white">Class 7</option>
                    <option value="Class 8" className="bg-[#0E121A] text-white">Class 8</option>
                    <option value="Class 9" className="bg-[#0E121A] text-white">Class 9</option>
                    <option value="Class 10" className="bg-[#0E121A] text-white">Class 10</option>
                    <option value="Class 11" className="bg-[#0E121A] text-white">Class 11</option>
                    <option value="Class 12" className="bg-[#0E121A] text-white">Class 12</option>
                    <option value="Class 9 Entrance" className="bg-[#0E121A] text-white">Class 9 Entrance</option>
                    <option value="Class 11 Entrance" className="bg-[#0E121A] text-white">Class 11 Entrance</option>
                    <option value="Competitive Exam" className="bg-[#0E121A] text-white">Competitive Exam</option>
                  </select>
                </div>
              </div>

              {/* Conditional Stream & Target Exam Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Stream (For Class 11 & 12)
                  </label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value as any })}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  >
                    <option value="" className="bg-[#0E121A] text-white">None / General</option>
                    <option value="Science PCM" className="bg-[#0E121A] text-white">Science PCM (Physics, Chem, Math)</option>
                    <option value="Science PCB" className="bg-[#0E121A] text-white">Science PCB (Physics, Chem, Bio)</option>
                    <option value="Commerce" className="bg-[#0E121A] text-white">Commerce (Accountancy, Business, Econ)</option>
                    <option value="Arts" className="bg-[#0E121A] text-white">Arts (History, Pol Sci, Geography)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Target Exam / Entrance
                  </label>
                  <input
                    type="text"
                    value={formData.targetExam}
                    onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                    placeholder="BPSC TRE, UP Super TET, BSSC, Bihar SI, AMU, Jamia..."
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  />
                </div>
              </div>

              {/* Pricing & Validity */}
              <div className="p-4 bg-[#060C17] rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-300 uppercase">Pricing & Validity Configuration</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFree}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFree: e.target.checked,
                          price: e.target.checked ? 0 : formData.price || 999,
                        })
                      }
                      className="rounded accent-[#CCFF00]"
                    />
                    <span className="text-xs font-semibold text-[#CCFF00]">100% Free Course</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Final Tuition Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, price: val, isFree: val === 0 });
                      }}
                      className="w-full py-2 px-3 bg-[#0E121A] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Original Price (₹ MRP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full py-2 px-3 bg-[#0E121A] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Course Validity (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                      placeholder="e.g. 365"
                      className="w-full py-2 px-3 bg-[#0E121A] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00]"
                    />
                  </div>
                </div>
              </div>

              {/* Instructor Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Assigned Lead Faculty
                  </label>
                  <select
                    value={formData.instructorId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const teacher = teachers.find((t) => t.uid === selId);
                      setFormData({
                        ...formData,
                        instructorId: selId,
                        instructorName: teacher?.displayName || '',
                      });
                    }}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  >
                    <option value="" className="bg-[#0E121A] text-white">Unassigned / Academy Faculty</option>
                    {teachers.map((t) => (
                      <option key={t.uid} value={t.uid} className="bg-[#0E121A] text-white">
                        {t.displayName} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g. Physics, Chemistry, Math"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Course Description & Syllabus Summary
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline core themes, chapter breakdown, problem sets, and target outcomes..."
                  className="w-full py-2.5 px-3.5 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#CCFF00]"
                />
                <label htmlFor="isPublished" className="font-semibold text-xs text-slate-300 cursor-pointer">
                  Publish immediately (Visible in student discovery catalog)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>{saving ? 'Saving...' : 'Save Course to Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 border border-white/15 shadow-2xl space-y-4 text-white relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center font-mono">
              <h3 className="font-display font-bold text-base text-white">
                Delete Course Record
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{deletingCourse.title}</strong>? This will remove the course and its enrolled access from Firestore.
              </p>
            </div>
            <div className="flex gap-2 font-mono">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition"
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

export default AdminCourses;
