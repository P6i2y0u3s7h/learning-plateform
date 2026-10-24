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
    <div className="space-y-6">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Notification Center
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates for classes, tests, evaluation results, doubt replies, and course materials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          <button
            onClick={() => setShowPreferencesModal(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Push Notification Opt-in Card */}
      {pushPermission !== 'granted' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Enable Web Push Notifications</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Never miss live class alerts, exam countdowns, or teacher answers even when offline.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushRequesting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            {pushRequesting ? 'Requesting...' : 'Enable Push Alerts'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs">
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
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center py-3 border-b border-slate-100">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2">
            {activeTab === 'unread' ? 'All Caught Up!' : 'No Notifications in this Category'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'unread'
              ? 'You have read all recent alerts. New updates will be logged here in real-time.'
              : 'There are currently no alerts matching your selected category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {paginatedNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    isUnread ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    onClick={() => handleNotificationClick(notif)}
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-xs">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
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
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
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
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1.5 rounded-xl text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
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
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500">
              <p>
                Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customize the alert channels and categories you wish to receive.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Delivery Channels
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                    <span className="text-xs font-medium text-slate-800">In-App Dashboard Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.inAppEnabled}
                      onChange={() => handleTogglePref('inAppEnabled')}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 accent-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                    <span className="text-xs font-medium text-slate-800">Email Digest Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.emailEnabled}
                      onChange={() => handleTogglePref('emailEnabled')}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 accent-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                    <span className="text-xs font-medium text-slate-800">Browser Web Push Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.pushEnabled}
                      onChange={() => handleTogglePref('pushEnabled')}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 accent-blue-600"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Alert Categories
                </h4>
                <div className="grid grid-cols-2 gap-2">
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
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-700">{cat.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(preferences[cat.key as keyof typeof preferences])}
                        onChange={() => handleTogglePref(cat.key as any)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 accent-blue-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
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
