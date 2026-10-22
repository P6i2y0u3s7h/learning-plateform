import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  BookOpen,
  Clock,
  Layers,
  CheckCircle2,
  PlayCircle,
  FileText,
  ShieldCheck,
  Download,
  Share2,
  Award,
  UserCheck,
  Lock,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Sparkles,
  HelpCircle,
  ClipboardList,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Loading';
import RazorpayCheckoutModal from '../components/payment/RazorpayCheckoutModal';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [enrolledNotice, setEnrolledNotice] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [freeEnrolling, setFreeEnrolling] = useState(false);

  const handleEnrollClick = async () => {
    if (!user) {
      navigate(`/login?redirect=/courses/${courseId}`);
      return;
    }

    const currentCourse = courseData?.course;
    if (!currentCourse) return;

    if (currentCourse.price === 0 || currentCourse.isFree) {
      try {
        setFreeEnrolling(true);
        await studentService.enrollCourse(user.uid, currentCourse.id);
        setIsAlreadyEnrolled(true);
        setEnrolledNotice(true);
      } catch (err) {
        console.error('Failed free enrollment:', err);
      } finally {
        setFreeEnrolling(false);
      }
    } else {
      setIsCheckoutOpen(true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchCourse() {
      try {
        setLoading(true);
        if (courseId) {
          const [hierarchy, enrollments] = await Promise.all([
            courseService.getCourseHierarchy(courseId),
            user?.uid ? studentService.getStudentEnrollments(user.uid) : Promise.resolve([]),
          ]);

          if (isMounted) {
            setCourseData(hierarchy);
            if (hierarchy?.course && enrollments && enrollments.length > 0) {
              const enrolled = enrollments.some((e) => e.courseId === courseId || e.id === courseId);
              setIsAlreadyEnrolled(enrolled);
            }
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[CourseDetailsPage] Failed to fetch hierarchy:', err);
        if (isMounted) setLoading(false);
      }
    }

    fetchCourse();
    return () => {
      isMounted = false;
    };
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="w-full bg-[#07080D] min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-8 w-64 rounded-xl bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-72 w-full rounded-2xl bg-white/5" />
              <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const course = courseData?.course;

  if (!course) {
    return (
      <div className="w-full bg-[#07080D] min-h-screen flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0E121A] border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-[#CCFF00] flex items-center justify-center mx-auto border border-[#CCFF00]/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black font-display text-white uppercase">
            Course Not Found
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The requested course record does not exist or may have been unlisted by the academic coordinators.
          </p>
          <div className="pt-2">
            <Link
              to="/school-courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#CCFF00] transition"
            >
              Browse Available Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRestricted = !course.isPublished && !isAdmin;

  if (isRestricted) {
    return (
      <div className="w-full bg-[#07080D] min-h-screen flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-[#0E121A] border border-white/10 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Unpublished Draft Course
          </div>
          <h1 className="text-2xl font-black font-display text-white uppercase">
            Protected Content
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            &ldquo;{course.title}&rdquo; is currently in review status. In accordance with platform security policies, only authorized administrators and assigned educators may access course materials before public launch.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/school-courses"
              className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-mono uppercase text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Explore Public Batches
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-mono uppercase font-bold hover:bg-[#CCFF00] transition"
            >
              Admin Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { chapters = [], lessons = [], materials = [], tests = [] } = courseData;

  return (
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link to="/school-courses" className="hover:text-white transition-colors">COURSES</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold truncate max-w-xs uppercase">{course.title}</span>
        </div>

        {!course.isPublished && isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Admin Preview Mode: This course is currently unpublished and hidden from public students.</span>
            </div>
            <Link
              to="/dashboard/admin/courses"
              className="text-xs font-bold text-[#CCFF00] underline"
            >
              Manage in Admin Panel
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card */}
            <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-3 py-1 rounded-full border border-[#CCFF00]/25">
                  {course.subjectName || 'GENERAL'}
                </span>
                {course.classGrade && (
                  <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {course.classGrade}
                  </span>
                )}
                {course.stream && (
                  <span className="font-mono text-[10px] tracking-wider uppercase text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    {course.stream}
                  </span>
                )}
                {course.targetExam && (
                  <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {course.targetExam}
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-white text-2xl sm:text-3xl lg:text-4xl mb-4 leading-tight uppercase tracking-tight">
                {course.title}
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                {course.description}
              </p>

              {/* Architectural Metrics HUD Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-white/5 font-mono text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">CHAPTERS</p>
                  <p className="font-bold text-white mt-0.5">{chapters.length || course.totalChapters || 8} Modules</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">LESSONS</p>
                  <p className="font-bold text-white mt-0.5">{lessons.length || course.totalLessons || 45} Lessons</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">VALIDITY</p>
                  <p className="font-bold text-[#CCFF00] mt-0.5">{course.validityDays ? `${course.validityDays} Days` : '365 Days'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">FACULTY</p>
                  <p className="font-bold text-white mt-0.5 truncate">{course.instructorName || 'Senior Faculty'}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase tracking-wider">NCERT ALIGNED & EXAM ORIENTED</span>
                </div>
                <div className="flex items-center gap-2 text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span className="uppercase tracking-wider">NOTES & CBT TESTS INCLUDED</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 gap-2 font-mono text-xs">
              {[
                { id: 'curriculum', num: '01', label: `SYLLABUS (${chapters.length} CHs)` },
                { id: 'materials', num: '02', label: `STUDY NOTES (${materials.length})` },
                { id: 'tests', num: '03', label: `TESTS (${tests.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 uppercase tracking-wider font-bold border-b-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#CCFF00] text-[#CCFF00]'
                      : 'border-transparent text-slate-500 hover:text-white'
                  }`}
                >
                  <span className="text-[#CCFF00] mr-1.5">{tab.num} //</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Curriculum / Chapters & Lessons */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {chapters.length === 0 ? (
                  <div className="p-8 bg-[#0E121A] rounded-2xl border border-white/10 text-center text-slate-500 text-xs font-mono">
                    Detailed chapter modules are being organized by faculty mentors.
                  </div>
                ) : (
                  chapters.map((chap, idx) => {
                    const chapLessons = lessons.filter((l) => l.chapterId === chap.id);
                    return (
                      <div key={chap.id} className="bg-[#0E121A] rounded-2xl border border-white/10 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="font-display font-extrabold text-sm text-white uppercase">{chap.title}</h3>
                              {chap.description && (
                                <p className="text-xs text-slate-400 mt-0.5 font-sans">{chap.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-500">
                            {chapLessons.length} LECTURES
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Study Materials */}
            {activeTab === 'materials' && (
              <div className="space-y-3">
                {materials.length === 0 ? (
                  <div className="p-8 bg-[#0E121A] rounded-2xl border border-white/10 text-center text-slate-500 text-xs font-mono">
                    Chapter formula sheets and reference notes will be unlocked upon cohort start.
                  </div>
                ) : (
                  materials.map((mat) => (
                    <div key={mat.id} className="p-4 bg-[#0E121A] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#CCFF00]" />
                        <div>
                          <p className="font-display font-bold text-white uppercase">{mat.title}</p>
                          <p className="text-[11px] font-mono text-slate-400">{mat.subjectName || 'Study Material'} • {mat.fileSizeMb || 1.5} MB</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 font-mono text-[10px] uppercase border border-white/10">
                        PDF Resource
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Practice Tests */}
            {activeTab === 'tests' && (
              <div className="space-y-3">
                {tests.length === 0 ? (
                  <div className="p-8 bg-[#0E121A] rounded-2xl border border-white/10 text-center text-slate-500 text-xs font-mono">
                    Chapter-wise quizzes and full syllabus mock exams are scheduled along with the course.
                  </div>
                ) : (
                  tests.map((t) => (
                    <div key={t.id} className="p-4 bg-[#0E121A] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-[#CCFF00]" />
                        <div>
                          <p className="font-display font-bold text-white uppercase">{t.title}</p>
                          <p className="text-[11px] font-mono text-slate-400">Duration: {t.durationMinutes} mins • Total Marks: {t.totalMarks}</p>
                        </div>
                      </div>
                      <Link
                        to="/mock-tests"
                        className="px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold uppercase hover:bg-[#CCFF00] hover:text-black transition"
                      >
                        Attempt Test
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar Sticky Card (Right col) */}
          <div className="space-y-6">
            <div className="bg-[#0E121A] rounded-3xl border border-white/10 p-6 shadow-2xl sticky top-24">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center mb-6">
                <div className="w-12 h-12 bg-white/10 text-[#CCFF00] rounded-2xl mx-auto flex items-center justify-center mb-3 border border-white/10">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest block">
                  {course.price === 0 || course.isFree ? '100% FREE ENROLLMENT' : 'PREMIUM BATCH'}
                </span>
                <p className="font-display font-extrabold text-3xl text-white mt-2">
                  {course.price === 0 || course.isFree ? (
                    <span className="text-[#CCFF00]">Free Access</span>
                  ) : (
                    <>₹{course.price.toLocaleString('en-IN')}</>
                  )}
                </p>
                {course.originalPrice && course.originalPrice > course.price && (
                  <p className="text-xs font-mono text-slate-500 line-through mt-0.5">
                    ₹{course.originalPrice.toLocaleString('en-IN')} MRP
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2 font-sans">
                  Includes all video lectures, notes & practice tests
                </p>
              </div>

              {isAlreadyEnrolled ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center mb-4">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono font-bold text-xs uppercase mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ENROLLED STUDENT</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">You have full access to this course's videos, notes & tests.</p>
                  <Link
                    to={`/dashboard/student/classroom/${course.id}`}
                    className="mt-3 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#CCFF00] text-black font-mono font-black text-xs uppercase tracking-wider hover:bg-white transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Open Classroom
                  </Link>
                </div>
              ) : enrolledNotice ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center mb-4">
                  <p className="font-mono text-xs font-bold text-emerald-400 uppercase">Enrollment Activated!</p>
                  <p className="text-xs text-slate-300 font-sans mt-1">Visit your Student Dashboard to start learning immediately.</p>
                  <Link
                    to={`/dashboard/student/classroom/${course.id}`}
                    className="block w-full mt-3 py-3 rounded-full bg-[#CCFF00] text-black font-mono font-black text-xs uppercase tracking-wider hover:bg-white transition"
                  >
                    Go to Classroom
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnrollClick}
                    disabled={freeEnrolling}
                    className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-[#CCFF00] text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    {freeEnrolling ? (
                      'ENROLLING...'
                    ) : course.price === 0 || course.isFree ? (
                      <>
                        <span>ENROLL FOR FREE</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-black" />
                        <span>ENROLL VIA RAZORPAY (₹{course.price.toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                  <Link
                    to="/mock-tests"
                    className="block w-full py-3 rounded-full border border-white/10 text-slate-300 text-center font-mono text-xs uppercase hover:bg-white/5 transition"
                  >
                    EXPLORE PRACTICE TESTS
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-white/5 space-y-3 font-mono text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>VALIDITY</span>
                  <span className="font-bold text-white">
                    {course.validityDays ? `${course.validityDays} DAYS` : '365 DAYS'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NOTES & FORMULAS</span>
                  <span className="font-bold text-[#CCFF00]">INCLUDED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MOCK TESTS</span>
                  <span className="font-bold text-white">WEEKLY & CHAPTERS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>COMPATIBILITY</span>
                  <span className="font-bold text-white">MOBILE, TABLET & PC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Razorpay Secure Checkout Modal */}
        {isCheckoutOpen && (
          <RazorpayCheckoutModal
            isOpen={isCheckoutOpen}
            course={course}
            user={user}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={(payment) => {
              setIsAlreadyEnrolled(true);
              setEnrolledNotice(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
