import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Clock,
  Calendar,
  Award,
  ArrowRight,
  PlayCircle,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileText,
  CreditCard,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type {
  Enrollment,
  Course,
  TestAttempt,
  Test,
  LiveClass,
  Assignment,
  Notification,
} from '../../../types';
import { StatCard, ProgressBar } from '../../../components/UI';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const StudentOverview: React.FC = () => {
  useDocumentTitle('Student Dashboard — Brainstorm Academy');
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real Firestore data state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const [
          enrList,
          attemptsList,
          testsList,
          classesList,
          assignmentsList,
          notifsList,
        ] = await Promise.all([
          studentService.getStudentEnrollments(user.uid),
          studentService.getStudentTestAttempts(user.uid),
          studentService.getAvailablePracticeTests(),
          studentService.getUpcomingClasses(),
          studentService.getAssignments(),
          studentService.getStudentNotifications(user.uid),
        ]);

        let courseDetails: Course[] = [];
        if (enrList.length > 0) {
          courseDetails = await studentService.getCoursesByIds(enrList.map((e) => e.courseId));
        }

        if (isMounted) {
          setEnrollments(enrList);
          setEnrolledCourses(courseDetails);
          setTestAttempts(attemptsList);
          setUpcomingTests(testsList.slice(0, 3));
          setUpcomingClasses(classesList.slice(0, 2));
          setPendingAssignments(assignmentsList.slice(0, 3));
          setRecentNotifications(notifsList.slice(0, 3));
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error fetching student dashboard records:', err);
          setError('Could not refresh latest dashboard data.');
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Dynamic metrics calculation with ZERO hardcoding
  const stats = useMemo(() => {
    return studentService.calculateDashboardStats(
      enrollments,
      testAttempts,
      userProfile?.completedLessonIds || []
    );
  }, [enrollments, testAttempts, userProfile?.completedLessonIds]);

  // Student greeting
  const studentName = userProfile?.displayName || user?.displayName || 'Scholar';
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Performance Trend Chart Data
  const chartPerformanceData = useMemo(() => {
    if (testAttempts.length === 0) return [];
    return [...testAttempts]
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
      .map((att, i) => ({
        month: `Test ${i + 1}`,
        score: att.percentage || 0,
      }));
  }, [testAttempts]);

  // Subject Scores Breakdown Data
  const chartSubjectData = useMemo(() => {
    const courseMap = new Map<string, Course>();
    enrolledCourses.forEach((c) => courseMap.set(c.id, c));

    return enrollments.slice(0, 4).map((enr) => {
      const crs = courseMap.get(enr.courseId);
      return {
        subject: crs?.subjectName || crs?.title || enr.courseTitle || 'Subject',
        score: enr.progressPercentage || 0,
      };
    });
  }, [enrollments, enrolledCourses]);

  return (
    <div className="space-y-7 relative">
      {/* 1. Welcome Section & Student Profile Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-slate-900">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-display font-bold text-2xl shadow-xs flex-shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Student Learning Dashboard
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {timeGreeting}, {studentName}!
              </h1>
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Active Scholar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
              {userProfile?.classGrade || 'Class 10 CBSE'} •{' '}
              {userProfile?.targetExam ? `Target: ${userProfile.targetExam}` : 'Academic Session 2026–27'}
            </p>
          </div>
        </div>

        {/* Quick Dashboard Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs font-semibold">
          <Link
            to="/dashboard/student/tests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Take Test</span>
          </Link>
          <Link
            to="/dashboard/student/doubts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Ask Doubt</span>
          </Link>
          <Link
            to="/dashboard/student/materials"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Study Notes</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={stats.enrolledCoursesCount.toString()}
          sub={stats.enrolledCoursesCount > 0 ? 'Active programs' : '0 enrolled'}
          color="#2563EB"
        />
        <StatCard
          icon={ClipboardList}
          label="Tests Attempted"
          value={stats.testsAttemptedCount.toString()}
          sub={stats.testsAttemptedCount > 0 ? 'Completed assessments' : 'No tests yet'}
          color="#16A34A"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.averageScoreText}
          sub={stats.testsAttemptedCount > 0 ? 'Overall test performance' : 'Take a test to calculate'}
          color="#2563EB"
        />
        <StatCard
          icon={Clock}
          label="Study Hours"
          value={stats.studyHoursText}
          sub={`${stats.completedLessonsCount} lessons finished`}
          color="#6366F1"
        />
      </div>

      {/* Grid: Left (Continue Learning, Courses, Progress) & Right (Upcoming, Results, Doubts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-7">
          
          {/* Continue Learning & Enrolled Courses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                  Continue Learning
                </h2>
                <p className="text-xs text-slate-500 font-sans">Pick up right where you left off</p>
              </div>
              <Link
                to="/dashboard/student/courses"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View All ({enrollments.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3.5">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-2.5 opacity-80" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">
                  You Haven't Enrolled in Any Courses Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed font-sans">
                  Join our comprehensive school batches, competitive exam coaching, or AMU/Jamia entrance modules to start learning.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold">
                  <Link
                    to="/school-courses"
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                  >
                    School Courses
                  </Link>
                  <Link
                    to="/competitive-exams"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Competitive Exams
                  </Link>
                  <Link
                    to="/amu-jamia"
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                  >
                    AMU & Jamia
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {enrollments.slice(0, 3).map((enr) => {
                  const course = enrolledCourses.find((c) => c.id === enr.courseId);
                  const progress = enr.progressPercentage || 0;
                  const title = course?.title || enr.courseTitle || 'Enrolled Course';
                  const subject = course?.subjectName || 'Course';

                  return (
                    <div
                      key={enr.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            {subject}
                          </p>
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {title}
                          </h4>
                          <div className="mt-2 max-w-xs">
                            <ProgressBar value={progress} showLabel />
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/dashboard/student/classroom/${enr.courseId}`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs flex-shrink-0"
                      >
                        Resume →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress Reports: Performance Trend & Subject Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Score Trend & Subject Mastery
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Visual breakdown of your actual assessment achievements
                </p>
              </div>
              <Link
                to="/dashboard/student/progress"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Detailed Report →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score progression chart */}
              <div className="h-56 flex flex-col">
                <p className="text-xs font-semibold text-slate-600 mb-2 text-center uppercase tracking-wider">
                  Score Progression (Test %)
                </p>
                {chartPerformanceData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-800">No Test Progression Yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Take your first test to view your progress graph.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartPerformanceData}>
                        <defs>
                          <linearGradient id="scoreColorOverview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                        <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#scoreColorOverview)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Subject Breakdown chart */}
              <div className="h-56 flex flex-col">
                <p className="text-xs font-semibold text-slate-600 mb-2 text-center uppercase tracking-wider">
                  Curriculum Completion (%)
                </p>
                {chartSubjectData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-800">No Enrolled Subjects</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enroll in programs to track subject completion.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSubjectData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="subject" stroke="#64748B" fontSize={10} />
                        <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey="score" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignments Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                Recent Coursework & Assignments
              </h3>
              <Link
                to="/dashboard/student/assignments"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>

            {pendingAssignments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-100 font-sans">
                No pending homework or assignments due right now.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{a.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Due: {a.dueDate || 'Flexible'} • Total: {a.totalMarks} pts
                      </p>
                    </div>
                    <Link
                      to="/dashboard/student/assignments"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition flex-shrink-0"
                    >
                      Submit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Scheduled Live Classes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Live Sessions
              </h3>
              <Link
                to="/dashboard/student/classes"
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Schedule →
              </Link>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <p className="font-semibold">No live sessions scheduled today.</p>
                <p className="text-slate-500 mt-0.5 font-sans">
                  Check back for weekly live doubts and mentor lectures.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {upcomingClasses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                  >
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                      {c.subjectName || 'Live'}
                    </span>
                    <h4 className="font-bold text-slate-900">{c.title}</h4>
                    <p className="text-slate-500 text-[11px]">{c.scheduledAt}</p>
                    <Link
                      to="/dashboard/student/classes"
                      className="text-blue-600 font-semibold hover:underline inline-block pt-1"
                    >
                      Classroom Link →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Practice Tests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Practice Tests
              </h3>
              <Link
                to="/dashboard/student/tests"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>

            {upcomingTests.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-slate-100 font-sans">
                No active tests scheduled.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{test.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {test.durationMinutes} mins • {test.totalMarks} marks
                      </p>
                    </div>
                    <Link
                      to="/dashboard/student/tests"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex-shrink-0"
                    >
                      Attempt
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Test Results */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Recent Scores
              </h3>
              <Link
                to="/dashboard/student/results"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                All Scores →
              </Link>
            </div>

            {testAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-slate-100 font-sans">
                No test results recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {testAttempts.slice(0, 3).map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{res.testTitle}</h4>
                      <p className="text-[10px] text-slate-500">
                        {res.startedAt ? new Date(res.startedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-blue-600">
                        {res.score}
                      </span>
                      <span className="text-[10px] text-slate-400">/{res.totalMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing & Tax Invoices */}
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Billing & Receipts</p>
              <h4 className="font-bold text-sm mt-0.5 text-slate-900">Payment History</h4>
              <p className="text-xs text-slate-500 mt-0.5">Download tax invoices and receipts</p>
            </div>
            <Link
              to="/dashboard/student/payments"
              className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
              title="Go to payment history"
            >
              <CreditCard className="w-5 h-5" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentOverview;
