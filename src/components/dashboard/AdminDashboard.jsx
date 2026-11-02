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
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../notifications/NotificationBell';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import UnifiedSidebar from './UnifiedSidebar';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const COLORS = {
  deepTeal: '#0F3040',
  tealSlate: '#183E4C',
  mutedSlate: '#464858',
  warmIvory: '#F5F3EF',
  softBorder: '#E7E4DF',
  terracotta: '#A56F63',
  softPeach: '#D99B7F',
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
  Critical: { color: 'text-[#A33D35]', bg: 'bg-[#F5DEDA]', border: 'border-[#A33D35]/30', dot: 'bg-[#A33D35]' },
  High: { color: 'text-[#93651C]', bg: 'bg-[#F8EBD2]', border: 'border-[#93651C]/30', dot: 'bg-[#93651C]' },
  Medium: { color: 'text-[#405C78]', bg: 'bg-[#E5EAF0]', border: 'border-[#405C78]/30', dot: 'bg-[#405C78]' },
  Low: { color: 'text-[#464858]', bg: 'bg-[#F5F3EF]', border: 'border-[#E7E4DF]', dot: 'bg-[#464858]' },
};

const STATUS_STYLES = {
  Open: { color: 'text-[#405C78]', bg: 'bg-[#E5EAF0]', border: 'border-[#405C78]/30' },
  Assigned: { color: 'text-[#405C78]', bg: 'bg-[#E5EAF0]', border: 'border-[#405C78]/30' },
  'In Progress': { color: 'text-[#93651C]', bg: 'bg-[#F8EBD2]', border: 'border-[#93651C]/30' },
  Resolved: { color: 'text-[#286448]', bg: 'bg-[#DCEDE4]', border: 'border-[#286448]/30' },
  Closed: { color: 'text-[#286448]', bg: 'bg-[#DCEDE4]', border: 'border-[#286448]/30' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.Open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: 'currentColor' }} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
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

  // Handle opening incident directly from notification click
  const { activeIncidentToOpen, clearActiveIncident } = useNotifications();
  useEffect(() => {
    if (activeIncidentToOpen?.ticketId) {
      setSelectedTicketId(activeIncidentToOpen.ticketId);
      clearActiveIncident();
    }
  }, [activeIncidentToOpen, clearActiveIncident]);

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
          className="relative rounded-2xl p-6 sm:p-8 border border-[#183E4C] overflow-hidden shadow-xs text-white"
          style={{
            background: 'linear-gradient(135deg, #0F3040 0%, #183E4C 100%)',
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#183E4C] text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-widest font-mono">
                  Command & Governance Center
                </span>
                <span className="text-xs text-slate-300 font-mono">Executive: {user?.name}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                Campus Infrastructure Executive Console
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                Monitor institutional incident resolution velocities, allocate field technicians, govern SLA categories, and audit platform security actions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAllData}
                className="px-3.5 py-2 rounded-xl bg-[#183E4C] hover:bg-[#235061] border border-[#D99B7F]/30 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D99B7F]' : ''}`} />
                <span>Synchronize</span>
              </button>
              {onOpenRoleTester && (
                <button
                  type="button"
                  onClick={onOpenRoleTester}
                  className="px-3.5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8e5e54] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                  <span>Verify RBAC</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 8 Metric Cards specified in requirements (Clean White Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#0F3040]/30 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Total Incidents</span>
              <div className="p-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040]">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0F3040] font-heading tracking-tight">{metrics.totalIncidents}</div>
            <p className="mt-1 text-[11px] text-[#464858]">All registered tickets</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#405C78]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#405C78] uppercase font-bold tracking-wider">Open Incidents</span>
              <div className="p-1.5 rounded-xl bg-[#E5EAF0] border border-[#405C78]/20 text-[#405C78]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#405C78] font-heading tracking-tight">{metrics.openIncidents}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Unassigned / awaiting triage</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#A33D35]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A33D35] uppercase font-bold tracking-wider">Critical Incidents</span>
              <div className="p-1.5 rounded-xl bg-[#F5DEDA] border border-[#A33D35]/20 text-[#A33D35]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#A33D35] font-heading tracking-tight">{metrics.criticalIncidents}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Urgent SLA dispatch required</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#93651C]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#93651C] uppercase font-bold tracking-wider">Assigned Incidents</span>
              <div className="p-1.5 rounded-xl bg-[#F8EBD2] border border-[#93651C]/20 text-[#93651C]">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#93651C] font-heading tracking-tight">{metrics.assignedIncidents}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Dispatched to specialists</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#286448]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#286448] uppercase font-bold tracking-wider">Resolved Incidents</span>
              <div className="p-1.5 rounded-xl bg-[#DCEDE4] border border-[#286448]/20 text-[#286448]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#286448] font-heading tracking-tight">{metrics.resolvedIncidents}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Completed repair orders</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#183E4C]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#183E4C] uppercase font-bold tracking-wider">Avg Response Time</span>
              <div className="p-1.5 rounded-xl bg-[#E5EAF0] border border-[#183E4C]/20 text-[#183E4C]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#183E4C] font-heading tracking-tight">{metrics.avgResponseTime}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Time to first dispatch action</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#A56F63]/40 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A56F63] uppercase font-bold tracking-wider">Avg Resolution Time</span>
              <div className="p-1.5 rounded-xl bg-[#F5F3EF] border border-[#A56F63]/25 text-[#A56F63]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#A56F63] font-heading tracking-tight">{metrics.avgResolutionTime}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Lifecycle completion speed</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs hover:shadow-md hover:border-[#0F3040]/30 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Active Technicians</span>
              <div className="p-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0F3040] font-heading tracking-tight">{technicians.length}</div>
            <p className="mt-1 text-[11px] text-[#464858]">Field workforce available</p>
          </div>
        </div>

        {/* 2-Column Split: Recurring Issues & Incident Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recurring Issues */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#93651C]" />
                <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
                  Recurring Campus Infrastructure Issues
                </h3>
              </div>
              <span className="text-[10px] text-[#464858] font-mono">Location Clusters</span>
            </div>

            {(!metrics.recurringIssues || metrics.recurringIssues.length === 0) ? (
              <p className="text-xs text-[#464858] py-6 text-center">No recurring incident hot-spots detected yet.</p>
            ) : (
              <div className="space-y-2">
                {metrics.recurringIssues.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F3040]">{item.building}</p>
                      <p className="text-[11px] text-[#464858]">{item.category}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/20 font-mono">
                      {item.incident_count} Incidents
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown & Technician Availability */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0F3040]" />
                <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
                  Workload by Category Classification
                </h3>
              </div>
              <span className="text-[10px] text-[#464858] font-mono">SLA Breakdown</span>
            </div>

            <div className="space-y-2.5">
              {categories.slice(0, 5).map((cat) => {
                const count = tickets.filter((t) => (t.category || '').toLowerCase() === cat.name.toLowerCase()).length;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#183E4C] font-semibold">{cat.name}</span>
                      <span className="text-[#0F3040] font-mono font-bold">{count} tickets ({cat.sla_hours || 4}h SLA)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0F3040] rounded-full"
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
              <ClipboardList className="w-4 h-4 text-[#0F3040]" />
              <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
                Recent Campus Incidents Needing Attention
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('all-incidents')}
              className="text-xs text-[#A56F63] hover:underline font-bold flex items-center gap-1"
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
    <div className="rounded-2xl border border-[#E7E4DF] overflow-hidden bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F5F3EF] text-[#464858] uppercase text-[10px] tracking-wider border-b border-[#E7E4DF]">
              <th className="px-4 py-3 font-bold">Incident ID</th>
              <th className="px-4 py-3 font-bold">Title</th>
              <th className="px-4 py-3 font-bold hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 font-bold hidden md:table-cell">Location</th>
              <th className="px-4 py-3 font-bold">Priority</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold hidden lg:table-cell">Assigned Tech</th>
              <th className="px-4 py-3 font-bold hidden xl:table-cell">Reported Date</th>
              <th className="px-4 py-3 font-bold text-center">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E4DF]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#464858]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#464858]" />
                  <p className="text-xs font-semibold">No incidents found matching current filters.</p>
                </td>
              </tr>
            ) : (
              items.map((tkt) => (
                <tr key={tkt.id} className="hover:bg-[#F5F3EF]/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#0F3040]">
                    {tkt.ticket_number || `INC-${tkt.id}`}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#183E4C] max-w-[200px] truncate">
                    {tkt.title}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#464858]">
                    {tkt.category}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#464858]">
                    <div className="font-semibold text-[#183E4C]">{tkt.building}</div>
                    <div className="text-[10px] text-[#464858]">{tkt.room}</div>
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
                      <span className="text-[#0F3040] font-semibold">{tkt.technician_name}</span>
                    ) : (
                      <span className="text-[#93651C] font-bold text-[11px] italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-[#464858]">
                    <span title={formatFullDate(tkt.created_at)}>{formatTimeAgo(tkt.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(tkt.id)}
                        className="p-1.5 rounded-lg text-[#0F3040] hover:bg-[#F5F3EF] border border-[#E7E4DF]"
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
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#F5F3EF] text-[#0F3040] border border-[#E7E4DF] hover:bg-slate-200"
                        title="Assign or reassign technician"
                      >
                        {tkt.technician_id ? 'Reassign' : 'Assign'}
                      </button>
                      {tkt.status === 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(tkt.id, 'Closed')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#DCEDE4] text-[#286448] border border-[#286448]/30 hover:bg-[#c9e4d5]"
                          title="Confirm and close"
                        >
                          Close
                        </button>
                      )}
                      {(tkt.status === 'Resolved' || tkt.status === 'Closed') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(tkt.id, 'Open')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30 hover:bg-[#f3dfba]"
                          title="Reopen incident"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(tkt)}
                        className="p-1.5 rounded-lg text-[#A33D35] hover:bg-[#F5DEDA] border border-[#A33D35]/20"
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
        <div className="px-4 py-3 bg-[#F5F3EF] border-t border-[#E7E4DF] flex items-center justify-between text-xs text-[#464858]">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} incidents
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-[#E7E4DF] bg-white disabled:opacity-40 text-[#0F3040]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[#0F3040] font-bold">{currentPage} / {Math.ceil(filteredTickets.length / pageSize)}</span>
            <button
              type="button"
              disabled={currentPage === Math.ceil(filteredTickets.length / pageSize)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded-lg border border-[#E7E4DF] bg-white disabled:opacity-40 text-[#0F3040]"
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
          <h2 className="text-lg font-black text-[#0F3040] font-heading flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#A56F63]" />
            <span>All Campus Infrastructure Incidents</span>
            <span className="text-xs text-[#464858] font-mono">({filteredTickets.length} / {tickets.length})</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
            Full operational view of reported issues across buildings, departments, and services with administrative override actions.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464858]" />
          <input
            type="text"
            placeholder="Search by ID, title, building, room, reporter, or technician..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs placeholder-slate-400 focus:outline-none focus:border-[#0F3040]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs font-semibold focus:outline-none focus:border-[#0F3040] flex-1 sm:flex-none"
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
            className="px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs font-semibold focus:outline-none focus:border-[#0F3040] flex-1 sm:flex-none"
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
            className="px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs font-semibold focus:outline-none focus:border-[#0F3040] flex-1 sm:flex-none"
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
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#A33D35] hover:bg-[#F5DEDA] border border-[#A33D35]/20"
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
          <h2 className="text-lg font-black text-[#0F3040] font-heading flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#A56F63]" />
            <span>Incident Assignments & Dispatch Governance</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
            Allocate unassigned incident work orders to qualified field technicians based on real-time availability and domain expertise.
          </p>
        </div>

        {/* Technician Workload Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicians.map((tech) => {
            const activeCount = tech.activeTasks || 0;
            const isHeavy = activeCount >= 4;
            return (
              <div key={tech.id} className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0F3040] text-white flex items-center justify-center font-bold text-xs">
                      {tech.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F3040]">{tech.name}</h4>
                      <p className="text-[10px] text-[#464858]">{tech.department || 'Field Ops'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isHeavy
                      ? 'bg-[#F8EBD2] text-[#93651C]'
                      : 'bg-[#DCEDE4] text-[#286448]'
                  }`}>
                    {isHeavy ? 'High Load' : 'Available'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E7E4DF]">
                  <span className="text-[#464858]">Active Work Orders:</span>
                  <span className="font-mono font-bold text-[#0F3040]">{activeCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unassigned Incidents Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#93651C]" />
              <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
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
              <Wrench className="w-4 h-4 text-[#0F3040]" />
              <h3 className="text-xs font-bold text-[#0F3040] uppercase tracking-wider">
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
    return (
      <AnalyticsDashboard
        onNavigateToIncident={(id) => {
          setSelectedTicketId(id);
          setActiveTab('all-incidents');
        }}
      />
    );
  };

  // ─── View 3: User Management ────────────────────────────────────────────────
  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0F3040] font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A56F63]" />
            <span>Campus Member Directory & Role Provisioning</span>
            <span className="text-xs text-[#464858] font-mono">({filteredUsers.length})</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
            Manage user accounts, assign technician or administrator privileges, and toggle account activation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateUserModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Provision User / Tech</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464858]" />
          <input
            type="text"
            placeholder="Search by name, email, campus ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs placeholder-slate-400 focus:outline-none focus:border-[#0F3040]"
          />
        </div>

        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs font-semibold focus:outline-none focus:border-[#0F3040] w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="Reporter">Reporter (Student/Faculty)</option>
          <option value="Technician">Technician</option>
          <option value="Administrator">Administrator</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[#E7E4DF] overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F3EF] text-[#464858] uppercase text-[10px] tracking-wider border-b border-[#E7E4DF]">
                <th className="px-4 py-3 font-bold">User Profile</th>
                <th className="px-4 py-3 font-bold">Campus ID</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Type & Dept</th>
                <th className="px-4 py-3 font-bold">Role Designation</th>
                <th className="px-4 py-3 font-bold">Account Status</th>
                <th className="px-4 py-3 font-bold text-center">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4DF]">
              {filteredUsers.map((u) => {
                const isSelf = u.id === user?.id;
                const isRoleLoading = actionLoadingId === `role-${u.id}`;
                const isStatusLoading = actionLoadingId === `status-${u.id}`;

                return (
                  <tr key={u.id} className="hover:bg-[#F5F3EF]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#0F3040] flex items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E5EAF0] text-[#405C78] font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#464858]">{u.email}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[#183E4C] font-bold">
                      {u.college_id}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell text-[#464858]">
                      <div className="font-medium text-[#0F3040]">{u.user_type}</div>
                      <div className="text-[10px] text-[#464858]">{u.department || 'General'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isRoleLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A56F63]" />
                        ) : (
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            className="px-2 py-1 rounded-lg bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#0F3040] font-semibold disabled:opacity-50"
                          >
                            <option value="Reporter">Reporter</option>
                            <option value="Technician">Technician</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active'
                          ? 'bg-[#DCEDE4] text-[#286448]'
                          : 'bg-[#F5DEDA] text-[#A33D35]'
                      }`}>
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-[#0F3040] hover:bg-[#F5F3EF] border border-[#E7E4DF]"
                          title="View user details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || isStatusLoading}
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-40 border ${
                            u.status === 'active'
                              ? 'bg-[#F5DEDA] text-[#A33D35] border-[#A33D35]/30 hover:bg-[#edd1cc]'
                              : 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30 hover:bg-[#cbe5d7]'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
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
          <h2 className="text-lg font-bold text-[#0F3040] font-heading flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#A56F63]" />
            <span>Field Technician Workforce & Workload Dispatch</span>
            <span className="text-xs text-[#464858] font-mono">({technicians.length} Specialists)</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
            Monitor technician task saturation, completed repair histories, and assign work based on availability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-center font-bold text-[#0F3040]">
                  {tech.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F3040]">{tech.name}</h3>
                  <p className="text-xs text-[#464858]">{tech.email}</p>
                  <p className="text-[11px] text-[#A56F63] font-mono font-semibold">{tech.college_id}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tech.status === 'active'
                    ? 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30'
                    : 'bg-[#F5DEDA] text-[#A33D35] border-[#A33D35]/30'
                }`}
              >
                {tech.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Active Load</span>
                <p className="text-lg font-bold text-[#0F3040] font-heading mt-0.5">{tech.activeTasks || 0}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Completed</span>
                <p className="text-lg font-bold text-[#286448] font-heading mt-0.5">{tech.completedTasks || 0}</p>
              </div>
            </div>

            {/* Currently Assigned Orders preview */}
            <div>
              <p className="text-[11px] font-bold text-[#464858] uppercase tracking-wider mb-1.5">
                Current Assigned Tasks ({tech.assignedTickets?.length || 0}):
              </p>
              {(!tech.assignedTickets || tech.assignedTickets.length === 0) ? (
                <p className="text-xs text-[#464858]/70 italic py-2">Available for new work order assignment</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {tech.assignedTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className="p-2 rounded-lg bg-[#F5F3EF] hover:bg-[#E5EAF0] border border-[#E7E4DF] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-mono text-[10px] text-[#A56F63] font-bold">{t.ticket_number}</span>
                      <span className="text-[#0F3040] font-medium truncate max-w-[140px]">{t.title}</span>
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
          <h2 className="text-lg font-bold text-[#0F3040] font-heading flex items-center gap-2">
            <Server className="w-5 h-5 text-[#0F3040]" />
            <span>Campus Infrastructure Services</span>
            <span className="text-xs text-[#464858] font-mono">({services.length})</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
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
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {services.map((svc) => (
          <div key={svc.id} className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F3040]">{svc.name}</h3>
                <span className="text-[11px] text-[#A56F63] font-semibold">{svc.category}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  svc.status === 'active' ? 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30' : 'bg-[#F5DEDA] text-[#A33D35] border-[#A33D35]/30'
                }`}
              >
                {svc.status}
              </span>
            </div>

            <p className="text-xs text-[#464858] leading-relaxed min-h-[32px]">{svc.description || 'Institutional operational service.'}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E7E4DF]">
              <span className="text-[#464858]">Target SLA: <strong className="text-[#0F3040]">{svc.sla_hours} Hours</strong></span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(svc);
                    setServiceFormData({ name: svc.name, category: svc.category, sla_hours: svc.sla_hours, description: svc.description || '', status: svc.status });
                    setShowServiceModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] hover:bg-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(svc.id)}
                  className="p-1.5 rounded-lg bg-[#F5DEDA] text-[#A33D35] hover:bg-[#edd1cc]"
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
          <h2 className="text-lg font-bold text-[#0F3040] font-heading flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#A56F63]" />
            <span>Incident Category Classifications</span>
            <span className="text-xs text-[#464858] font-mono">({categories.length})</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
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
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#A56F63] hover:bg-[#8e5c51] shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F3040]">{cat.name}</h3>
                <span className="text-[10px] text-[#464858] font-mono">/{cat.code}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30">
                {cat.sla_hours || 4}h SLA
              </span>
            </div>

            <p className="text-xs text-[#464858] leading-relaxed">{cat.description || 'Infrastructure domain classification.'}</p>

            <div className="flex items-center justify-between pt-2 border-t border-[#E7E4DF] text-xs">
              <span className="text-[#464858]">
                Incidents: <strong className="text-[#0F3040]">{tickets.filter((t) => (t.category || '').toLowerCase() === cat.name.toLowerCase()).length}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryFormData({ name: cat.name, code: cat.code, sla_hours: cat.sla_hours || 4, description: cat.description || '', status: cat.status || 'active' });
                    setShowCategoryModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] hover:bg-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg bg-[#F5DEDA] text-[#A33D35] hover:bg-[#edd1cc]"
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
          <h2 className="text-lg font-bold text-[#0F3040] font-heading flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#286448]" />
            <span>Campus Buildings, Floors & Coordinates</span>
            <span className="text-xs text-[#464858] font-mono">({locations.length})</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
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
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Location</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {locations.map((loc) => (
          <div key={loc.id} className="p-3.5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#A56F63] font-bold uppercase">{loc.floor}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(loc.id)}
                  className="text-[#464858] hover:text-[#A33D35]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-[#0F3040] mt-1">{loc.building}</h4>
              <p className="text-xs text-[#464858] font-mono mt-0.5">{loc.room}</p>
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
          <h2 className="text-lg font-bold text-[#0F3040] font-heading flex items-center gap-2">
            <History className="w-5 h-5 text-[#0F3040]" />
            <span>Administrative Security & Operations Audit Trail</span>
            <span className="text-xs text-[#464858] font-mono">({filteredLogs.length} Records)</span>
          </h2>
          <p className="text-xs text-[#464858] mt-0.5">
            Immutable log of authentication attempts, privilege assignments, ticket lifecycle transitions, and overrides.
          </p>
        </div>

        <select
          value={auditActionFilter}
          onChange={(e) => setAuditActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl saas-input text-xs"
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

      <div className="rounded-2xl border border-[#E7E4DF] overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F3EF] text-[#464858] uppercase text-[11px] font-semibold tracking-wider border-b border-[#E7E4DF]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4DF]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F3EF]/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-[#464858] whitespace-nowrap">
                    {formatFullDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#0F3040]">
                    <div className="font-bold">{log.user_name || 'System / Guest'}</div>
                    <div className="text-[10px] text-[#464858]">{log.user_role || 'Auth Gateway'}</div>
                  </td>
                  <td className="px-4 py-3 text-[#183E4C] font-mono text-[11px] max-w-md break-words">
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
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-4 text-[#0F3040]">
          <div className="flex items-start justify-between pb-3 border-b border-[#E7E4DF]">
            <div>
              <span className="font-mono font-bold text-xs text-[#A56F63]">{t.ticket_number}</span>
              <h2 className="text-lg font-bold text-[#0F3040] font-heading mt-0.5">{t.title}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                <span className="text-xs text-[#464858]">{t.category}</span>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedTicketId(null)} className="text-[#464858] hover:text-[#0F3040] p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Reporter</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{t.reporter_name}</p>
              <p className="text-[#464858] text-[11px]">{t.reporter_email} · {t.reporter_college_id}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Assigned Specialist</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{t.technician_name || 'Unassigned'}</p>
              <p className="text-[#464858] text-[11px]">{t.technician_email || 'Awaiting dispatch'}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Campus Coordinates</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{t.building}</p>
              <p className="text-[#464858] text-[11px]">{t.floor} · {t.room}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Affected Service</span>
              <p className="font-bold text-[#A56F63] mt-0.5">{t.affected_service || 'General'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs">
            <span className="text-[10px] text-[#464858] uppercase font-bold block mb-1">Description</span>
            <p className="text-[#0F3040] leading-relaxed whitespace-pre-wrap">{t.description}</p>
          </div>

          {t.resolution_details && (
            <div className="p-4 rounded-xl bg-[#DCEDE4] border border-[#286448]/30 text-xs">
              <span className="text-[10px] text-[#286448] uppercase font-bold block mb-1">Resolution Summary</span>
              <p className="text-[#286448] font-mono">{t.resolution_details}</p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E7E4DF] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTicketToAssign(t);
                  setSelectedTechId(t.technician_id || '');
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F3040] text-white hover:bg-[#183E4C] transition-colors"
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] hover:bg-slate-200 transition-colors"
              >
                Override Priority
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteTicket(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5DEDA] text-[#A33D35] border border-[#A33D35]/30 hover:bg-[#edd1cc] transition-colors"
            >
              Delete Record
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── User Profile Modal ──────────────────────────────────────────────────────
  const renderUserProfileModal = () => {
    if (!selectedUser) return null;
    const u = selectedUser;
    const userTickets = tickets.filter((t) => t.reporter_id === u.id || t.user_id === u.id);
    const userAssigned = tickets.filter((t) => t.technician_id === u.id);

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-4 text-[#0F3040]">
          <div className="flex items-start justify-between pb-3 border-b border-[#E7E4DF]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-center font-bold text-[#0F3040] text-lg">
                {u.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F3040] font-heading">{u.name}</h2>
                <p className="text-xs text-[#464858]">{u.email}</p>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedUser(null)} className="text-[#464858] hover:text-[#0F3040] p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Identifiers */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Campus ID</span>
              <p className="font-mono font-bold text-[#A56F63] mt-0.5">{u.college_id || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Role</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{u.role}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Account Status</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                u.status === 'active'
                  ? 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30'
                  : 'bg-[#F5DEDA] text-[#A33D35] border-[#A33D35]/30'
              }`}>
                {u.status === 'active' ? 'Active' : 'Suspended'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">User Type</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{u.user_type || 'Student'}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] col-span-2">
              <span className="text-[10px] text-[#464858] uppercase font-bold tracking-wider">Department</span>
              <p className="font-bold text-[#0F3040] mt-0.5">{u.department || 'General Campus'}</p>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-center">
              <p className="text-xl font-bold text-[#0F3040] font-heading">{userTickets.length}</p>
              <p className="text-[10px] text-[#464858] mt-0.5">Incidents<br />Submitted</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-center">
              <p className="text-xl font-bold text-[#93651C] font-heading">
                {userTickets.filter((t) => t.status === 'Open' || t.status === 'Assigned' || t.status === 'In Progress').length}
              </p>
              <p className="text-[10px] text-[#464858] mt-0.5">Currently<br />Open</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-center">
              <p className="text-xl font-bold text-[#286448] font-heading">{userAssigned.length}</p>
              <p className="text-[10px] text-[#464858] mt-0.5">Assigned<br />to Them</p>
            </div>
          </div>

          {/* Registration Date */}
          <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs flex items-center justify-between">
            <span className="text-[#464858]">Member Since</span>
            <span className="font-mono text-[#0F3040] font-bold">{formatTimeAgo(u.created_at)}</span>
          </div>

          {/* Governance Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#E7E4DF] flex-wrap">
            {u.id !== user?.id && (
              <button
                type="button"
                onClick={() => {
                  handleToggleUserStatus(u);
                  setSelectedUser({ ...u, status: u.status === 'active' ? 'suspended' : 'active' });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  u.status === 'active'
                    ? 'bg-[#F5DEDA] text-[#A33D35] border-[#A33D35]/30 hover:bg-[#edd1cc]'
                    : 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30 hover:bg-[#cbe5d7]'
                }`}
              >
                {u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#464858] hover:text-[#0F3040] ml-auto"
            >
              Close
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
    assignments: 'Assignments & Dispatch Matrix',
    reports: 'Reports & Analytics',
    'audit-logs': 'System Activity Audit Trail',
    settings: 'Enterprise Platform Settings',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3EF] text-[#0F3040]">
      {/* Reusable Enterprise Sidebar */}
      <UnifiedSidebar
        brandRole="ADMIN"
        brandSub="Campus Governance"
        navItems={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSelectedTicketId(null);
          setSelectedUser(null);
          setCurrentPage(1);
        }}
        user={user}
        onLogout={logout}
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
              type="button"
              className="lg:hidden p-2 rounded-xl text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF]"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] text-[#464858] font-mono hidden sm:block">CampusFix · Executive Administration</p>
              <h2 className="text-base font-bold text-[#0F3040]">{tabTitles[activeTab]}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={fetchAllData}
              className="p-2 rounded-xl text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] border border-[#E7E4DF] transition-colors"
              title="Refresh dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A56F63]' : ''}`} />
            </button>

            {/* Top Navigation Notification Bell */}
            <NotificationBell onNavigateToIncident={(id) => setSelectedTicketId(id)} />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
              <div className="w-6 h-6 rounded-full bg-[#0F3040] flex items-center justify-center text-[10px] font-bold text-white">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[#0F3040] hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5F3EF]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'all-incidents' && renderAllIncidentsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'technicians' && renderTechniciansTab()}
          {activeTab === 'services' && renderServicesTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'locations' && renderLocationsTab()}
          {activeTab === 'assignments' && renderAssignmentsTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'audit-logs' && renderAuditLogsTab()}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs max-w-xl space-y-4">
              <h3 className="text-base font-bold text-[#0F3040] font-heading">Enterprise System Settings</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex justify-between">
                  <span className="text-[#464858]">Database Engine:</span>
                  <span className="text-[#0F3040] font-mono font-bold">SQLite 3 (WAL Mode Enabled)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex justify-between">
                  <span className="text-[#464858]">Security Cipher:</span>
                  <span className="text-[#286448] font-mono font-bold">bcrypt-js 10-Round Hash</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex justify-between">
                  <span className="text-[#464858]">JWT Token Expiry:</span>
                  <span className="text-[#0F3040] font-mono font-bold">24 Hours (Rolling Session)</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Selected Incident Dossier Modal */}
      {selectedTicketId && renderIncidentDossierModal()}

      {/* User Profile Modal */}
      {selectedUser && renderUserProfileModal()}

      {/* Dispatch / Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-4 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">Dispatch Incident {ticketToAssign?.ticket_number}</h3>
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-[#464858] hover:text-[#0F3040]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#464858]">
              Select an available specialist technician based on workload and expertise:
            </p>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs"
            >
              <option value="">Select Technician...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.activeTasks || 0} active tickets) · {t.department}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button
                type="button"
                disabled={!selectedTechId}
                onClick={handleAssignIncident}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] disabled:opacity-50 transition-colors"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Override Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-4 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">Override SLA Priority</h3>
              <button type="button" onClick={() => setShowPriorityModal(false)} className="text-[#464858] hover:text-[#0F3040]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#464858]">
              Changing SLA priority for <strong>{ticketToReprioritize?.ticket_number}</strong> will be logged in the audit trail:
            </p>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs"
            >
              <option value="Low">Low (24h SLA)</option>
              <option value="Medium">Medium (8h SLA)</option>
              <option value="High">High (4h SLA)</option>
              <option value="Critical">Critical (2h SLA)</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPriorityModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button type="button" onClick={handleOverridePriority} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#A56F63] hover:bg-[#8e5c51] transition-colors">
                Save Priority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-3 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">Provision Campus Account</h3>
              <button type="button" onClick={() => setShowCreateUserModal(false)} className="text-[#464858] hover:text-[#0F3040]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Campus Email</label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Campus ID</label>
              <input
                type="text"
                required
                value={newUserData.college_id}
                onChange={(e) => setNewUserData({ ...newUserData, college_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Initial Password</label>
              <input
                type="password"
                required
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl saas-input text-xs"
                >
                  <option value="Reporter">Reporter</option>
                  <option value="Technician">Technician</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Department</label>
                <input
                  type="text"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl saas-input text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] transition-colors">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveService} className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-3 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">{editingService ? 'Edit Service' : 'Add Campus Service'}</h3>
              <button type="button" onClick={() => setShowServiceModal(false)} className="text-[#464858] hover:text-[#0F3040]"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Service Name</label>
              <input type="text" required value={serviceFormData.name} onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Category</label>
              <input type="text" required value={serviceFormData.category} onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Target SLA (Hours)</label>
                <input type="number" required min="1" value={serviceFormData.sla_hours} onChange={(e) => setServiceFormData({ ...serviceFormData, sla_hours: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
              </div>
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Status</label>
                <select value={serviceFormData.status} onChange={(e) => setServiceFormData({ ...serviceFormData, status: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs">
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Description</label>
              <textarea rows={2} value={serviceFormData.description} onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowServiceModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] transition-colors">Save Service</button>
            </div>
          </form>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-3 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-[#464858] hover:text-[#0F3040]"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Category Name</label>
              <input type="text" required value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Short Code</label>
                <input type="text" required value={categoryFormData.code} onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
              </div>
              <div>
                <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">SLA (Hours)</label>
                <input type="number" required min="1" value={categoryFormData.sla_hours} onChange={(e) => setCategoryFormData({ ...categoryFormData, sla_hours: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Description</label>
              <textarea rows={2} value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#A56F63] hover:bg-[#8e5c51] transition-colors">Save Category</button>
            </div>
          </form>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-2xl space-y-3 text-[#0F3040]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DF]">
              <h3 className="text-sm font-bold text-[#0F3040]">{editingLocation ? 'Edit Location' : 'Add Location'}</h3>
              <button type="button" onClick={() => setShowLocationModal(false)} className="text-[#464858] hover:text-[#0F3040]"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Building</label>
              <input type="text" required value={locationFormData.building} onChange={(e) => setLocationFormData({ ...locationFormData, building: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Floor</label>
              <input type="text" required value={locationFormData.floor} onChange={(e) => setLocationFormData({ ...locationFormData, floor: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div>
              <label className="text-[11px] text-[#464858] uppercase font-bold block mb-1">Room / Lab Area</label>
              <input type="text" required value={locationFormData.room} onChange={(e) => setLocationFormData({ ...locationFormData, room: e.target.value })} className="w-full px-3 py-2 rounded-xl saas-input text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLocationModal(false)} className="px-3 py-1.5 text-xs text-[#464858] hover:text-[#0F3040]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F3040] hover:bg-[#183E4C] transition-colors">Save Coordinates</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
