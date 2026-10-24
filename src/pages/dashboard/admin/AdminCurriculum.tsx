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
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic Architecture</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Curriculum Master Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Structure and configure course categories, subjects, chapters, and video lessons directly in Cloud Firestore.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'categories') setModalType('category');
            if (activeTab === 'subjects') setModalType('subject');
            if (activeTab === 'chapters') setModalType('chapter');
            if (activeTab === 'lessons') setModalType('lesson');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm hover:shadow w-fit self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add {activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'chapters'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Chapters ({chapters.length})
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Lessons ({lessons.length})
          </button>
        </div>
      </div>

      {/* Content depending on activeTab */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100">
              <Skeleton className="h-4 w-32 bg-slate-100" />
              <Skeleton className="h-4 w-16 bg-slate-100" />
            </div>
          ))}
        </div>
      ) : activeTab === 'categories' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6">Slug</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{c.slug}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete category ${c.name}?`)) return;
                          await adminService.deleteCategory(c.id, user?.email || 'admin');
                          setCategories(categories.filter((cat) => cat.id !== c.id));
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Subject</th>
                  <th className="py-3 px-6">Class / Grade</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                        {s.classGrade || 'Class 10'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete subject ${s.name}?`)) return;
                          await adminService.deleteSubject(s.id, user?.email || 'admin');
                          setSubjects(subjects.filter((sub) => sub.id !== s.id));
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Chapter Title</th>
                  <th className="py-3 px-6">Order</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {chapters.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{ch.title}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 font-medium">Seq #{ch.order}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete chapter ${ch.title}?`)) return;
                          await adminService.deleteChapter(ch.id, user?.email || 'admin');
                          setChapters(chapters.filter((c) => c.id !== ch.id));
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Lesson Title</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lessons.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{l.title}</td>
                    <td className="py-3.5 px-6 text-xs font-semibold text-blue-600">{l.durationMinutes} mins</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete lesson ${l.title}?`)) return;
                          await adminService.deleteLesson(l.id, user?.email || 'admin');
                          setLessons(lessons.filter((les) => les.id !== l.id));
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200/80 shadow-2xl relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-lg text-slate-900 mb-4 capitalize">
              Add New {modalType}
            </h3>

            {modalType === 'category' && (
              <form onSubmit={handleCreateCategory} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Foundation Courses"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50">Save Category</button>
                </div>
              </form>
            )}

            {modalType === 'subject' && (
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Class</label>
                  <input
                    type="text"
                    value={subjectClass}
                    onChange={(e) => setSubjectClass(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50">Save Subject</button>
                </div>
              </form>
            )}

            {modalType === 'chapter' && (
              <form onSubmit={handleCreateChapter} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Real Numbers"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attach to Course</label>
                  <select
                    value={chapterCourseId}
                    onChange={(e) => setChapterCourseId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50">Save Chapter</button>
                </div>
              </form>
            )}

            {modalType === 'lesson' && (
              <form onSubmit={handleCreateLesson} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. Lecture 1: Introduction to Equations"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Attach to Course</label>
                    <select
                      value={lessonCourseId}
                      onChange={(e) => setLessonCourseId(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Video Lecture URL (YouTube / Cloud)</label>
                  <input
                    type="url"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50">Save Lesson</button>
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
