import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  GraduationCap,
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
import type { Enrollment, TestAttempt, Course } from '../../../types';
import { StatCard, ProgressBar } from '../../../components/UI';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const StudentProgressReports: React.FC = () => {
  useDocumentTitle('Progress Reports & Analytics — Brainstorm Academy');
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [enrList, attList] = await Promise.all([
          studentService.getStudentEnrollments(user.uid),
          studentService.getStudentTestAttempts(user.uid),
        ]);

        let courseList: Course[] = [];
        if (enrList.length > 0) {
          courseList = await studentService.getCoursesByIds(enrList.map((e) => e.courseId));
        }

        if (isMounted) {
          setEnrollments(enrList);
          setAttempts(attList);
          setCourses(courseList);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load progress data:', err);
          setError('Unable to load progress reports.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Dynamic stats
  const dashboardStats = useMemo(() => {
    return studentService.calculateDashboardStats(
      enrollments,
      attempts,
      userProfile?.completedLessonIds || []
    );
  }, [enrollments, attempts, userProfile?.completedLessonIds]);

  // Score progression chart data
  const scoreTrendData = useMemo(() => {
    if (attempts.length === 0) return [];
    // Sort chronologically ascending for the trend line
    const sorted = [...attempts].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    return sorted.map((att, idx) => ({
      name: `Test ${idx + 1}`,
      title: att.testTitle,
      score: att.percentage || 0,
      date: att.startedAt ? new Date(att.startedAt).toLocaleDateString() : '',
    }));
  }, [attempts]);

  // Subject completion bar data
  const subjectProgressData = useMemo(() => {
    const courseMap = new Map<string, Course>();
    courses.forEach((c) => courseMap.set(c.id, c));

    return enrollments.map((enr) => {
      const crs = courseMap.get(enr.courseId);
      return {
        subject: crs?.subjectName || crs?.title || enr.courseTitle || 'Course',
        progress: enr.progressPercentage || 0,
      };
    });
  }, [enrollments, courses]);

  return (
    <div className="space-y-8 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
            [ 09 // ACADEMIC ANALYTICS ]
          </span>
        </div>
        <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
          Academic Progress Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
          Comprehensive performance evaluation based on real test scores, completed lectures, and curriculum mastery.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Active Enrolled"
          value={dashboardStats.enrolledCoursesCount.toString()}
          sub={
            dashboardStats.enrolledCoursesCount > 0
              ? 'Syllabus courses in progress'
              : 'Zero active enrollments'
          }
          color="#CCFF00"
          bgColor="rgba(204,255,0,0.1)"
        />
        <StatCard
          icon={Award}
          label="Tests Taken"
          value={dashboardStats.testsAttemptedCount.toString()}
          sub={
            dashboardStats.testsAttemptedCount > 0
              ? 'Recorded mock assessments'
              : 'No tests attempted'
          }
          color="#38BDF8"
          bgColor="rgba(56,189,248,0.1)"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={dashboardStats.averageScoreText}
          sub="Overall test average"
          color="#10B981"
          bgColor="rgba(16,185,129,0.1)"
        />
        <StatCard
          icon={Clock}
          label="Estimated Study"
          value={dashboardStats.studyHoursText}
          sub={`${dashboardStats.completedLessonsCount} lessons completed`}
          color="#F59E0B"
          bgColor="rgba(245,158,11,0.1)"
        />
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl h-72">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl h-72">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Test Score Progression */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col text-white">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-wider font-bold">
                  PROGRESSION METRICS
                </span>
              </div>
              <h2 className="font-mono font-bold text-lg text-white">
                Score Progression Over Time
              </h2>
              <p className="text-xs text-slate-400 font-mono">Percentage score across recent test attempts</p>
            </div>

            {scoreTrendData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#060C17] rounded-2xl border border-dashed border-white/15">
                <Award className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs font-mono font-bold text-white">No Test Progression Data</p>
                <p className="text-[11px] text-slate-400 font-mono max-w-xs mt-1">
                  Complete your first practice test to generate your performance progression chart.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrendData}>
                    <defs>
                      <linearGradient id="scoreReportColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#CCFF00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0E121A',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val}%`, 'Score']}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#CCFF00"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#scoreReportColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Course Progress Mastery */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col text-white">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                <span className="font-mono text-xs text-[#38BDF8] uppercase tracking-wider font-bold">
                  CURRICULUM COVERAGE
                </span>
              </div>
              <h2 className="font-mono font-bold text-lg text-white">
                Syllabus Completion by Course
              </h2>
              <p className="text-xs text-slate-400 font-mono">Progress percentage in enrolled subjects</p>
            </div>

            {subjectProgressData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#060C17] rounded-2xl border border-dashed border-white/15">
                <GraduationCap className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs font-mono font-bold text-white">No Enrolled Subject Data</p>
                <p className="text-[11px] text-slate-400 font-mono max-w-xs mt-1">
                  Enroll in course modules to track chapter completion and curriculum mastery.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="subject" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0E121A',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val}%`, 'Progress']}
                    />
                    <Bar dataKey="progress" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressReports;
