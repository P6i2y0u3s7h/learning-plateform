import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayCircle,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Search,
  Eye,
  CheckCircle2,
  Lock,
  Unlock,
  Video,
  Edit2,
  Clock,
  Sparkles,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { courseService } from '../../../services/courseService';
import type { Lesson, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import VideoPlayer from '../../../components/common/VideoPlayer';
import { cacheManager } from '../../../utils/cacheManager';

export const TeacherLessons: React.FC = () => {
  useDocumentTitle('Manage Lessons & Video Lectures — Brainstorm Academy');
  const { user } = useAuth();

  const cachedLessons = cacheManager.get<Lesson[]>('lessons:all');
  const cachedCourses = cacheManager.get<Course[]>('courses:all');
  const hasCache = Boolean(cachedLessons && cachedCourses);

  const [loading, setLoading] = useState(() => !hasCache);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>(() => cachedLessons || []);
  const [courses, setCourses] = useState<Course[]>(() => cachedCourses || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    courseId: cachedCourses && cachedCourses.length > 0 ? cachedCourses[0].id : '',
    courseTitle: cachedCourses && cachedCourses.length > 0 ? cachedCourses[0].title : '',
    chapterTitle: 'Chapter 1: Foundational Concepts',
    chapterId: '',
    durationMinutes: 30,
    videoProvider: 'youtube' as 'youtube' | 'vimeo' | 'direct' | 'hls' | 'custom',
    videoUrl: '',
    description: '',
    isFreePreview: false,
    isPublished: true,
  });

  // Video Test Preview Modal
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const loadData = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (lessons.length === 0 || courses.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<[Lesson[], Course[]]>((_, reject) =>
        setTimeout(() => reject(new Error('Lessons fetch timed out')), 8000)
      );

      const [fetchedLessons, fetchedCourses] = await Promise.race([
        Promise.all([
          adminService.getLessons(),
          courseService.getAllCourses(),
        ]),
        timeoutPromise,
      ]);

      if (isMountedCheck()) {
        setLessons(fetchedLessons);
        setCourses(fetchedCourses);
        if (fetchedCourses.length > 0 && !formData.courseId) {
          setFormData((prev) => ({
            ...prev,
            courseId: fetchedCourses[0].id,
            courseTitle: fetchedCourses[0].title,
          }));
        }
      }
    } catch (err: any) {
      if (isMountedCheck()) {
        console.warn('[TeacherLessons] Load error:', err);
        if (lessons.length === 0) {
          setError('Failed to load lessons and course catalog.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [lessons.length, courses.length, formData.courseId]);

  useEffect(() => {
    let isMounted = true;
    loadData(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingLesson(null);
    const defaultCourse = courses[0];
    setFormData({
      title: '',
      courseId: defaultCourse?.id || '',
      courseTitle: defaultCourse?.title || '',
      chapterTitle: 'Chapter 1: Foundational Concepts',
      chapterId: '',
      durationMinutes: 30,
      videoProvider: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: '',
      isFreePreview: false,
      isPublished: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      courseId: lesson.courseId || '',
      courseTitle: lesson.courseTitle || '',
      chapterTitle: lesson.chapterTitle || 'Chapter 1',
      chapterId: lesson.chapterId || '',
      durationMinutes: lesson.durationMinutes || 30,
      videoProvider: (lesson.videoProvider as any) || 'youtube',
      videoUrl: lesson.videoUrl || '',
      description: lesson.description || '',
      isFreePreview: lesson.isFreePreview ?? false,
      isPublished: lesson.isPublished ?? true,
    });
    setModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a lesson title.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedCourse = courses.find((c) => c.id === formData.courseId) || courses[0];
      const courseId = selectedCourse?.id || formData.courseId || 'course-default';
      const courseTitle = selectedCourse?.title || formData.courseTitle || 'General Course';
      const chapterId = formData.chapterId || `chap_${courseId}_1`;

      const payload: Partial<Lesson> = {
        ...formData,
        courseId,
        courseTitle,
        chapterId,
      };

      if (editingLesson) {
        await adminService.updateLesson(
          editingLesson.id,
          payload,
          user?.email || 'teacher'
        );
        setLessons((prev) =>
          prev.map((l) =>
            l.id === editingLesson.id
              ? { ...l, ...payload, updatedAt: new Date().toISOString() }
              : l
          )
        );
        setSuccessMsg(`Updated lesson "${payload.title}".`);
      } else {
        const newId = await adminService.createLesson(
          payload,
          user?.email || 'teacher'
        );
        const created: Lesson = {
          id: newId,
          order: lessons.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(payload as any),
        };
        setLessons((prev) => [created, ...prev]);
        setSuccessMsg(`Published lesson "${payload.title}".`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[TeacherLessons] Save error:', err);
      setError(err?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      const updated = await adminService.toggleLessonPublishStatus(
        lesson.id,
        lesson.isPublished,
        user?.email || 'teacher'
      );
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, isPublished: updated } : l))
      );
    } catch (err) {
      alert('Could not change publication status.');
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await adminService.deleteLesson(lesson.id, user?.email || 'teacher');
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      setSuccessMsg(`Removed "${lesson.title}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to delete lesson.');
    }
  };

  const filteredLessons = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lessons.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(q) ||
        (l.chapterTitle && l.chapterTitle.toLowerCase().includes(q)) ||
        (l.courseTitle && l.courseTitle.toLowerCase().includes(q));

      const matchesCourse =
        selectedCourseFilter === 'All' || l.courseId === selectedCourseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [lessons, searchQuery, selectedCourseFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Video Learning Studio
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Manage Lessons & Video Lectures
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author video curriculum with configurable hosting, course and chapter hierarchy, and access gates.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Lesson</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lesson, chapter, or topic..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Filter Course:
          </label>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="All">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lesson List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">
            No Video Lessons Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Click "Add Lesson" to publish a video lecture linked to your courses and chapters.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Lesson</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {item.courseTitle || 'Curriculum Course'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.isFreePreview ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Free Preview
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Enrolled Only
                      </span>
                    )}
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className="cursor-pointer"
                      title="Click to toggle publication"
                    >
                      {item.isPublished ? (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition">
                          Draft
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 mt-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.chapterTitle || 'Chapter Module'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.durationMinutes || 30} mins
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="uppercase text-blue-600 font-semibold">
                        {item.videoProvider || 'youtube'}
                      </span>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPreviewLesson(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Video</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Lesson Authoring
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">
              {editingLesson ? 'Edit Video Lesson' : 'Publish New Video Lesson'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Configurable video hosting metadata. Large video binaries are streamed via YouTube, Vimeo, or CDN.
            </p>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lesson 2.4: Zeroes of Quadratic Polynomials"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Associated Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = courses.find((c) => c.id === id);
                      setFormData({
                        ...formData,
                        courseId: id,
                        courseTitle: selected?.title || '',
                      });
                    }}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition cursor-pointer"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Chapter / Section
                  </label>
                  <input
                    type="text"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    placeholder="e.g. Chapter 2: Polynomials"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Video Provider
                  </label>
                  <select
                    value={formData.videoProvider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoProvider: e.target.value as any,
                      })
                    }
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="youtube">YouTube Embed</option>
                    <option value="vimeo">Vimeo Player</option>
                    <option value="direct">Direct MP4 / CDN</option>
                    <option value="hls">HLS / M3U8 Stream</option>
                    <option value="custom">Custom Web Frame</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })
                    }
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Video URL or Video ID *
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or Vimeo ID"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Lesson Description & Highlights
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key concepts, practice problem references, and homework notes..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              {/* Access Permissions Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-900 font-semibold block">
                      Free Demo / Preview Lesson
                    </span>
                    <span className="text-[10px] text-slate-500">
                      If enabled, non-enrolled students can watch this lecture without enrollment.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFreePreview}
                    onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </label>

                <div className="border-t border-slate-200 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs uppercase tracking-wider text-slate-900 font-semibold">
                      Publish Immediately
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Lesson...</span>
                    </>
                  ) : (
                    <span>{editingLesson ? 'Save Changes' : 'Publish Lesson'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setPreviewLesson(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Video Player Verification
              </span>
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 mt-1">
                {previewLesson.title}
              </h3>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-black">
              <VideoPlayer
                lesson={previewLesson}
                isAuthorized={true}
                courseTitle={previewLesson.courseTitle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLessons;
