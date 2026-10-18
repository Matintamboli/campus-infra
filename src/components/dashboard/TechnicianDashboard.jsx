import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldAlert,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TechnicianDashboard({ onNotify, onOpenRoleTester }) {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-1082',
      title: 'Lab 304 Wi-Fi access point dropping connection periodically',
      category: 'Network',
      priority: 'High',
      status: 'In Progress',
      building: 'Engineering Block B',
      room: 'Lab 304',
      reportedBy: 'Alex Rivera (STU-8821)',
      time: 'Today, 11:20 AM',
      notes: [
        'Diagnosed Cisco AP 2802; beacon signal drops during heavy multicast.',
        'Swapped PoE power injector; testing channel saturation.',
      ],
    },
    {
      id: 'TKT-1049',
      title: 'Server Rack 4 UPS battery warning in CS Datacenter',
      category: 'Power',
      priority: 'Critical',
      status: 'Assigned',
      building: 'Main Data Center',
      room: 'Server Room 1',
      reportedBy: 'Facility Ops Telemetry',
      time: 'Today, 08:15 AM',
      notes: ['Dispatched on-site with replacement APC battery pack modules.'],
    },
    {
      id: 'TKT-1033',
      title: 'Workstation 12 GPU failure in CAD Simulation Suite',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Assigned',
      building: 'Design & Tech Lab',
      room: 'Studio 4',
      reportedBy: 'Prof. J. Myers (FAC-3312)',
      time: 'Yesterday, 4:10 PM',
      notes: ['RTX workstation display driver crashing on CUDA kernels.'],
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState(tickets[0]);
  const [newNote, setNewNote] = useState('');

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
    }
    if (onNotify) onNotify(`Ticket ${ticketId} status updated to ${newStatus}`, 'success');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteText = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${user?.name || 'Technician'}]: ${newNote.trim()}`;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id ? { ...t, notes: [...t.notes, noteText] } : t
      )
    );

    setSelectedTicket((prev) => ({
      ...prev,
      notes: [...prev.notes, noteText],
    }));

    setNewNote('');
    if (onNotify) onNotify('Technician investigation log recorded', 'success');
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div 
        className="relative rounded-2xl p-6 sm:p-8 border border-amber-500/30 overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(88, 70, 50, 0.35) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                Field Technician Queue
              </span>
              <span className="text-xs text-slate-400 font-mono">Specialist: {user?.name}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Technician Incident Workspace
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Inspect assigned campus infrastructure reports, document technical troubleshooting logs, and mark tickets as In Progress or Resolved.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRoleTester}
            className="px-4 py-2.5 rounded-xl bg-[#464858]/50 hover:bg-[#464858] border border-amber-500/30 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Verify Role Barriers</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned to Me</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">{tickets.length}</div>
          <p className="mt-1 text-[11px] text-slate-400">Field work orders</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</span>
            <Wrench className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-sky-300 font-heading">
            {tickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Active investigation</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-heading">
            {tickets.filter((t) => t.status === 'Resolved').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ready for user confirmation</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Filter Queue:</span>
        {['all', 'assigned', 'in progress', 'resolved'].map((filterVal) => (
          <button
            key={filterVal}
            onClick={() => setActiveFilter(filterVal)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeFilter === filterVal
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-[#202733]/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {filterVal}
          </button>
        ))}
      </div>

      {/* 2-Column Split: Ticket List & Ticket Detail / Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredTickets.map((tkt) => {
            const isSelected = selectedTicket.id === tkt.id;
            return (
              <div
                key={tkt.id}
                onClick={() => setSelectedTicket(tkt)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1a222d] border-amber-500/60 shadow-lg scale-[1.01]'
                    : 'bg-[#202733]/70 border-slate-300/15 hover:border-slate-300/35'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-300">{tkt.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tkt.priority === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      tkt.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {tkt.priority}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tkt.status === 'In Progress' ? 'bg-sky-500/20 text-sky-300' :
                    tkt.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {tkt.status}
                  </span>
                </div>

                <h3 className="mt-2 text-xs font-bold text-white line-clamp-1">{tkt.title}</h3>
                <p className="mt-1 text-[11px] text-slate-400">📍 {tkt.building} • {tkt.room}</p>
              </div>
            );
          })}
        </div>

        {/* Selected Ticket Action & Investigation Logs */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#1a222d]/90 border border-slate-300/25 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#A56F63]/25">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300">{selectedTicket.id}</span>
                <span className="text-xs text-slate-400">• Category: {selectedTicket.category}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 font-heading">{selectedTicket.title}</h2>
              <p className="text-xs text-slate-400">Reported by {selectedTicket.reportedBy} • {selectedTicket.time}</p>
            </div>

            {/* Status Transition Control */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#202733]/80 border border-slate-300/20">
              {['Assigned', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(selectedTicket.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedTicket.status === st
                      ? 'bg-amber-500 text-[#0F3040] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Priority Detail Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/15">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Campus Coordinates</span>
              <p className="text-xs font-bold text-white mt-0.5">{selectedTicket.building}</p>
              <p className="text-xs text-slate-300">{selectedTicket.room}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#202733]/60 border border-slate-300/15">
              <span className="text-[10px] uppercase font-semibold text-slate-400">SLA Severity Level</span>
              <p className="text-xs font-bold text-amber-300 mt-0.5">{selectedTicket.priority} Priority</p>
              <p className="text-xs text-slate-300">Target Resolution: 4 Hours</p>
            </div>
          </div>

          {/* Chronological Investigation Logs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Technician Diagnostic & Parts Log</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedTicket.notes.map((note, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/25 text-xs text-slate-200 leading-relaxed font-mono">
                  {note}
                </div>
              ))}
            </div>

            {/* Add Log Form */}
            <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Log diagnostic note, cable swapped, or firmware patch..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-white placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0F3040] font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Log Note</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
