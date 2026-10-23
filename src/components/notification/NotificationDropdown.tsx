import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  CheckCheck,
  ChevronRight,
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position calculation logic: guarantees dropdown never overflows or gets clipped
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Mobile: viewport < 640px
    if (vw < 640) {
      setDropdownStyle({
        position: 'fixed',
        top: `${Math.round(rect.bottom + 8)}px`,
        left: '12px',
        right: '12px',
        width: 'calc(100vw - 24px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: `${Math.max(280, vh - rect.bottom - 24)}px`,
        zIndex: 9999,
        boxSizing: 'border-box',
      });
    } else if (vw < 1024) {
      // Tablet: 640px <= viewport < 1024px
      // Width: min(380px, calc(100vw - 32px))
      const targetWidth = Math.min(380, vw - 32);
      let right = vw - rect.right - 6;
      // Clamping: ensure at least 16px from right edge
      right = Math.max(16, right);
      // Clamping: ensure at least 16px from left edge
      if (vw - right - targetWidth < 16) {
        right = vw - targetWidth - 16;
      }

      setDropdownStyle({
        position: 'fixed',
        top: `${Math.round(rect.bottom + 8)}px`,
        right: `${Math.round(right)}px`,
        width: `${targetWidth}px`,
        maxWidth: 'min(380px, calc(100vw - 32px))',
        maxHeight: `${Math.max(320, vh - rect.bottom - 24)}px`,
        zIndex: 9999,
        boxSizing: 'border-box',
      });
    } else {
      // Desktop: viewport >= 1024px
      // Width: 380px (within 360–400px range)
      const targetWidth = 380;
      let right = vw - rect.right - 8;
      right = Math.max(20, right);
      if (vw - right - targetWidth < 20) {
        right = vw - targetWidth - 20;
      }

      setDropdownStyle({
        position: 'fixed',
        top: `${Math.round(rect.bottom + 8)}px`,
        right: `${Math.round(right)}px`,
        width: `${targetWidth}px`,
        maxWidth: '400px',
        maxHeight: `${Math.max(340, vh - rect.bottom - 24)}px`,
        zIndex: 9999,
        boxSizing: 'border-box',
      });
    }
  }, []);

  // Update position when opened or when viewport resizes/scrolls
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleResizeOrScroll = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, { capture: true });
    };
  }, [isOpen, updatePosition]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current && buttonRef.current.contains(target);
      const clickedPopover = popoverRef.current && popoverRef.current.contains(target);

      if (!clickedButton && !clickedPopover) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

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
    <>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
          isOpen
            ? 'bg-[#EEF3FB] text-[#2457A7] border-[#2457A7]/40 ring-2 ring-[#2457A7]/20 shadow-xs'
            : 'bg-gray-50 text-gray-500 hover:bg-[#EEF3FB] hover:text-[#2457A7] border-gray-100 hover:border-gray-200'
        }`}
        title="Notifications"
        aria-label="Toggle notifications menu"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card Portal: completely prevents parent overflow clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={dropdownStyle}
            className="box-border bg-white rounded-[18px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25),0_0_1px_1px_rgba(0,0,0,0.06)] border border-gray-100/90 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
            role="dialog"
            aria-label="Notifications Dropdown"
          >
            {/* Header: Left title + unread badge, Right 'Mark all read' */}
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2.5 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="font-display font-bold text-sm text-[#17365D] tracking-tight whitespace-nowrap">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-[#2457A7]/10 text-[#2457A7] text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs text-[#2457A7] hover:text-[#17365D] hover:underline flex items-center gap-1 font-semibold flex-shrink-0 whitespace-nowrap transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-b border-gray-100/80 flex items-center gap-2 bg-[#F8FAFC] flex-shrink-0">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#17365D] shadow-xs border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white text-[#2457A7] shadow-xs border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications Scrollable List */}
            <div className="overflow-y-auto divide-y divide-gray-100/80 flex-1 overscroll-contain">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Loading notifications...
                </div>
              ) : recentNotifs.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-85" />
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
                      className={`px-4 sm:px-5 py-3.5 hover:bg-gray-50/90 transition-colors cursor-pointer flex gap-3 items-start group ${
                        isUnread ? 'bg-blue-50/35 hover:bg-blue-50/55' : ''
                      }`}
                    >
                      {/* Notification Icon Badge */}
                      <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 group-hover:scale-105 transition-transform">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="min-w-0 flex-1">
                        {/* Title and Unread Indicator on right */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#172033] line-clamp-2 leading-snug flex-1">
                            {notif.title}
                          </p>
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#2457A7] flex-shrink-0 mt-1 shadow-[0_0_6px_rgba(36,87,167,0.45)]"
                              title="Unread"
                            />
                          )}
                        </div>

                        {/* Description (max 2 lines with ellipsis) */}
                        <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-1 leading-relaxed">
                          {notif.body}
                        </p>

                        {/* Timestamp and Open Action */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100/60">
                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleDateString(undefined, {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                          {notif.actionUrl && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2457A7] group-hover:underline">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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
            <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/70 rounded-b-[18px] text-center flex-shrink-0">
              <Link
                to={getAllNotificationsUrl()}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#2457A7] hover:text-[#17365D] hover:underline transition-colors w-full group cursor-pointer"
              >
                <span>View All Notifications Center</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationDropdown;
