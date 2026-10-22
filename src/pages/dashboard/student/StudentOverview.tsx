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
  useDocumentTitle('Student Learning Cockpit — Brainstorm Academy');
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

  // Performance Trend Chart Data (from student's actual test attempts)
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
    <div className="space-y-8 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* 1. Welcome Section & Student Profile Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CCFF00] via-[#10B981] to-[#047857] text-black flex items-center justify-center font-mono font-black text-2xl shadow-[0_0_25px_rgba(204,255,0,0.35)] ring-1 ring-white/20 flex-shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
                [ 01 // STUDENT LEARNING COCKPIT ]
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
                {timeGreeting}, {studentName}!
              </h1>
              <span className="bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active Scholar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              {userProfile?.classGrade || 'Class 10 CBSE'} •{' '}
              {userProfile?.targetExam ? `Target: ${userProfile.targetExam}` : 'Academic Session 2026–27'}
            </p>
          </div>
        </div>

        {/* Quick Dashboard Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto font-mono text-xs">
          <Link
            to="/dashboard/student/tests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95"
          >
            <ClipboardList className="w-4 h-4 stroke-[3]" />
            <span>Take Test</span>
          </Link>
          <Link
            to="/dashboard/student/doubts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all"
          >
            <HelpCircle className="w-4 h-4 text-[#CCFF00]" />
            <span>Ask Doubt</span>
          </Link>
          <Link
            to="/dashboard/student/materials"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all"
          >
            <FileText className="w-4 h-4 text-[#38BDF8]" />
            <span>Notes</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
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
          color="#38BDF8"
        />
        <StatCard
          icon={ClipboardList}
          label="Tests Attempted"
          value={stats.testsAttemptedCount.toString()}
          sub={stats.testsAttemptedCount > 0 ? 'Completed assessments' : 'No tests yet'}
          color="#10B981"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.averageScoreText}
          sub={stats.testsAttemptedCount > 0 ? 'Overall test performance' : 'Take a test to calculate'}
          color="#CCFF00"
        />
        <StatCard
          icon={Clock}
          label="Study Hours"
          value={stats.studyHoursText}
          sub={`${stats.completedLessonsCount} lessons finished`}
          color="#A78BFA"
        />
      </div>

      {/* Grid: Left (Continue Learning, Courses, Progress) & Right (Upcoming, Results, Doubts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning & My Courses */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-mono font-black text-lg text-white tracking-tight flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#CCFF00]" />
                  Continue Learning
                </h2>
                <p className="text-xs text-slate-400 font-mono">Pick up right where you left off</p>
              </div>
              <Link
                to="/dashboard/student/courses"
                className="text-xs font-mono font-bold text-[#CCFF00] hover:underline flex items-center gap-1"
              >
                <span>View All ({enrollments.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/15">
                <BookOpen className="w-12 h-12 text-[#CCFF00] opacity-80 mx-auto mb-3" />
                <h3 className="font-mono font-black text-base text-white mb-1">
                  You Haven't Enrolled in Any Courses Yet
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto mb-5 leading-relaxed">
                  Join our comprehensive school batches, competitive exam coaching, or AMU/Jamia entrance modules to start your learning journey.
                </p>
                <div className="flex flex-wrap justify-center gap-2 font-mono text-xs">
                  <Link
                    to="/school-courses"
                    className="px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    School Courses
                  </Link>
                  <Link
                    to="/competitive-exams"
                    className="px-4 py-2 rounded-xl font-bold bg-[#CCFF00] text-black hover:bg-white transition"
                  >
                    Competitive Exams
                  </Link>
                  <Link
                    to="/amu-jamia"
                    className="px-4 py-2 rounded-xl font-bold bg-[#38BDF8] text-black hover:bg-white transition"
                  >
                    AMU & Jamia
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 3).map((enr) => {
                  const course = enrolledCourses.find((c) => c.id === enr.courseId);
                  const progress = enr.progressPercentage || 0;
                  const title = course?.title || enr.courseTitle || 'Enrolled Course';
                  const subject = course?.subjectName || 'Course';

                  return (
                    <div
                      key={enr.id}
                      className="p-4 rounded-2xl border border-white/10 bg-[#060C17] hover:border-[#CCFF00]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#CCFF00] group-hover:bg-[#CCFF00] group-hover:text-black transition">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono font-bold text-[#CCFF00] uppercase tracking-wider">
                            {subject}
                          </p>
                          <h4 className="font-mono font-bold text-sm text-white truncate">
                            {title}
                          </h4>
                          <div className="mt-2 max-w-xs">
                            <ProgressBar value={progress} showLabel />
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/dashboard/student/classroom/${enr.courseId}`}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition shadow-[0_0_15px_rgba(204,255,0,0.3)] flex-shrink-0"
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
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-mono font-black text-lg text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#38BDF8]" />
                  Score Trend & Subject Mastery
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Visual breakdown of your actual assessment achievements
                </p>
              </div>
              <Link
                to="/dashboard/student/progress"
                className="text-xs font-mono font-bold text-[#38BDF8] hover:underline"
              >
                Detailed Report →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score progression chart */}
              <div className="h-56 flex flex-col font-mono">
                <p className="text-xs text-slate-400 mb-2 text-center uppercase tracking-wider">
                  Score Progression (Test %)
                </p>
                {chartPerformanceData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10 p-4 text-center">
                    <p className="text-xs font-bold text-white">No Test Progression Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Take your first test to view your progress graph.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartPerformanceData}>
                        <defs>
                          <linearGradient id="scoreColorOverview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#CCFF00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#060C17', borderColor: '#ffffff20', color: '#fff', borderRadius: '12px', fontFamily: 'monospace' }} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#CCFF00"
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
              <div className="h-56 flex flex-col font-mono">
                <p className="text-xs text-slate-400 mb-2 text-center uppercase tracking-wider">
                  Curriculum Completion (%)
                </p>
                {chartSubjectData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10 p-4 text-center">
                    <p className="text-xs font-bold text-white">No Enrolled Subjects</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enroll in programs to track subject completion.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSubjectData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                        <XAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#060C17', borderColor: '#ffffff20', color: '#fff', borderRadius: '12px', fontFamily: 'monospace' }} />
                        <Bar dataKey="score" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignments Widget */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-black text-base text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#CCFF00]" />
                Recent Coursework & Assignments
              </h3>
              <Link
                to="/dashboard/student/assignments"
                className="text-xs font-mono font-bold text-[#CCFF00] hover:underline"
              >
                View All →
              </Link>
            </div>

            {pendingAssignments.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 py-4 text-center bg-white/[0.02] rounded-xl border border-white/5">
                No pending homework or assignments due right now.
              </p>
            ) : (
              <div className="space-y-3 font-mono">
                {pendingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-[#060C17] border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{a.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {a.dueDate || 'Flexible'} • Total: {a.totalMarks} pts
                      </p>
                    </div>
                    <Link
                      to="/dashboard/student/assignments"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#CCFF00]/15 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black transition flex-shrink-0"
                    >
                      Submit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Scheduled Live Classes */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-black text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#10B981]" />
                Live Sessions
              </h3>
              <Link
                to="/dashboard/student/classes"
                className="text-xs font-mono font-bold text-[#10B981] hover:underline"
              >
                Schedule →
              </Link>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-mono text-emerald-300">
                <p className="font-bold">No sessions scheduled today.</p>
                <p className="text-slate-400 mt-0.5">
                  Check back for weekly live doubts and mentor lectures.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-mono">
                {upcomingClasses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-[#060C17] border border-white/10 rounded-2xl space-y-1.5"
                  >
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                      {c.subjectName || 'Live'}
                    </span>
                    <h4 className="font-bold text-white">{c.title}</h4>
                    <p className="text-slate-400 text-[11px]">{c.scheduledAt}</p>
                    <Link
                      to="/dashboard/student/classes"
                      className="text-[#CCFF00] font-bold hover:underline inline-block pt-1"
                    >
                      Classroom Link →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Practice Tests */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-black text-base text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#CCFF00]" />
                Practice Tests
              </h3>
              <Link
                to="/dashboard/student/tests"
                className="text-xs font-mono font-bold text-[#CCFF00] hover:underline"
              >
                View All →
              </Link>
            </div>

            {upcomingTests.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 py-3 text-center bg-white/[0.02] rounded-xl border border-white/5">
                No active tests scheduled.
              </p>
            ) : (
              <div className="space-y-3 font-mono">
                {upcomingTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3.5 rounded-2xl bg-[#060C17] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{test.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {test.durationMinutes} mins • {test.totalMarks} marks
                      </p>
                    </div>
                    <Link
                      to="/dashboard/student/tests"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#CCFF00] text-black hover:bg-white transition flex-shrink-0"
                    >
                      Attempt
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Test Results */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-black text-base text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                Recent Scores
              </h3>
              <Link
                to="/dashboard/student/results"
                className="text-xs font-mono font-bold text-[#F59E0B] hover:underline"
              >
                All Scores →
              </Link>
            </div>

            {testAttempts.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 py-3 text-center bg-white/[0.02] rounded-xl border border-white/5">
                No test results recorded yet.
              </p>
            ) : (
              <div className="space-y-3 font-mono">
                {testAttempts.slice(0, 3).map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-2xl bg-[#060C17] border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{res.testTitle}</h4>
                      <p className="text-[10px] text-slate-400">
                        {res.startedAt ? new Date(res.startedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#CCFF00]">
                        {res.score}
                      </span>
                      <span className="text-[10px] text-slate-500">/{res.totalMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing & Tax Invoices */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl flex items-center justify-between relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <div>
              <p className="text-[10px] text-[#CCFF00] font-bold uppercase tracking-widest">Billing & Invoices</p>
              <h4 className="font-black text-base mt-0.5 text-white">Payment History</h4>
              <p className="text-[11px] text-slate-400 mt-1">Download tax invoices and receipts</p>
            </div>
            <Link
              to="/dashboard/student/payments"
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#CCFF00] text-[#CCFF00] transition-all shadow-md"
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
