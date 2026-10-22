import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, ClipboardList, MessageSquare, Plus,
  CheckCircle2, Clock, BarChart3, HelpCircle, FileText, Sparkles,
  AlertCircle, ArrowRight, PlayCircle, Calendar, TrendingUp, RefreshCw,
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
        // Only show blocking error if we have no cached data at all
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
      // Mark doubt answered in Firestore
      await adminService.updateDoubtStatus(selectedDoubt.id, 'answered', replyText);
      setDoubts((prev) =>
        prev.map((d) => d.id === selectedDoubt.id ? { ...d, status: 'answered', teacherReply: replyText } : d)
      );
      setStats((prev) => ({ ...prev, pendingDoubts: Math.max(0, prev.pendingDoubts - 1) }));
      setSelectedDoubt(null);
      setReplyText('');
    } catch (err) {
      // Optimistic UI even if Firestore write fails
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
      // Navigate cleanly with client router
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
      <div className="rounded-3xl p-8 bg-[#0D0F15] border border-red-500/20 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Connection Problem</h3>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#CCFF00] text-black font-semibold hover:bg-[#b8e600] transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry Loading
        </button>
      </div>
    );
  }

  const teacherName = userProfile?.displayName || user?.displayName || 'Faculty';
  const teacherInitial = teacherName.charAt(0).toUpperCase();
  const specialization = userProfile?.subjectSpecialization || 'General Curriculum';

  return (
    <div className="space-y-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Teacher Welcome Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] via-[#CCFF00] to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-black flex items-center justify-center font-mono font-black text-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-1 ring-white/20 flex-shrink-0">
            {teacherInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-xs text-[#10B981] uppercase tracking-widest font-bold">
                [ 01 // FACULTY CONTROL CENTER ]
              </span>
            </div>
            <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
              Welcome, {teacherName.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Faculty: {specialization} • Brainstorm Academy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setNewLessonModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Lesson</span>
          </button>
          <Button
            to="/dashboard/teacher/tests"
            variant="outlineWhite"
            size="sm"
            className="!font-mono !text-xs !font-bold !uppercase tracking-wider"
          >
            <ClipboardList className="w-4 h-4 text-[#CCFF00]" />
            <span>New Test</span>
          </Button>
          <Button
            to="/dashboard/teacher/materials"
            variant="outlineWhite"
            size="sm"
            className="!font-mono !text-xs !font-bold !uppercase tracking-wider"
          >
            <FileText className="w-4 h-4 text-[#CCFF00]" />
            <span>Upload Material</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-sm text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="My Courses"
          value={stats.totalCourses.toString()}
          sub="Assigned curriculum"
          color="#38BDF8"
        />
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={stats.totalStudents.toString()}
          sub="Platform-wide"
          color="#10B981"
        />
        <StatCard
          icon={MessageSquare}
          label="Pending Doubts"
          value={stats.pendingDoubts.toString()}
          sub="Requires response"
          color="#CCFF00"
        />
        <StatCard
          icon={ClipboardList}
          label="Published Tests"
          value={stats.totalTests.toString()}
          sub="Active assessments"
          color="#A78BFA"
        />
      </div>

      {/* Main Grid: Courses + Doubts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Course Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-mono font-black text-lg text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#CCFF00]" />
                Assigned Courses & Batches
              </h2>
              <p className="text-xs text-slate-400 font-mono">Your curriculum modules</p>
            </div>
            <span className="font-mono text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-300">
              {courses.length} Courses
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-[#0E121A]/85 border border-white/10 rounded-2xl p-10 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-mono text-sm">No courses assigned yet.</p>
              <p className="text-slate-500 font-mono text-xs mt-1">Contact admin to get courses assigned to your profile.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#38BDF8]/30 to-transparent" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="w-5 h-5 text-[#38BDF8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-sm text-white group-hover:text-[#CCFF00] transition-colors truncate">
                          {course.title}
                        </p>
                        <p className="font-mono text-xs text-slate-400 mt-0.5">
                          {course.categoryId || 'General'} • {course.classGrade || 'All Grades'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        course.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <Link
                        to="/dashboard/teacher/lessons"
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#CCFF00] hover:text-black text-slate-300 font-mono text-[11px] font-black uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.enrolledCount || 0} enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" />
                      {course.totalLessons || 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      {course.price === 0 || course.isFree ? 'Free' : `₹${course.price || 0}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard/teacher/lessons"
            className="w-full py-2.5 font-mono text-xs text-slate-400 hover:text-[#CCFF00] border border-white/10 hover:border-[#CCFF00]/30 rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
          >
            View All Curriculum Modules <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right Col: Student Doubt Resolution Desk */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono font-black text-base text-white tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#CCFF00]" />
                Doubt Desk
              </h3>
              <p className="text-xs text-slate-400 font-mono">Student academic queries</p>
            </div>
            {stats.pendingDoubts > 0 && (
              <span className="font-mono text-xs bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-bold px-2.5 py-1 rounded-full uppercase">
                {stats.pendingDoubts} Pending
              </span>
            )}
          </div>

          {doubts.length === 0 ? (
            <div className="bg-[#0E121A]/85 border border-white/10 rounded-2xl p-8 text-center">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 font-mono text-xs">No student doubts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent" />
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                        {doubt.studentName || doubt.student || 'Student'}
                      </span>
                      <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        doubt.status === 'answered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {doubt.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-2">{doubt.courseTitle || doubt.course || 'General'}</p>
                    <p className="text-xs text-slate-200 bg-[#060C17] border border-white/10 p-3 rounded-xl font-mono leading-relaxed line-clamp-2">
                      "{doubt.question || 'No question text'}"
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">
                      {doubt.createdAt ? new Date(doubt.createdAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                    {doubt.status !== 'answered' ? (
                      <button
                        onClick={() => setSelectedDoubt(doubt)}
                        className="px-3 py-1.5 rounded-lg bg-[#CCFF00] hover:bg-white text-black font-mono text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] active:scale-95 cursor-pointer"
                      >
                        Answer →
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
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
            className="w-full py-2.5 font-mono text-xs text-slate-400 hover:text-[#CCFF00] border border-white/10 hover:border-[#CCFF00]/30 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            View All Doubts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Study Materials', icon: FileText, to: '/dashboard/teacher/materials', color: '#38BDF8', desc: 'Upload notes & PDFs' },
          { label: 'Assignments', icon: ClipboardList, to: '/dashboard/teacher/assignments', color: '#A78BFA', desc: 'Create & manage tasks' },
          { label: 'Test Bank', icon: BarChart3, to: '/dashboard/teacher/tests', color: '#CCFF00', desc: 'MCQ & practice tests' },
          { label: 'Notifications', icon: Sparkles, to: '/dashboard/teacher/notifications', color: '#10B981', desc: 'Platform announcements' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="bg-[#0E121A]/85 border border-white/10 rounded-2xl p-4 hover:border-white/25 transition-all group relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />
              </div>
              <p className="font-mono font-bold text-xs text-white group-hover:text-[#CCFF00] transition-colors">{item.label}</p>
              <p className="font-mono text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Answer Doubt Modal */}
      {selectedDoubt && (
        <Modal
          isOpen={!!selectedDoubt}
          onClose={() => { setSelectedDoubt(null); setReplyText(''); }}
          title={`Answer: ${selectedDoubt.studentName || selectedDoubt.student || 'Student'}'s Doubt`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedDoubt(null); setReplyText(''); }} className="!text-slate-400 hover:!text-white">
                Cancel
              </Button>
              <button
                onClick={handleResolveDoubt}
                disabled={!replyText.trim() || submitting}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-white disabled:opacity-50 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Send Answer →'}
              </button>
            </div>
          }
        >
          <div className="space-y-4 font-mono">
            <div className="p-3 bg-[#060C17] border border-white/10 rounded-xl text-xs text-slate-300">
              <span className="text-slate-500 uppercase text-[10px] block mb-1">Student Question:</span>
              <p className="font-semibold text-white">{selectedDoubt.question || 'No question text'}</p>
              {selectedDoubt.courseTitle && (
                <p className="text-slate-500 text-[10px] mt-1">Course: {selectedDoubt.courseTitle}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Your Explanation / Solution:
              </label>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write mathematical explanation, formulas, or conceptual steps..."
                className="w-full p-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] rounded-xl text-xs text-white placeholder-slate-500 outline-none transition resize-none"
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
            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <Button variant="ghost" size="sm" onClick={() => setNewLessonModal(false)} className="!text-slate-400 hover:!text-white">
                Cancel
              </Button>
              <button
                onClick={handleCreateLesson}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer"
              >
                Go to Lessons Builder →
              </button>
            </div>
          }
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-slate-400 text-xs">
              Complete lesson creation is available in the <strong className="text-[#CCFF00]">Lessons</strong> module with full video upload, chapter organization, and content management.
            </p>
            <div className="p-3 bg-[#060C17] border border-[#CCFF00]/20 rounded-xl">
              <p className="text-[#CCFF00] font-bold text-xs mb-1">Lessons Module includes:</p>
              <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
                <li>Chapter & lesson organization</li>
                <li>Video URL or Firebase Storage upload</li>
                <li>Free preview toggle</li>
                <li>Study notes attachment</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
