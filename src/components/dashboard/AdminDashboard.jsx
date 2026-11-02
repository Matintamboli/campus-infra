import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wrench,
  Layers,
  MapPin,
  ClipboardList,
  BarChart3,
  History,
  Settings,
  LogOut,
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  Eye,
  Trash2,
  Plus,
  Edit2,
  Server,
  ShieldAlert,
  RotateCcw,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

const PRIORITY_STYLES = {
  Critical: { color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40', dot: 'bg-red-400' },
  High: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40', dot: 'bg-amber-400' },
  Medium: { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-500/40', dot: 'bg-sky-400' },
  Low: { color: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/40', dot: 'bg-slate-400' },
};

const STATUS_STYLES = {
  Open: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  Assigned: { color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  'In Progress': { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  Resolved: { color: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  Closed: { color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.Open;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

// ─── Sidebar Navigation Definition ───────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'all-incidents', label: 'All Incidents', icon: ClipboardList },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'technicians', label: 'Technician Management', icon: Wrench },
  { id: 'services', label: 'Service Management', icon: Server },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'locations', label: 'Locations & Campus', icon: MapPin },
  { id: 'assignments', label: 'Assignments', icon: UserCheck },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'audit-logs', label: 'System Activity', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token, logout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data States
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Selected Detail Views / Modals
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedTicketId) || null, [tickets, selectedTicketId]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Interactive Management Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [ticketToAssign, setTicketToAssign] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [ticketToReprioritize, setTicketToReprioritize] = useState(null);
  const [newPriority, setNewPriority] = useState('Medium');

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '', email: '', college_id: '', password: '', role: 'Technician', user_type: 'IT Staff', department: 'Campus Operations',
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({ name: '', category: 'Network Infrastructure', sla_hours: 4, description: '', status: 'active' });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', code: '', sla_hours: 4, description: '', status: 'active' });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationFormData, setLocationFormData] = useState({ building: '', floor: 'Ground Floor', room: '', status: 'active' });

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        overviewRes,
        ticketsRes,
        usersRes,
        techsRes,
        servicesRes,
        categoriesRes,
        locationsRes,
        logsRes,
      ] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/tickets?view=all', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/technicians', { headers }),
        fetch('/api/admin/services', { headers }),
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/locations', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
      ]);

      if (overviewRes.ok) {
        const d = await overviewRes.json();
        setOverviewMetrics(d.metrics);
      }
      if (ticketsRes.ok) {
        const d = await ticketsRes.json();
        setTickets(d.tickets || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsersList(d.users || []);
      }
      if (techsRes.ok) {
        const d = await techsRes.json();
        setTechnicians(d.technicians || []);
      }
      if (servicesRes.ok) {
        const d = await servicesRes.json();
        setServices(d.services || []);
      }
      if (categoriesRes.ok) {
        const d = await categoriesRes.json();
        setCategories(d.categories || []);
      }
      if (locationsRes.ok) {
        const d = await locationsRes.json();
        setLocations(d.locations || []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setAuditLogs(d.logs || []);
      }
    } catch (err) {
      console.error('[Admin Dashboard Fetch Error]:', err);
      if (onNotify) onNotify('Failed to synchronize administrative dataset', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, onNotify]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ─── User Management Actions ────────────────────────────────────────────────
  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    setActionLoadingId(`role-${targetUser.id}`);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');

      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
      fetchAllData();
      if (onNotify) onNotify(`Promoted ${targetUser.name} to ${newRole}`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setActionLoadingId(`status-${targetUser.id}`);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle status');

      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u)));
      fetchAllData();
      if (onNotify) onNotify(`Account for ${targetUser.name} is now ${nextStatus}`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');

      setShowCreateUserModal(false);
      setNewUserData({ name: '', email: '', college_id: '', password: '', role: 'Technician', user_type: 'IT Staff', department: 'Campus Operations' });
      fetchAllData();
      if (onNotify) onNotify(`Account for ${data.user.name} provisioned successfully`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  // ─── Incident Actions ───────────────────────────────────────────────────────
  const handleAssignIncident = async () => {
    if (!ticketToAssign || !selectedTechId) return;
    try {
      const res = await fetch(`/api/tickets/${ticketToAssign.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ technicianId: selectedTechId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Assignment failed');

      setShowAssignModal(false);
      setTicketToAssign(null);
      setSelectedTechId('');
      fetchAllData();
      if (onNotify) onNotify(`Ticket ${data.ticket.ticket_number} dispatched to technician`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleOverridePriority = async () => {
    if (!ticketToReprioritize) return;
    try {
      const res = await fetch(`/api/admin/tickets/${ticketToReprioritize.id}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Priority update failed');

      setShowPriorityModal(false);
      setTicketToReprioritize(null);
      fetchAllData();
      if (onNotify) onNotify(`Priority updated to ${newPriority}`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, nextStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, note: `Administrator status override to ${nextStatus}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');

      fetchAllData();
      if (onNotify) onNotify(`Status set to ${nextStatus}`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleDeleteTicket = async (ticket) => {
    if (!window.confirm(`Are you sure you want to permanently delete incident ${ticket.ticket_number}? This action is irreversible and recorded in the audit log.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete ticket');

      if (selectedTicketId === ticket.id) setSelectedTicketId(null);
      fetchAllData();
      if (onNotify) onNotify(`Incident ${ticket.ticket_number} deleted`, 'info');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  // ─── Services CRUD Actions ──────────────────────────────────────────────────
  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(serviceFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save service');

      setShowServiceModal(false);
      setEditingService(null);
      setServiceFormData({ name: '', category: 'Network Infrastructure', sla_hours: 4, description: '', status: 'active' });
      fetchAllData();
      if (onNotify) onNotify('Campus service updated successfully', 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Remove this service from institutional listings?')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAllData();
        if (onNotify) onNotify('Service deleted', 'info');
      }
    } catch {
      if (onNotify) onNotify('Failed to delete service', 'error');
    }
  };

  // ─── Categories CRUD Actions ────────────────────────────────────────────────
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(categoryFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save category');

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', code: '', sla_hours: 4, description: '', status: 'active' });
      fetchAllData();
      if (onNotify) onNotify('Category classification saved', 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category? Ensure no active tickets require this classification.')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAllData();
        if (onNotify) onNotify('Category removed', 'info');
      }
    } catch {
      if (onNotify) onNotify('Failed to delete category', 'error');
    }
  };

  // ─── Locations CRUD Actions ─────────────────────────────────────────────────
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    try {
      const url = editingLocation ? `/api/admin/locations/${editingLocation.id}` : '/api/admin/locations';
      const method = editingLocation ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(locationFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save location');

      setShowLocationModal(false);
      setEditingLocation(null);
      setLocationFormData({ building: '', floor: 'Ground Floor', room: '', status: 'active' });
      fetchAllData();
      if (onNotify) onNotify('Location coordinates saved', 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Delete this facility coordinate record?')) return;
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAllData();
        if (onNotify) onNotify('Location removed', 'info');
      }
    } catch {
      if (onNotify) onNotify('Failed to delete location', 'error');
    }
  };

  // ─── Filtered Datasets ──────────────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.ticket_number || '').toLowerCase().includes(q) ||
          (t.title || '').toLowerCase().includes(q) ||
          (t.building || '').toLowerCase().includes(q) ||
          (t.room || '').toLowerCase().includes(q) ||
          (t.reporter_name || '').toLowerCase().includes(q) ||
          (t.technician_name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (priorityFilter !== 'all') {
      result = result.filter((t) => (t.priority || '').toLowerCase() === priorityFilter.toLowerCase());
    }
    if (categoryFilter !== 'all') {
      result = result.filter((t) => (t.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    return result;
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage]);

  const filteredUsers = useMemo(() => {
    let result = [...usersList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.college_id || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q)
      );
    }
    if (userRoleFilter !== 'all') {
      result = result.filter((u) => u.role === userRoleFilter);
    }
    return result;
  }, [usersList, searchQuery, userRoleFilter]);

  const filteredLogs = useMemo(() => {
    let result = [...auditLogs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.action || '').toLowerCase().includes(q) ||
          (l.details || '').toLowerCase().includes(q) ||
          (l.user_name || '').toLowerCase().includes(q) ||
          (l.user_email || '').toLowerCase().includes(q)
      );
    }
    if (auditActionFilter !== 'all') {
      result = result.filter((l) => l.action === auditActionFilter);
    }
    return result;
  }, [auditLogs, searchQuery, auditActionFilter]);

  // ─── Sidebar Render ─────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <aside className="flex flex-col h-full bg-[#0F3040]/95 border-r border-slate-300/10 w-64 shrink-0 select-none">
      <div className="px-5 py-5 border-b border-slate-300/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white font-heading tracking-tight">CampusFix</span>
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Enterprise Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id && !selectedTicketId;
          let badge = null;
          if (id === 'all-incidents') badge = overviewMetrics?.openIncidents || null;
          if (id === 'technicians') badge = technicians.length || null;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setSelectedTicketId(null);
                setSelectedUser(null);
                setCurrentPage(1);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#464858]/30'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.15))',
                      borderLeft: '3px solid #a855f7',
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{label}</span>
              </div>
              {badge !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-300/10 space-y-2">
        <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center font-bold text-xs text-purple-200">
            {(user?.name || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Director Drake'}</p>
            <p className="text-[10px] text-purple-300 font-mono truncate">{user?.college_id || 'ADM-0001'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Administrative Console</span>
        </button>
      </div>
    </aside>
  );

  // ─── View 1: Administrator Overview ─────────────────────────────────────────
  const renderOverviewTab = () => {
    const metrics = overviewMetrics || {
      totalIncidents: tickets.length,
      openIncidents: tickets.filter((t) => t.status === 'Open').length,
      criticalIncidents: tickets.filter((t) => t.priority === 'Critical').length,
      assignedIncidents: tickets.filter((t) => t.status === 'Assigned').length,
      resolvedIncidents: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
      avgResponseTime: '1.2h',
      avgResolutionTime: '3.8h',
      recurringIssues: [],
    };

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div
          className="relative rounded-2xl p-6 sm:p-8 border border-purple-500/30 overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.98) 0%, rgba(99, 102, 241, 0.25) 100%)',
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-widest">
                  Command & Governance Center
                </span>
                <span className="text-xs text-slate-400 font-mono">Executive: {user?.name}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Campus Infrastructure Executive Console
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
                Monitor institutional incident resolution velocities, allocate field technicians, govern SLA categories, and audit platform security actions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAllData}
                className="px-3.5 py-2 rounded-xl bg-[#202733]/80 hover:bg-[#202733] border border-slate-300/20 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
                <span>Synchronize</span>
              </button>
              {onOpenRoleTester && (
                <button
                  type="button"
                  onClick={onOpenRoleTester}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Verify RBAC</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 8 Metric Cards specified in requirements */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-slate-300/15">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Incidents</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-heading">{metrics.totalIncidents}</div>
            <p className="mt-1 text-[11px] text-slate-500">All registered tickets</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Open Incidents</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-300 font-heading">{metrics.openIncidents}</div>
            <p className="mt-1 text-[11px] text-slate-500">Unassigned / awaiting triage</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-red-500/20">
            <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Critical Incidents</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-red-300 font-heading">{metrics.criticalIncidents}</div>
            <p className="mt-1 text-[11px] text-slate-500">Urgent SLA dispatch required</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-blue-500/20">
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Assigned Incidents</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-blue-300 font-heading">{metrics.assignedIncidents}</div>
            <p className="mt-1 text-[11px] text-slate-500">Dispatched to specialists</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Resolved Incidents</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-300 font-heading">{metrics.resolvedIncidents}</div>
            <p className="mt-1 text-[11px] text-slate-500">Completed repair orders</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-slate-300/15">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Response Time</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-purple-300 font-heading">{metrics.avgResponseTime}</div>
            <p className="mt-1 text-[11px] text-slate-500">Time to first dispatch action</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-slate-300/15">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Resolution Time</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#D99B7F] font-heading">{metrics.avgResolutionTime}</div>
            <p className="mt-1 text-[11px] text-slate-500">Lifecycle completion speed</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-slate-300/15">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Technicians</span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-heading">{technicians.length}</div>
            <p className="mt-1 text-[11px] text-slate-500">Field workforce available</p>
          </div>
        </div>

        {/* 2-Column Split: Recurring Issues & Incident Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recurring Issues */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 shadow space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recurring Campus Infrastructure Issues
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Location Clusters</span>
            </div>

            {(!metrics.recurringIssues || metrics.recurringIssues.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recurring incident hot-spots detected yet.</p>
            ) : (
              <div className="space-y-2">
                {metrics.recurringIssues.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{item.building}</p>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.incident_count} Incidents
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown & Technician Availability */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 shadow space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Workload by Category Classification
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">SLA Breakdown</span>
            </div>

            <div className="space-y-2.5">
              {categories.slice(0, 5).map((cat) => {
                const count = tickets.filter((t) => (t.category || '').toLowerCase() === cat.name.toLowerCase()).length;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{cat.name}</span>
                      <span className="text-purple-300 font-mono font-bold">{count} tickets ({cat.sla_hours || 4}h SLA)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                        style={{ width: `${Math.min(100, (count / Math.max(1, tickets.length)) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Triage Incident Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Campus Incidents Needing Attention
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('all-incidents')}
              className="text-xs text-purple-300 hover:underline flex items-center gap-1"
            >
              <span>View All ({tickets.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderIncidentsTable(tickets.slice(0, 5))}
        </div>
      </div>
    );
  };

  // ─── View 2: All Incidents (Management & Dispatch) ─────────────────────────
  const renderIncidentsTable = (items = paginatedTickets) => (
    <div className="rounded-2xl border border-slate-300/15 overflow-hidden bg-[#1a222d]/70 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0F3040]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-300/10">
              <th className="px-4 py-3 font-semibold">Incident ID</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">Location</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">Assigned Tech</th>
              <th className="px-4 py-3 font-semibold hidden xl:table-cell">Reported Date</th>
              <th className="px-4 py-3 font-semibold text-center">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/10">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No incidents found matching current filters.</p>
                </td>
              </tr>
            ) : (
              items.map((tkt) => (
                <tr key={tkt.id} className="hover:bg-[#202733]/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#D99B7F]">
                    {tkt.ticket_number || `INC-${tkt.id}`}
                  </td>
                  <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">
                    {tkt.title}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-300">
                    {tkt.category}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-300">
                    <div>{tkt.building}</div>
                    <div className="text-[10px] text-slate-500">{tkt.room}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketToReprioritize(tkt);
                        setNewPriority(tkt.priority);
                        setShowPriorityModal(true);
                      }}
                      className="hover:opacity-80 transition-opacity"
                      title="Click to override priority"
                    >
                      <PriorityBadge priority={tkt.priority} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tkt.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {tkt.technician_name ? (
                      <span className="text-slate-200 font-semibold">{tkt.technician_name}</span>
                    ) : (
                      <span className="text-amber-400/80 font-bold text-[11px] italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-slate-400">
                    <span title={formatFullDate(tkt.created_at)}>{formatTimeAgo(tkt.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(tkt.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-[#202733] border border-slate-300/20"
                        title="Open incident dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTicketToAssign(tkt);
                          setSelectedTechId(tkt.technician_id || '');
                          setShowAssignModal(true);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                        title="Assign or reassign technician"
                      >
                        {tkt.technician_id ? 'Reassign' : 'Assign'}
                      </button>
                      {tkt.status === 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(tkt.id, 'Closed')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                          title="Confirm and close"
                        >
                          Close
                        </button>
                      )}
                      {(tkt.status === 'Resolved' || tkt.status === 'Closed') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(tkt.id, 'Open')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                          title="Reopen incident"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(tkt)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                        title="Delete incident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {filteredTickets.length > pageSize && (
        <div className="px-4 py-3 bg-[#0F3040]/80 border-t border-slate-300/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} incidents
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-slate-300/20 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-white">{currentPage} / {Math.ceil(filteredTickets.length / pageSize)}</span>
            <button
              type="button"
              disabled={currentPage === Math.ceil(filteredTickets.length / pageSize)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded-lg border border-slate-300/20 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAllIncidentsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <span>All Campus Infrastructure Incidents</span>
            <span className="text-xs text-slate-400 font-mono">({filteredTickets.length} / {tickets.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full operational view of reported issues across buildings, departments, and services with administrative override actions.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-3.5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, building, room, reporter, or technician..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-xs placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040] flex-1 sm:flex-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040] flex-1 sm:flex-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040] flex-1 sm:flex-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#202733] border border-slate-300/20"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Incident Table */}
      {renderIncidentsTable(paginatedTickets)}
    </div>
  );

  // ─── View: Assignments & Dispatch Matrix ────────────────────────────────────
  const renderAssignmentsTab = () => {
    const unassignedTickets = tickets.filter((t) => !t.technician_id || t.status === 'Open');
    const assignedTickets = tickets.filter((t) => t.technician_id && t.status !== 'Resolved' && t.status !== 'Closed');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span>Incident Assignments & Dispatch Governance</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Allocate unassigned incident work orders to qualified field technicians based on real-time availability and domain expertise.
          </p>
        </div>

        {/* Technician Workload Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicians.map((tech) => {
            const activeCount = tech.activeTasks || 0;
            const isHeavy = activeCount >= 4;
            return (
              <div key={tech.id} className="p-4 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                      {tech.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{tech.name}</h4>
                      <p className="text-[10px] text-slate-400">{tech.department || 'Field Ops'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isHeavy
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isHeavy ? 'High Load' : 'Available'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-300/10">
                  <span className="text-slate-400">Active Work Orders:</span>
                  <span className="font-mono font-bold text-purple-300">{activeCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unassigned Incidents Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Unassigned Incidents Awaiting Technician Allocation ({unassignedTickets.length})
              </h3>
            </div>
          </div>
          {renderIncidentsTable(unassignedTickets)}
        </div>

        {/* Active In-Progress Assignments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Assignments in Field ({assignedTickets.length})
              </h3>
            </div>
          </div>
          {renderIncidentsTable(assignedTickets)}
        </div>
      </div>
    );
  };

  // ─── View: Reports & Analytics ──────────────────────────────────────────────
  const renderReportsTab = () => {
    const metrics = overviewMetrics || {
      totalIncidents: tickets.length,
      openIncidents: tickets.filter((t) => t.status === 'Open').length,
      criticalIncidents: tickets.filter((t) => t.priority === 'Critical').length,
      assignedIncidents: tickets.filter((t) => t.status === 'Assigned').length,
      resolvedIncidents: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
      avgResponseTime: '1.2h',
      avgResolutionTime: '3.8h',
      recurringIssues: [],
    };

    const statusCounts = {
      Open: tickets.filter((t) => t.status === 'Open').length,
      Assigned: tickets.filter((t) => t.status === 'Assigned').length,
      'In Progress': tickets.filter((t) => t.status === 'In Progress').length,
      Resolved: tickets.filter((t) => t.status === 'Resolved').length,
      Closed: tickets.filter((t) => t.status === 'Closed').length,
    };

    const priorityCounts = {
      Critical: tickets.filter((t) => t.priority === 'Critical').length,
      High: tickets.filter((t) => t.priority === 'High').length,
      Medium: tickets.filter((t) => t.priority === 'Medium').length,
      Low: tickets.filter((t) => t.priority === 'Low').length,
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span>Infrastructure Health & Operations Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key SLA performance indicators, resolution velocity analytics, and institutional infrastructure recurring patterns.
          </p>
        </div>

        {/* 6 Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-slate-300/15">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Logged</span>
            <div className="mt-1 text-2xl font-extrabold text-white font-heading">{metrics.totalIncidents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 uppercase font-bold">Awaiting Action</span>
            <div className="mt-1 text-2xl font-extrabold text-amber-300 font-heading">{metrics.openIncidents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-red-500/20">
            <span className="text-[10px] text-red-400 uppercase font-bold">Urgent Critical</span>
            <div className="mt-1 text-2xl font-extrabold text-red-300 font-heading">{metrics.criticalIncidents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Resolved Total</span>
            <div className="mt-1 text-2xl font-extrabold text-emerald-300 font-heading">{metrics.resolvedIncidents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 uppercase font-bold">Avg Response</span>
            <div className="mt-1 text-2xl font-extrabold text-purple-300 font-heading">{metrics.avgResponseTime}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#202733]/70 border border-[#D99B7F]/20">
            <span className="text-[10px] text-[#D99B7F] uppercase font-bold">Avg Resolution</span>
            <div className="mt-1 text-2xl font-extrabold text-[#D99B7F] font-heading">{metrics.avgResolutionTime}</div>
          </div>
        </div>

        {/* Priority and Status breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-300/10">
              Severity / Priority Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(priorityCounts).map(([p, count]) => {
                const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                return (
                  <div key={p} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{p}</span>
                      <span className="text-slate-400 font-mono">{count} tickets ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p === 'Critical' ? 'bg-red-500' : p === 'High' ? 'bg-amber-500' : p === 'Medium' ? 'bg-sky-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-300/10">
              Lifecycle Status Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([st, count]) => {
                const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{st}</span>
                      <span className="text-slate-400 font-mono">{count} tickets ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── View 3: User Management ────────────────────────────────────────────────
  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Campus Member Directory & Role Provisioning</span>
            <span className="text-xs text-slate-400 font-mono">({filteredUsers.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage user accounts, assign technician or administrator privileges, and toggle account activation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateUserModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Provision User / Tech</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, campus ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-xs placeholder-slate-400"
          />
        </div>

        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040] w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="Reporter">Reporter (Student/Faculty)</option>
          <option value="Technician">Technician</option>
          <option value="Administrator">Administrator</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-300/15 overflow-hidden bg-[#1a222d]/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0F3040]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-300/10">
                <th className="px-4 py-3 font-semibold">User Profile</th>
                <th className="px-4 py-3 font-semibold">Campus ID</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Type & Dept</th>
                <th className="px-4 py-3 font-semibold">Role Designation</th>
                <th className="px-4 py-3 font-semibold">Account Status</th>
                <th className="px-4 py-3 font-semibold text-center">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/10">
              {filteredUsers.map((u) => {
                const isSelf = u.id === user?.id;
                const isRoleLoading = actionLoadingId === `role-${u.id}`;
                const isStatusLoading = actionLoadingId === `status-${u.id}`;

                return (
                  <tr key={u.id} className="hover:bg-[#202733]/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300 font-bold">
                      {u.college_id}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell text-slate-300">
                      <div>{u.user_type}</div>
                      <div className="text-[10px] text-slate-500">{u.department || 'General'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isRoleLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#0F3040] text-purple-200 border border-purple-500/30 focus:border-purple-400"
                          >
                            <option value="Reporter">Reporter</option>
                            <option value="Technician">Technician</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-300 bg-[#202733] border border-slate-300/20 hover:text-white"
                        >
                          Profile
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            disabled={isStatusLoading}
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              u.status === 'active'
                                ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {isStatusLoading ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : u.status === 'active' ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
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
      </div>
    </div>
  );

  // ─── View 4: Technician Management ──────────────────────────────────────────
  const renderTechniciansTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Field Technician Workforce & Workload Dispatch</span>
            <span className="text-xs text-slate-400 font-mono">({technicians.length} Specialists)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor technician task saturation, completed repair histories, and assign work based on availability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="p-5 rounded-2xl bg-[#1a222d]/90 border border-slate-300/20 shadow-lg space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300">
                  {tech.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-slate-400">{tech.email}</p>
                  <p className="text-[10px] text-amber-300/80 font-mono">{tech.college_id}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tech.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}
              >
                {tech.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#202733]/80 border border-slate-300/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Load</span>
                <p className="text-lg font-extrabold text-sky-300 font-heading mt-0.5">{tech.activeTasks || 0}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#202733]/80 border border-slate-300/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Completed</span>
                <p className="text-lg font-extrabold text-emerald-400 font-heading mt-0.5">{tech.completedTasks || 0}</p>
              </div>
            </div>

            {/* Currently Assigned Orders preview */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Current Assigned Tasks ({tech.assignedTickets?.length || 0}):
              </p>
              {(!tech.assignedTickets || tech.assignedTickets.length === 0) ? (
                <p className="text-xs text-slate-500 italic py-2">Available for new work order assignment</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {tech.assignedTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className="p-2 rounded-lg bg-[#202733]/60 hover:bg-[#202733] border border-slate-300/10 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-[10px] text-[#D99B7F] font-bold">{t.ticket_number}</span>
                      <span className="text-white truncate max-w-[140px]">{t.title}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── View 5: Services Management ────────────────────────────────────────────
  const renderServicesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <span>Campus Infrastructure Services</span>
            <span className="text-xs text-slate-400 font-mono">({services.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure affected campus service catalog and default SLA resolution targets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingService(null);
            setServiceFormData({ name: '', category: 'Network Infrastructure', sla_hours: 4, description: '', status: 'active' });
            setShowServiceModal(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}
        >
          <Plus className="w-4 h-4" />
          <span>New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {services.map((svc) => (
          <div key={svc.id} className="p-4 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{svc.name}</h3>
                <span className="text-[11px] text-sky-400 font-semibold">{svc.category}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  svc.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}
              >
                {svc.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed min-h-[32px]">{svc.description || 'Institutional operational service.'}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-300/10">
              <span className="text-slate-400">Target SLA: <strong>{svc.sla_hours} Hours</strong></span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(svc);
                    setServiceFormData({ name: svc.name, category: svc.category, sla_hours: svc.sla_hours, description: svc.description || '', status: svc.status });
                    setShowServiceModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#202733] text-slate-300 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(svc.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── View 6: Categories Management ──────────────────────────────────────────
  const renderCategoriesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D99B7F]" />
            <span>Incident Category Classifications</span>
            <span className="text-xs text-slate-400 font-mono">({categories.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage infrastructure categories and triage routing rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setCategoryFormData({ name: '', code: '', sla_hours: 4, description: '', status: 'active' });
            setShowCategoryModal(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F3040] shadow flex items-center gap-2"
          style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.roseGold})` }}
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">/{cat.code}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {cat.sla_hours || 4}h SLA
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{cat.description || 'Infrastructure domain classification.'}</p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-300/10 text-xs">
              <span className="text-slate-400">
                Incidents: <strong>{tickets.filter((t) => (t.category || '').toLowerCase() === cat.name.toLowerCase()).length}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryFormData({ name: cat.name, code: cat.code, sla_hours: cat.sla_hours || 4, description: cat.description || '', status: cat.status || 'active' });
                    setShowCategoryModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#202733] text-slate-300 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── View 7: Locations Management ───────────────────────────────────────────
  const renderLocationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Campus Buildings, Floors & Coordinates</span>
            <span className="text-xs text-slate-400 font-mono">({locations.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standardized campus facility directory for report location selectors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingLocation(null);
            setLocationFormData({ building: '', floor: 'Ground Floor', room: '', status: 'active' });
            setShowLocationModal(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
        >
          <Plus className="w-4 h-4" />
          <span>New Location</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {locations.map((loc) => (
          <div key={loc.id} className="p-3.5 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">{loc.floor}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(loc.id)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{loc.building}</h4>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{loc.room}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── View 8: Security Audit Logs ────────────────────────────────────────────
  const renderAuditLogsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Administrative Security & Operations Audit Trail</span>
            <span className="text-xs text-slate-400 font-mono">({filteredLogs.length} Records)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of authentication attempts, privilege assignments, ticket lifecycle transitions, and overrides.
          </p>
        </div>

        <select
          value={auditActionFilter}
          onChange={(e) => setAuditActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040]"
        >
          <option value="all">All Action Types</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="ROLE_CHANGE">ROLE_CHANGE</option>
          <option value="ACCOUNT_STATUS_CHANGE">ACCOUNT_STATUS_CHANGE</option>
          <option value="CREATE_TICKET">CREATE_TICKET</option>
          <option value="UPDATE_TICKET_STATUS">UPDATE_TICKET_STATUS</option>
          <option value="ASSIGN_TICKET">ASSIGN_TICKET</option>
          <option value="OVERRIDE_PRIORITY">OVERRIDE_PRIORITY</option>
          <option value="DELETE_TICKET">DELETE_TICKET</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-300/15 overflow-hidden bg-[#1a222d]/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0F3040]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-300/10">
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/10">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#202733]/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {formatFullDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    <div className="font-bold">{log.user_name || 'System / Guest'}</div>
                    <div className="text-[10px] text-slate-400">{log.user_role || 'Auth Gateway'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-mono text-[11px] max-w-md break-words">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── Incident Dossier Workspace Modal ───────────────────────────────────────
  const renderIncidentDossierModal = () => {
    if (!selectedTicket) return null;
    const t = selectedTicket;
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#1a222d] border border-purple-500/40 shadow-2xl space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-300/10">
            <div>
              <span className="font-mono font-bold text-xs text-[#D99B7F]">{t.ticket_number}</span>
              <h2 className="text-lg font-bold text-white font-heading mt-0.5">{t.title}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                <span className="text-xs text-slate-400">{t.category}</span>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedTicketId(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Reporter</span>
              <p className="font-bold text-white mt-0.5">{t.reporter_name}</p>
              <p className="text-slate-400 text-[11px]">{t.reporter_email} · {t.reporter_college_id}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Assigned Specialist</span>
              <p className="font-bold text-amber-300 mt-0.5">{t.technician_name || 'Unassigned'}</p>
              <p className="text-slate-400 text-[11px]">{t.technician_email || 'Awaiting dispatch'}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Campus Coordinates</span>
              <p className="font-bold text-white mt-0.5">{t.building}</p>
              <p className="text-slate-300 text-[11px]">{t.floor} · {t.room}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/10">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Affected Service</span>
              <p className="font-bold text-[#D99B7F] mt-0.5">{t.affected_service || 'General'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202733]/80 border border-slate-300/10 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Description</span>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{t.description}</p>
          </div>

          {t.resolution_details && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Resolution Summary</span>
              <p className="text-slate-200 font-mono">{t.resolution_details}</p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-300/10 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTicketToAssign(t);
                  setSelectedTechId(t.technician_id || '');
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500 text-white"
              >
                Dispatch / Assign
              </button>
              <button
                type="button"
                onClick={() => {
                  setTicketToReprioritize(t);
                  setNewPriority(t.priority);
                  setShowPriorityModal(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#202733] border border-slate-300/20 text-slate-200"
              >
                Override Priority
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteTicket(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
            >
              Delete Record
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Shell Render ──────────────────────────────────────────────────────
  const tabTitles = {
    overview: 'Operations Overview & Telemetry',
    'all-incidents': 'All Campus Incidents',
    users: 'User Governance & Directory',
    technicians: 'Technician Workforce',
    services: 'Services Management',
    categories: 'Category Classifications',
    locations: 'Campus Facilities & Locations',
    reports: 'Reports & Analytics',
    'audit-logs': 'System Activity Audit Trail',
    settings: 'Enterprise Platform Settings',
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
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">CampusFix · Executive Administration</p>
              <h2 className="text-sm font-bold text-white">{tabTitles[activeTab]}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAllData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
              title="Refresh dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202733]/70 border border-slate-300/20">
              <div className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-[10px] font-bold text-purple-200">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'all-incidents' && renderIncidentsTable()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'technicians' && renderTechniciansTab()}
          {activeTab === 'services' && renderServicesTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'locations' && renderLocationsTab()}
          {activeTab === 'reports' && renderOverviewTab()}
          {activeTab === 'audit-logs' && renderAuditLogsTab()}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-2xl bg-[#1a222d]/80 border border-slate-300/15 max-w-xl space-y-4">
              <h3 className="text-base font-bold text-white font-heading">Enterprise System Settings</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#202733]/60 flex justify-between">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="text-white font-mono font-bold">SQLite 3 (WAL Mode Enabled)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#202733]/60 flex justify-between">
                  <span className="text-slate-400">Security Cipher:</span>
                  <span className="text-emerald-400 font-mono font-bold">bcrypt-js 10-Round Hash</span>
                </div>
                <div className="p-3 rounded-xl bg-[#202733]/60 flex justify-between">
                  <span className="text-slate-400">JWT Token Expiry:</span>
                  <span className="text-white font-mono font-bold">24 Hours (Rolling Session)</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Selected Incident Dossier Modal */}
      {selectedTicketId && renderIncidentDossierModal()}

      {/* Dispatch / Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#1a222d] border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">Dispatch Incident {ticketToAssign?.ticket_number}</h3>
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Select an available specialist technician based on workload and expertise:
            </p>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs bg-[#0F3040]"
            >
              <option value="">Select Technician...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.activeTasks || 0} active tickets) · {t.department}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button
                type="button"
                disabled={!selectedTechId}
                onClick={handleAssignIncident}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-500 disabled:opacity-50"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Override Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#1a222d] border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">Override SLA Priority</h3>
              <button type="button" onClick={() => setShowPriorityModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Changing SLA priority for <strong>{ticketToReprioritize?.ticket_number}</strong> will be logged in the audit trail:
            </p>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs bg-[#0F3040]"
            >
              <option value="Low">Low (24h SLA)</option>
              <option value="Medium">Medium (8h SLA)</option>
              <option value="High">High (4h SLA)</option>
              <option value="Critical">Critical (2h SLA)</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPriorityModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="button" onClick={handleOverridePriority} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500">
                Save Priority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="w-full max-w-md p-6 rounded-2xl bg-[#1a222d] border border-purple-500/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">Provision Campus Account</h3>
              <button type="button" onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Campus Email</label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Campus ID</label>
              <input
                type="text"
                required
                value={newUserData.college_id}
                onChange={(e) => setNewUserData({ ...newUserData, college_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Initial Password</label>
              <input
                type="password"
                required
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040]"
                >
                  <option value="Reporter">Reporter</option>
                  <option value="Technician">Technician</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Department</label>
                <input
                  type="text"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-white text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-500">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveService} className="w-full max-w-md p-6 rounded-2xl bg-[#1a222d] border border-sky-500/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">{editingService ? 'Edit Service' : 'Add Campus Service'}</h3>
              <button type="button" onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Service Name</label>
              <input type="text" required value={serviceFormData.name} onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Category</label>
              <input type="text" required value={serviceFormData.category} onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Target SLA (Hours)</label>
                <input type="number" required min="1" value={serviceFormData.sla_hours} onChange={(e) => setServiceFormData({ ...serviceFormData, sla_hours: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Status</label>
                <select value={serviceFormData.status} onChange={(e) => setServiceFormData({ ...serviceFormData, status: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs bg-[#0F3040]">
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Description</label>
              <textarea rows={2} value={serviceFormData.description} onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowServiceModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500">Save Service</button>
            </div>
          </form>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="w-full max-w-md p-6 rounded-2xl bg-[#1a222d] border border-[#D99B7F]/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Category Name</label>
              <input type="text" required value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Short Code</label>
                <input type="text" required value={categoryFormData.code} onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">SLA (Hours)</label>
                <input type="number" required min="1" value={categoryFormData.sla_hours} onChange={(e) => setCategoryFormData({ ...categoryFormData, sla_hours: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Description</label>
              <textarea rows={2} value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F3040] bg-[#D99B7F]">Save Category</button>
            </div>
          </form>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="w-full max-w-md p-6 rounded-2xl bg-[#1a222d] border border-emerald-500/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300/10">
              <h3 className="text-sm font-bold text-white">{editingLocation ? 'Edit Location' : 'Add Location'}</h3>
              <button type="button" onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Building</label>
              <input type="text" required value={locationFormData.building} onChange={(e) => setLocationFormData({ ...locationFormData, building: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Floor</label>
              <input type="text" required value={locationFormData.floor} onChange={(e) => setLocationFormData({ ...locationFormData, floor: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Room / Lab Area</label>
              <input type="text" required value={locationFormData.room} onChange={(e) => setLocationFormData({ ...locationFormData, room: e.target.value })} className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLocationModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500">Save Coordinates</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
