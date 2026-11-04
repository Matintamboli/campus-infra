import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Wifi, 
  Monitor, 
  Cpu, 
  Zap, 
  Tv, 
  Server,
  ShieldAlert,
  Send,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportIncidentModule from '../incident/ReportIncidentModule';
import MyIncidentsModule from '../incident/MyIncidentsModule';

export default function ReporterDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token } = useAuth();

  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'report' | 'my-incidents'
  const [selectedIncident, setSelectedIncident] = useState(null);

  // New incident report form state
  const [category, setCategory] = useState('network');
  const [priority, setPriority] = useState('Medium');
  const [title, setTitle] = useState('');
  const [building, setBuilding] = useState('Engineering Block B');
  const [room, setRoom] = useState('Lab 304');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [submittedTickets, setSubmittedTickets] = useState([]);

  const categories = [
    { id: 'network', name: 'Network Infrastructure', icon: Wifi, desc: 'Wi-Fi, Ethernet, routers' },
    { id: 'hardware', name: 'Hardware Systems', icon: Monitor, desc: 'PCs, monitors, keyboards' },
    { id: 'software', name: 'Software & OS', icon: Cpu, desc: 'Lab software, OS license' },
    { id: 'power', name: 'Power & Electrical', icon: Zap, desc: 'Sockets, UPS, power strips' },
    { id: 'classroom', name: 'Classroom Equipment', icon: Tv, desc: 'Projectors, smartboards' },
    { id: 'servers', name: 'Campus Servers', icon: Server, desc: 'Virtual machines, LMS' },
  ];

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
        setSubmittedTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
      if (onNotify) onNotify('Unable to retrieve incidents from campus server', 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [token, onNotify]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      if (onNotify) onNotify('Please provide a title and detailed problem description', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === category)?.name || 'General';
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: selectedCat,
          priority,
          building: building.trim(),
          room: room.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit incident ticket');
      }

      setSubmittedTickets((prev) => [data.ticket, ...prev]);
      setTitle('');
      setDescription('');
      if (onNotify) onNotify(`Incident report filed! Ticket #${data.ticket.ticket_number || data.ticket.id} registered`, 'success');
    } catch (err) {
      console.error('Submit error:', err);
      if (onNotify) onNotify(err.message || 'Error filing incident report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div 
        className="relative rounded-2xl p-6 sm:p-8 bg-[#0F3040] text-white overflow-hidden shadow-xs"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider">
                Reporter Portal
              </span>
              <span className="text-xs text-white/70 font-mono">Role: Reporter ({user?.userType || 'Student'})</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Welcome, {user?.name || 'Campus Reporter'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-2xl font-light">
              Report campus infrastructure faults, track investigation milestones, and confirm resolutions. Every incident is prioritized and assigned to field technicians.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedIncident(null);
                setViewMode(viewMode === 'report' ? 'dashboard' : 'report');
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#A56F63] hover:bg-[#8e5e54] transition-all active:scale-95 flex items-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{viewMode === 'report' ? 'Return to Dashboard' : 'Report an Incident'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedIncident(null);
                setViewMode(viewMode === 'my-incidents' ? 'dashboard' : 'my-incidents');
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-xs ${
                viewMode === 'my-incidents'
                  ? 'bg-white text-[#0F3040] border-white font-bold'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{viewMode === 'my-incidents' ? 'Overview Dashboard' : 'My Incidents'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenRoleTester}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-[#D99B7F]" />
              <span>Verify Role Barriers</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'report' ? (
        <ReportIncidentModule
          onIncidentCreated={(ticket) => {
            setSubmittedTickets((prev) => [ticket, ...prev]);
          }}
          onViewIncident={(ticket) => {
            setSelectedIncident(ticket);
            setViewMode('my-incidents');
          }}
          onReturnToDashboard={() => {
            setViewMode('dashboard');
          }}
          onNotify={onNotify}
        />
      ) : viewMode === 'my-incidents' ? (
        <MyIncidentsModule
          tickets={submittedTickets}
          onRefreshTickets={fetchTickets}
          onReportNew={() => {
            setSelectedIncident(null);
            setViewMode('report');
          }}
          selectedIncident={selectedIncident}
          onSelectIncident={(tkt) => {
            setSelectedIncident(tkt);
            if (tkt) {
              setSubmittedTickets((prev) => prev.map((item) => (item.id === tkt.id ? tkt : item)));
            }
          }}
          onNotify={onNotify}
        />
      ) : (
        <>
          {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E7E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#464858] uppercase tracking-wider">My Open Incidents</span>
            <Clock className="w-4 h-4 text-[#93651C]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0F3040] font-heading">
            {submittedTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-[#464858]">Under technician investigation</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#464858] uppercase tracking-wider">In Progress</span>
            <AlertCircle className="w-4 h-4 text-[#405C78]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0F3040] font-heading">
            {submittedTickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-[#464858]">Technician on-site in progress</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#464858] uppercase tracking-wider">Campus SLA Health</span>
            <CheckCircle2 className="w-4 h-4 text-[#286448]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#286448] font-heading">99.8%</div>
          <p className="mt-1 text-[11px] text-[#464858]">Network & Power services optimal</p>
        </div>
      </div>

      {/* Main Grid: Report Form + My Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report New Incident Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF]">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#A56F63]" />
              <h2 className="text-lg font-bold text-[#0F3040] font-heading">Report Infrastructure Incident</h2>
            </div>
            <span className="text-[11px] font-mono text-[#464858]">Reporter: {user?.name}</span>
          </div>

          <form onSubmit={handleCreateReport} className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1.5">
                Incident Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const isSel = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSel
                          ? 'bg-[#A56F63]/15 border-[#A56F63] text-[#0F3040] shadow-xs'
                          : 'bg-[#F5F3EF] border-[#E7E4DF] text-[#464858] hover:border-[#A56F63]/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${isSel ? 'text-[#A56F63]' : 'text-[#464858]'}`} />
                      <div className="text-xs font-bold truncate">{c.name}</div>
                      <div className="text-[10px] text-[#464858] truncate">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="inc-title" className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1">
                Incident Summary / Title
              </label>
              <input
                id="inc-title"
                type="text"
                placeholder="e.g. Wi-Fi router flashing red, high packet loss in Computer Lab 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl saas-input text-[#0F3040] text-xs placeholder-[#8D8B96]"
              />
            </div>

            {/* Priority & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl saas-input text-[#0F3040] text-xs"
                >
                  <option value="Low">Low (Minor inconvenience)</option>
                  <option value="Medium">Medium (Standard issue)</option>
                  <option value="High">High (Classroom disruption)</option>
                  <option value="Critical">Critical (Campus outage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1">
                  Campus Building
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Science Block A"
                  className="w-full px-3 py-2 rounded-xl saas-input text-[#0F3040] text-xs placeholder-[#8D8B96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1">
                  Room / Lab No.
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full px-3 py-2 rounded-xl saas-input text-[#0F3040] text-xs placeholder-[#8D8B96]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="inc-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#464858] mb-1">
                Detailed Description & Error Telemetry
              </label>
              <textarea
                id="inc-desc"
                rows={3}
                placeholder="Describe what occurred, any error codes shown on displays or switches, and when the issue started..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl saas-input text-[#0F3040] text-xs placeholder-[#8D8B96]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide text-white bg-[#0F3040] hover:bg-[#183E4C] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>DISPATCHING INCIDENT TO FIELD DISPATCH...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT CAMPUS INCIDENT TICKET</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: My Incident Tracking */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DF] mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#A56F63]" />
              <h2 className="text-lg font-bold text-[#0F3040] font-heading">My Reported Incidents</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchTickets}
                className="p-1 rounded-lg text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors"
                title="Refresh incident list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin text-[#A56F63]' : ''}`} />
              </button>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F3EF] border border-[#E7E4DF] text-[#A56F63] font-bold">
                {submittedTickets.length} Active
              </span>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {submittedTickets.map((tkt) => (
              <div 
                key={tkt.id}
                className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] hover:border-[#A56F63]/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#A56F63]">{tkt.ticket_number || `INC-${tkt.id}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tkt.priority === 'Critical' ? 'bg-[#F5DEDA] text-[#A33D35] border border-[#A33D35]/30' :
                      tkt.priority === 'High' ? 'bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30' :
                      'bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30'
                    }`}>
                      {tkt.priority}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tkt.status === 'In Progress' ? 'bg-[#F8EBD2] text-[#93651C] border border-[#93651C]/30' :
                    tkt.status === 'Resolved' || tkt.status === 'Closed' ? 'bg-[#DCEDE4] text-[#286448] border border-[#286448]/30' :
                    'bg-[#E5EAF0] text-[#405C78] border border-[#405C78]/30'
                  }`}>
                    {tkt.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#0F3040] leading-snug">{tkt.title}</p>

                <div className="flex items-center justify-between text-[11px] text-[#464858] pt-1 border-t border-[#E7E4DF]">
                  <span>📍 {tkt.building || '—'}{tkt.room ? ` • ${tkt.room}` : ''}</span>
                  <span>{tkt.created_at ? new Date(tkt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                </div>

                <div className="text-[11px] bg-white px-2.5 py-1 rounded text-[#464858] border border-[#E7E4DF] flex items-center justify-between">
                  <span>Assigned: <strong className="text-[#0F3040]">{tkt.technician_name || 'Awaiting Assignment'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
