import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReporterDashboard({ onNotify, onOpenRoleTester }) {
  const { user } = useAuth();

  // New incident report form state (functional interactive preview)
  const [category, setCategory] = useState('network');
  const [priority, setPriority] = useState('Medium');
  const [title, setTitle] = useState('');
  const [building, setBuilding] = useState('Engineering Block B');
  const [room, setRoom] = useState('Lab 304');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTickets, setSubmittedTickets] = useState([
    {
      id: 'TKT-1082',
      title: 'Lab 304 Wi-Fi access point dropping connection periodically',
      category: 'Network',
      priority: 'High',
      status: 'In Progress',
      building: 'Engineering Block B',
      room: 'Lab 304',
      date: 'Today, 11:20 AM',
      technician: 'Marcus Vance (Assigned)',
    },
    {
      id: 'TKT-1055',
      title: 'Projector HDMI port flickering in Lecture Hall 2',
      category: 'Classroom Equipment',
      priority: 'Medium',
      status: 'Open',
      building: 'Science Concourse',
      room: 'Hall 2',
      date: 'Yesterday, 3:45 PM',
      technician: 'Unassigned (In Dispatch Queue)',
    },
  ]);

  const categories = [
    { id: 'network', name: 'Network Infrastructure', icon: Wifi, desc: 'Wi-Fi, Ethernet, routers' },
    { id: 'hardware', name: 'Hardware Systems', icon: Monitor, desc: 'PCs, monitors, keyboards' },
    { id: 'software', name: 'Software & OS', icon: Cpu, desc: 'Lab software, OS license' },
    { id: 'power', name: 'Power & Electrical', icon: Zap, desc: 'Sockets, UPS, power strips' },
    { id: 'classroom', name: 'Classroom Equipment', icon: Tv, desc: 'Projectors, smartboards' },
    { id: 'servers', name: 'Campus Servers', icon: Server, desc: 'Virtual machines, LMS' },
  ];

  const handleCreateReport = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      if (onNotify) onNotify('Please provide a title and detailed problem description', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newTkt = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        category: categories.find((c) => c.id === category)?.name || 'General',
        priority,
        status: 'Open',
        building,
        room,
        date: 'Just now',
        technician: 'Awaiting Administrator Assignment',
      };
      setSubmittedTickets([newTkt, ...submittedTickets]);
      setTitle('');
      setDescription('');
      if (onNotify) onNotify(`Incident report filed successfully! Assigned Ticket #${newTkt.id}`, 'success');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div 
        className="relative rounded-2xl p-6 sm:p-8 border border-[#A56F63]/30 overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(70, 72, 88, 0.45) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider">
                Reporter Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">Role: Reporter ({user?.userType || 'Student'})</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Welcome, {user?.name || 'Campus Reporter'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Report campus infrastructure faults, track investigation milestones, and confirm resolutions. Every incident is prioritized and assigned to field technicians.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenRoleTester}
              className="px-4 py-2.5 rounded-xl bg-[#464858]/50 hover:bg-[#464858] border border-[#A56F63]/40 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-[#D99B7F]" />
              <span>Verify Role Barriers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">My Open Incidents</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">
            {submittedTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Under technician investigation</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</span>
            <AlertCircle className="w-4 h-4 text-[#D99B7F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">
            {submittedTickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Technician on-site in progress</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Campus SLA Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-heading">99.8%</div>
          <p className="mt-1 text-[11px] text-slate-400">Network & Power services optimal</p>
        </div>
      </div>

      {/* Main Grid: Report Form + My Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report New Incident Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#D99B7F]" />
              <h2 className="text-lg font-bold text-white font-heading">Report Infrastructure Incident</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Reporter: {user?.name}</span>
          </div>

          <form onSubmit={handleCreateReport} className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                          ? 'bg-[#D99B7F]/20 border-[#D99B7F] text-white shadow-sm'
                          : 'bg-[#202733]/60 border-slate-500/25 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${isSel ? 'text-[#D99B7F]' : 'text-slate-400'}`} />
                      <div className="text-xs font-bold truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="inc-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Incident Summary / Title
              </label>
              <input
                id="inc-title"
                type="text"
                placeholder="e.g. Wi-Fi router flashing red, high packet loss in Computer Lab 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
              />
            </div>

            {/* Priority & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
                >
                  <option value="Low" className="bg-[#0F3040]">Low (Minor inconvenience)</option>
                  <option value="Medium" className="bg-[#0F3040]">Medium (Standard issue)</option>
                  <option value="High" className="bg-[#0F3040]">High (Classroom disruption)</option>
                  <option value="Critical" className="bg-[#0F3040]">Critical (Campus outage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Campus Building
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Science Block A"
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Room / Lab No.
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="inc-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Detailed Description & Error Telemetry
              </label>
              <textarea
                id="inc-desc"
                rows={3}
                placeholder="Describe what occurred, any error codes shown on displays or switches, and when the issue started..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide text-[#0F3040] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
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
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D99B7F]" />
              <h2 className="text-lg font-bold text-white font-heading">My Reported Incidents</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#D99B7F]/20 text-[#D99B7F] font-bold">
              {submittedTickets.length} Active
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {submittedTickets.map((tkt) => (
              <div 
                key={tkt.id}
                className="p-3.5 rounded-xl bg-[#202733]/70 border border-slate-300/20 hover:border-slate-300/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#D99B7F]">{tkt.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tkt.priority === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      tkt.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                    }`}>
                      {tkt.priority}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tkt.status === 'In Progress' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                    tkt.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {tkt.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white leading-snug">{tkt.title}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-600/20">
                  <span>📍 {tkt.building} • {tkt.room}</span>
                  <span>{tkt.date}</span>
                </div>

                <div className="text-[11px] bg-[#0F3040]/70 px-2.5 py-1 rounded text-slate-300 flex items-center justify-between">
                  <span>Assigned: <strong>{tkt.technician}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
