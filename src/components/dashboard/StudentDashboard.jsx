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
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../notifications/NotificationBell';
import ReportIncidentModule from '../incident/ReportIncidentModule';
import MyIncidentsModule from '../incident/MyIncidentsModule';
import UnifiedSidebar from './UnifiedSidebar';

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

  // Global Notification Engine Hook
  const {
    notifications,
    unreadCount: unreadNotificationsCount,
    markAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    openCenterModal,
    activeIncidentToOpen,
    clearActiveIncident,
  } = useNotifications();

  // Sync opening incident from notification click
  useEffect(() => {
    if (activeIncidentToOpen?.ticketId) {
      const target = tickets.find((t) => t.id === activeIncidentToOpen.ticketId);
      if (target) {
        setSelectedIncident(target);
        setActiveTab('my-incidents');
      }
      clearActiveIncident();
    }
  }, [activeIncidentToOpen, tickets, clearActiveIncident]);

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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'report', label: 'Report an Incident', icon: PlusCircle, highlight: true },
    { id: 'my-incidents', label: 'My Incidents', icon: FileText, badge: tickets.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3EF] text-[#0F3040]">
      <UnifiedSidebar
        brandRole="STUDENT"
        brandSub="Campus Operations"
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSelectedIncident(null);
        }}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenRoleTester={onOpenRoleTester}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-[#E7E4DF] bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#0F3040] font-heading tracking-tight flex items-center gap-1.5">
                <span>Welcome back, <span className="text-[#A56F63]">{user?.name || 'Student'}</span> 👋</span>
              </h1>
              <p className="text-[11px] text-[#464858] hidden sm:block">
                Campus Infrastructure Incident Operations • Active Student View
              </p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8B96]" />
              <input
                type="text"
                placeholder="Search incident title, ID, building, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl saas-input text-xs text-[#0F3040] placeholder-[#8D8B96]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D8B96] hover:text-[#0F3040]"
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            {/* Professional Top Navigation Notification Bell */}
            <NotificationBell
              onNavigateToIncident={(ticketId) => {
                const target = tickets.find((t) => t.id === ticketId);
                if (target) {
                  setSelectedIncident(target);
                  setActiveTab('my-incidents');
                }
              }}
            />

            {/* Refresh Tickets Button */}
            <button
              type="button"
              onClick={fetchTickets}
              className="p-2 rounded-xl bg-white hover:bg-[#F5F3EF] border border-[#E7E4DF] text-[#464858] hover:text-[#0F3040] transition-all shadow-xs"
              title="Refresh incident data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingTickets ? 'animate-spin text-[#A56F63]' : ''}`} />
            </button>

            {/* Profile Avatar Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F5F3EF] border border-transparent hover:border-[#E7E4DF] transition-all text-left"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-[#0F3040] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#286448] border-2 border-white" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#E7E4DF] shadow-xl p-3 z-50 text-[#0F3040]"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <div className="pb-2.5 border-b border-[#E7E4DF] mb-2">
                    <p className="text-xs font-bold text-[#0F3040] truncate">{user?.name || 'Student'}</p>
                    <p className="text-[11px] text-[#464858] truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[#464858]">ID:</span>
                      <span className="font-mono text-[#A56F63] font-bold">{user?.collegeId || 'STU-0000'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#A56F63]" />
                      <span>View Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('help')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#A56F63]" />
                      <span>Campus Support Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenRoleTester}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#93651C]" />
                      <span>Role Security Diagnostic</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A33D35] hover:bg-[#F5DEDA]/50 transition-colors"
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
        <div className="p-3 bg-white border-b border-[#E7E4DF] md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8B96]" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl saas-input text-xs text-[#0F3040] placeholder-[#8D8B96]"
            />
          </div>
        </div>

        {/* ========================================================
            3. TAB CONTENT ROUTING
            ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 bg-[#F5F3EF]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Action Hero Banner */}
              <div 
                className="relative rounded-2xl p-6 sm:p-7 bg-[#0F3040] text-white overflow-hidden shadow-xs"
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider">
                        Student Operations Desk
                      </span>
                      <span className="text-xs text-white/70 font-mono">Status: Connected to University Dispatch</span>
                    </div>
                    <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
                      Campus Infrastructure Incident Hub
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-2xl font-light">
                      Experiencing classroom AV failure, Wi-Fi connectivity degradation, or lab equipment malfunctions? File a work order directly to field dispatch.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide text-white bg-[#A56F63] hover:bg-[#8e5e54] shadow-xs transition-all active:scale-95 flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>REPORT NEW INCIDENT</span>
                  </button>
                </div>
              </div>

              {/* 4 Attractive Statistic Cards (Computed from actual incident data) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Incidents Reported */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs transition-all hover:border-[#A56F63]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider">
                      Total Reported
                    </span>
                    <div className="p-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#A56F63]">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-[#0F3040] font-heading tracking-tight">
                    {stats.total}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#464858]">
                    <span>Lifetime student tickets</span>
                    <span className="text-[#A56F63] font-semibold">Active</span>
                  </div>
                </div>

                {/* Open Incidents */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs transition-all hover:border-[#93651C]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider">
                      Open Incidents
                    </span>
                    <div className="p-2 rounded-xl bg-[#F8EBD2] border border-[#93651C]/30 text-[#93651C]">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-[#93651C] font-heading tracking-tight">
                    {stats.open}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#464858]">
                    <span>Awaiting triage queue</span>
                    <span className="text-[#93651C] font-semibold">{stats.statusDist.openPct}%</span>
                  </div>
                </div>

                {/* In Progress */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs transition-all hover:border-[#405C78]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider">
                      In Progress
                    </span>
                    <div className="p-2 rounded-xl bg-[#E5EAF0] border border-[#405C78]/30 text-[#405C78]">
                      <Wrench className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-[#405C78] font-heading tracking-tight">
                    {stats.inProgress}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#464858]">
                    <span>Field tech active on-site</span>
                    <span className="text-[#405C78] font-semibold">{stats.statusDist.inProgressPct}%</span>
                  </div>
                </div>

                {/* Resolved Incidents */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs transition-all hover:border-[#286448]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider">
                      Resolved Incidents
                    </span>
                    <div className="p-2 rounded-xl bg-[#DCEDE4] border border-[#286448]/30 text-[#286448]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-[#286448] font-heading tracking-tight">
                    {stats.resolved}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#464858]">
                    <span>Confirmed fixed & verified</span>
                    <span className="text-[#286448] font-semibold">{stats.statusDist.resolvedPct}%</span>
                  </div>
                </div>
              </div>

              {/* Middle Grid: Charts & Activity Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Status Distribution Donut Chart */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF] mb-4">
                      <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">Status Distribution</h3>
                      <span className="text-[10px] text-[#464858]">Calculated Live</span>
                    </div>

                    {stats.total === 0 ? (
                      <div className="py-10 text-center text-[#464858] text-xs">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-dashed border-[#E7E4DF] flex items-center justify-center text-[#8D8B96]">
                          0%
                        </div>
                        <p className="font-semibold text-[#0F3040]">No Incidents Recorded</p>
                        <p className="mt-1 text-[11px]">Report an incident to populate status metrics.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {/* Interactive SVG Donut */}
                        <div className="relative w-44 h-44 my-2">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Base Background Track */}
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E7E4DF" strokeWidth="12" />

                            {/* Open Slice */}
                            {stats.statusDist.openPct > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#405C78"
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
                                stroke="#93651C"
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
                                stroke="#286448"
                                strokeWidth="12"
                                strokeDasharray={`${(stats.statusDist.resolvedPct / 100) * 238.76} 238.76`}
                                strokeDashoffset={`-${((stats.statusDist.openPct + stats.statusDist.inProgressPct) / 100) * 238.76}`}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-[#0F3040] font-heading">{stats.total}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#464858]">Tickets</span>
                          </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="w-full mt-4 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#F5F3EF]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#405C78]" />
                              <span className="text-[#464858]">Open</span>
                            </div>
                            <span className="font-mono text-[#0F3040] font-bold">{stats.open} ({stats.statusDist.openPct}%)</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#F5F3EF]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#93651C]" />
                              <span className="text-[#464858]">In Progress</span>
                            </div>
                            <span className="font-mono text-[#0F3040] font-bold">{stats.inProgress} ({stats.statusDist.inProgressPct}%)</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#F5F3EF]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#286448]" />
                              <span className="text-[#464858]">Resolved</span>
                            </div>
                            <span className="font-mono text-[#0F3040] font-bold">{stats.resolved} ({stats.statusDist.resolvedPct}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Distribution Chart */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF] mb-4">
                      <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">Priority Distribution</h3>
                      <span className="text-[10px] text-[#464858]">Severity Breakdown</span>
                    </div>

                    {stats.total === 0 ? (
                      <div className="py-10 text-center text-[#464858] text-xs">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[#8D8B96]" />
                        <p className="font-semibold text-[#0F3040]">No Priority Data</p>
                        <p className="mt-1 text-[11px]">Telemetry will populate as incidents are filed.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 my-2">
                        {/* Critical */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#A33D35] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#A33D35]" /> Critical
                            </span>
                            <span className="font-mono text-[#0F3040]">{stats.priorityDist.critical} ({stats.priorityDist.criticalPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#A33D35] rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.criticalPct}%` }} />
                          </div>
                        </div>

                        {/* High */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#93651C] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#93651C]" /> High
                            </span>
                            <span className="font-mono text-[#0F3040]">{stats.priorityDist.high} ({stats.priorityDist.highPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#93651C] rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.highPct}%` }} />
                          </div>
                        </div>

                        {/* Medium */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#405C78] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#405C78]" /> Medium
                            </span>
                            <span className="font-mono text-[#0F3040]">{stats.priorityDist.medium} ({stats.priorityDist.mediumPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#405C78] rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.mediumPct}%` }} />
                          </div>
                        </div>

                        {/* Low */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#464858] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#464858]" /> Low
                            </span>
                            <span className="font-mono text-[#0F3040]">{stats.priorityDist.low} ({stats.priorityDist.lowPct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#464858] rounded-full transition-all duration-500" style={{ width: `${stats.priorityDist.lowPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF] mb-4">
                      <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">Activity Timeline</h3>
                      <Activity className="w-3.5 h-3.5 text-[#A56F63]" />
                    </div>

                    {timelineEvents.length === 0 ? (
                      <div className="py-10 text-center text-[#464858] text-xs">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-[#8D8B96]" />
                        <p className="font-semibold text-[#0F3040]">No Recent Activity</p>
                        <p className="mt-1 text-[11px]">Updates will appear as tickets progress.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timelineEvents.map((evt) => {
                          const EvtIcon = evt.icon;
                          return (
                            <div key={evt.id} className="flex items-start gap-3 text-xs">
                              <div className={`p-1.5 rounded-lg bg-[#F5F3EF] text-[#0F3040] border border-[#E7E4DF] flex-shrink-0 mt-0.5`}>
                                <EvtIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[#0F3040] font-medium truncate">{evt.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-[#464858] mt-0.5">
                                  <span className="font-mono text-[#A56F63] font-semibold">{evt.ticketNumber}</span>
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
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E4DF]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#A56F63]" />
                    <h3 className="text-base font-bold text-[#0F3040] font-heading">Recent Incidents</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F3EF] border border-[#E7E4DF] text-[#A56F63] font-bold">
                      {filteredTickets.length} Found
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-incidents')}
                      className="text-xs text-[#A56F63] hover:text-[#0F3040] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View All in My Incidents</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center text-[#464858] space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-center text-[#8D8B96] mb-2">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-[#0F3040]">No Incidents Found</p>
                    <p className="text-xs max-w-sm mx-auto text-[#464858]">
                      {searchQuery
                        ? `No reported issues matched your query "${searchQuery}".`
                        : 'You haven\'t submitted any campus infrastructure issues yet.'}
                    </p>
                    <div className="pt-2">
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E7E4DF] text-[#464858] text-xs font-semibold hover:text-[#0F3040]"
                        >
                          Clear Search Filter
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('report')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F3040] hover:bg-[#183E4C] transition-all active:scale-95 shadow-xs"
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
                        <tr className="border-b border-[#E7E4DF] text-[#464858] uppercase tracking-wider text-[11px] bg-[#F5F3EF]">
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
                      <tbody className="divide-y divide-[#E7E4DF]">
                        {filteredTickets.slice(0, 5).map((tkt) => (
                          <tr 
                            key={tkt.id}
                            onClick={() => {
                              setSelectedIncident(tkt);
                              setActiveTab('my-incidents');
                            }}
                            className="hover:bg-[#F5F3EF]/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#A56F63] whitespace-nowrap">
                              {tkt.ticket_number || `TKT-${tkt.id}`}
                            </td>
                            <td className="py-3 px-3 font-medium text-[#0F3040] max-w-[200px] truncate">
                              {tkt.title}
                            </td>
                            <td className="py-3 px-3 text-[#464858] whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-[#F5F3EF] border border-[#E7E4DF] text-[11px]">
                                {tkt.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#464858] whitespace-nowrap text-[11px]">
                              📍 {tkt.building} • {tkt.room}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tkt.priority === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35] border border-[#A33D35]/30' :
                                tkt.priority === 'High' ? 'bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30' :
                                tkt.priority === 'Medium' ? 'bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30' :
                                'bg-[#F5F3EF] text-[#464858] border border-[#E7E4DF]'
                              }`}>
                                {tkt.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tkt.status === 'In Progress' ? 'bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30' :
                                tkt.status === 'Resolved' || tkt.status === 'Closed' ? 'bg-[#DCEDE4] text-[#286448] border border-[#286448]/30' :
                                'bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30'
                              }`}>
                                {tkt.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#464858] whitespace-nowrap text-[11px]">
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
                                className="px-2.5 py-1 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] font-semibold text-[11px] transition-all"
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
              <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#A56F63]" />
                    <h2 className="text-xl font-bold text-[#0F3040] font-heading">Student Notification Feed</h2>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5DEDA] text-[#A33D35] font-bold text-xs">
                        {unreadNotificationsCount} New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-[#A56F63] hover:underline font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={openCenterModal}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-xs flex items-center gap-1.5"
                    >
                      <span>Notification Center</span>
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-[#464858]">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#464858]" />
                    <p className="text-xs font-semibold">No notifications in your feed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          if (notif.ticket_id) {
                            const target = tickets.find((t) => t.id === notif.ticket_id);
                            if (target) {
                              setSelectedIncident(target);
                              setActiveTab('my-incidents');
                            }
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          !notif.is_read 
                            ? 'bg-white border-l-4 border-l-[#A56F63] border-[#E7E4DF] shadow-xs'
                            : 'bg-white border-[#E7E4DF] hover:bg-[#F5F3EF]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#A56F63] shrink-0" />}
                              <h4 className="font-bold text-[#0F3040] text-xs">{notif.title}</h4>
                              {notif.ticket_number && (
                                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30">
                                  {notif.ticket_number}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-[#464858] leading-relaxed">{notif.message}</p>
                          </div>
                          <span className="text-[10px] text-[#464858] whitespace-nowrap shrink-0">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F3040] font-heading">Campus IT Help & Support</h2>
                  <p className="text-xs text-[#464858] mt-1">Student self-service guides and emergency technician dispatch</p>
                </div>

                {/* Service Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] space-y-2">
                    <Wifi className="w-5 h-5 text-[#286448]" />
                    <h4 className="text-sm font-bold text-[#0F3040]">eduroam Wi-Fi Guide</h4>
                    <p className="text-xs text-[#464858]">Connect your laptop and phone using your college email and campus password with 802.1X PEAP authentication.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] space-y-2">
                    <Printer className="w-5 h-5 text-[#A56F63]" />
                    <h4 className="text-sm font-bold text-[#0F3040]">Student Cloud Printing</h4>
                    <p className="text-xs text-[#464858]">Each student is allocated 200 free duplex prints per semester at library and residential hall kiosks.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] space-y-2">
                    <Monitor className="w-5 h-5 text-[#405C78]" />
                    <h4 className="text-sm font-bold text-[#0F3040]">Computer Lab Access</h4>
                    <p className="text-xs text-[#464858]">Computer Science labs 102 & 304 are open 24/7 with active university student ID badge swipe access.</p>
                  </div>
                </div>

                {/* Helpdesk Contact Info */}
                <div className="p-5 rounded-xl bg-[#0F3040] text-white text-xs space-y-2">
                  <h4 className="font-bold text-white text-sm">Need In-Person Support?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-white/90">
                    <div>📍 <strong>Location:</strong> CS Building, Room 101</div>
                    <div>📞 <strong>Telephone:</strong> (555) 019-4821</div>
                    <div>✉️ <strong>Email:</strong> helpdesk@campus.edu</div>
                  </div>
                  <p className="text-[11px] text-white/70 pt-1 border-t border-white/10 mt-2">
                    Walk-in desk hours: Monday – Friday: 8:00 AM – 8:00 PM • Saturday: 10:00 AM – 4:00 PM
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-[#E7E4DF]">
                  <div className="w-16 h-16 rounded-2xl bg-[#0F3040] text-white border border-[#E7E4DF] flex items-center justify-center text-2xl font-black shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F3040] font-heading">{user?.name || 'Campus Student'}</h2>
                    <p className="text-xs text-[#A56F63] font-mono">{user?.collegeId || 'STU-0000'}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30 uppercase tracking-wider">
                      Student Account • Reporter Access
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                    <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Campus Email</span>
                    <span className="text-sm font-semibold text-[#0F3040] mt-0.5 block">{user?.email}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                    <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Academic Department</span>
                    <span className="text-sm font-semibold text-[#0F3040] mt-0.5 block">{user?.department || 'Undergraduate Studies'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                    <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Session Security</span>
                    <span className="text-sm font-semibold text-[#286448] mt-0.5 block">256-Bit Encrypted JWT</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                    <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Campus Status</span>
                    <span className="text-sm font-semibold text-[#0F3040] mt-0.5 block">Active Enrolled Student</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={onOpenRoleTester}
                    className="px-4 py-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] border border-[#E7E4DF] text-xs font-semibold text-[#0F3040] transition-colors"
                  >
                    Test Role Privileges
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-[#F5DEDA] hover:bg-[#F5DEDA]/80 border border-[#A33D35]/30 text-xs font-semibold text-[#A33D35] transition-colors flex items-center gap-1.5"
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
