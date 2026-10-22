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
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 04 // VIDEO LEARNING STUDIO ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Manage Lessons & Video Lectures
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Author video curriculum with configurable hosting, course and chapter hierarchy, and access gates.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Lesson</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lesson, chapter, or topic..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider">
            Filter Course:
          </label>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="py-1.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs font-mono font-semibold text-white focus:outline-none focus:border-[#CCFF00]"
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
            <div key={i} className="p-5 bg-[#0E121A]/85 rounded-2xl border border-white/10 shadow-lg space-y-3">
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-5 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg text-white mb-1">
            No Video Lessons Found
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto mb-6">
            Click "Add Lesson" to publish a video lecture linked to your courses and chapters.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Lesson</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl hover:border-white/25 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {item.courseTitle || 'Curriculum Course'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.isFreePreview ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Free Preview
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Enrolled Only
                      </span>
                    )}
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase transition cursor-pointer border ${
                        item.isPublished
                          ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30 hover:bg-[#CCFF00]/20'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {item.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 mt-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#CCFF00] group-hover:bg-[#CCFF00] group-hover:text-black transition">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans font-bold text-sm text-white line-clamp-1 group-hover:text-[#CCFF00] transition">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                      {item.chapterTitle || 'Chapter Module'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#CCFF00]" />
                        {item.durationMinutes || 30} mins
                      </span>
                      <span className="uppercase text-slate-500">•</span>
                      <span className="uppercase text-[#38BDF8]">
                        {item.videoProvider || 'youtube'}
                      </span>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setPreviewLesson(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 text-[#CCFF00] hover:bg-white/10 border border-white/10 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Video</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-[#38BDF8] hover:bg-white/10 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0E121A] text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
                [ LESSON AUTHORING ]
              </span>
            </div>
            <h3 className="font-mono font-black text-xl text-white mb-1 uppercase tracking-tight">
              {editingLesson ? 'Edit Video Lesson' : 'Publish New Video Lesson'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-5">
              Configurable video hosting metadata. Large video binaries are streamed via YouTube, Vimeo, or CDN.
            </p>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lesson 2.4: Zeroes of Quadratic Polynomials"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white placeholder-slate-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
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
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white outline-none transition font-mono"
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
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                    Chapter / Section
                  </label>
                  <input
                    type="text"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    placeholder="e.g. Chapter 2: Polynomials"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white outline-none transition font-sans"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
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
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white outline-none transition font-mono"
                  >
                    <option value="youtube">YouTube Embed</option>
                    <option value="vimeo">Vimeo Player</option>
                    <option value="direct">Direct MP4 / CDN</option>
                    <option value="hls">HLS / M3U8 Stream</option>
                    <option value="custom">Custom Web Frame</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })
                    }
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white outline-none transition font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                  Video URL or Video ID *
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or Vimeo ID"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white font-mono text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                  Lesson Description & Highlights
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key concepts, practice problem references, and homework notes..."
                  className="w-full py-2 px-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl text-white placeholder-slate-500 outline-none transition font-sans"
                />
              </div>

              {/* Access Permissions Box */}
              <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-white font-bold block">
                      Free Demo / Preview Lesson
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      If enabled, non-enrolled students can watch this lecture without enrollment.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFreePreview}
                    onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                    className="w-4 h-4 rounded text-[#CCFF00] accent-[#CCFF00] cursor-pointer"
                  />
                </label>

                <div className="border-t border-white/10 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                      Publish Immediately
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-[#CCFF00] accent-[#CCFF00] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-mono text-xs uppercase font-bold text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0E121A] rounded-3xl max-w-3xl w-full p-6 border border-white/15 shadow-2xl relative text-white">
            <button
              onClick={() => setPreviewLesson(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="font-mono text-xs font-bold text-[#CCFF00] uppercase tracking-wider">
                Video Player Verification
              </span>
              <h3 className="font-mono font-black text-lg sm:text-xl text-white mt-1">
                {previewLesson.title}
              </h3>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black">
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
