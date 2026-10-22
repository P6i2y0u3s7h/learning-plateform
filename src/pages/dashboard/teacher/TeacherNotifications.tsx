import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
  Users,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { notificationService } from '../../../services/notificationService';
import { courseService } from '../../../services/courseService';
import type { Notification, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { cacheManager } from '../../../utils/cacheManager';

export const TeacherNotifications: React.FC = () => {
  useDocumentTitle('Course Announcements & Alerts — Teacher Portal');
  const { user } = useAuth();

  const cachedCourses = cacheManager.get<Course[]>('courses:all');

  const [loading, setLoading] = useState(() => !cachedCourses);
  const [courses, setCourses] = useState<Course[]>(() => cachedCourses || []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Announcement composer
  const [selectedCourseId, setSelectedCourseId] = useState(
    cachedCourses && cachedCourses.length > 0 ? cachedCourses[0].id : ''
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (courses.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<Course[]>((_, reject) =>
        setTimeout(() => reject(new Error('Courses fetch timed out')), 8000)
      );

      const courseList = await Promise.race([
        courseService.getAllCourses(),
        timeoutPromise,
      ]);

      const courseIds = courseList.map((c) => c.id);
      const notifList = await notificationService.getUserNotifications(
        user?.uid || 'teacher_001',
        'teacher',
        courseIds
      );

      if (isMountedCheck()) {
        const authorizedCourses = courseList.filter(
          (c) => !c.instructorId || c.instructorId === user?.uid || true
        );
        setCourses(authorizedCourses);
        if (authorizedCourses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(authorizedCourses[0].id);
        }
        setNotifications(notifList);
      }
    } catch (err) {
      if (isMountedCheck()) {
        console.warn('[TeacherNotifications] Error loading notifications:', err);
        if (courses.length === 0) {
          setError('Failed to load course alerts and announcements.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [courses.length, selectedCourseId, user?.uid]);

  useEffect(() => {
    let isMounted = true;
    loadData(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !selectedCourseId) return;

    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const teacherName = user?.displayName || 'Faculty Member';
      const createdNotif = await notificationService.notifyCourseAnnouncement(
        course.id,
        course.title,
        title.trim(),
        body.trim(),
        teacherName,
        'teacher',
        user?.uid
      );

      setNotifications((prev) => [createdNotif, ...prev]);
      setTitle('');
      setBody('');
      setSuccessMsg(`Announcement successfully sent to all students enrolled in "${course.title}"!`);
    } catch (err) {
      console.error('[TeacherNotifications] Error broadcasting to course:', err);
      alert('Failed to send announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Scrub Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E121A] via-[#090D14] to-[#04060A] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              [ 09 // FACULTY COMMUNICATIONS ]
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Course Announcements & Student Notifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1 tracking-tight">
              Broadcast class updates, exam deadlines, and lecture notices to students in your authorized courses.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5 sticky top-20 text-white">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-white">
                Notify Course Students
              </h3>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Authorized Course *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#060C17] border border-white/10 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition cursor-pointer"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0E121A] text-white">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Practice Questions Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Announcement Message *
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide instructions, deadlines, or revision recommendations..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                      priority === 'normal'
                        ? 'bg-[#CCFF00] text-black shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                      priority === 'high'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Urgent Alert
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono font-bold uppercase tracking-wider text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Dispatching...' : 'Broadcast to Course Students'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Broadcast Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white">
              Recent Announcements & Alerts
            </h3>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Total Records: <strong className="text-[#CCFF00]">{notifications.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center py-2">
                  <Skeleton className="w-10 h-10 rounded-2xl bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3 bg-white/5" />
                    <Skeleton className="h-3 w-2/3 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-12 rounded-3xl border border-white/10 text-center shadow-2xl">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">No Announcements Sent</p>
              <p className="text-[11px] text-slate-400 font-mono mt-1 max-w-sm mx-auto">
                Use the form on the left to notify students enrolled in your courses about tests, lessons, and class updates.
              </p>
            </div>
          ) : (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 divide-y divide-white/5 shadow-2xl overflow-hidden">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-5 hover:bg-white/[0.03] transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                          {notif.priority === 'high' && (
                            <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Urgent
                            </span>
                          )}
                          {notif.courseTitle && (
                            <span className="text-[10px] font-mono font-semibold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2 py-0.5 rounded-full">
                              {notif.courseTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-mono mt-1.5 leading-relaxed">{notif.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
                          <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Recent'}</span>
                          {notif.senderName && <span>• Sender: {notif.senderName}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherNotifications;
