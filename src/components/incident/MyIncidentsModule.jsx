import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  X, 
  Send, 
  Upload, 
  Paperclip, 
  FileText, 
  Eye, 
  RefreshCw, 
  RotateCcw, 
  Check, 
  Copy, 
  MessageSquare, 
  Wifi, 
  Monitor, 
  Cpu, 
  Zap, 
  Tv, 
  Server, 
  Printer, 
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Priority Rank mapping for sorting
const PRIORITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Progress Steps Definition
const PROGRESS_STEPS = [
  { key: 'Open', label: 'Open', desc: 'Logged & Dispatched' },
  { key: 'Assigned', label: 'Assigned', desc: 'Technician Dispatched' },
  { key: 'In Progress', label: 'In Progress', desc: 'Diagnostics & Repair' },
  { key: 'Resolved', label: 'Resolved', desc: 'Solution Implemented' },
  { key: 'Closed', label: 'Closed', desc: 'Verified & Confirmed' },
];

/**
 * Format relative time (e.g., '10m ago', 'Today, 2:30 PM')
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

/**
 * Category Icon Resolver
 */
function getCategoryIcon(catName) {
  const c = (catName || '').toLowerCase();
  if (c.includes('network') || c.includes('wi-fi')) return Wifi;
  if (c.includes('hardware')) return Monitor;
  if (c.includes('software')) return Cpu;
  if (c.includes('power') || c.includes('elect')) return Zap;
  if (c.includes('class') || c.includes('project')) return Tv;
  if (c.includes('server')) return Server;
  if (c.includes('print')) return Printer;
  return HelpCircle;
}

