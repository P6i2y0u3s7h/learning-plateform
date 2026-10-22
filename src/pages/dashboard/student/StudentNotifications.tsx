import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  ExternalLink,
  Settings2,
  Sliders,
  CreditCard,
  FileText,
  Volume2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import type { Notification, NotificationType } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const StudentNotifications: React.FC = () => {
  useDocumentTitle('Notification Center — Brainstorm Academy');
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    preferences,
    updatePreferences,
    requestPushPermission,
    pushPermission,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'announcements' | 'courses' | 'tests' | 'doubts' | 'payments'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [pushRequesting, setPushRequesting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.read;
      if (activeTab === 'announcements') return n.type === 'announcement' || n.type === 'system';
      if (activeTab === 'courses') {
        return ['course_published', 'new_lesson', 'material_uploaded', 'upcoming_class'].includes(n.type);
      }
      if (activeTab === 'tests') {
        return ['upcoming_test', 'test_result', 'assignment_due'].includes(n.type);
      }
      if (activeTab === 'doubts') return n.type === 'doubt_reply';
      if (activeTab === 'payments') return n.type === 'payment_success';
      return true;
    });
  }, [notifications, activeTab]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'test_result':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'upcoming_test':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'doubt_reply':
        return <HelpCircle className="w-4 h-4 text-[#2457A7]" />;
      case 'upcoming_class':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'new_lesson':
      case 'course_published':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'material_uploaded':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'assignment_due':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'payment_success':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#2457A7]" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleEnablePush = async () => {
    setPushRequesting(true);
    setFeedbackMsg(null);
    try {
      const granted = await requestPushPermission();
      if (granted) {
        setFeedbackMsg('Push alerts enabled successfully! You will receive instant notifications on this device.');
      } else {
        setFeedbackMsg('Notification permission was declined in your browser settings.');
      }
    } catch (e) {
      setFeedbackMsg('Could not register push notifications on this browser.');
    } finally {
      setPushRequesting(false);
    }
  };

  const handleTogglePref = async (key: keyof typeof preferences) => {
    if (!preferences) return;
    const newVal = !preferences[key as keyof typeof preferences];
    await updatePreferences({ [key]: newVal });
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 10 // NOTIFICATION CENTER ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Real-time updates for classes, tests, evaluation results, doubt replies, and course materials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap font-mono">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CCFF00] hover:bg-white text-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.25)] cursor-pointer active:scale-95"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          <button
            onClick={() => setShowPreferencesModal(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#38BDF8]" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-mono text-emerald-400 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Push Notification Opt-in Card */}
      {pushPermission !== 'granted' && (
        <div className="bg-[#0E121A]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent" />
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <h4 className="font-mono font-bold text-sm text-white">Enable Web Push Notifications</h4>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Never miss live class alerts, exam countdowns, or teacher answers even when offline.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushRequesting}
            className="px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(56,189,248,0.25)] flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            {pushRequesting ? 'Requesting...' : 'Enable Push Alerts'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-2.5 border border-white/10 shadow-xl flex items-center gap-1.5 overflow-x-auto font-mono text-xs">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'announcements', label: 'Announcements' },
          { id: 'courses', label: 'Courses & Lessons' },
          { id: 'tests', label: 'Tests & Results' },
          { id: 'doubts', label: 'Doubts' },
          { id: 'payments', label: 'Fees & Invoices' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center py-3 border-b border-white/10">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-14 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            {activeTab === 'unread' ? 'All Caught Up!' : 'No Notifications in this Category'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
            {activeTab === 'unread'
              ? 'You have read all recent alerts. New updates will be logged here in real-time.'
              : 'There are currently no alerts matching your selected category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
            {paginatedNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    isUnread ? 'bg-[#CCFF00]/[0.03]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div
                    onClick={() => handleNotificationClick(notif)}
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-xs">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-mono font-bold text-sm text-white">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse flex-shrink-0" />
                        )}
                        {notif.priority === 'high' && (
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Urgent
                          </span>
                        )}
                        {notif.courseTitle && (
                          <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2 py-0.5 rounded-full">
                            {notif.courseTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                        <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Recent'}</span>
                        {notif.senderName && <span>• By {notif.senderName}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {notif.actionUrl && (
                      <button
                        onClick={() => handleNotificationClick(notif)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-black transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1.5 rounded-xl text-xs text-slate-400 hover:text-[#CCFF00] hover:bg-white/5 transition cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono text-xs text-slate-400">
              <p>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferencesModal && preferences && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E121A] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-[#38BDF8] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-lg text-white">
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Customize the alert channels and categories you wish to receive.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Delivery Channels
                </h4>
                <div className="space-y-2 font-mono">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-[#060C17] border border-white/10 hover:border-white/20 transition cursor-pointer">
                    <span className="text-xs font-bold text-slate-200">In-App Dashboard Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.inAppEnabled}
                      onChange={() => handleTogglePref('inAppEnabled')}
                      className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-[#060C17] border border-white/10 hover:border-white/20 transition cursor-pointer">
                    <span className="text-xs font-bold text-slate-200">Email Digest Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.emailEnabled}
                      onChange={() => handleTogglePref('emailEnabled')}
                      className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-[#060C17] border border-white/10 hover:border-white/20 transition cursor-pointer">
                    <span className="text-xs font-bold text-slate-200">Browser Web Push Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.pushEnabled}
                      onChange={() => handleTogglePref('pushEnabled')}
                      className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00]"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Alert Categories
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {[
                    { key: 'courses', label: 'Course Lectures' },
                    { key: 'tests', label: 'Examinations' },
                    { key: 'doubts', label: 'Doubt Answers' },
                    { key: 'assignments', label: 'Assignments' },
                    { key: 'announcements', label: 'Announcements' },
                    { key: 'payments', label: 'Tuition Fees' },
                  ].map((cat) => (
                    <label
                      key={cat.key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#060C17] border border-white/10 hover:border-white/20 transition cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-300">{cat.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(preferences[cat.key as keyof typeof preferences])}
                        onChange={() => handleTogglePref(cat.key as any)}
                        className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono font-black uppercase tracking-wider text-xs transition cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.25)]"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
