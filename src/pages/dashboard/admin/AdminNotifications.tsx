import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { courseService } from '../../../services/courseService';
import type { Notification, Course } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminNotifications: React.FC = () => {
  useDocumentTitle('Announcements & Alerts — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Composer State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'student' | 'teacher' | 'course'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [broadcasting, setBroadcasting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [notifList, courseList] = await Promise.all([
          adminService.getBroadcastNotifications(),
          courseService.getAllCourses(),
        ]);
        if (isMounted) {
          setAnnouncements(notifList);
          setCourses(courseList);
          if (courseList.length > 0) {
            setSelectedCourseId(courseList[0].id);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminNotifications] Error fetching notifications:', err);
          setError('Failed to fetch announcements.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setBroadcasting(true);
    setSuccessMsg(null);

    const isCourseTarget = targetType === 'course';
    const targetCourse = isCourseTarget ? courses.find((c) => c.id === selectedCourseId) : undefined;
    const targetRole = isCourseTarget ? 'student' : targetType;

    try {
      const notifId = await adminService.publishAnnouncement(
        title.trim(),
        body.trim(),
        targetRole,
        user?.email || 'admin@brainstorm.edu',
        targetCourse?.id,
        targetCourse?.title,
        priority
      );

      const newNotif: Notification = {
        id: notifId,
        userId: isCourseTarget ? `course:${targetCourse?.id}` : (targetRole === 'all' ? 'broadcast-all' : `broadcast-${targetRole}`),
        targetRole: isCourseTarget ? undefined : targetRole,
        courseId: targetCourse?.id,
        courseTitle: targetCourse?.title,
        title: title.trim(),
        body: body.trim(),
        type: 'announcement',
        priority,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newNotif, ...prev]);

      setTitle('');
      setBody('');
      setSuccessMsg(
        isCourseTarget
          ? `Announcement dispatched to students in "${targetCourse?.title}"!`
          : `Announcement successfully broadcasted to ${targetRole === 'all' ? 'everyone' : `${targetRole}s`}!`
      );
    } catch (err) {
      console.error('[AdminNotifications] Error dispatching announcement:', err);
      alert('Failed to broadcast announcement.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Broadcast Hub</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Notification & Announcement Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Broadcast critical platform updates, exam schedules, and academic reminders in real-time.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 sticky top-20 relative overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Dispatch Announcement</h2>
                <p className="text-xs text-slate-500">Live in-app push alerts</p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Recipient Group
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>EVERYONE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('student')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'student'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>STUDENTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('teacher')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'teacher'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>TEACHERS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('course')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'course'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>COURSE</span>
                  </button>
                </div>
              </div>

              {targetType === 'course' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Target Course *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 transition"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Announcement Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for CBSE Term-1 Mock Tests Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notice Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete dates, room numbers, or links..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                      priority === 'normal'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                      priority === 'high'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    URGENT ALERT
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {broadcasting ? (
                  'Transmitting Notice...'
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Broadcast Announcement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Announcements Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Dispatched Announcements History
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {announcements.length} Dispatched Messages
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-3 shadow-sm">
              <Skeleton className="h-16 w-full bg-slate-100 rounded-2xl" />
              <Skeleton className="h-16 w-full bg-slate-100 rounded-2xl" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-800 text-sm">No Announcements Dispatched</p>
              <p className="text-xs text-slate-500 mt-1">
                Compose your first platform broadcast using the panel on the left.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                      {ann.priority === 'high' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          URGENT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ann.createdAt
                        ? new Date(ann.createdAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ann.body}
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                      {ann.courseTitle ? `Course: ${ann.courseTitle}` : `Target: ${ann.targetRole || 'Everyone'}`}
                    </span>
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

export default AdminNotifications;