export default function MyIncidentsModule({
  tickets = [],
  onRefreshTickets,
  onReportNew,
  selectedIncident,
  onSelectIncident,
  onNotify,
}) {
  const { user, token } = useAuth();
  const fileInputRef = useRef(null);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'
  // dateCutoffMs holds a stable epoch number set via event handler (not during render)
  // so the linter never sees Date.now() called inside useMemo.
  const [dateCutoffMs, setDateCutoffMs] = useState(0);

  // Sorting State
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail View Interaction State
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isConfirmingResolution, setIsConfirmingResolution] = useState(false);

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  // Full Screen Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Helper to calculate progress step index (0 to 4)
  const getStepIndex = (status) => {
    switch (status) {
      case 'Open': return 0;
      case 'Assigned': return 1;
      case 'In Progress': return 2;
      case 'Resolved': return 3;
      case 'Closed': return 4;
      default: return 0;
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Text Search (ID, Title, Building, Room, Service)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((tkt) => {
        const idMatch = (tkt.ticket_number || `INC-${tkt.id}`).toLowerCase().includes(q);
        const titleMatch = (tkt.title || '').toLowerCase().includes(q);
        const descMatch = (tkt.description || '').toLowerCase().includes(q);
        const locMatch = `${tkt.building || ''} ${tkt.room || ''}`.toLowerCase().includes(q);
        const serviceMatch = (tkt.affected_service || '').toLowerCase().includes(q);
        return idMatch || titleMatch || descMatch || locMatch || serviceMatch;
      });
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((tkt) => (tkt.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    // 3. Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter((tkt) => (tkt.priority || '').toLowerCase() === priorityFilter.toLowerCase());
    }

    // 4. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((tkt) => (tkt.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // 5. Date Filter
    if (dateFilter !== 'all' && dateCutoffMs > 0) {
      const now = dateCutoffMs;
      result = result.filter((tkt) => {
        if (!tkt.created_at) return true;
        const ticketTime = new Date(tkt.created_at).getTime();
        const diffMs = now - ticketTime;
        if (dateFilter === 'today') return diffMs <= 24 * 60 * 60 * 1000;
        if (dateFilter === '7days') return diffMs <= 7 * 24 * 60 * 60 * 1000;
        if (dateFilter === '30days') return diffMs <= 30 * 24 * 60 * 60 * 1000;
        return true;
      });
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'priority') {
        const rankA = PRIORITY_RANK[(a.priority || '').toLowerCase()] || 0;
        const rankB = PRIORITY_RANK[(b.priority || '').toLowerCase()] || 0;
        if (rankB !== rankA) return rankB - rankA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    return result;
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, dateFilter, dateCutoffMs, sortBy]);

  // Pagination calculation
  const totalItems = filteredAndSortedTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTickets.slice(start, start + pageSize);
  }, [filteredAndSortedTickets, currentPage, pageSize]);

  // Reset pagination when filter parameters change
  const handleFilterChange = (setter, value) => {
    // Capture a fresh time snapshot when the date filter is changed (outside render / memo)
    if (setter === setDateFilter) {
      setDateCutoffMs(value === 'all' ? 0 : Date.now());
    }
    setter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setDateCutoffMs(0);
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Copy Ticket ID Handler
  const handleCopyTicketId = (ticketNum) => {
    if (!ticketNum) return;
    navigator.clipboard.writeText(ticketNum);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    if (onNotify) onNotify('Ticket ID copied to clipboard', 'info');
  };

  // Add Comment / Note to Incident
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIncident) return;

    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/tickets/${selectedIncident.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: newComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post comment');

      // Update local state
      const updatedNotes = [...(selectedIncident.notes || []), data.note];
      const updatedIncident = { ...selectedIncident, notes: updatedNotes, updated_at: new Date().toISOString() };
      onSelectIncident(updatedIncident);
      setNewComment('');

      if (onRefreshTickets) onRefreshTickets();
      if (onNotify) onNotify('Comment added to incident record', 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message || 'Error posting comment', 'error');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Upload Additional Supporting Evidence
  const handleUploadEvidence = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedIncident) return;

    setIsUploadingAttachments(true);
    const newAttachments = [];
    let processed = 0;

    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        if (onNotify) onNotify(`"${file.name}" exceeds 8MB limit.`, 'error');
        processed++;
        if (processed === files.length) submitEvidence(newAttachments);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        newAttachments.push({
          id: `evid-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type,
          data: uploadEvent.target.result,
          isImage: file.type.startsWith('image/'),
          uploadedAt: new Date().toISOString(),
        });
        processed++;
        if (processed === files.length) {
          submitEvidence(newAttachments);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const submitEvidence = async (newFiles) => {
    if (!newFiles.length) {
      setIsUploadingAttachments(false);
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${selectedIncident.id}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attachments: newFiles }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload evidence');

      onSelectIncident(data.ticket);
      if (onRefreshTickets) onRefreshTickets();
      if (onNotify) onNotify(`${newFiles.length} additional evidence item(s) attached to ticket!`, 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message || 'Error saving attachments', 'error');
    } finally {
      setIsUploadingAttachments(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm Resolution Workflow (Resolved -> Closed)
  const handleConfirmResolution = async () => {
    if (!selectedIncident) return;
    setIsConfirmingResolution(true);
    try {
      const res = await fetch(`/api/tickets/${selectedIncident.id}/status`, {
        method: 'POST', // or PATCH
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Closed' }),
      });

      // If backend uses PATCH:
      let patchRes = res;
      if (!res.ok && res.status === 404) {
        patchRes = await fetch(`/api/tickets/${selectedIncident.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'Closed' }),
        });
      }

      const data = await patchRes.json();
      if (!patchRes.ok) throw new Error(data.message || 'Failed to confirm resolution');

      onSelectIncident(data.ticket);
      if (onRefreshTickets) onRefreshTickets();
      if (onNotify) onNotify('Resolution confirmed! Ticket is now officially Closed.', 'success');
    } catch (err) {
      if (onNotify) onNotify(err.message || 'Error confirming resolution', 'error');
    } finally {
      setIsConfirmingResolution(false);
    }
  };

  // Reopen Issue Workflow (Resolved/Closed -> Open)
  const handleReopenIncident = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || !selectedIncident) return;

    setIsSubmittingReopen(true);
    try {
      const res = await fetch(`/api/tickets/${selectedIncident.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Open',
          reopenReason: reopenReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reopen incident');

      onSelectIncident(data.ticket);
      setIsReopenModalOpen(false);
      setReopenReason('');
      if (onRefreshTickets) onRefreshTickets();
      if (onNotify) onNotify(`Incident ${data.ticket.ticket_number} reopened and returned to dispatch queue.`, 'info');
    } catch (err) {
      if (onNotify) onNotify(err.message || 'Error reopening incident', 'error');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  // Dynamic Timeline Events for the Selected Incident
  const incidentTimeline = useMemo(() => {
    if (!selectedIncident) return [];
    const events = [];

    // 1. Created Event
    events.push({
      title: 'Incident Reported',
      desc: `Submitted by ${selectedIncident.reporter_name || user?.name} (${selectedIncident.reporter_college_id || user?.collegeId || 'Reporter'})`,
      date: selectedIncident.created_at,
      icon: PlusCircle,
      color: 'text-[#D99B7F]',
      badge: 'Open',
    });

    // 2. Technician Assigned Event
    if (selectedIncident.technician_name) {
      events.push({
        title: 'Specialist Assigned',
        desc: `Dispatched to ${selectedIncident.technician_name} (${selectedIncident.technician_email || 'Field Ops'})`,
        date: selectedIncident.updated_at || selectedIncident.created_at,
        icon: Wrench,
        color: 'text-amber-400',
        badge: 'Assigned',
      });
    }

    // 3. Diagnostic Notes / Messages
    if (selectedIncident.notes && Array.isArray(selectedIncident.notes)) {
      selectedIncident.notes.forEach((note) => {
        const isReopen = (note.note || '').includes('[REOPENED BY REPORTER]');
        const isResolution = (note.note || '').includes('confirmed incident resolution');
        events.push({
          title: isReopen ? 'Issue Reopened' : isResolution ? 'Resolution Verified' : `Diagnostic Note from ${note.author_name || 'Staff'}`,
          desc: note.note,
          date: note.created_at,
          icon: isReopen ? RotateCcw : isResolution ? ShieldCheck : MessageSquare,
          color: isReopen ? 'text-rose-400' : isResolution ? 'text-emerald-400' : 'text-sky-400',
          badge: note.author_role || 'Update',
        });
      });
    }

    // 4. Resolved / Closed status milestone
    if (selectedIncident.status === 'Resolved' || selectedIncident.status === 'Closed') {
      events.push({
        title: selectedIncident.status === 'Closed' ? 'Incident Closed' : 'Remediation Resolved',
        desc: selectedIncident.status === 'Closed' 
          ? 'Ticket successfully verified and closed.' 
          : 'Technician completed repair work; awaiting student confirmation.',
        date: selectedIncident.updated_at,
        icon: CheckCircle2,
        color: 'text-emerald-400',
        badge: selectedIncident.status,
      });
    }

    return events;
  }, [selectedIncident, user]);

  // =========================================================================
  // VIEW 1: FULL INCIDENT DETAILS DOSSIER (WHEN SELECTED)
  // =========================================================================
  if (selectedIncident) {
    const currentStepIdx = getStepIndex(selectedIncident.status);

    return (
      <div className="space-y-6 animate-fadeIn pb-10">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectIncident(null)}
              className="p-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to My Incidents</span>
            </button>
            <span className="text-[#E7E4DF] hidden sm:inline">/</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#0F3040]">
                {selectedIncident.ticket_number || `INC-${selectedIncident.id}`}
              </span>
              <button
                type="button"
                onClick={() => handleCopyTicketId(selectedIncident.ticket_number || `INC-${selectedIncident.id}`)}
                className="p-1 rounded text-[#464858] hover:text-[#0F3040] transition-colors"
                title="Copy Incident ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-[#286448]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Action Buttons for Status Lifecycle */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIncident.status === 'Resolved' && (
              <button
                type="button"
                disabled={isConfirmingResolution}
                onClick={handleConfirmResolution}
                className="px-3.5 py-2 rounded-xl bg-[#286448] hover:bg-[#1f4e38] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isConfirmingResolution ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm Resolution</span>
              </button>
            )}

            {(selectedIncident.status === 'Resolved' || selectedIncident.status === 'Closed') && (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#F5DEDA] hover:bg-[#f0c9c3] border border-[#A33D35]/30 text-[#A33D35] font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Problem Persists? Reopen</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onRefreshTickets) onRefreshTickets();
              }}
              className="p-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] transition-colors"
              title="Refresh incident data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. VISUAL PROGRESS TRACKER */}
        <div className="p-6 rounded-2xl border border-[#E7E4DF] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E4DF] mb-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#464858]">Lifecycle Progress</span>
              <h3 className="text-base font-bold text-[#0F3040] font-heading">
                Incident Resolution Tracker
              </h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase ${
              selectedIncident.status === 'Closed' || selectedIncident.status === 'Resolved' ? 'bg-[#DCEDE4] text-[#286448]' :
              selectedIncident.status === 'In Progress' ? 'bg-[#F8EBD2] text-[#93651C]' :
              selectedIncident.status === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35]' :
              'bg-[#E5EAF0] text-[#405C78]'
            }`}>
              Current: {selectedIncident.status}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="relative">
            {/* Desktop / Tablet Timeline bar */}
            <div className="hidden sm:grid grid-cols-5 gap-2 relative z-10">
              {PROGRESS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                        isPassed
                          ? 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30 shadow-xs'
                          : isCurrent
                          ? 'bg-[#0F3040] text-white border-[#0F3040] scale-110 shadow-xs'
                          : 'bg-[#F5F3EF] text-[#464858] border-[#E7E4DF]'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-5 h-5 text-[#286448]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span className={`mt-2.5 text-xs font-bold ${
                      isCurrent ? 'text-[#0F3040]' : isPassed ? 'text-[#286448]' : 'text-[#464858]'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-[#464858] mt-0.5 leading-tight">{step.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* Connecting line behind icons */}
            <div className="hidden sm:block absolute top-5 left-10 right-10 h-0.5 bg-[#E7E4DF] z-0">
              <div 
                className="h-full bg-[#0F3040] transition-all duration-500"
                style={{ width: `${(currentStepIdx / 4) * 100}%` }}
              />
            </div>

            {/* Mobile Vertical Stepper */}
            <div className="sm:hidden space-y-3">
              {PROGRESS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isPassed ? 'bg-[#DCEDE4] text-[#286448] border border-[#286448]/30' :
                      isCurrent ? 'bg-[#0F3040] text-white font-black' :
                      'bg-[#F5F3EF] text-[#464858]'
                    }`}>
                      {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-[#0F3040]' : 'text-[#464858]'}`}>{step.label}</span>
                      <span className="text-[10px] text-[#464858]">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. MAIN 2-COLUMN DOSSIER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: INCIDENT SUMMARY, ATTACHMENTS & COMMENTS */}
          <div className="lg:col-span-7 space-y-6">
            {/* Incident Title & Meta Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/20 uppercase tracking-wider flex items-center gap-1 font-mono">
                      {React.createElement(getCategoryIcon(selectedIncident.category), { className: 'w-3 h-3' })}
                      <span>{selectedIncident.category}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedIncident.priority === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35]' :
                      selectedIncident.priority === 'High' ? 'bg-[#F8EBD2] text-[#93651C]' :
                      selectedIncident.priority === 'Medium' ? 'bg-[#E5EAF0] text-[#405C78]' :
                      'bg-[#F5F3EF] text-[#464858]'
                    }`}>
                      {selectedIncident.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0F3040] font-heading mt-2">{selectedIncident.title}</h2>
                </div>
              </div>

              {/* Coordinates & Affected Service Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs">
                <div>
                  <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Campus Location</span>
                  <p className="text-[#0F3040] font-medium mt-0.5">
                    📍 {selectedIncident.building}
                    {selectedIncident.floor ? ` • ${selectedIncident.floor}` : ''}
                    {selectedIncident.room ? ` • ${selectedIncident.room}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">Affected Service / Device</span>
                  <p className="text-[#A56F63] font-semibold mt-0.5">
                    ⚡ {selectedIncident.affected_service || 'General Campus Service'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">
                  Problem Description & Diagnostics
                </span>
                <p className="text-xs text-[#0F3040] leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Attached Files & Evidence */}
              <div className="space-y-2.5 pt-2 border-t border-[#E7E4DF]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F3040] uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#A56F63]" />
                    <span>Uploaded Evidence & Attachments ({(selectedIncident.attachments || []).length})</span>
                  </span>
                  
                  {/* Upload More Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAttachments}
                    className="px-2.5 py-1 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 border border-[#E7E4DF]"
                  >
                    {isUploadingAttachments ? (
                      <span className="w-3 h-3 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>Add Evidence</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.log"
                    onChange={handleUploadEvidence}
                    className="hidden"
                  />
                </div>

                {(!selectedIncident.attachments || selectedIncident.attachments.length === 0) ? (
                  <p className="text-xs text-[#464858] italic bg-[#F5F3EF] p-3 rounded-xl border border-[#E7E4DF]">
                    No attachments uploaded with this report. Use "Add Evidence" above to attach screenshots or logs.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedIncident.attachments.map((att, i) => (
                      <div 
                        key={att.id || i}
                        onClick={() => att.isImage && att.data && setPreviewImage(att)}
                        className={`p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs flex flex-col justify-between transition-all ${
                          att.isImage ? 'hover:border-[#0F3040] cursor-pointer' : ''
                        }`}
                      >
                        {att.isImage && att.data ? (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 mb-1.5 flex items-center justify-center">
                            <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg bg-white mb-1.5 flex flex-col items-center justify-center text-[#464858]">
                            <FileText className="w-8 h-8 text-[#A56F63] mb-1" />
                            <span className="text-[10px] uppercase font-mono">{att.type?.split('/')[1] || 'DOC'}</span>
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-[#0F3040] font-medium text-[11px] truncate">{att.name}</p>
                          <p className="text-[10px] text-[#464858]">{att.size || 'Attachment'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation & Technician Comments Feed */}
            <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#A56F63]" />
                  <h3 className="text-sm font-bold text-[#0F3040] font-heading">
                    Technician Updates & Conversation Log
                  </h3>
                </div>
                <span className="text-xs text-[#464858] font-mono">
                  {(selectedIncident.notes || []).length} Messages
                </span>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!selectedIncident.notes || selectedIncident.notes.length === 0) ? (
                  <div className="p-4 rounded-xl bg-[#F5F3EF] text-center text-[#464858] text-xs">
                    No diagnostic updates or notes posted yet. Use the box below to ask the technician a question.
                  </div>
                ) : (
                  selectedIncident.notes.map((note) => {
                    const isReporter = note.author_id === user?.id || (note.author_role || '').toLowerCase() === 'reporter';
                    const isSpecialist = !isReporter;

                    return (
                      <div 
                        key={note.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isSpecialist
                            ? 'bg-[#F8EBD2]/40 border-[#93651C]/30 text-[#0F3040]'
                            : 'bg-[#F5F3EF] border-[#E7E4DF] text-[#0F3040]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${isSpecialist ? 'text-[#93651C]' : 'text-[#0F3040]'}`}>
                              {note.author_name || (isSpecialist ? 'Technician' : 'Reporter')}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 text-[#464858] uppercase font-mono">
                              {note.author_role || (isSpecialist ? 'Technician' : 'Student')}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#464858] font-mono">
                            {formatTimeAgo(note.created_at)}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{note.note}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Post New Comment / Note Form */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-[#E7E4DF] flex gap-2">
                <input
                  type="text"
                  placeholder="Post comment, clarify room access, or reply to technician..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl saas-input text-xs"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !newComment.trim()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F3040] hover:bg-[#183E4C] shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPostingComment ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT 5 COLS: TECHNICIAN CONTACT CARD & COMPLETE ACTIVITY TIMELINE */}
          <div className="lg:col-span-5 space-y-6">
            {/* Assigned Specialist Contact Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3.5">
              <span className="text-[10px] text-[#464858] uppercase tracking-wider font-semibold block">
                Field Operations Specialist
              </span>

              {selectedIncident.technician_name ? (
                <div className="p-4 rounded-xl bg-[#F8EBD2]/50 border border-[#93651C]/30 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#F8EBD2] border border-[#93651C]/40 flex items-center justify-center text-[#93651C] font-bold text-base">
                    🔧
                  </div>
                  <div className="flex-1 truncate">
                    <h4 className="text-sm font-bold text-[#0F3040] truncate">{selectedIncident.technician_name}</h4>
                    <p className="text-[11px] text-[#464858] font-mono truncate">{selectedIncident.technician_email || 'it-ops@campus.edu'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-[#F8EBD2] text-[#93651C] font-semibold border border-[#93651C]/30">
                      Dispatched Specialist
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-center space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-[#93651C] mb-1" />
                  <p className="text-xs font-semibold text-[#0F3040]">Awaiting Specialist Assignment</p>
                  <p className="text-[11px] text-[#464858]">
                    Incident is in the IT queue and prioritized based on SLA severity tier.
                  </p>
                </div>
              )}

              {/* Reported By & Date */}
              <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#464858]">Reporter:</span>
                  <span className="text-[#0F3040] font-medium">{selectedIncident.reporter_name || user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464858]">Student / College ID:</span>
                  <span className="font-mono text-[#0F3040] font-medium">{selectedIncident.reporter_college_id || user?.collegeId || 'STU'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464858]">Reported Timestamp:</span>
                  <span className="text-[#0F3040]">
                    {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464858]">Target Resolution:</span>
                  <span className="text-[#93651C] font-bold">
                    {selectedIncident.priority === 'Critical' ? '< 30 Mins' :
                     selectedIncident.priority === 'High' ? '1–2 Hours' :
                     selectedIncident.priority === 'Medium' ? '4–8 Hours' : '24–48 Hours'}
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Activity Timeline */}
            <div className="p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF]">
                <h3 className="text-sm font-bold text-[#0F3040] font-heading">Complete Activity Timeline</h3>
                <span className="text-xs text-[#464858] font-mono">{incidentTimeline.length} Milestones</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E7E4DF]">
                {incidentTimeline.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-[#E7E4DF] shadow-xs flex items-center justify-center text-[#0F3040]">
                        <Icon className="w-3 h-3 text-[#A56F63]" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F3040]">{item.title}</span>
                          <span className="text-[10px] text-[#464858] font-mono">
                            {formatTimeAgo(item.date)}
                          </span>
                        </div>
                        <p className="text-[#464858] leading-relaxed text-[11px]">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* REOPEN INCIDENT MODAL WORKFLOW */}
        {isReopenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E7E4DF] p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#E7E4DF]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F5DEDA] border border-[#A33D35]/30 flex items-center justify-center text-[#A33D35]">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F3040] font-heading">Reopen Campus Incident</h3>
                    <p className="text-xs text-[#464858] font-mono">{selectedIncident.ticket_number}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#464858] hover:text-[#0F3040]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#464858] leading-relaxed">
                If the infrastructure fault has returned or was not fully resolved, please provide specific observations below so field technicians can be re-dispatched.
              </p>

              <form onSubmit={handleReopenIncident} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F3040] mb-1">
                    Reason for Reopening <span className="text-[#A33D35]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Wi-Fi router worked for 2 hours but started losing packets again at 3 PM..."
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E7E4DF]">
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReopen || !reopenReason.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#A33D35] hover:bg-[#85322b] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingReopen ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>Authorize & Reopen Incident</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FULLSCREEN IMAGE VIEWER MODAL */}
        {previewImage && (
          <div 
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <X className="w-5 h-5" />
              </button>
              <img 
                src={previewImage.data} 
                alt={previewImage.name} 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20" 
              />
              <p className="text-center text-xs text-white/90 mt-2 font-mono">{previewImage.name} ({previewImage.size})</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MY INCIDENTS OVERVIEW & TABLE VIEW
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Overview Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs">
          <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider block">My Total Incidents</span>
          <div className="text-2xl font-black text-[#0F3040] font-heading mt-1">{tickets.length}</div>
          <span className="text-[10px] text-[#464858]">Reported by your account</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs">
          <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider block">Open / Queued</span>
          <div className="text-2xl font-black text-[#405C78] font-heading mt-1">
            {tickets.filter((t) => t.status === 'Open' || t.status === 'Assigned').length}
          </div>
          <span className="text-[10px] text-[#405C78]">Pending investigation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs">
          <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider block">In Progress</span>
          <div className="text-2xl font-black text-[#93651C] font-heading mt-1">
            {tickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <span className="text-[10px] text-[#93651C]">Technician active on-site</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs">
          <span className="text-[11px] font-semibold text-[#464858] uppercase tracking-wider block">Resolved & Closed</span>
          <div className="text-2xl font-black text-[#286448] font-heading mt-1">
            {tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
          </div>
          <span className="text-[10px] text-[#286448]">Successfully completed</span>
        </div>
      </div>

      {/* Main SaaS Incident Table Panel */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-5">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E4DF]">
          <div>
            <h2 className="text-xl font-bold text-[#0F3040] font-heading">My Submitted Incidents</h2>
            <p className="text-xs text-[#464858]">
              Live tracking for campus infrastructure issues reported by your student or faculty profile
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {onRefreshTickets && (
              <button
                type="button"
                onClick={onRefreshTickets}
                className="p-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] transition-all"
                title="Refresh incident list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {onReportNew && (
              <button
                type="button"
                onClick={onReportNew}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F3040] hover:bg-[#183E4C] flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report New Incident</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="space-y-3">
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#464858] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Incident ID (e.g. INC-1082), title, location, or affected service..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl saas-input text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearchTerm, '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#464858] hover:text-[#0F3040]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 4-Filter Grid + Sorting + Reset Button */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#464858] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#464858] mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#464858] mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs cursor-pointer"
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

            {/* Date Filter */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#464858] mb-1">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today (24h)</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] uppercase font-semibold text-[#464858] mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl saas-input text-xs cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Table */}
        {filteredAndSortedTickets.length === 0 ? (
          <div className="py-16 text-center text-[#464858] space-y-3 bg-[#F5F3EF] rounded-2xl border border-[#E7E4DF]">
            <FileText className="w-12 h-12 mx-auto text-[#464858]/60 mb-1" />
            <h3 className="text-sm font-bold text-[#0F3040]">No Incidents Match Filters</h3>
            <p className="text-xs text-[#464858] max-w-sm mx-auto">
              There are no campus infrastructure reports matching your current search criteria.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#E7E4DF] border border-[#E7E4DF] text-[#0F3040] text-xs font-semibold transition-all mt-2 shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#E7E4DF]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E7E4DF] bg-[#F5F3EF] text-[#464858] uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Incident ID</th>
                  <th className="py-3.5 px-4 font-semibold">Incident Title</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Current Status</th>
                  <th className="py-3.5 px-4 font-semibold">Reported Date</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Specialist</th>
                  <th className="py-3.5 px-4 font-semibold text-right">View Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DF]">
                {paginatedTickets.map((tkt) => (
                    <tr 
                      key={tkt.id}
                      onClick={() => onSelectIncident(tkt)}
                      className="hover:bg-[#F5F3EF]/60 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F3040] whitespace-nowrap">
                        {tkt.ticket_number || `INC-${tkt.id}`}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-medium text-[#0F3040] max-w-[200px] truncate group-hover:text-[#A56F63] transition-colors">
                        {tkt.title}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F5F3EF] border border-[#E7E4DF] text-[11px] text-[#0F3040]">
                          {React.createElement(getCategoryIcon(tkt.category), { className: 'w-3 h-3 text-[#A56F63]' })}
                          <span className="truncate max-w-[110px]">{tkt.category}</span>
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-[#464858] whitespace-nowrap text-[11px]">
                        📍 {tkt.building} {tkt.room ? `• ${tkt.room}` : ''}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tkt.priority === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35]' :
                          tkt.priority === 'High' ? 'bg-[#F8EBD2] text-[#93651C]' :
                          tkt.priority === 'Medium' ? 'bg-[#E5EAF0] text-[#405C78]' :
                          'bg-[#F5F3EF] text-[#464858] border border-[#E7E4DF]'
                        }`}>
                          {tkt.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tkt.status === 'Closed' || tkt.status === 'Resolved' ? 'bg-[#DCEDE4] text-[#286448]' :
                          tkt.status === 'In Progress' ? 'bg-[#F8EBD2] text-[#93651C]' :
                          tkt.status === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35]' :
                          'bg-[#E5EAF0] text-[#405C78]'
                        }`}>
                          {tkt.status}
                        </span>
                      </td>

                      {/* Reported Date */}
                      <td className="py-3.5 px-4 text-[#464858] whitespace-nowrap text-[11px] font-mono">
                        {formatTimeAgo(tkt.created_at)}
                      </td>

                      {/* Assigned Specialist */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        {tkt.technician_name ? (
                          <span className="text-[#93651C] font-medium flex items-center gap-1">
                            <span>🔧</span>
                            <span className="truncate max-w-[120px]">{tkt.technician_name}</span>
                          </span>
                        ) : (
                          <span className="text-[#464858] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#93651C]" />
                            <span>Awaiting Dispatch</span>
                          </span>
                        )}
                      </td>

                      {/* View Details Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(tkt);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#F5F3EF] hover:bg-[#0F3040] hover:text-white text-[#0F3040] border border-[#E7E4DF] font-bold text-[11px] transition-all active:scale-95 flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredAndSortedTickets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E7E4DF] text-xs">
            <div className="flex items-center gap-3 text-[#464858]">
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} incidents
              </span>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-[#E7E4DF]">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#F5F3EF] border border-[#E7E4DF] text-[#0F3040] text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] disabled:opacity-40 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#0F3040] text-white shadow-xs'
                          : 'bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="text-[#464858] px-1">...</span>;
                }
                return null;
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] disabled:opacity-40 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
