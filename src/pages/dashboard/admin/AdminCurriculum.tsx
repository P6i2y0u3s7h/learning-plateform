import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  PlayCircle,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Category, Subject, Chapter, Lesson, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminCurriculum: React.FC<{ initialTab?: 'categories' | 'subjects' | 'chapters' | 'lessons' }> = ({
  initialTab = 'categories',
}) => {
  useDocumentTitle('Curriculum Management — Super Admin');
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'categories' | 'subjects' | 'chapters' | 'lessons'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Modal State
  const [modalType, setModalType] = useState<'category' | 'subject' | 'chapter' | 'lesson' | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectClass, setSubjectClass] = useState('Class 10');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterCourseId, setChapterCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessonChapterId, setLessonChapterId] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(30);

  useEffect(() => {
    let isMounted = true;
    async function loadCurriculum() {
      try {
        setLoading(true);
        setError(null);
        const [cats, subjs, chaps, less, crs] = await Promise.all([
          adminService.getCategories(),
          adminService.getSubjects(),
          adminService.getChapters(),
          adminService.getLessons(),
          adminService.getCourses(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setSubjects(subjs);
          setChapters(chaps);
          setLessons(less);
          setCourses(crs);
          if (crs.length > 0) {
            setChapterCourseId(crs[0].id);
            setLessonCourseId(crs[0].id);
          }
          if (chaps.length > 0) {
            setLessonChapterId(chaps[0].id);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminCurriculum] Error loading curriculum:', err);
          setError('Failed to load curriculum records.');
          setLoading(false);
        }
      }
    }

    loadCurriculum();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      const id = await adminService.createCategory({ name: categoryName.trim() }, user?.email || 'admin');
      setCategories((prev) => [...prev, { id, name: categoryName.trim(), slug: categoryName.toLowerCase().replace(/\s+/g, '-'), isActive: true }]);
      setCategoryName('');
      setModalType(null);
    } catch (err) {
      alert('Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setSaving(true);
    try {
      const id = await adminService.createSubject({ name: subjectName.trim(), classGrade: subjectClass, categoryId: 'school' }, user?.email || 'admin');
      setSubjects((prev) => [...prev, { id, name: subjectName.trim(), classGrade: subjectClass, categoryId: 'school' }]);
      setSubjectName('');
      setModalType(null);
    } catch (err) {
      alert('Could not save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || !chapterCourseId) return;
    setSaving(true);
    try {
      const id = await adminService.createChapter({ title: chapterTitle.trim(), courseId: chapterCourseId, order: chapters.length + 1 }, user?.email || 'admin');
      setChapters((prev) => [...prev, { id, title: chapterTitle.trim(), courseId: chapterCourseId, order: chapters.length + 1, totalLessons: 0, isPublished: true }]);
      setChapterTitle('');
      setModalType(null);
    } catch (err) {
      alert('Could not save chapter.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setSaving(true);
    try {
      const id = await adminService.createLesson({
        title: lessonTitle.trim(),
        courseId: lessonCourseId,
        chapterId: lessonChapterId,
        videoUrl: lessonVideoUrl.trim(),
        durationMinutes: Number(lessonDuration),
        type: 'video',
        order: lessons.length + 1,
      }, user?.email || 'admin');
      setLessons((prev) => [...prev, {
        id,
        title: lessonTitle.trim(),
        courseId: lessonCourseId,
        chapterId: lessonChapterId,
        videoUrl: lessonVideoUrl.trim(),
        durationMinutes: Number(lessonDuration),
        type: 'video',
        order: lessons.length + 1,
        isFreePreview: false,
        isPublished: true,
      }]);
      setLessonTitle('');
      setLessonVideoUrl('');
      setModalType(null);
    } catch (err) {
      alert('Could not save lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>[ ACADEMIC ARCHITECTURE · CURRICULUM ]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Curriculum Master Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
            Structure and configure course categories, subjects, chapters, and video lessons directly in Cloud Firestore.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E121A]/85 backdrop-blur-2xl p-3 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'chapters'
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Chapters ({chapters.length})
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Lessons ({lessons.length})
          </button>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'categories') setModalType('category');
            if (activeTab === 'subjects') setModalType('subject');
            if (activeTab === 'chapters') setModalType('chapter');
            if (activeTab === 'lessons') setModalType('lesson');
          }}
          className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add {activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {/* Content depending on activeTab */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-white/5">
              <Skeleton className="h-4 w-32 bg-white/5" />
              <Skeleton className="h-4 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : activeTab === 'categories' ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6">Slug</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{c.name}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono text-xs">{c.slug}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete category ${c.name}?`)) return;
                          await adminService.deleteCategory(c.id, user?.email || 'admin');
                          setCategories(categories.filter((cat) => cat.id !== c.id));
                        }}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'subjects' ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Subject</th>
                  <th className="py-3 px-6">Class / Grade</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{s.name}</td>
                    <td className="py-3.5 px-6 text-[#CCFF00] font-mono font-semibold">{s.classGrade || 'Class 10'}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete subject ${s.name}?`)) return;
                          await adminService.deleteSubject(s.id, user?.email || 'admin');
                          setSubjects(subjects.filter((sub) => sub.id !== s.id));
                        }}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'chapters' ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Chapter Title</th>
                  <th className="py-3 px-6">Order</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {chapters.map((ch) => (
                  <tr key={ch.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{ch.title}</td>
                    <td className="py-3.5 px-6 text-xs font-mono text-slate-400">Seq #{ch.order}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete chapter ${ch.title}?`)) return;
                          await adminService.deleteChapter(ch.id, user?.email || 'admin');
                          setChapters(chapters.filter((c) => c.id !== ch.id));
                        }}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Lesson Title</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {lessons.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{l.title}</td>
                    <td className="py-3.5 px-6 text-xs font-mono text-[#CCFF00]">{l.durationMinutes} mins</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete lesson ${l.title}?`)) return;
                          await adminService.deleteLesson(l.id, user?.email || 'admin');
                          setLessons(lessons.filter((les) => les.id !== l.id));
                        }}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-4">
              Add New {modalType.toUpperCase()}
            </h3>

            {modalType === 'category' && (
              <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Foundation Courses"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer disabled:opacity-50">Save Category</button>
                </div>
              </form>
            )}

            {modalType === 'subject' && (
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Target Class</label>
                  <input
                    type="text"
                    value={subjectClass}
                    onChange={(e) => setSubjectClass(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer disabled:opacity-50">Save Subject</button>
                </div>
              </form>
            )}

            {modalType === 'chapter' && (
              <form onSubmit={handleCreateChapter} className="space-y-4 text-xs">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Real Numbers"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Attach to Course</label>
                  <select
                    value={chapterCourseId}
                    onChange={(e) => setChapterCourseId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer disabled:opacity-50">Save Chapter</button>
                </div>
              </form>
            )}

            {modalType === 'lesson' && (
              <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. Lecture 1: Introduction to Equations"
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Attach to Course</label>
                    <select
                      value={lessonCourseId}
                      onChange={(e) => setLessonCourseId(e.target.value)}
                      className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Video Lecture URL (YouTube / Cloud)</label>
                  <input
                    type="url"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer disabled:opacity-50">Save Lesson</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurriculum;
