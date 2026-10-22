import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  Award,
  CreditCard,
  FileText,
  Check,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import type { Notification, NotificationType } from '../../types';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const recentNotifs = filteredNotifs.slice(0, 5);

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

  const getAllNotificationsUrl = () => {
    if (role === 'admin') return '/dashboard/admin/notifications';
    if (role === 'teacher') return '/dashboard/teacher/notifications';
    return '/dashboard/student/notifications';
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      setIsOpen(false);
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-[#EEF3FB] hover:text-[#2457A7] transition-colors border border-gray-100 cursor-pointer"
        title="Notifications"
        aria-label="Toggle notifications menu"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-[#17365D]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#2457A7]/10 text-[#2457A7] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-[#2457A7] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 bg-[#F7F9FC]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#17365D] shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white text-[#2457A7] shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading alerts...</div>
            ) : recentNotifs.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-gray-700">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No {filter === 'unread' ? 'unread' : 'recent'} notifications.
                </p>
              </div>
            ) : (
              recentNotifs.map((notif) => {
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-gray-50/80 transition cursor-pointer flex gap-3 items-start ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#172033] line-clamp-1">{notif.title}</p>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#2457A7] flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5 leading-snug">
                        {notif.body}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                        {notif.actionUrl && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2457A7] hover:underline">
                            <span>Open</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl text-center">
            <Link
              to={getAllNotificationsUrl()}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#2457A7] hover:underline w-full"
            >
              <span>View All Notifications Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
