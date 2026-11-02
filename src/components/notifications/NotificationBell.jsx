import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Inbox,
  Settings,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import StatusBadge from '../ui/StatusBadge';

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getEventIcon(eventType, priority) {
  if (priority === 'critical' || eventType.includes('CRITICAL') || eventType.includes('OVERDUE')) {
    return { icon: ShieldAlert, color: 'text-[#A33D35]', bg: 'bg-[#F5DEDA] border-[#A33D35]/30' };
  }
  if (eventType.includes('ASSIGN') || eventType.includes('TECH')) {
    return { icon: Wrench, color: 'text-[#93651C]', bg: 'bg-[#F8EBD2] border-[#93651C]/30' };
  }
  if (eventType.includes('RESOLV') || eventType.includes('CLOSED')) {
    return { icon: CheckCircle2, color: 'text-[#286448]', bg: 'bg-[#DCEDE4] border-[#286448]/30' };
  }
  if (eventType.includes('REPEATED')) {
    return { icon: AlertTriangle, color: 'text-[#A56F63]', bg: 'bg-[#F5F3EF] border-[#A56F63]/30' };
  }
  return { icon: Clock, color: 'text-[#0F3040]', bg: 'bg-[#E5EAF0] border-[#0F3040]/20' };
}

export default function NotificationBell({ onNavigateToIncident }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    openIncident,
    openCenterModal,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayedNotifications = notifications
    .filter((n) => (filter === 'unread' ? !n.is_read : true))
    .slice(0, 8);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.ticket_id) {
      openIncident(notif.ticket_id, notif.ticket_number);
      if (onNavigateToIncident) {
        onNavigateToIncident(notif.ticket_id, notif.ticket_number);
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition-all border ${
          isOpen
            ? 'bg-[#0F3040] text-white border-[#0F3040] shadow-sm'
            : 'bg-white hover:bg-[#F5F3EF] border-[#E7E4DF] text-[#0F3040] shadow-xs'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-[#A33D35] text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[580px] animate-fadeIn text-[#0F3040]">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E7E4DF] bg-[#F5F3EF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#0F3040] font-heading">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5DEDA] text-[#A33D35]">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#A56F63] hover:text-[#0F3040] flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openCenterModal();
                }}
                className="p-1 rounded-lg text-[#464858] hover:text-[#0F3040] hover:bg-slate-200/50"
                title="Open Settings & Center"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 py-2 border-b border-[#E7E4DF] bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-[#0F3040] text-white shadow-xs'
                    : 'text-[#464858] hover:bg-[#F5F3EF]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'unread'
                    ? 'bg-[#0F3040] text-white shadow-xs'
                    : 'text-[#464858] hover:bg-[#F5F3EF]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] text-[#464858] font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#286448]" />
              <span>Live SSE</span>
            </span>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E7E4DF]">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-[#464858] space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40 text-[#464858]" />
                <p className="text-xs font-semibold text-[#183E4C]">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications in your activity feed.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const { icon: EventIcon, color, bg } = getEventIcon(notif.event_type, notif.priority);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                      !notif.is_read
                        ? 'bg-[#F5F3EF]/70 hover:bg-[#F5F3EF]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {!notif.is_read && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#A56F63]" />
                    )}

                    {/* Event Icon badge */}
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}
                    >
                      <EventIcon className={`w-4 h-4 ${color}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs truncate ${
                            !notif.is_read ? 'font-black text-[#0F3040]' : 'font-semibold text-[#183E4C]'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#464858] whitespace-nowrap font-mono flex-shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#464858] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        {notif.ticket_number && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E5EAF0] text-[#405C78]">
                            {notif.ticket_number}
                          </span>
                        )}
                        {notif.email_sent === 1 && (
                          <span className="text-[9px] text-[#286448] font-mono">
                            Delivered to email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 border-t border-[#E7E4DF] bg-[#F5F3EF] flex items-center justify-between">
            <span className="text-[10px] text-[#464858] font-mono">Role Filtered Feed</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openCenterModal();
              }}
              className="text-xs font-bold text-[#0F3040] hover:text-[#A56F63] flex items-center gap-1 transition-colors"
            >
              <span>Notification Center</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
