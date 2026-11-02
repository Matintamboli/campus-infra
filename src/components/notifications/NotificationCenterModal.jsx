import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Mail,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

function formatFullDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

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

function getEventDetails(eventType, priority) {
  if (priority === 'critical' || eventType.includes('CRITICAL') || eventType.includes('OVERDUE')) {
    return {
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      tag: 'Critical Alert',
    };
  }
  if (eventType.includes('ASSIGN') || eventType.includes('TECH')) {
    return {
      icon: Wrench,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/40',
      tag: 'Field Dispatch',
    };
  }
  if (eventType.includes('RESOLV') || eventType.includes('CLOSED')) {
    return {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      tag: 'Resolution',
    };
  }
  if (eventType.includes('REPEATED')) {
    return {
      icon: AlertTriangle,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/40',
      tag: 'Pattern Alert',
    };
  }
  return {
    icon: Clock,
    color: 'text-[#D99B7F]',
    bg: 'bg-[#D99B7F]/20',
    border: 'border-[#D99B7F]/40',
    tag: 'Operational Update',
  };
}

export default function NotificationCenterModal({ onNavigateToIncident }) {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    preferences,
    isCenterModalOpen,
    closeCenterModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    updatePreferences,
    openIncident,
    fetchNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'critical' | 'preferences'
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanningSLA, setIsScanningSLA] = useState(false);
  const [slaMessage, setSlaMessage] = useState(null);

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    if (activeTab === 'unread') {
      list = list.filter((n) => !n.is_read);
    } else if (activeTab === 'critical') {
      list = list.filter(
        (n) => n.priority === 'critical' || n.event_type.includes('CRITICAL') || n.event_type.includes('OVERDUE')
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.message || '').toLowerCase().includes(q) ||
          (n.ticket_number || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [notifications, activeTab, searchQuery]);

  const handleOpenIncident = (ticketId, ticketNumber) => {
    openIncident(ticketId, ticketNumber);
    if (onNavigateToIncident) {
      onNavigateToIncident(ticketId, ticketNumber);
    }
    closeCenterModal();
  };

  const handleSimulateSla = async () => {
    setIsScanningSLA(true);
    setSlaMessage(null);
    try {
      const res = await fetch('/api/notifications/simulate-sla-check', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campusfix_auth_token') || sessionStorage.getItem('campusfix_session_token')}`,
        },
      });
      const data = await res.json();
      setSlaMessage(data.message || 'SLA scan complete.');
      fetchNotifications();
    } catch {
      setSlaMessage('Failed to trigger scan.');
    } finally {
      setIsScanningSLA(false);
    }
  };

  if (!isCenterModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#121922] border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div
          className="p-5 sm:p-6 border-b border-slate-300/10 flex items-start justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(70, 72, 88, 0.6) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D99B7F]/20 border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F] shadow-lg">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                  Notification Center & Activity Feed
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-red-500 to-amber-500 text-white shadow">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Role-tailored infrastructure incident alerts, field technician dispatch updates, and SLA governance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCenterModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#202733]/80 hover:bg-[#202733] border border-slate-300/15 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Search Toolbar */}
        <div className="p-3.5 sm:px-6 border-b border-slate-300/10 bg-[#1a222d]/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              {
                id: 'critical',
                label: `Critical SLA (${notifications.filter((n) => n.priority === 'critical').length})`,
              },
              { id: 'preferences', label: 'Preferences & Channels' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#D99B7F] text-[#0F3040] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Actions */}
          {activeTab !== 'preferences' && (
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#202733]/90 border border-slate-500/30 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#D99B7F]"
                />
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#202733] hover:bg-[#202733]/80 border border-[#D99B7F]/40 text-[#D99B7F] hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearReadNotifications}
                className="p-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-slate-300/10 transition-all"
                title="Clear read notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activeTab === 'preferences' ? (
            /* PREFERENCES PANEL */
            <div className="max-w-xl mx-auto space-y-5 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-[#1a222d] border border-slate-300/15 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Notification Channels & Dispatch Routing
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure your personal notification delivery channels and sound alerts.
                  </p>
                </div>

                {/* Email Notifications Toggle */}
                <div className="p-4 rounded-xl bg-[#202733]/70 border border-slate-300/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Email Notifications</p>
                      <p className="text-[11px] text-slate-400">
                        Dispatch email summaries to <strong>{user?.email}</strong> for status changes and critical alerts.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updatePreferences({ emailEnabled: !preferences.emailEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                      preferences.emailEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Audio Chime Toggle */}
                <div className="p-4 rounded-xl bg-[#202733]/70 border border-slate-300/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                      {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Audio Alert Chime</p>
                      <p className="text-[11px] text-slate-400">
                        Play an acoustic tone when a real-time event arrives through Server-Sent Events.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                      preferences.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Real-Time SSE Status */}
                <div className="p-4 rounded-xl bg-[#0F3040]/70 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Live Server-Sent Events Active</p>
                      <p className="text-[10px] text-slate-400">Real-time socket channel connected to CampusFix API</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Administrator Controls: SLA Scan */}
              {user?.role === 'Administrator' && (
                <div className="p-5 rounded-2xl bg-[#1a222d] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Administrator SLA Breach Detector
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Scan all open incidents against configured category SLA hours and broadcast breach notifications.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isScanningSLA}
                      onClick={handleSimulateSla}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningSLA ? 'animate-spin' : ''}`} />
                      <span>Run SLA Scan</span>
                    </button>
                  </div>
                  {slaMessage && (
                    <p className="text-xs text-amber-300 font-mono bg-amber-500/10 p-2 rounded-lg">{slaMessage}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* NOTIFICATION CARDS LIST */
            filteredNotifications.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <Bell className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <h4 className="text-sm font-bold text-white">No notifications matching filters</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? `No alerts match "${searchQuery}".` : 'You have no notifications in this view.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const details = getEventDetails(notif.event_type, notif.priority);
                const IconComp = details.icon;

                return (
                  <div
                    key={notif.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      !notif.is_read
                        ? 'bg-[#1a222d] border-[#D99B7F]/40 shadow-lg'
                        : 'bg-[#151c26]/70 border-slate-300/10 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      {/* Event Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${details.bg} ${details.border} ${details.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${details.bg} ${details.border} ${details.color}`}>
                              {details.tag}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {notif.event_type}
                            </span>
                          </div>

                          <span className="text-xs text-slate-400 font-mono" title={formatFullDate(notif.created_at)}>
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#D99B7F] shrink-0" />
                          )}
                          <span>{notif.title}</span>
                        </h3>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Metadata Footer: Ticket link + Email delivered indicator */}
                        <div className="mt-3 pt-3 border-t border-slate-300/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {notif.ticket_number && (
                              <button
                                type="button"
                                onClick={() => handleOpenIncident(notif.ticket_id, notif.ticket_number)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold bg-[#0F3040] text-[#D99B7F] border border-[#D99B7F]/40 hover:bg-[#0F3040]/80 transition-all"
                              >
                                <span>{notif.ticket_number}</span>
                                {notif.building && (
                                  <span className="text-slate-400 font-sans font-normal">· {notif.building}</span>
                                )}
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </button>
                            )}

                            {notif.email_sent === 1 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                <Mail className="w-3 h-3" />
                                <span>Email Dispatched</span>
                              </span>
                            )}
                          </div>

                          {/* Quick item actions */}
                          <div className="flex items-center gap-1.5">
                            {!notif.is_read && (
                              <button
                                type="button"
                                onClick={() => markAsRead(notif.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-[#202733] border border-slate-300/20"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteNotification(notif.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-slate-300/10"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-300/10 bg-[#0F3040]/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>CampusFix Unified Event Broker · Real-Time Push</span>
          </div>

          <button
            type="button"
            onClick={closeCenterModal}
            className="px-4 py-1.5 rounded-xl font-bold text-xs bg-[#202733] hover:bg-[#202733]/80 border border-slate-300/20 text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
