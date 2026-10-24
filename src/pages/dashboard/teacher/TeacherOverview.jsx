import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, ClipboardList, MessageSquare, Plus,
  CheckCircle2, Clock, BarChart3, HelpCircle, FileText, Sparkles,
  AlertCircle, ArrowRight, PlayCircle, Calendar, TrendingUp, RefreshCw,
  GraduationCap
} from 'lucide-react';
import { StatCard, Button, Badge } from '../../../components/UI';
import Modal from '../../../components/Modal';
import { FormField, SelectField } from '../../../components/FormFields';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { courseService } from '../../../services/courseService';
import { cacheManager } from '../../../utils/cacheManager';
import { Skeleton } from '../../../components/ui/Loading';

export default function TeacherOverview() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const cachedCourses = cacheManager.get('courses:all');
  const cachedStats = cacheManager.get('admin:dashboard:stats');
  const hasInitialCache = Boolean(cachedCourses && cachedStats);

  const [loading, setLoading] = useState(() => !hasInitialCache);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState(() => {
    if (!cachedCourses) return [];
    const myCourses = cachedCourses.filter(
      (c) => c.instructorId === user?.uid || c.teacherId === user?.uid
    );
    return myCourses.length > 0 ? myCourses : cachedCourses.slice(0, 5);
  });
  const [doubts, setDoubts] = useState([]);
  const [stats, setStats] = useState(() => {
    if (!cachedStats) return { totalCourses: 0, totalStudents: 0, pendingDoubts: 0, totalTests: 0 };
    return {
      totalCourses: cachedCourses ? cachedCourses.length : 0,
      totalStudents: cachedStats.activeEnrollments || 0,
      pendingDoubts: 0,
      totalTests: cachedStats.publishedTests || 0,
    };
  });

  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newLessonModal, setNewLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ courseId: '', title: '', videoUrl: '', duration: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (isMountedCheck = () => true) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      if (!hasInitialCache) {
        setLoading(true);
      }
      setError(null);

      // Timeout safety: 8s
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), 8000)
      );

      const fetchPromise = Promise.all([
        courseService.getAllCourses(),
        adminService.getDoubts ? adminService.getDoubts() : Promise.resolve([]),
        adminService.getDashboardStats(),
      ]);

      const [allCourses, allDoubts, dashStats] = await Promise.race([fetchPromise, timeoutPromise]);
      if (!isMountedCheck()) return;

      // Filter courses by this teacher's UID (instructorId or teacherId)
      const myCourses = allCourses.filter(
        (c) => c.instructorId === user.uid || c.teacherId === user.uid
      );

      // If no specific courses found, show all (for demo/admin-created accounts)
      const displayCourses = myCourses.length > 0 ? myCourses : allCourses.slice(0, 5);

      // Filter doubts to those belonging to this teacher's courses
      const myCourseIds = new Set(displayCourses.map((c) => c.id));
      const myDoubts = allDoubts.filter(
        (d) => !d.courseId || myCourseIds.has(d.courseId)
      );

      setCourses(displayCourses);
      setDoubts(myDoubts.slice(0, 6));
      setStats({
        totalCourses: displayCourses.length,
        totalStudents: dashStats.activeEnrollments || 0,
        pendingDoubts: myDoubts.filter((d) => d.status === 'pending').length,
        totalTests: dashStats.publishedTests || 0,
      });
    } catch (err) {
      if (isMountedCheck()) {
        console.warn('[TeacherOverview] Load warning:', err);
        if (!hasInitialCache && courses.length === 0) {
          setError('Unable to load teacher dashboard data. Please check your network connection.');
        }
      }
    } finally {
      if (isMountedCheck()) setLoading(false);
    }
  }, [user?.uid, hasInitialCache]);

  useEffect(() => {
    let mounted = true;
    loadData(() => mounted);
    return () => { mounted = false; };
  }, [loadData]);

  const handleResolveDoubt = async () => {
    if (!selectedDoubt || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await adminService.updateDoubtStatus(selectedDoubt.id, 'answered', replyText);
      setDoubts((prev) =>
        prev.map((d) => d.id === selectedDoubt.id ? { ...d, status: 'answered', teacherReply: replyText } : d)
      );
      setStats((prev) => ({ ...prev, pendingDoubts: Math.max(0, prev.pendingDoubts - 1) }));
      setSelectedDoubt(null);
      setReplyText('');
    } catch (err) {
      setDoubts((prev) =>
        prev.map((d) => d.id === selectedDoubt.id ? { ...d, status: 'answered' } : d)
      );
      setSelectedDoubt(null);
      setReplyText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim()) return;
    setSubmitting(true);
    try {
      setNewLessonModal(false);
      setLessonForm({ courseId: '', title: '', videoUrl: '', duration: '' });
      navigate('/dashboard/teacher/lessons');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="rounded-3xl p-8 bg-white border border-red-200 text-center max-w-lg mx-auto my-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Connection Problem</h3>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Retry Loading
        </button>
      </div>
    );
  }

  const teacherName = userProfile?.displayName || user?.displayName || 'Faculty Member';
  const teacherInitial = teacherName.charAt(0).toUpperCase();
  const specialization = userProfile?.subjectSpecialization || 'General Curriculum';

  return (
    <div className="space-y-8">
      {/* Teacher Welcome Banner (EduCore Theme) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
            {teacherInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-blue-600 uppercase tracking-wider font-bold">
                Faculty Portal
              </span>
            </div>
            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Welcome back, {teacherName.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Specialization: {specialization} • Brainstorm Academy</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setNewLessonModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Lesson</span>
          </button>
          <Link
            to="/dashboard/teacher/tests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>New Test</span>
          </Link>
          <Link
            to="/dashboard/teacher/materials"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Upload Notes</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats in EduCore styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="My Courses"
          value={stats.totalCourses.toString()}
          sub="Assigned curriculum"
          color="#2563EB"
        />
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={stats.totalStudents.toString()}
          sub="Platform-wide learners"
          color="#16A34A"
        />
        <StatCard
          icon={MessageSquare}
          label="Pending Doubts"
          value={stats.pendingDoubts.toString()}
          sub="Requires response"
          color="#F59E0B"
        />
        <StatCard
          icon={ClipboardList}
          label="Published Tests"
          value={stats.totalTests.toString()}
          sub="Active assessments"
          color="#1E3A8A"
        />
      </div>

      {/* Main Grid: Courses + Doubts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Course Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Assigned Courses & Batches
              </h2>
              <p className="text-xs text-slate-500">Curriculum modules under your instruction</p>
            </div>
            <span className="text-xs bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-blue-700 font-semibold">
              {courses.length} Courses
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm">No courses assigned yet.</p>
              <p className="text-slate-400 text-xs mt-1">Contact the administrator to get courses assigned to your profile.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {course.categoryId || 'General'} • {course.classGrade || 'All Grades'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase border ${
                        course.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <Link
                        to="/dashboard/teacher/lessons"
                        className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold transition-all border border-blue-100"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.enrolledCount || 0} enrolled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                      {course.totalLessons || 0} lessons
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      {course.price === 0 || course.isFree ? 'Free Access' : `₹${course.price || 0}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard/teacher/lessons"
            className="w-full py-2.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-sm"
          >
            View All Curriculum Modules <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right Col: Student Doubt Resolution Desk */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Doubt Resolution
              </h3>
              <p className="text-xs text-slate-500">Student queries awaiting answers</p>
            </div>
            {stats.pendingDoubts > 0 && (
              <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full">
                {stats.pendingDoubts} Pending
              </span>
            )}
          </div>

          {doubts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-sm">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 text-xs">No pending student doubts.</p>
              <p className="text-slate-400 text-[11px] mt-0.5">All queries are answered!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {doubt.studentName || doubt.student || 'Student'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                        doubt.status === 'answered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {doubt.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{doubt.courseTitle || doubt.course || 'General'}</p>
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed line-clamp-2">
                      "{doubt.question || 'No question text'}"
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {doubt.createdAt ? new Date(doubt.createdAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                    {doubt.status !== 'answered' ? (
                      <button
                        onClick={() => setSelectedDoubt(doubt)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Answer →
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard/teacher/doubts"
            className="w-full py-2.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            View All Doubts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Study Materials', icon: FileText, to: '/dashboard/teacher/materials', color: '#2563EB', desc: 'Upload notes & PDFs' },
          { label: 'Assignments', icon: ClipboardList, to: '/dashboard/teacher/assignments', color: '#1E3A8A', desc: 'Create & manage tasks' },
          { label: 'Test Bank', icon: BarChart3, to: '/dashboard/teacher/tests', color: '#16A34A', desc: 'MCQ & practice tests' },
          { label: 'Announcements', icon: Sparkles, to: '/dashboard/teacher/notifications', color: '#F59E0B', desc: 'Notify student batches' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden shadow-sm"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <p className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Answer Doubt Modal */}
      {selectedDoubt && (
        <Modal
          isOpen={!!selectedDoubt}
          onClose={() => { setSelectedDoubt(null); setReplyText(''); }}
          title={`Answer: ${selectedDoubt.studentName || selectedDoubt.student || 'Student'}'s Query`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedDoubt(null); setReplyText(''); }}>
                Cancel
              </Button>
              <button
                onClick={handleResolveDoubt}
                disabled={!replyText.trim() || submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Send Solution →'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">Student Question:</span>
              <p className="font-semibold text-slate-900">{selectedDoubt.question || 'No question text'}</p>
              {selectedDoubt.courseTitle && (
                <p className="text-slate-500 text-[11px] mt-1.5">Course: {selectedDoubt.courseTitle}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Explanation / Solution:
              </label>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write step-by-step mathematical explanation, formulas, or conceptual steps..."
                className="w-full p-3 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Create Lesson Modal */}
      {newLessonModal && (
        <Modal
          isOpen={newLessonModal}
          onClose={() => setNewLessonModal(false)}
          title="Add New Lesson"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={() => setNewLessonModal(false)}>
                Cancel
              </Button>
              <button
                onClick={handleCreateLesson}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Go to Lessons Builder →
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Complete lesson creation is available in the <strong className="text-blue-600">Lessons</strong> module with video uploads, chapter organization, and syllabus tracking.
            </p>
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-900 font-semibold text-xs mb-1.5">Lessons Builder Features:</p>
              <ul className="text-slate-600 text-xs space-y-1 list-disc list-inside">
                <li>Chapter & lesson hierarchy organization</li>
                <li>Video streaming URL or storage attachment</li>
                <li>Free preview toggle for trial lessons</li>
                <li>Downloadable study notes & lecture handouts</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
