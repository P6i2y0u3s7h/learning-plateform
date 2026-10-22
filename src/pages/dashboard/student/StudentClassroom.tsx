import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Lock,
  FileText,
  HelpCircle,
  BookOpen,
  Download,
  Share2,
  Clock,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseService } from '../../../services/courseService';
import { studentService } from '../../../services/studentService';
import type { Course, Chapter, Lesson, StudyMaterial, Enrollment } from '../../../types';
import { VideoPlayer } from '../../../components/common/VideoPlayer';
import { PDFViewerModal } from '../../../components/common/PDFViewerModal';
import { ProgressBar } from '../../../components/UI';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const StudentClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, role } = useAuth();
  const isTeacher = role === 'teacher';

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  // Active state
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'doubt'>('overview');

  // PDF Viewer Modal
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Doubt quick submission
  const [doubtText, setDoubtText] = useState('');
  const [doubtSubmitting, setDoubtSubmitting] = useState(false);
  const [doubtSuccess, setDoubtSuccess] = useState(false);

  useDocumentTitle(
    course ? `${course.title} — Classroom & Video Lectures` : 'Student Classroom'
  );

  useEffect(() => {
    let isMounted = true;
    async function loadClassroom() {
      if (!courseId) return;
      try {
        setLoading(true);
        const [hierarchy, enrollments] = await Promise.all([
          courseService.getCourseHierarchy(courseId),
          user?.uid ? studentService.getStudentEnrollments(user.uid) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setCourse(hierarchy.course);
          setChapters(hierarchy.chapters);
          setLessons(hierarchy.lessons);
          setMaterials(hierarchy.materials);

          const currentEnr = enrollments.find((e) => e.courseId === courseId) || null;
          setEnrollment(currentEnr);

          // Select lesson from URL query or fallback to first lesson
          const requestedLessonId = searchParams.get('lesson');
          if (requestedLessonId && hierarchy.lessons.some((l) => l.id === requestedLessonId)) {
            setActiveLessonId(requestedLessonId);
          } else if (hierarchy.lessons.length > 0) {
            setActiveLessonId(hierarchy.lessons[0].id);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('[StudentClassroom] Error loading classroom:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadClassroom();
    return () => {
      isMounted = false;
    };
  }, [courseId, user?.uid]);

  const activeLesson =
    lessons.find((l) => l.id === activeLessonId) || lessons[0] || null;

  const isEnrolled =
    Boolean(enrollment && enrollment.status === 'active') ||
    course?.isFree ||
    course?.price === 0 ||
    isAdmin ||
    isTeacher;

  const isLessonLocked =
    !isEnrolled && activeLesson ? !activeLesson.isFreePreview : false;

  const completedLessonIds = enrollment?.completedLessonIds || [];
  const isLessonCompleted = activeLesson
    ? completedLessonIds.includes(activeLesson.id)
    : false;

  const handleToggleComplete = async () => {
    if (!user?.uid || !courseId || !activeLesson) return;
    try {
      const res = await studentService.toggleLessonCompletion(
        user.uid,
        courseId,
        activeLesson.id,
        lessons.length
      );
      if (enrollment) {
        const nextList = res.isCompleted
          ? [...completedLessonIds, activeLesson.id]
          : completedLessonIds.filter((id) => id !== activeLesson.id);
        setEnrollment({
          ...enrollment,
          completedLessonIds: nextList,
          progressPercentage: res.newProgress,
        });
      }
    } catch (err) {
      console.error('Error toggling lesson completion:', err);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setSearchParams({ lesson: lessonId });
  };

  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === activeLessonId);
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      handleSelectLesson(lessons[currentIndex + 1].id);
    }
  };

  const handlePreviousLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === activeLessonId);
    if (currentIndex > 0) {
      handleSelectLesson(lessons[currentIndex - 1].id);
    }
  };

  const handleOpenPdf = (mat: StudyMaterial) => {
    setSelectedMaterial(mat);
    setPdfModalOpen(true);
  };

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !doubtText.trim() || !course) return;
    setDoubtSubmitting(true);
    try {
      await studentService.submitDoubt({
        userId: user.uid,
        studentName: user.displayName || 'Student',
        studentEmail: user.email,
        courseId: course.id,
        subjectName: course.subjectName || course.title,
        question: `[Lesson: ${activeLesson?.title || 'General'}] ${doubtText.trim()}`,
      });
      setDoubtText('');
      setDoubtSuccess(true);
      setTimeout(() => setDoubtSuccess(false), 4000);
    } catch (err) {
      alert('Could not submit doubt. Please try again.');
    } finally {
      setDoubtSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-gray-100 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-[#172033]">Course Not Found</h3>
        <p className="text-xs text-gray-500">
          The course you requested is not active or could not be loaded.
        </p>
        <Link
          to="/dashboard/student/courses"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#17365D] text-white text-xs font-bold"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  const courseMaterials = materials.filter(
    (m) => !m.courseId || m.courseId === course.id
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/60">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link
            to="/dashboard/student/courses"
            className="hover:text-[#2457A7] font-medium flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> My Courses
          </Link>
          <span>/</span>
          <span className="font-bold text-[#17365D] truncate max-w-xs">{course.title}</span>
        </div>

        {enrollment && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600">Course Completion:</span>
            <div className="w-32">
              <ProgressBar value={enrollment.progressPercentage || 0} />
            </div>
            <span className="text-xs font-bold text-[#2457A7]">
              {enrollment.progressPercentage || 0}%
            </span>
          </div>
        )}
      </div>

      {/* Main Classroom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Lecture & Content Tabs (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <VideoPlayer
              title={activeLesson.title}
              videoUrl={activeLesson.videoUrl}
              videoProvider={activeLesson.videoProvider || 'youtube'}
              durationMinutes={activeLesson.durationMinutes}
              isLocked={isLessonLocked}
              isCompleted={isLessonCompleted}
              courseId={course.id}
              courseTitle={course.title}
              onToggleComplete={isEnrolled ? handleToggleComplete : undefined}
            />
          ) : (
            <div className="aspect-video w-full rounded-3xl bg-slate-900 text-white flex items-center justify-center p-6 text-center">
              <p className="text-sm font-semibold">No lessons available in this course yet.</p>
            </div>
          )}

          {/* Navigation Controls: Previous / Next */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handlePreviousLesson}
              disabled={lessons.findIndex((l) => l.id === activeLessonId) <= 0}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Lecture
            </button>
            <button
              onClick={handleNextLesson}
              disabled={
                lessons.findIndex((l) => l.id === activeLessonId) >=
                lessons.length - 1
              }
              className="px-4 py-2 rounded-xl bg-[#17365D] hover:bg-[#2457A7] text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
            >
              Next Lecture <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs: Lesson Notes, Chapter PDFs, Ask Doubt */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex border-b border-gray-100 gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-[#2457A7] text-[#2457A7]'
                    : 'border-transparent text-gray-500 hover:text-[#172033]'
                }`}
              >
                Lecture Notes & Summary
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`pb-3 border-b-2 transition ${
                  activeTab === 'resources'
                    ? 'border-[#2457A7] text-[#2457A7]'
                    : 'border-transparent text-gray-500 hover:text-[#172033]'
                }`}
              >
                Study Materials & Worksheets ({courseMaterials.length})
              </button>
              <button
                onClick={() => setActiveTab('doubt')}
                className={`pb-3 border-b-2 transition ${
                  activeTab === 'doubt'
                    ? 'border-[#2457A7] text-[#2457A7]'
                    : 'border-transparent text-gray-500 hover:text-[#172033]'
                }`}
              >
                Ask a Doubt on this Lecture
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#172033] text-base">
                    {activeLesson?.title || course.title}
                  </h3>
                  {activeLesson?.isFreePreview && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      Free Preview Lecture
                    </span>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {activeLesson?.description ||
                    course.description ||
                    'Comprehensive classroom lecture covering core theoretical principles, theorem proofs, and solved numerical problems.'}
                </p>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <span className="font-bold text-[#17365D] text-xs">Pedagogical Learning Note:</span>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Watch the lecture through, pause when problem statements appear, and attempt derivations on your workbook before comparing with the step-by-step video solution.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Study Materials */}
            {activeTab === 'resources' && (
              <div className="space-y-3">
                {courseMaterials.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No downloadable chapter notes uploaded for this course yet.
                  </div>
                ) : (
                  courseMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-[#2457A7] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-[#172033] truncate">{mat.title}</p>
                          <p className="text-[11px] text-gray-500">
                            {mat.subjectName || 'Resource'} • {mat.fileType.toUpperCase()} • {mat.fileSizeMb || 1.5} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleOpenPdf(mat)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#17365D] hover:bg-gray-50 transition"
                        >
                          View PDF
                        </button>
                        {mat.isDownloadable !== false && mat.fileUrl && (
                          <a
                            href={mat.fileUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-[#17365D] text-white hover:bg-[#2457A7] transition"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Ask Doubt */}
            {activeTab === 'doubt' && (
              <form onSubmit={handleSubmitDoubt} className="space-y-4 text-xs">
                {doubtSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Your academic question has been submitted to the faculty desk!</span>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-[#172033] mb-1.5">
                    What is your doubt regarding this lecture?
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    placeholder="Specify the minute mark or formula step where you got stuck..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#2457A7]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={doubtSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#2457A7] text-white font-bold transition shadow-xs"
                >
                  {doubtSubmitting ? 'Submitting Question...' : 'Submit to Faculty Mentor'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Course Syllabus Curriculum Tree (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2457A7]" />
                <h3 className="font-bold text-sm text-[#172033]">Course Curriculum</h3>
              </div>
              <span className="text-xs text-gray-500">{lessons.length} Lectures</span>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {chapters.map((chap, chapIdx) => {
                const chapLessons = lessons.filter((l) => l.chapterId === chap.id);
                return (
                  <div key={chap.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17365D] bg-gray-50/80 p-2.5 rounded-xl">
                      <span className="w-5 h-5 rounded-md bg-[#2457A7]/10 text-[#2457A7] flex items-center justify-center text-[10px]">
                        {chapIdx + 1}
                      </span>
                      <span className="truncate">{chap.title}</span>
                    </div>

                    <div className="space-y-1 pl-2">
                      {chapLessons.map((l) => {
                        const isCurrent = l.id === activeLessonId;
                        const isDone = completedLessonIds.includes(l.id);
                        const isLockedItem = !isEnrolled && !l.isFreePreview;

                        return (
                          <button
                            key={l.id}
                            onClick={() => handleSelectLesson(l.id)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                              isCurrent
                                ? 'bg-[#2457A7] text-white font-bold shadow-xs'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isDone ? (
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                                    isCurrent ? 'text-emerald-300' : 'text-emerald-600'
                                  }`}
                                />
                              ) : isLockedItem ? (
                                <Lock
                                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                                    isCurrent ? 'text-white' : 'text-amber-500'
                                  }`}
                                />
                              ) : (
                                <PlayCircle
                                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                                    isCurrent ? 'text-white' : 'text-[#2457A7]'
                                  }`}
                                />
                              )}
                              <span className="truncate">{l.title}</span>
                            </div>
                            <span
                              className={`text-[10px] flex-shrink-0 ${
                                isCurrent ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {l.durationMinutes}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        material={selectedMaterial}
        canDownload={selectedMaterial?.isDownloadable !== false}
      />
    </div>
  );
};

export default StudentClassroom;
