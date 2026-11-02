import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Inbox,
  Wrench,
  CheckCircle2,
  Bell,
  User as UserIcon,
  LogOut,
  Search,
  RefreshCw,
  Clock,
  AlertCircle,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  X,
  Menu,
  Send,
  Paperclip,
  ShieldAlert,
  MapPin,
  Tag,
  User2,
  Activity,
  Wifi,
  Monitor,
  Cpu,
  Zap,
  Tv,
  Server,
  Printer,
  HelpCircle,
  CheckCheck,
  Play,
  Eye,
  FileText,
  Copy,
  Lock,
  MessageSquare,
  History,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../notifications/NotificationBell';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const COLORS = {
  darkTeal: '#0F3040',
  slate: '#464858',
  terracotta: '#A56F63',
  roseGold: '#D99B7F',
};

// ─── Formatting Helpers ──────────────────────────────────────────────────────
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
    if (diffDays === 1) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

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

function getCategoryIcon(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('network') || c.includes('wi-fi') || c.includes('wifi')) return Wifi;
  if (c.includes('hardware')) return Monitor;
  if (c.includes('software')) return Cpu;
  if (c.includes('power') || c.includes('electrical')) return Zap;
  if (c.includes('class') || c.includes('project') || c.includes('equipment')) return Tv;
  if (c.includes('server')) return Server;
  if (c.includes('print')) return Printer;
  return HelpCircle;
}

