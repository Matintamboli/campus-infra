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
      color: 'text-[#A33D35]',
      bg: 'bg-[#F5DEDA]',
      border: 'border-[#A33D35]/30',
      tag: 'Critical Alert',
    };
  }
  if (eventType.includes('ASSIGN') || eventType.includes('TECH')) {
    return {
      icon: Wrench,
      color: 'text-[#93651C]',
      bg: 'bg-[#F8EBD2]',
      border: 'border-[#93651C]/30',
      tag: 'Field Dispatch',
    };
  }
  if (eventType.includes('RESOLV') || eventType.includes('CLOSED')) {
    return {
      icon: CheckCircle2,
      color: 'text-[#286448]',
      bg: 'bg-[#DCEDE4]',
      border: 'border-[#286448]/30',
      tag: 'Resolution',
    };
  }
  if (eventType.includes('REPEATED')) {
    return {
      icon: AlertTriangle,
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      tag: 'Pattern Alert',
    };
  }
  return {
    icon: Clock,
    color: 'text-[#405C78]',
    bg: 'bg-[#E5EAF0]',
    border: 'border-[#405C78]/30',
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white border border-[#E7E4DF] shadow-2xl overflow-hidden flex flex-col text-[#0F3040]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-[#0F3040] text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D99B7F]/20 border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F] shadow-xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                  Notification Center & Activity Feed
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A33D35] text-white shadow-xs">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Role-tailored infrastructure incident alerts, field technician dispatch updates, and SLA governance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCenterModal}
            className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Search Toolbar */}
        <div className="p-3.5 sm:px-6 border-b border-[#E7E4DF] bg-[#F5F3EF] flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                    ? 'bg-[#0F3040] text-white shadow-xs'
                    : 'text-[#464858] hover:text-[#0F3040] hover:bg-white'
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#464858]" />
                <input
                  type="text"
                  placeholder="Filter notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl saas-input text-xs"
                />
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] flex items-center gap-1.5 whitespace-nowrap transition-all shadow-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#286448]" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearReadNotifications}
                className="p-2 rounded-xl text-[#464858] hover:text-[#A33D35] hover:bg-[#F5DEDA] border border-[#E7E4DF] transition-all"
                title="Clear read notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#F5F3EF]">
          {activeTab === 'preferences' ? (
            /* PREFERENCES PANEL */
            <div className="max-w-xl mx-auto space-y-5 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-white border border-[#E7E4DF] space-y-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#0F3040] font-heading">
                    Notification Channels & Dispatch Routing
                  </h3>
                  <p className="text-xs text-[#464858] mt-0.5">
                    Configure your personal notification delivery channels and sound alerts.
                  </p>
                </div>

                {/* Email Notifications Toggle */}
                <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F3040]">Email Notifications</p>
                      <p className="text-[11px] text-[#464858]">
                        Dispatch email summaries to <strong>{user?.email}</strong> for status changes and critical alerts.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updatePreferences({ emailEnabled: !preferences.emailEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                      preferences.emailEnabled ? 'bg-[#0F3040]' : 'bg-[#E7E4DF]'
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
                <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F8EBD2] text-[#93651C] flex items-center justify-center">
                      {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F3040]">Audio Alert Chime</p>
                      <p className="text-[11px] text-[#464858]">
                        Play an acoustic tone when a real-time event arrives through Server-Sent Events.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                      preferences.soundEnabled ? 'bg-[#93651C]' : 'bg-[#E7E4DF]'
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
                <div className="p-4 rounded-xl bg-[#DCEDE4]/60 border border-[#286448]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#286448] animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-[#286448]">Live Server-Sent Events Active</p>
                      <p className="text-[10px] text-[#464858]">Real-time socket channel connected to CampusFix API</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DCEDE4] text-[#286448] font-bold border border-[#286448]/40">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Administrator Controls: SLA Scan */}
              {user?.role === 'Administrator' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E7E4DF] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
                        Administrator SLA Breach Detector
                      </h4>
                      <p className="text-[11px] text-[#464858]">
                        Scan all open incidents against configured category SLA hours and broadcast breach notifications.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isScanningSLA}
                      onClick={handleSimulateSla}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30 hover:bg-[#F8EBD2]/80 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningSLA ? 'animate-spin' : ''}`} />
                      <span>Run SLA Scan</span>
                    </button>
                  </div>
                  {slaMessage && (
                    <p className="text-xs text-[#93651C] font-mono bg-[#F8EBD2] p-2 rounded-lg border border-[#93651C]/20">{slaMessage}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* NOTIFICATION CARDS LIST */
            filteredNotifications.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Bell className="w-10 h-10 mx-auto opacity-30 text-[#464858]" />
                <h4 className="text-sm font-bold text-[#0F3040]">No notifications matching filters</h4>
                <p className="text-xs text-[#464858] max-w-sm mx-auto">
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
                        ? 'bg-white border-[#0F3040]/20 shadow-sm'
                        : 'bg-white/80 border-[#E7E4DF] opacity-80'
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
                            <span className="text-[10px] text-[#464858] font-mono">
                              {notif.event_type}
                            </span>
                          </div>

                          <span className="text-xs text-[#464858] font-mono" title={formatFullDate(notif.created_at)}>
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#0F3040] mt-1.5 flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#D99B7F] shrink-0" />
                          )}
                          <span>{notif.title}</span>
                        </h3>

                        <p className="text-xs text-[#464858] mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Metadata Footer: Ticket link + Email delivered indicator */}
                        <div className="mt-3 pt-3 border-t border-[#E7E4DF] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {notif.ticket_number && (
                              <button
                                type="button"
                                onClick={() => handleOpenIncident(notif.ticket_id, notif.ticket_number)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold bg-[#F5F3EF] text-[#0F3040] border border-[#E7E4DF] hover:bg-[#E7E4DF] transition-all"
                              >
                                <span>{notif.ticket_number}</span>
                                {notif.building && (
                                  <span className="text-[#464858] font-sans font-normal">· {notif.building}</span>
                                )}
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </button>
                            )}

                            {notif.email_sent === 1 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
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
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#464858] hover:text-[#0F3040] bg-[#F5F3EF] border border-[#E7E4DF] hover:border-[#0F3040]/30 transition-all"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteNotification(notif.id)}
                              className="p-1.5 rounded-lg text-[#464858] hover:text-[#A33D35] hover:bg-[#F5DEDA] border border-[#E7E4DF] transition-all"
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
        <div className="p-4 sm:px-6 border-t border-[#E7E4DF] bg-white flex items-center justify-between text-xs text-[#464858]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#286448]" />
            <span>CampusFix Unified Event Broker · Real-Time Push</span>
          </div>

          <button
            type="button"
            onClick={closeCenterModal}
            className="px-4 py-1.5 rounded-xl font-bold text-xs bg-[#0F3040] hover:bg-[#183E4C] text-white transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
