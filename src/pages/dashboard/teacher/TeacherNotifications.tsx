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
      {/* Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Faculty Communications
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Course Announcements & Student Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Broadcast class updates, exam deadlines, and lecture notices to students in your authorized courses.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 sticky top-20 text-slate-900">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Notify Course Students
              </h3>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Authorized Course *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition cursor-pointer"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Practice Questions Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Announcement Message *
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide instructions, deadlines, or revision recommendations..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`py-2 text-xs font-semibold rounded-xl transition cursor-pointer border ${
                      priority === 'normal'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-2 text-xs font-semibold rounded-xl transition cursor-pointer border ${
                      priority === 'high'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                    }`}
                  >
                    Urgent Alert
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
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
            <h3 className="font-bold text-lg text-slate-900">
              Recent Announcements & Alerts
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Records: <strong className="text-blue-600 font-bold">{notifications.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center py-2">
                  <Skeleton className="w-10 h-10 rounded-2xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-sm">
              <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">No Announcements Sent</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use the form on the left to notify students enrolled in your courses about tests, lessons, and class updates.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-5 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                          {notif.priority === 'high' && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Urgent
                            </span>
                          )}
                          {notif.courseTitle && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              {notif.courseTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{notif.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
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
