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
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
            <Bell className="w-3.5 h-3.5" />
            <span>[ DISPATCH INDEX · SYSTEM BROADCASTS ]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Notification & Announcement Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
            Broadcast critical platform updates, exam schedules, and academic reminders in real-time.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-white font-mono text-xs md:text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#CCFF00] flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-[#CCFF00] font-mono font-bold hover:underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 sticky top-20 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Dispatch Announcement</h2>
                <p className="text-xs text-slate-400 font-mono">Live in-app push alerts</p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Recipient Group
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'all'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>EVERYONE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('student')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'student'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>STUDENTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('teacher')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'teacher'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>TEACHERS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('course')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'course'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>COURSE</span>
                  </button>
                </div>
              </div>

              {targetType === 'course' && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Select Target Course *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#060C17] border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#CCFF00] transition font-mono"
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
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Announcement Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for CBSE Term-1 Mock Tests Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#060C17] text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Notice Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete dates, room numbers, or links..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#060C17] text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`py-2 text-xs font-mono font-bold rounded-xl transition cursor-pointer ${
                      priority === 'normal'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-2 text-xs font-mono font-bold rounded-xl transition cursor-pointer ${
                      priority === 'high'
                        ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    URGENT ALERT
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
            <h2 className="text-base font-bold font-display text-white">
              Dispatched Announcements History
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {announcements.length} Dispatched Messages
            </span>
          </div>

          {loading ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 space-y-3">
              <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
              <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-12 rounded-2xl border border-white/10 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-mono font-bold text-white text-sm">No Announcements Dispatched</p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Compose your first platform broadcast using the panel on the left.
              </p>
            </div>
          ) : (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 divide-y divide-white/5 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 hover:bg-white/[0.03] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{ann.title}</h3>
                      {ann.priority === 'high' && (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          URGENT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {ann.createdAt
                        ? new Date(ann.createdAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {ann.body}
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] font-mono font-bold">
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
