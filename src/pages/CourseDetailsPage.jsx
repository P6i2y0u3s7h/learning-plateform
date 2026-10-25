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
  GraduationCap
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
      <div className="w-full bg-[#F8FAFC] min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const course = courseData?.course;

  if (!course) {
    return (
      <div className="w-full bg-[#F8FAFC] min-h-screen flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Course Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested course record does not exist or may have been unlisted by the academic coordinators.
          </p>
          <div className="pt-2">
            <Link
              to="/school-courses"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
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
      <div className="w-full bg-[#F8FAFC] min-h-screen flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Unpublished Draft Course
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Protected Content
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            &ldquo;{course.title}&rdquo; is currently in review status. In accordance with platform security policies, only authorized administrators and assigned educators may access course materials before public launch.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/school-courses"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Explore Public Batches
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
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
    <div className="w-full bg-[#F8FAFC] text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/school-courses" className="hover:text-blue-600 transition-colors">Courses</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-600 font-semibold truncate max-w-xs">{course.title}</span>
        </div>

        {!course.isPublished && isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Admin Preview Mode: This course is currently unpublished and hidden from public students.</span>
            </div>
            <Link
              to="/dashboard/admin/courses"
              className="text-xs font-bold text-amber-900 underline"
            >
              Manage in Admin Panel
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card (EduCore Theme) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm relative">
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {course.subjectName || 'General'}
                </span>
                {course.classGrade && (
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {course.classGrade}
                  </span>
                )}
                {course.stream && (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                    {course.stream}
                  </span>
                )}
                {course.targetExam && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {course.targetExam}
                  </span>
                )}
              </div>

              <h1 className="font-extrabold text-slate-900 text-xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 leading-tight tracking-tight">
                {course.title}
              </h1>

              <p className="text-slate-600 text-xs sm:text-base leading-relaxed mb-6">
                {course.description}
              </p>

              {/* Course Metrics HUD Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-4 border-y border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Chapters</p>
                  <p className="font-bold text-slate-900 mt-0.5">{chapters.length || course.totalChapters || 8} Modules</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Lessons</p>
                  <p className="font-bold text-slate-900 mt-0.5">{lessons.length || course.totalLessons || 45} Lessons</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Validity</p>
                  <p className="font-bold text-blue-600 mt-0.5">{course.validityDays ? `${course.validityDays} Days` : '365 Days'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Faculty</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{course.instructorName || 'Senior Faculty'}</p>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2.5 sm:px-3 py-1.5 rounded-full border border-emerald-200 text-[11px] sm:text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">NCERT Aligned & Exam Oriented</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-2.5 sm:px-3 py-1.5 rounded-full border border-blue-200 text-[11px] sm:text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">Notes & CBT Tests Included</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-1.5 sm:gap-3 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'curriculum', num: '01', label: `Syllabus (${chapters.length} Modules)` },
                { id: 'materials', num: '02', label: `Study Notes (${materials.length})` },
                { id: 'tests', num: '03', label: `Tests (${tests.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 sm:py-3 px-3 sm:px-4 font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="text-blue-600 mr-1.5 font-bold">{tab.num}.</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Curriculum / Chapters & Lessons */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {chapters.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
                    Detailed chapter modules are being organized by faculty mentors.
                  </div>
                ) : (
                  chapters.map((chap, idx) => {
                    const chapLessons = lessons.filter((l) => l.chapterId === chap.id);
                    return (
                      <div key={chap.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900">{chap.title}</h3>
                              {chap.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{chap.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {chapLessons.length} Lectures
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
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
                    Chapter formula sheets and reference notes will be unlocked upon cohort start.
                  </div>
                ) : (
                  materials.map((mat) => (
                    <div key={mat.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-bold text-slate-900">{mat.title}</p>
                          <p className="text-[11px] text-slate-500">{mat.subjectName || 'Study Material'} • {mat.fileSizeMb || 1.5} MB</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 font-semibold text-[10px] uppercase border border-slate-200">
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
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
                    Chapter-wise quizzes and full syllabus mock exams are scheduled along with the course.
                  </div>
                ) : (
                  tests.map((t) => (
                    <div key={t.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs shadow-sm">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-bold text-slate-900">{t.title}</p>
                          <p className="text-[11px] text-slate-500">Duration: {t.durationMinutes} mins • Total Marks: {t.totalMarks}</p>
                        </div>
                      </div>
                      <Link
                        to="/mock-tests"
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 text-center mb-6">
                <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-blue-200 shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  {course.price === 0 || course.isFree ? '100% Free Enrollment' : 'Full Batch Access'}
                </span>
                <p className="font-extrabold text-3xl text-slate-900 mt-2">
                  {course.price === 0 || course.isFree ? (
                    <span className="text-emerald-600">Free Access</span>
                  ) : (
                    <>₹{course.price.toLocaleString('en-IN')}</>
                  )}
                </p>
                {course.originalPrice && course.originalPrice > course.price && (
                  <p className="text-xs text-slate-400 line-through mt-0.5">
                    ₹{course.originalPrice.toLocaleString('en-IN')} MRP
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Includes all video lectures, notes & practice tests
                </p>
              </div>

              {isAlreadyEnrolled ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center mb-4">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs uppercase mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Enrolled Student</span>
                  </div>
                  <p className="text-xs text-slate-600">You have full access to this course's videos, notes & tests.</p>
                  <Link
                    to={`/dashboard/student/classroom/${course.id}`}
                    className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Open Classroom
                  </Link>
                </div>
              ) : enrolledNotice ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center mb-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Enrollment Activated!</p>
                  <p className="text-xs text-slate-600 mt-1">Visit your Student Dashboard to start learning immediately.</p>
                  <Link
                    to={`/dashboard/student/classroom/${course.id}`}
                    className="block w-full mt-3 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm"
                  >
                    Go to Classroom
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnrollClick}
                    disabled={freeEnrolling}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    {freeEnrolling ? (
                      'Enrolling...'
                    ) : course.price === 0 || course.isFree ? (
                      <>
                        <span>Enroll for Free</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-white" />
                        <span>Enroll via Razorpay (₹{course.price.toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                  <Link
                    to="/mock-tests"
                    className="block w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-center text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Explore Practice Tests
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Validity</span>
                  <span className="font-semibold text-slate-900">
                    {course.validityDays ? `${course.validityDays} Days` : '365 Days'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notes & Formulas</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mock Tests</span>
                  <span className="font-semibold text-slate-900">Weekly & Chapter Tests</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform Compatibility</span>
                  <span className="font-semibold text-slate-900">Mobile, Tablet & PC</span>
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
