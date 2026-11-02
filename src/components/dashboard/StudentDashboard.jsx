import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Bell, 
  HelpCircle, 
  User as UserIcon, 
  LogOut, 
  Search, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertCircle, 
  Wifi, 
  Monitor, 
  ArrowRight, 
  X, 
  Menu, 
  ShieldAlert, 
  RefreshCw, 
  Printer, 
  MessageSquare, 
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportIncidentModule from '../incident/ReportIncidentModule';
import MyIncidentsModule from '../incident/MyIncidentsModule';

/**
 * Helper: Format timestamps cleanly
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function StudentDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token, logout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'report' | 'my-incidents' | 'notifications' | 'help' | 'profile'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Tickets Data
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState('all');
  const [categoryFilter] = useState('all');
  const [priorityFilter] = useState('all');

  // Selected Incident for Details Drawer / Modal
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Field Technician Assigned',
      desc: 'Marcus Vance has been dispatched to investigate Wi-Fi access point in Engineering Block B.',
      time: '10 minutes ago',
      read: false,
      type: 'assignment',
    },
    {
      id: 2,
      title: 'Infrastructure Maintenance Notice',
      desc: 'Scheduled eduroam wireless certificate rotation completed across dormitories.',
      time: '1 hour ago',
      read: false,
      type: 'system',
    },
    {
      id: 3,
      title: 'Diagnostic Log Updated',
      desc: 'PoE power injector swapped; 4-hour telemetry saturation check initiated.',
      time: '3 hours ago',
      read: true,
      type: 'update',
    },
  ]);

  // Fetch Tickets from Backend API
  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.warn('Could not fetch tickets from backend:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Dynamic Statistics computed from actual student tickets
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Open').length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

    // Status distribution
    const statusDist = {
      open,
      inProgress,
      resolved,
      openPct: total > 0 ? Math.round((open / total) * 100) : 0,
      inProgressPct: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      resolvedPct: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };

    // Priority distribution
    const critical = tickets.filter((t) => t.priority === 'Critical').length;
    const high = tickets.filter((t) => t.priority === 'High').length;
    const medium = tickets.filter((t) => t.priority === 'Medium').length;
    const low = tickets.filter((t) => t.priority === 'Low').length;

    const priorityDist = {
      critical,
      high,
      medium,
      low,
      criticalPct: total > 0 ? Math.round((critical / total) * 100) : 0,
      highPct: total > 0 ? Math.round((high / total) * 100) : 0,
      mediumPct: total > 0 ? Math.round((medium / total) * 100) : 0,
      lowPct: total > 0 ? Math.round((low / total) * 100) : 0,
    };

    return { total, open, inProgress, resolved, statusDist, priorityDist };
  }, [tickets]);

  // Filtered Tickets according to search and active dropdowns
  const filteredTickets = useMemo(() => {
    return tickets.filter((tkt) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !q ||
        tkt.title?.toLowerCase().includes(q) ||
        tkt.ticket_number?.toLowerCase().includes(q) ||
        tkt.building?.toLowerCase().includes(q) ||
        tkt.room?.toLowerCase().includes(q) ||
        tkt.category?.toLowerCase().includes(q);

      const matchesStatus = 
        statusFilter === 'all' || 
        tkt.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory = 
        categoryFilter === 'all' || 
        tkt.category?.toLowerCase() === categoryFilter.toLowerCase();

      const matchesPriority = 
        priorityFilter === 'all' || 
        tkt.priority?.toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  // Activity Timeline generated from actual incidents & notes
  const timelineEvents = useMemo(() => {
    const events = [];
    tickets.forEach((tkt) => {
      events.push({
        id: `created-${tkt.id}`,
        type: 'created',
        title: `Reported: ${tkt.title}`,
        ticketNumber: tkt.ticket_number || `TKT-${tkt.id}`,
        time: formatTimeAgo(tkt.created_at),
        date: tkt.created_at,
        icon: PlusCircle,
        color: 'text-[#D99B7F]',
        bg: 'bg-[#D99B7F]/20',
      });

      if (tkt.technician_name) {
        events.push({
          id: `assigned-${tkt.id}`,
          type: 'assigned',
          title: `Assigned to ${tkt.technician_name}`,
          ticketNumber: tkt.ticket_number || `TKT-${tkt.id}`,
          time: formatTimeAgo(tkt.updated_at || tkt.created_at),
          date: tkt.updated_at || tkt.created_at,
          icon: Wrench,
          color: 'text-amber-400',
          bg: 'bg-amber-500/20',
        });
      }

      if (tkt.notes && Array.isArray(tkt.notes)) {
        tkt.notes.forEach((note) => {
          events.push({
            id: `note-${note.id}`,
            type: 'note',
            title: `Diagnostic note by ${note.author_name || 'Technician'}: "${note.note?.slice(0, 50)}..."`,
            ticketNumber: tkt.ticket_number || `TKT-${tkt.id}`,
            time: formatTimeAgo(note.created_at),
            date: note.created_at,
            icon: MessageSquare,
            color: 'text-sky-400',
            bg: 'bg-sky-500/20',
          });
        });
      }

      if (tkt.status === 'Resolved' || tkt.status === 'Closed') {
        events.push({
          id: `resolved-${tkt.id}`,
          type: 'resolved',
          title: `Resolved: ${tkt.title}`,
          ticketNumber: tkt.ticket_number || `TKT-${tkt.id}`,
          time: formatTimeAgo(tkt.updated_at),
          date: tkt.updated_at,
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/20',
        });
      }
    });

    return events.slice(0, 6);
  }, [tickets]);

  const handleLogout = async () => {
    await logout();
    if (onNotify) onNotify('Signed out of CampusFix', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (onNotify) onNotify('All notifications marked as read', 'info');
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#0c121c] text-slate-100 overflow-x-hidden selection:bg-[#D99B7F] selection:text-[#0F3040]">
      {/* ========================================================
          1. SIDEBAR (Desktop + Responsive Mobile Drawer)
          ======================================================== */}
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F3040]/95 backdrop-blur-2xl border-r border-[#A56F63]/25 flex flex-col justify-between transition-transform duration-300 ease-out
        lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top: Brand Logo */}
        <div>
          <div className="p-5 border-b border-[#A56F63]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A56F63] to-[#D99B7F] p-[1.5px] shadow-lg shadow-black/40">
                <div className="w-full h-full rounded-[10px] bg-[#1a222d] flex items-center justify-center">
                  <svg viewBox="0 0 48 48" className="w-6 h-6 text-[#D99B7F]" fill="none" stroke="currentColor">
                    <path d="M8 38V20L24 10L40 20V38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="24" cy="20" r="3" fill="#D99B7F" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white tracking-tight font-heading">Campus<span className="text-[#D99B7F]">Fix</span></span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#464858]/60 text-[#D99B7F] border border-[#A56F63]/40 font-bold">STUDENT</span>
                </div>
                <p className="text-[10px] text-slate-400">IT Infrastructure Portal</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'report', label: 'Report an Incident', icon: PlusCircle, highlight: true },
              { id: 'my-incidents', label: 'My Incidents', icon: FileText, badge: tickets.length },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
              { id: 'help', label: 'Help & Support', icon: HelpCircle },
              { id: 'profile', label: 'Profile', icon: UserIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D99B7F]/20 to-[#A56F63]/10 text-white border border-[#D99B7F]/40 shadow-sm'
                      : item.highlight
                      ? 'bg-[#464858]/40 text-[#D99B7F] hover:bg-[#464858]/70 border border-[#A56F63]/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#464858]/35'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D99B7F]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#D99B7F] text-[#0F3040]' : 'bg-[#464858] text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Role Diagnostics & Sign Out */}
        <div className="p-3.5 border-t border-[#A56F63]/20 space-y-2">
          {/* Security Tester Quick Trigger */}
          <button
            type="button"
            onClick={onOpenRoleTester}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#464858]/30 hover:bg-[#464858]/60 text-slate-300 text-xs font-medium border border-[#A56F63]/25 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-[#D99B7F]" />
            <span className="truncate">Verify Role Matrix</span>
          </button>

          {/* User Preview & Sign Out */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-[#D99B7F]/20 border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F] font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="truncate">
                <p className="text-white text-xs font-semibold truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.collegeId || 'STU'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT WRAPPER
          ======================================================== */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* ========================================================
            TOP NAVIGATION BAR
            ======================================================== */}
        <header className="sticky top-0 z-30 w-full h-16 bg-[#0F3040]/85 backdrop-blur-xl border-b border-[#A56F63]/25 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Welcome Message */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-[#464858]/40 border border-[#A56F63]/30 text-slate-300 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-white font-heading tracking-tight flex items-center gap-1.5">
                <span>Welcome back, <span className="text-[#D99B7F]">{user?.name || 'Student'}</span> 👋</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Campus Infrastructure Incident Operations • Active Student View
              </p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search incident title, ID, building, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#202733]/80 border border-slate-500/25 focus:border-[#D99B7F] text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Action, Notification Bell & Profile Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-[#0F3040] shadow-md transition-all hover:brightness-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 rounded-xl bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 text-slate-300 hover:text-white transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D99B7F] text-[#0F3040] text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Refresh Tickets Button */}
            <button
              type="button"
              onClick={fetchTickets}
              className="p-2 rounded-xl bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 text-slate-300 hover:text-white transition-all"
              title="Refresh incident data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingTickets ? 'animate-spin text-[#D99B7F]' : ''}`} />
            </button>

            {/* Profile Avatar Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#464858]/40 border border-transparent hover:border-[#A56F63]/30 transition-all text-left"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F3040] to-[#464858] border border-[#D99B7F]/50 flex items-center justify-center text-[#D99B7F] font-bold text-xs shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F3040]" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0F3040]/95 border border-[#A56F63]/40 shadow-2xl backdrop-blur-2xl p-3 z-50 animate-fadeIn"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <div className="pb-2.5 border-b border-[#A56F63]/25 mb-2">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Student'}</p>
                    <p className="text-[11px] text-slate-300 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">ID:</span>
                      <span className="font-mono text-[#D99B7F] font-bold">{user?.collegeId || 'STU-0000'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#464858]/40 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#D99B7F]" />
                      <span>View Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('help')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#464858]/40 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#D99B7F]" />
                      <span>Campus Support Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenRoleTester}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#464858]/40 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Role Security Diagnostic</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Search Input (Visible only on small viewports) */}
        <div className="p-3 bg-[#0F3040]/70 border-b border-[#A56F63]/20 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#202733] border border-slate-500/25 text-xs text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* ========================================================
            3. TAB CONTENT ROUTING
            ======================================================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Action Hero Banner */}
              <div 
                className="relative rounded-2xl p-6 sm:p-7 border border-[#A56F63]/30 overflow-hidden shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(70, 72, 88, 0.45) 100%)',
                }}
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider">
                        Student Operations Desk
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Status: Connected to University Dispatch</span>
                    </div>
                    <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
                      Campus Infrastructure Incident Hub
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
                      Experiencing classroom AV failure, Wi-Fi connectivity degradation, or lab equipment malfunctions? File a work order directly to field dispatch.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide text-[#0F3040] shadow-lg transition-all hover:brightness-105 active:scale-95 flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
                    }}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>REPORT NEW INCIDENT</span>
                  </button>
                </div>
              </div>

              {/* 4 Attractive Statistic Cards (Computed from actual incident data) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Incidents Reported */}
                <div className="p-4 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-lg backdrop-blur-md transition-all hover:border-[#D99B7F]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Total Reported
                    </span>
                    <div className="p-2 rounded-xl bg-[#D99B7F]/15 border border-[#D99B7F]/30 text-[#D99B7F]">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-white font-heading tracking-tight">
                    {stats.total}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Lifetime student tickets</span>
                    <span className="text-[#D99B7F] font-semibold">Active</span>
                  </div>
                </div>

                {/* Open Incidents */}
                <div className="p-4 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-lg backdrop-blur-md transition-all hover:border-amber-400/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Open Incidents
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-white font-heading tracking-tight text-amber-300">
                    {stats.open}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Awaiting triage queue</span>
                    <span className="text-amber-400 font-semibold">{stats.statusDist.openPct}%</span>
                  </div>
                </div>

                {/* In Progress */}
                <div className="p-4 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-lg backdrop-blur-md transition-all hover:border-sky-400/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      In Progress
                    </span>
                    <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-white font-heading tracking-tight text-sky-300">
                    {stats.inProgress}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Field tech active on-site</span>
                    <span className="text-sky-400 font-semibold">{stats.statusDist.inProgressPct}%</span>
                  </div>
                </div>

                {/* Resolved Incidents */}
                <div className="p-4 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-lg backdrop-blur-md transition-all hover:border-emerald-400/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Resolved Incidents
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-white font-heading tracking-tight text-emerald-400">
                    {stats.resolved}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Confirmed fixed & verified</span>
                    <span className="text-emerald-400 font-semibold">{stats.statusDist.resolvedPct}%</span>
                  </div>
                </div>
              </div>

              {/* Middle Grid: Charts & Activity Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Status Distribution Donut Chart */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/20 mb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Distribution</h3>
                      <span className="text-[10px] text-slate-400">Calculated Live</span>
                    </div>

                    {stats.total === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                          0%
                        </div>
                        <p className="font-semibold text-slate-300">No Incidents Recorded</p>
                        <p className="mt-1 text-[11px]">Report an incident to populate status metrics.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {/* Interactive SVG Donut */}
                        <div className="relative w-44 h-44 my-2">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Base Background Track */}
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#202733" strokeWidth="12" />

                            {/* Open Slice */}
                            {stats.statusDist.openPct > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#F59E0B"
                                strokeWidth="12"
                                strokeDasharray={`${(stats.statusDist.openPct / 100) * 238.76} 238.76`}
                                strokeDashoffset="0"
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}

                            {/* In Progress Slice */}
                            {stats.statusDist.inProgressPct > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#38BDF8"
                                strokeWidth="12"
                                strokeDasharray={`${(stats.statusDist.inProgressPct / 100) * 238.76} 238.76`}
                                strokeDashoffset={`-${(stats.statusDist.openPct / 100) * 238.76}`}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}

                            {/* Resolved Slice */}
                            {stats.statusDist.resolvedPct > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#34D399"
                                strokeWidth="12"
                                strokeDasharray={`${(stats.statusDist.resolvedPct / 100) * 238.76} 238.76`}
                                strokeDashoffset={`-${((stats.statusDist.openPct + stats.statusDist.inProgressPct) / 100) * 238.76}`}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-white font-heading">{stats.total}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Tickets</span>
                          </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="w-full mt-4 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#202733]/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <span className="text-slate-300">Open</span>
                            </div>
                            <span className="font-mono text-white font-bold">{stats.open} ({stats.statusDist.openPct}%)</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#202733]/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                              <span className="text-slate-300">In Progress</span>
                            </div>
                            <span className="font-mono text-white font-bold">{stats.inProgress} ({stats.statusDist.inProgressPct}%)</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#202733]/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">Resolved</span>
                            </div>
                            <span className="font-mono text-white font-bold">{stats.resolved} ({stats.statusDist.resolvedPct}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Distribution Chart */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/20 mb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Priority Distribution</h3>
                      <span className="text-[10px] text-slate-400">Severity Breakdown</span>
                    </div>

                    {stats.total === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                        <p className="font-semibold text-slate-300">No Priority Data</p>
                        <p className="mt-1 text-[11px]">Telemetry will populate as incidents are filed.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 my-2">
                        {/* Critical */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-red-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" /> Critical
                            </span>
                            <span className="font-mono text-white">{stats.priorityDist.critical} ({stats.priorityDist.criticalPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#202733] rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.criticalPct}%` }} />
                          </div>
                        </div>

                        {/* High */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" /> High
                            </span>
                            <span className="font-mono text-white">{stats.priorityDist.high} ({stats.priorityDist.highPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#202733] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.highPct}%` }} />
                          </div>
                        </div>

                        {/* Medium */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#D99B7F] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#D99B7F]" /> Medium
                            </span>
                            <span className="font-mono text-white">{stats.priorityDist.medium} ({stats.priorityDist.mediumPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#202733] rounded-full overflow-hidden">
                            <div className="h-full bg-[#D99B7F] rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.mediumPct}%` }} />
                          </div>
                        </div>

                        {/* Low */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                            </span>
                            <span className="font-mono text-white">{stats.priorityDist.low} ({stats.priorityDist.lowPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#202733] rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.lowPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/20 mb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Activity Timeline</h3>
                      <Activity className="w-3.5 h-3.5 text-[#D99B7F]" />
                    </div>

                    {timelineEvents.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="font-semibold text-slate-300">No Recent Activity</p>
                        <p className="mt-1 text-[11px]">Updates will appear as tickets progress.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timelineEvents.map((evt) => {
                          const EvtIcon = evt.icon;
                          return (
                            <div key={evt.id} className="flex items-start gap-3 text-xs">
                              <div className={`p-1.5 rounded-lg ${evt.bg} ${evt.color} flex-shrink-0 mt-0.5`}>
                                <EvtIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-slate-200 font-medium truncate">{evt.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-mono text-[#D99B7F]">{evt.ticketNumber}</span>
                                  <span>•</span>
                                  <span>{evt.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Incidents Table */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#1a222d]/85 border border-[#A56F63]/25 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#A56F63]/20">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#D99B7F]" />
                    <h3 className="text-base font-bold text-white font-heading">Recent Incidents</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D99B7F]/20 text-[#D99B7F] font-bold">
                      {filteredTickets.length} Found
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-incidents')}
                      className="text-xs text-[#D99B7F] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View All in My Incidents</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#202733] border border-slate-600/40 flex items-center justify-center text-slate-500 mb-2">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-white">No Incidents Found</p>
                    <p className="text-xs max-w-sm mx-auto text-slate-400">
                      {searchQuery
                        ? `No reported issues matched your query "${searchQuery}".`
                        : 'You haven\'t submitted any campus infrastructure issues yet.'}
                    </p>
                    <div className="pt-2">
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#464858]/50 text-slate-200 text-xs font-semibold hover:bg-[#464858]"
                        >
                          Clear Search Filter
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('report')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F3040] transition-all hover:brightness-105 active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)' }}
                        >
                          Report Your First Incident
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3 font-semibold">Incident ID</th>
                          <th className="py-3 px-3 font-semibold">Title</th>
                          <th className="py-3 px-3 font-semibold">Category</th>
                          <th className="py-3 px-3 font-semibold">Location</th>
                          <th className="py-3 px-3 font-semibold">Priority</th>
                          <th className="py-3 px-3 font-semibold">Status</th>
                          <th className="py-3 px-3 font-semibold">Date Reported</th>
                          <th className="py-3 px-3 font-semibold text-right">View Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {filteredTickets.slice(0, 5).map((tkt) => (
                          <tr 
                            key={tkt.id}
                            onClick={() => {
                              setSelectedIncident(tkt);
                              setActiveTab('my-incidents');
                            }}
                            className="hover:bg-[#202733]/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#D99B7F] whitespace-nowrap">
                              {tkt.ticket_number || `TKT-${tkt.id}`}
                            </td>
                            <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">
                              {tkt.title}
                            </td>
                            <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-[#202733] border border-slate-500/30 text-[11px]">
                                {tkt.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 whitespace-nowrap text-[11px]">
                              📍 {tkt.building} • {tkt.room}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tkt.priority === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                                tkt.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                tkt.priority === 'Medium' ? 'bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40' :
                                'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                              }`}>
                                {tkt.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tkt.status === 'In Progress' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                                tkt.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {tkt.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                              {formatTimeAgo(tkt.created_at)}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(tkt);
                                  setActiveTab('my-incidents');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#464858]/40 hover:bg-[#D99B7F] text-slate-300 hover:text-[#0F3040] font-semibold text-[11px] transition-all"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REPORT AN INCIDENT */}
          {activeTab === 'report' && (
            <ReportIncidentModule
              onIncidentCreated={(newTicket) => {
                setTickets((prev) => [newTicket, ...prev]);
              }}
              onViewIncident={(ticket) => {
                setSelectedIncident(ticket);
                setActiveTab('my-incidents');
              }}
              onReturnToDashboard={() => {
                setActiveTab('overview');
              }}
              onNotify={onNotify}
            />
          )}

          {/* TAB 3: MY INCIDENTS */}
          {activeTab === 'my-incidents' && (
            <MyIncidentsModule
              tickets={tickets}
              onRefreshTickets={fetchTickets}
              onReportNew={() => setActiveTab('report')}
              selectedIncident={selectedIncident}
              onSelectIncident={(tkt) => {
                setSelectedIncident(tkt);
                if (tkt) {
                  setTickets((prev) => prev.map((item) => (item.id === tkt.id ? tkt : item)));
                }
              }}
              onNotify={onNotify}
            />
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="p-6 rounded-2xl bg-[#1a222d]/90 border border-[#A56F63]/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#D99B7F]" />
                    <h2 className="text-xl font-bold text-white font-heading">Notifications</h2>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D99B7F]/20 text-[#D99B7F] font-bold text-xs">
                        {unreadNotificationsCount} New
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-[#D99B7F] hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        notif.read 
                          ? 'bg-[#202733]/40 border-slate-600/20 text-slate-400' 
                          : 'bg-[#202733]/80 border-[#D99B7F]/40 text-slate-200 shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-[#D99B7F]" />}
                            <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                          </div>
                          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{notif.desc}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-[#1a222d]/90 border border-[#A56F63]/30 shadow-xl space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white font-heading">Campus IT Help & Support</h2>
                  <p className="text-xs text-slate-300 mt-1">Student self-service guides and emergency technician dispatch</p>
                </div>

                {/* Service Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-500/20 space-y-2">
                    <Wifi className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">eduroam Wi-Fi Guide</h4>
                    <p className="text-xs text-slate-300">Connect your laptop and phone using your college email and campus password with 802.1X PEAP authentication.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-500/20 space-y-2">
                    <Printer className="w-5 h-5 text-[#D99B7F]" />
                    <h4 className="text-sm font-bold text-white">Student Cloud Printing</h4>
                    <p className="text-xs text-slate-300">Each student is allocated 200 free duplex prints per semester at library and residential hall kiosks.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-500/20 space-y-2">
                    <Monitor className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">Computer Lab Access</h4>
                    <p className="text-xs text-slate-300">Computer Science labs 102 & 304 are open 24/7 with active university student ID badge swipe access.</p>
                  </div>
                </div>

                {/* Helpdesk Contact Info */}
                <div className="p-4 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 text-xs space-y-2">
                  <h4 className="font-bold text-white text-sm">Need In-Person Support?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                    <div>📍 <strong>Location:</strong> CS Building, Room 101</div>
                    <div>📞 <strong>Telephone:</strong> (555) 019-4821</div>
                    <div>✉️ <strong>Email:</strong> helpdesk@campus.edu</div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Walk-in desk hours: Monday – Friday: 8:00 AM – 8:00 PM • Saturday: 10:00 AM – 4:00 PM
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#1a222d]/90 border border-[#A56F63]/30 shadow-2xl space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-[#A56F63]/25">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F3040] to-[#464858] border border-[#D99B7F] flex items-center justify-center text-[#D99B7F] text-2xl font-black shadow-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">{user?.name || 'Campus Student'}</h2>
                    <p className="text-xs text-[#D99B7F] font-mono">{user?.collegeId || 'STU-0000'}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider">
                      Student Account • Reporter Access
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-600/25">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Campus Email</span>
                    <span className="text-sm font-semibold text-white mt-0.5 block">{user?.email}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-600/25">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Academic Department</span>
                    <span className="text-sm font-semibold text-white mt-0.5 block">{user?.department || 'Undergraduate Studies'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-600/25">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Session Security</span>
                    <span className="text-sm font-semibold text-emerald-400 mt-0.5 block">256-Bit Encrypted JWT</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-600/25">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Campus Status</span>
                    <span className="text-sm font-semibold text-white mt-0.5 block">Active Enrolled Student</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={onOpenRoleTester}
                    className="px-4 py-2 rounded-xl bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Test Role Privileges
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-xs font-semibold text-red-200 transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