const PRIORITY_CONFIG = {
  Critical: { color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40', dot: 'bg-red-400' },
  High: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40', dot: 'bg-amber-400' },
  Medium: { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-500/40', dot: 'bg-sky-400' },
  Low: { color: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/40', dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  Open: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  Assigned: { color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  'In Progress': { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  Resolved: { color: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  Closed: { color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
};

const PROGRESS_STEPS = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const SLA_HOURS = { Critical: 2, High: 4, Medium: 8, Low: 24 };

function calculateSLA(ticket) {
  if (!ticket?.created_at) return null;
  const hours = SLA_HOURS[ticket.priority] || 8;
  const created = new Date(ticket.created_at).getTime();
  const deadline = created + hours * 3600 * 1000;
  const now = Date.now();
  const diff = deadline - now;
  const isBreached = diff < 0;
  const hoursLeft = Math.abs(diff / 3600000);
  const pct = Math.max(0, Math.min(100, (diff / (hours * 3600 * 1000)) * 100));

  return {
    hours,
    isBreached,
    hoursLeft: hoursLeft.toFixed(1),
    pct,
  };
}

// ─── Small Presentation Components ───────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        active
          ? 'bg-[#1a222d] border-[#D99B7F]/60 shadow-lg scale-[1.02]'
          : 'bg-[#202733]/60 border-slate-300/15 hover:border-slate-300/35 hover:bg-[#202733]/90'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl bg-[#0F3040]/70 border border-slate-300/10 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`mt-2 text-2xl sm:text-3xl font-extrabold font-heading ${color}`}>{value}</div>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Sidebar Navigation Items ───────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assigned', label: 'Assigned Incidents', icon: ClipboardList },
  { id: 'available', label: 'Available Incidents', icon: Inbox },
  { id: 'in-progress', label: 'In Progress', icon: Wrench },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

export default function TechnicianDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    openCenterModal,
    activeIncidentToOpen,
    clearActiveIncident,
  } = useNotifications();

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tickets Data
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );
  const setSelectedTicket = useCallback((tkt) => {
    setSelectedTicketId(tkt ? tkt.id : null);
  }, []);

  // Sync opening incident from notification click
  useEffect(() => {
    if (activeIncidentToOpen?.ticketId) {
      setSelectedTicketId(activeIncidentToOpen.ticketId);
      clearActiveIncident();
    }
  }, [activeIncidentToOpen, clearActiveIncident]);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Workspace Actions & Notes
  const [noteText, setNoteText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeNoteTab, setActiveNoteTab] = useState('all'); // 'all' | 'internal' | 'comments'

  // Resolution Details Modal / Form
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionDetailsText, setResolutionDetailsText] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // File Upload State
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const fileInputRef = useRef(null);

  // Fullscreen Preview Modal & Feedback
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Fetch Tickets from API
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      // Technicians query with view=all to see both their assigned queue and unassigned campus tickets
      const res = await fetch('/api/tickets?view=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      } else {
        if (onNotify) onNotify('Unable to retrieve incidents from campus operations server', 'error');
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
      if (onNotify) onNotify('Network error connecting to CampusFix backend', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, onNotify]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Refresh Single Ticket Details
  const refreshSingleTicket = useCallback(async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.ticket;
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTicket(updated);
      }
    } catch {
      // silent refresh fallback
    }
  }, [token, setSelectedTicket]);

  // Accept / Claim Ticket Assignment
  const handleAcceptAssignment = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ technicianId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to claim incident');

      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
      if (selectedTicket && selectedTicket.id === data.ticket.id) {
        setSelectedTicket(data.ticket);
      }
      if (onNotify) onNotify(`Incident ${data.ticket.ticket_number} assigned to you`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  // Update Status Workflow
  const handleUpdateStatus = async (newStatus, customResolutionDetails = '') => {
    if (!selectedTicket) return;
    setIsSubmittingStatus(true);
    try {
      const payload = {
        status: newStatus,
      };
      if (customResolutionDetails.trim()) {
        payload.resolutionDetails = customResolutionDetails.trim();
      }

      const res = await fetch(`/api/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update ticket status');

      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
      setSelectedTicket(data.ticket);
      setShowResolutionModal(false);
      setResolutionDetailsText('');
      if (onNotify) onNotify(`Status updated to "${newStatus}"`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Add Note or Reporter Comment
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedTicket) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: noteText.trim(),
          isInternal: isInternalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add log note');

      const newNote = data.note;
      setSelectedTicket((prev) => ({
        ...prev,
        notes: [...(prev.notes || []), newNote],
      }));
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, notes: [...(t.notes || []), newNote] } : t
        )
      );
      setNoteText('');
      if (onNotify) {
        onNotify(
          isInternalNote ? 'Internal technician note recorded' : 'Reporter-visible comment posted',
          'success'
        );
      }
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Upload Evidence Attachments
  const handleSelectFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
            });
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((newItems) => {
      setPendingAttachments((prev) => [...prev, ...newItems]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadPendingEvidence = async () => {
    if (!pendingAttachments.length || !selectedTicket) return;
    setIsUploadingAttachments(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attachments: pendingAttachments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload attachments');

      setSelectedTicket(data.ticket);
      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
      setPendingAttachments([]);
      if (onNotify) onNotify(`${pendingAttachments.length} evidence attachment(s) uploaded`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleCopyTicketId = (num) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    if (onNotify) onNotify('Ticket ID copied to clipboard', 'info');
  };

  // ─── Derived Queues & Calculations ──────────────────────────────────────────
  const myAssignedTickets = useMemo(() => {
    return tickets.filter((t) => t.technician_id === user?.id);
  }, [tickets, user?.id]);

  const availableTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'Open' && !t.technician_id);
  }, [tickets]);

  // Five Overview Metrics required by specification:
  // - Assigned to Me
  // - New Assignments
  // - In Progress
  // - Resolved
  // - High / Critical Priority
  const overviewStats = useMemo(() => {
    const assignedToMe = myAssignedTickets.length;
    const newAssignments = myAssignedTickets.filter((t) => t.status === 'Assigned').length;
    const inProgress = myAssignedTickets.filter((t) => t.status === 'In Progress').length;
    const resolved = myAssignedTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
    const highCritical = myAssignedTickets.filter((t) => t.priority === 'High' || t.priority === 'Critical').length;

    return {
      assignedToMe,
      newAssignments,
      inProgress,
      resolved,
      highCritical,
    };
  }, [myAssignedTickets]);

  // Filter & Search Logic for Tables
  const filteredTickets = useMemo(() => {
    let result = [];

    // Filter by active navigation tab
    if (activeTab === 'overview') {
      result = [...myAssignedTickets];
    } else if (activeTab === 'assigned') {
      result = myAssignedTickets.filter((t) => t.status === 'Assigned');
    } else if (activeTab === 'available') {
      result = [...availableTickets];
    } else if (activeTab === 'in-progress') {
      result = myAssignedTickets.filter((t) => t.status === 'In Progress');
    } else if (activeTab === 'resolved') {
      result = myAssignedTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
    } else {
      result = [...myAssignedTickets];
    }

    // Search Query (ID, Title, Location, Reporter, Category)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const idMatch = (t.ticket_number || `INC-${t.id}`).toLowerCase().includes(q);
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const locMatch = `${t.building || ''} ${t.room || ''}`.toLowerCase().includes(q);
        const repMatch = (t.reporter_name || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        return idMatch || titleMatch || locMatch || repMatch || catMatch;
      });
    }

    // Status Filter (if not locked by tab)
    if (statusFilter !== 'all') {
      result = result.filter((t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => (t.priority || '').toLowerCase() === priorityFilter.toLowerCase());
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => (t.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'priority') {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [
    activeTab,
    myAssignedTickets,
    availableTickets,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // ─── Sidebar Component ───────────────────────────────────────────────────────
  const renderSidebar = () => (
    <aside className="flex flex-col h-full bg-[#0F3040]/95 border-r border-slate-300/10 w-64 shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-300/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})`,
            }}
          >
            <Wrench className="w-4 h-4 text-[#0F3040]" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white font-heading tracking-tight">CampusFix</span>
            <div className="text-[10px] text-[#D99B7F] font-bold uppercase tracking-wider">Field Technician</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id && !selectedTicket;
          let badge = null;
          if (id === 'assigned' && overviewStats.newAssignments > 0) badge = overviewStats.newAssignments;
          if (id === 'available' && availableTickets.length > 0) badge = availableTickets.length;
          if (id === 'in-progress' && overviewStats.inProgress > 0) badge = overviewStats.inProgress;
          if (id === 'notifications' && unreadCount > 0) badge = unreadCount;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setSelectedTicket(null);
                setCurrentPage(1);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#464858]/30'
              }`}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${COLORS.terracotta}33, ${COLORS.roseGold}22)`,
                      borderLeft: `3px solid ${COLORS.roseGold}`,
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D99B7F]' : 'text-slate-400'}`} />
                <span>{label}</span>
              </div>
              {badge !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-slate-300/10 space-y-2">
        <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
          >
            {(user?.name || 'T')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Technician'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.college_id || 'Campus IT'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  // ─── Table Component ────────────────────────────────────────────────────────
  const renderIncidentTable = (items, isAvailableQueue = false) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-12 rounded-2xl bg-[#1a222d]/60 border border-slate-300/15 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Incidents in this Queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all'
              ? 'No matching incidents found for the applied search and filter criteria.'
              : isAvailableQueue
              ? 'All campus incidents are currently assigned to field technicians.'
              : 'Your queue is clear. Check the Available Incidents tab to pick up unassigned reports.'}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-300/15 overflow-hidden bg-[#1a222d]/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0F3040]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-300/10">
                <th className="px-4 py-3 font-semibold">Incident ID</th>
                <th className="px-4 py-3 font-semibold">Issue Title</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Location</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Reporter</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden xl:table-cell">Reported Time</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/10">
              {items.map((tkt) => {
                const CategoryIcon = getCategoryIcon(tkt.category);
                const isOpen = tkt.status === 'Open' && !tkt.technician_id;

                return (
                  <tr
                    key={tkt.id}
                    onClick={() => setSelectedTicket(tkt)}
                    className="hover:bg-[#202733]/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-[#D99B7F] group-hover:underline">
                        {tkt.ticket_number || `INC-${tkt.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <span className="text-white font-medium line-clamp-1 group-hover:text-[#D99B7F] transition-colors">
                        {tkt.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CategoryIcon className="w-3.5 h-3.5 text-[#D99B7F] shrink-0" />
                        <span className="truncate">{tkt.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="text-slate-300 font-medium">{tkt.building || '—'}</div>
                      {tkt.room && <div className="text-[10px] text-slate-400">{tkt.room}</div>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-300">
                      <div>{tkt.reporter_name || 'Campus Reporter'}</div>
                      {tkt.reporter_college_id && (
                        <div className="text-[10px] text-slate-500 font-mono">{tkt.reporter_college_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={tkt.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tkt.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(tkt.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(tkt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 bg-[#202733]/80 hover:text-white hover:bg-[#464858]/60 border border-slate-300/20 transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>
                        {isOpen && (
                          <button
                            type="button"
                            onClick={() => handleAcceptAssignment(tkt.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0F3040] transition-all hover:brightness-105 active:scale-95 shadow flex items-center gap-1"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})`,
                            }}
                          >
                            <Play className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTickets.length > pageSize && (
          <div className="px-4 py-3 bg-[#0F3040]/80 border-t border-slate-300/10 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} incidents
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300/20 disabled:opacity-40 hover:text-white hover:bg-[#464858]/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300/20 disabled:opacity-40 hover:text-white hover:bg-[#464858]/50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Incident Workspace (Detailed Dossier) ──────────────────────────────────
  const renderIncidentWorkspace = () => {
    if (!selectedTicket) return null;
    const ticket = selectedTicket;
    const isAssignedToMe = ticket.technician_id === user?.id;
    const isUnassignedOpen = ticket.status === 'Open' && !ticket.technician_id;
    const isAssignedToOther = ticket.technician_id && ticket.technician_id !== user?.id;
    const currentStepIdx = PROGRESS_STEPS.indexOf(ticket.status);
    const sla = calculateSLA(ticket);
    const CategoryIcon = getCategoryIcon(ticket.category);

    // Filter notes based on activeNoteTab
    const filteredNotes = (ticket.notes || []).filter((n) => {
      if (activeNoteTab === 'internal') return n.is_internal === 1;
      if (activeNoteTab === 'comments') return !n.is_internal || n.is_internal === 0;
      return true;
    });

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#202733]/80 hover:text-white hover:bg-[#464858]/60 border border-slate-300/20 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Queue</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-mono font-bold text-xs text-[#D99B7F]">{ticket.ticket_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyTicketId(ticket.ticket_number)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-[#202733]/60 border border-slate-300/20 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
            </button>
            <button
              type="button"
              onClick={() => refreshSingleTicket(ticket.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
              title="Refresh incident data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security / Authorization Alert if ticket belongs to another technician */}
        {isAssignedToOther && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200">
              <strong className="text-amber-300 font-bold block">Assigned to Another Specialist</strong>
              This incident is currently assigned to <strong>{ticket.technician_name}</strong>. Per security policy,
              only the authorized technician or administrator can update the status or document technical work orders.
            </div>
          </div>
        )}

        {/* Main 2-Column Split: Left Dossier / Right Timeline & Reporter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── Left Column (Dossier, Status, Notes) ── */}
          <div className="lg:col-span-8 space-y-5">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}50, ${COLORS.roseGold}30)` }}
                  >
                    <CategoryIcon className="w-5 h-5 text-[#D99B7F]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-[#D99B7F]">{ticket.ticket_number}</span>
                    <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading mt-0.5 leading-snug">
                      {ticket.title}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Self Assign Action (if unassigned open) */}
                {isUnassignedOpen && (
                  <button
                    type="button"
                    onClick={() => handleAcceptAssignment(ticket.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0F3040] shadow-lg transition-all hover:brightness-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
                  >
                    <Play className="w-4 h-4" />
                    <span>Accept Assignment</span>
                  </button>
                )}
              </div>

              {/* Visual 5-Step Progress Tracker */}
              <div className="pt-3 border-t border-slate-300/10">
                <div className="flex items-center w-full gap-0">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center flex-1 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              isCurrent
                                ? 'border-[#D99B7F] bg-[#D99B7F]/20 text-[#D99B7F] scale-110 shadow-md'
                                : isDone
                                ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                                : 'border-slate-600 bg-[#1a222d] text-slate-600'
                            }`}
                          >
                            {isDone && !isCurrent ? <CheckCheck className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span
                            className={`mt-1.5 text-[10px] font-semibold text-center truncate w-full px-1 ${
                              isCurrent ? 'text-[#D99B7F]' : isDone ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                        {idx < PROGRESS_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${
                              idx < currentStepIdx ? 'bg-emerald-400/70' : 'bg-slate-700'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Transition Control (Only for assigned technician or unassigned self-assign) */}
            {(isAssignedToMe || isUnassignedOpen) && ticket.status !== 'Closed' && (
              <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-[#A56F63]/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#D99B7F]" />
                    <span>Advance Lifecycle Workflow</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Authorized Technician Actions</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {ticket.status !== 'Assigned' && (
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={() => handleUpdateStatus('Assigned')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#202733]/80 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Mark Assigned</span>
                    </button>
                  )}

                  {ticket.status !== 'In Progress' && (
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={() => handleUpdateStatus('In Progress')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#202733]/80 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Start Investigation (In Progress)</span>
                    </button>
                  )}

                  {ticket.status !== 'Resolved' && (
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={() => setShowResolutionModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0F3040] shadow-md transition-all flex items-center gap-1.5 active:scale-95 ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Set Resolution & Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full Issue Description */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Description</h3>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            {/* Resolution Details Box (if resolved or closed) */}
            {(ticket.resolution_details || ticket.status === 'Resolved' || ticket.status === 'Closed') && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Official Resolution Details
                    </h3>
                  </div>
                  {isAssignedToMe && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionDetailsText(ticket.resolution_details || '');
                        setShowResolutionModal(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold"
                    >
                      Edit Resolution
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono bg-[#0F3040]/80 p-3 rounded-xl border border-emerald-500/20">
                  {ticket.resolution_details ||
                    'Technician verified service restoration and completed testing. Ready for campus confirmation.'}
                </p>
              </div>
            )}

            {/* Supporting Evidence Gallery */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-[#D99B7F]" />
                  <span>Supporting Evidence & Diagnostic Uploads</span>
                </h3>
                {isAssignedToMe && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#D99B7F] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>+ Upload Evidence</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,.pdf,.txt,.log,.doc,.docx"
                  onChange={handleSelectFiles}
                  className="hidden"
                />
              </div>

              {/* Gallery of Existing Attachments */}
              {(!ticket.attachments || ticket.attachments.length === 0) && pendingAttachments.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">No evidence documents or photos attached yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Saved Attachments */}
                  {ticket.attachments?.map((att, idx) => {
                    const isImg = att.type?.startsWith('image/') || att.data?.startsWith('data:image/');
                    return isImg ? (
                      <button
                        key={`att-${idx}`}
                        type="button"
                        onClick={() => setFullscreenImage(att.data)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-slate-300/20 hover:border-[#D99B7F]/60 transition-all bg-[#202733]"
                      >
                        <img
                          src={att.data}
                          alt={att.name || 'Evidence'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div
                        key={`att-${idx}`}
                        className="p-3 rounded-xl border border-slate-300/20 bg-[#202733]/60 flex flex-col justify-between"
                      >
                        <FileText className="w-6 h-6 text-[#D99B7F] mb-1" />
                        <span className="text-[10px] text-slate-300 font-mono truncate">{att.name}</span>
                      </div>
                    );
                  })}

                  {/* Pending Staged Uploads */}
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={`pending-${idx}`}
                      className="relative p-2 rounded-xl border border-dashed border-[#D99B7F]/60 bg-[#D99B7F]/10 flex flex-col justify-between"
                    >
                      <span className="text-[9px] uppercase font-bold text-[#D99B7F]">Pending Upload</span>
                      <p className="text-[10px] text-slate-300 font-mono truncate">{att.name}</p>
                      <button
                        type="button"
                        onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500/80 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Pending Button */}
              {pendingAttachments.length > 0 && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isUploadingAttachments}
                    onClick={handleUploadPendingEvidence}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F3040] shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
                  >
                    {isUploadingAttachments ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5" />
                    )}
                    <span>Commit {pendingAttachments.length} Attachment(s)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Investigation Notes & Reporter-Visible Comments */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300/10 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D99B7F]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Investigation Log & Dialogue
                  </h3>
                </div>

                {/* Sub-tab filter: All / Internal Notes / Reporter Comments */}
                <div className="flex items-center gap-1 bg-[#202733]/80 p-1 rounded-xl border border-slate-300/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveNoteTab('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      activeNoteTab === 'all' ? 'bg-[#0F3040] text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({ticket.notes?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNoteTab('internal')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      activeNoteTab === 'internal'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Internal Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNoteTab('comments')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      activeNoteTab === 'comments'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reporter Facing
                  </button>
                </div>
              </div>

              {/* Feed of Notes */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No records matching the selected view filter.</p>
                  </div>
                ) : (
                  filteredNotes.map((note, idx) => {
                    const isInternal = note.is_internal === 1;
                    const isMe = note.author_id === user?.id;
                    const isTech = note.author_role === 'Technician' || note.author_role === 'Administrator';

                    return (
                      <div
                        key={note.id || idx}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                          isInternal
                            ? 'bg-amber-500/10 border-amber-500/30 text-slate-200'
                            : isTech
                            ? 'bg-[#0F3040]/80 border-[#A56F63]/25 text-slate-200'
                            : 'bg-[#202733]/60 border-slate-300/15 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isInternal ? 'bg-amber-400' : isTech ? 'bg-[#D99B7F]' : 'bg-slate-400'
                              }`}
                            />
                            <span className="font-bold text-white text-[11px]">{note.author_name || 'System'}</span>
                            {isMe && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D99B7F]/20 text-[#D99B7F] font-bold">
                                You
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                isTech
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {note.author_role}
                            </span>
                            {isInternal && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-[#0F3040]">
                                INTERNAL LOG
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatTimeAgo(note.created_at)}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] whitespace-pre-wrap">{note.note}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Note Form (Only allowed for assigned technician or unassigned ticket) */}
              {(isAssignedToMe || isUnassignedOpen) && (
                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-300/10">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-400 font-semibold">Post Investigation Log or Note:</label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-slate-500 bg-[#202733] text-amber-500 focus:ring-0"
                      />
                      <span className={`text-[11px] font-bold ${isInternalNote ? 'text-amber-300' : 'text-slate-400'}`}>
                        {isInternalNote ? '🔒 Internal Note (Hidden from Reporter)' : '📢 Public Comment (Visible to Reporter)'}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      placeholder={
                        isInternalNote
                          ? 'Document technical diagnostics, voltages, port traces, switch configs...'
                          : 'Write a progress update or inquiry for the campus reporter...'
                      }
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !noteText.trim()}
                      className="px-5 rounded-xl text-xs font-bold text-[#0F3040] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
                      style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
                    >
                      {isSubmittingNote ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ── Right Column (Reporter Info, Coordinates, SLA Tracker) ── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Reporter Information Card */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span>Reporter Identity</span>
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow"
                  style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
                >
                  {(ticket.reporter_name || 'R')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{ticket.reporter_name || 'Campus Member'}</p>
                  <p className="text-xs text-slate-400 truncate">{ticket.reporter_email || '—'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-300/10 space-y-1.5 text-xs">
                {ticket.reporter_college_id && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>College ID:</span>
                    <span className="font-mono text-white font-bold">{ticket.reporter_college_id}</span>
                  </div>
                )}
                {ticket.reporter_department && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Department:</span>
                    <span className="text-slate-200">{ticket.reporter_department}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campus Coordinates Card */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span>Campus Location Coordinates</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Building:</span>
                  <span className="text-white font-bold">{ticket.building || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Floor:</span>
                  <span className="text-slate-200">{ticket.floor || 'Ground Floor'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Room / Lab:</span>
                  <span className="text-white font-bold">{ticket.room || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Affected Service:</span>
                  <span className="text-[#D99B7F] font-semibold">{ticket.affected_service || 'Campus Network'}</span>
                </div>
              </div>
            </div>

            {/* SLA Severity Level & Target Card */}
            {sla && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <div
                className={`p-5 rounded-2xl border shadow space-y-3 ${
                  sla.isBreached
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-[#1a222d]/90 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${sla.isBreached ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className={sla.isBreached ? 'text-red-400' : 'text-amber-300'}>
                      {sla.isBreached ? 'SLA Target Exceeded' : 'SLA Target Window'}
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{sla.hours}h SLA</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sla.isBreached
                        ? 'bg-red-500'
                        : sla.pct > 50
                        ? 'bg-emerald-400'
                        : sla.pct > 20
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${sla.isBreached ? 100 : sla.pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Deadline:</span>
                  <span className={`font-bold ${sla.isBreached ? 'text-red-300' : 'text-amber-300'}`}>
                    {sla.isBreached
                      ? `Overdue by ${sla.hoursLeft} hours`
                      : `${sla.hoursLeft} hours remaining`}
                  </span>
                </div>
              </div>
            )}

            {/* Assigned Specialist Card */}
            <div className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span>Field Specialist</span>
              </h3>
              {ticket.technician_name ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-300">
                    {ticket.technician_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{ticket.technician_name}</p>
                    <p className="text-[10px] text-slate-400">{ticket.technician_email || 'Field Specialist'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Unassigned — Ready for pickup</span>
                </div>
              )}
            </div>

            {/* Audit / Timestamp Summary */}
            <div className="p-4 rounded-2xl bg-[#202733]/50 border border-slate-300/10 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Submitted:</span>
                <span className="text-slate-300">{formatFullDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-300">{formatTimeAgo(ticket.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Details Modal */}
        {showResolutionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-[#1a222d] border border-emerald-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-300/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-heading">
                    Document Incident Resolution
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResolutionModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Detail the technical solution, hardware replaced, port changes, firmware updates, or testing performed.
                This information will be presented to the student/faculty reporter for confirmation.
              </p>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Resolution Summary & Technical Solution *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Swapped damaged RJ45 patch cable in rack 2. Re-flashed access point firmware v4.2. Tested 100Mbps throughput continuously with 0% packet loss."
                  value={resolutionDetailsText}
                  onChange={(e) => setResolutionDetailsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/10">
                <button
                  type="button"
                  onClick={() => setShowResolutionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingStatus || !resolutionDetailsText.trim()}
                  onClick={() => handleUpdateStatus('Resolved', resolutionDetailsText)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0F3040] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                  style={{ background: `linear-gradient(135deg, #10b981, #34d399)` }}
                >
                  {isSubmittingStatus ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Commit Resolution</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Image Preview Modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Evidence Preview"
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  };

  // ─── Overview Dashboard Tab ─────────────────────────────────────────────────
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className="relative rounded-2xl p-6 sm:p-8 border border-amber-500/25 overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.98) 0%, rgba(165, 111, 99, 0.25) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                Field Operations Console
              </span>
              <span className="text-xs text-slate-400 font-mono">Specialist: {user?.name}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Technician Incident Workspace
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Manage work orders across campus facilities, document diagnostic telemetry, and resolve infrastructure issues.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTickets()}
              className="px-3.5 py-2 rounded-xl bg-[#202733]/80 hover:bg-[#202733] border border-slate-300/20 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D99B7F]' : ''}`} />
              <span>Refresh</span>
            </button>
            {onOpenRoleTester && (
              <button
                type="button"
                onClick={onOpenRoleTester}
                className="px-3.5 py-2 rounded-xl bg-[#464858]/50 hover:bg-[#464858] border border-amber-500/30 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Verify Roles</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Five Overview Cards required by prompt */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Assigned to Me"
          value={overviewStats.assignedToMe}
          icon={ClipboardList}
          color="text-[#D99B7F]"
          sub="Total assigned orders"
          onClick={() => setActiveTab('assigned')}
        />
        <StatCard
          label="New Assignments"
          value={overviewStats.newAssignments}
          icon={Inbox}
          color="text-blue-300"
          sub="Awaiting triage pickup"
          onClick={() => setActiveTab('assigned')}
        />
        <StatCard
          label="In Progress"
          value={overviewStats.inProgress}
          icon={Wrench}
          color="text-sky-300"
          sub="Active troubleshooting"
          onClick={() => setActiveTab('in-progress')}
        />
        <StatCard
          label="Resolved"
          value={overviewStats.resolved}
          icon={CheckCircle2}
          color="text-emerald-400"
          sub="Completed repairs"
          onClick={() => setActiveTab('resolved')}
        />
        <StatCard
          label="High / Critical"
          value={overviewStats.highCritical}
          icon={AlertTriangle}
          color="text-red-400"
          sub="Urgent SLA incidents"
          onClick={() => {
            setActiveTab('assigned');
            setPriorityFilter('High');
          }}
        />
      </div>

      {/* Recent Assigned Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#D99B7F]" />
            <h2 className="text-sm font-bold text-white font-heading">My Active Incidents</h2>
            <span className="text-xs text-slate-400 font-mono">({myAssignedTickets.length})</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className="text-xs text-slate-400 hover:text-[#D99B7F] transition-colors flex items-center gap-1"
          >
            <span>View Full Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {renderIncidentTable(myAssignedTickets.slice(0, 5))}
      </div>

      {/* Available for Assignment Queue Preview */}
      {availableTickets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-300" />
              <h2 className="text-sm font-bold text-white font-heading">Unassigned Incidents Available</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                {availableTickets.length} Open
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className="text-xs text-slate-400 hover:text-[#D99B7F] transition-colors flex items-center gap-1"
            >
              <span>View All Available</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderIncidentTable(availableTickets.slice(0, 3), true)}
        </div>
      )}
    </div>
  );

  // ─── Filter & Search Header Component ───────────────────────────────────────
  const renderFilterBar = (title) => (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({filteredTickets.length})</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D99B7F]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showFilters
                ? 'bg-[#D99B7F]/20 text-[#D99B7F] border-[#D99B7F]/40'
                : 'bg-[#202733]/60 text-slate-400 border-slate-300/20 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by incident ID, title, building, room, or reporter name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Filter Drawer */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="all">All Lifecycle Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="all">All Categories</option>
              <option value="Network / Wi-Fi">Network / Wi-Fi</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Power">Power</option>
              <option value="Classroom Equipment">Classroom Equipment</option>
              <option value="Server">Server</option>
              <option value="Printer">Printer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Sorting</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Notifications View ─────────────────────────────────────────────────────
  const renderNotificationsTab = () => {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D99B7F]" />
              <span>Technician Work Orders & Dispatch Feed</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live notifications for assignments, priority updates, reporter notes, and critical alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#202733] border border-[#D99B7F]/40 text-[#D99B7F] hover:text-white flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              type="button"
              onClick={openCenterModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F3040] shadow flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #A56F63, #D99B7F)' }}
            >
              <span>Notification Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#1a222d]/60 border border-slate-300/15 text-center">
            <Bell className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No notifications in your feed</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                  if (notif.ticket_id) {
                    setSelectedTicketId(notif.ticket_id);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group ${
                  !notif.is_read
                    ? 'bg-[#1a222d] border-[#D99B7F]/40 shadow-lg'
                    : 'bg-[#151c26]/70 border-slate-300/15 hover:border-slate-300/35'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    notif.priority === 'critical'
                      ? 'bg-red-400'
                      : notif.priority === 'high'
                      ? 'bg-amber-400'
                      : 'bg-[#D99B7F]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notif.ticket_number && (
                        <span className="font-mono text-xs font-bold text-[#D99B7F] group-hover:underline">
                          {notif.ticket_number}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3040] text-purple-300 border border-purple-500/30">
                        {notif.event_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">{notif.title}</p>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors self-center" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Profile Tab ────────────────────────────────────────────────────────────
  const renderProfileTab = () => (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-lg font-extrabold text-white font-heading">Specialist Profile</h2>
      <div className="p-6 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow-xl space-y-5">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
          >
            {(user?.name || 'T')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading">{user?.name || 'Technician Specialist'}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Wrench className="w-3 h-3" /> Field Technician Specialist
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-300/15">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Staff ID</span>
            <p className="font-mono text-sm font-bold text-white mt-0.5">{user?.college_id || 'CAMPUS-TECH'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-300/15">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Department</span>
            <p className="text-sm font-bold text-white mt-0.5">{user?.department || 'Campus IT Operations'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-300/15">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Active Assigned</span>
            <p className="text-sm font-bold text-[#D99B7F] mt-0.5">{overviewStats.assignedToMe}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-300/15">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Resolved Repairs</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">{overviewStats.resolved}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Technician Console</span>
        </button>
      </div>
    </div>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────
  const tabTitles = {
    overview: 'Operations Overview',
    assigned: 'Assigned Work Orders',
    available: 'Available Incidents for Triage',
    'in-progress': 'Active In-Progress Work',
    resolved: 'Resolved Incidents Log',
    notifications: 'Notifications',
    profile: 'Specialist Profile',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a131a] text-slate-100">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex">
        {renderSidebar()}
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64" onClick={(e) => e.stopPropagation()}>
            {renderSidebar()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-300/10 bg-[#0F3040]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#464858]/50"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">CampusFix · Field Operations</p>
              <h2 className="text-sm font-bold text-white">
                {selectedTicket ? `Incident Workspace: ${selectedTicket.ticket_number}` : tabTitles[activeTab]}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Top Navigation Notification Bell */}
            <NotificationBell onNavigateToIncident={(id) => setSelectedTicketId(id)} />

            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setSelectedTicket(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202733]/70 border border-slate-300/20 hover:border-slate-300/40 transition-all"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
              >
                {(user?.name || 'T')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedTicket ? (
            renderIncidentWorkspace()
          ) : activeTab === 'overview' ? (
            renderOverviewTab()
          ) : activeTab === 'notifications' ? (
            renderNotificationsTab()
          ) : activeTab === 'profile' ? (
            renderProfileTab()
          ) : (
            <div className="space-y-4">
              {renderFilterBar(tabTitles[activeTab])}
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-3 text-[#D99B7F]" />
                  <span>Loading incident data...</span>
                </div>
              ) : (
                renderIncidentTable(paginatedTickets, activeTab === 'available')
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
