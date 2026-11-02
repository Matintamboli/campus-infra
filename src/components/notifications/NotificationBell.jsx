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
    return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' };
  }
  if (eventType.includes('ASSIGN') || eventType.includes('TECH')) {
    return { icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
  }
  if (eventType.includes('RESOLV') || eventType.includes('CLOSED')) {
    return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };
  }
  if (eventType.includes('REPEATED')) {
    return { icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40' };
  }
  return { icon: Clock, color: 'text-[#D99B7F]', bg: 'bg-[#D99B7F]/20 border-[#D99B7F]/40' };
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
        className={`relative p-2 rounded-xl transition-all ${
          isOpen
            ? 'bg-[#A56F63]/30 text-white border border-[#D99B7F]/50 shadow-md'
            : 'bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 text-slate-300 hover:text-white'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Animated Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/30 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] rounded-2xl bg-[#121922]/95 backdrop-blur-xl border border-slate-300/20 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[580px] animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-300/10 bg-[#0F3040]/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-heading">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/30">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-[#D99B7F] hover:text-white flex items-center gap-1 transition-colors"
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/40"
                title="Open Settings & Center"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 py-2 border-b border-slate-300/10 bg-[#1a222d]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'unread'
                    ? 'bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Real-Time SSE</span>
            </span>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-300/10">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-semibold text-slate-300">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications in your activity feed.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Updates on submitted and assigned campus issues will appear here instantly.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const iconInfo = getEventIcon(notif.event_type, notif.priority);
                const IconComponent = iconInfo.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#202733]/80 ${
                      !notif.is_read ? 'bg-[#202733]/40' : 'opacity-85'
                    }`}
                  >
                    {/* Event Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconInfo.bg} ${iconInfo.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D99B7F] shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Associated Ticket Pill */}
                      {notif.ticket_number && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#0F3040] text-[#D99B7F] border border-[#D99B7F]/30 hover:underline">
                            <span>{notif.ticket_number}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>

                          {notif.priority && notif.priority === 'critical' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                              Critical
                            </span>
                          )}

                          {notif.email_sent === 1 && (
                            <span className="text-[10px] text-slate-400" title="Email dispatch delivered">
                              ✉️
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-[#0F3040]/90 border-t border-slate-300/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              {notifications.length} total event{notifications.length !== 1 ? 's' : ''}
            </span>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openCenterModal();
              }}
              className="text-xs font-bold text-[#D99B7F] hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Notification Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

