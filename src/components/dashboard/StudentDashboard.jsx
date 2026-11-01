import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, 
  Wifi, 
  Monitor, 
  Zap, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  FileText, 
  ShieldAlert,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Network Infrastructure');
  const [quickBuilding, setQuickBuilding] = useState('Student Library & Learning Commons');
  const [quickRoom, setQuickRoom] = useState('Study Pod 12');
  const [quickDesc, setQuickDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudentTickets = useCallback(async () => {
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
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudentTickets();
  }, [fetchStudentTickets]);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickDesc.trim()) {
      if (onNotify) onNotify('Please enter a problem title and brief description', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: quickTitle.trim(),
          description: quickDesc.trim(),
          category: quickCategory,
          priority: 'Medium',
          building: quickBuilding.trim(),
          room: quickRoom.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit report');
      }

      setTickets((prev) => [data.ticket, ...prev]);
      setQuickTitle('');
      setQuickDesc('');
      if (onNotify) {
        onNotify(`Student incident filed! Ticket #${data.ticket.ticket_number || data.ticket.id}`, 'success');
      }
    } catch (err) {
      if (onNotify) onNotify(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentShortcuts = [
    { title: 'Wi-Fi Dropping in Dorms', category: 'Network Infrastructure', building: 'Residence Hall West', room: 'Floor 3 Common' },
    { title: 'Lab Computer Blue Screen', category: 'Hardware Systems', building: 'Computer Science Lab', room: 'Lab 102' },
    { title: 'Projector HDMI Blank', category: 'Classroom Equipment', building: 'Main Academic Hall', room: 'Lecture Hall 1' },
    { title: 'Power Outlet Not Working', category: 'Power & Electrical', building: 'Campus Library', room: '2nd Floor Quiet Zone' },
  ];

  const applyShortcut = (sc) => {
    setQuickTitle(sc.title);
    setQuickCategory(sc.category);
    setQuickBuilding(sc.building);
    setQuickRoom(sc.room);
    setQuickDesc(`Encountered recurring issue with ${sc.title.toLowerCase()} in ${sc.building}, ${sc.room}.`);
    if (onNotify) onNotify(`Loaded template: ${sc.title}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div 
        className="relative rounded-2xl p-6 sm:p-8 border border-[#A56F63]/30 overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(70, 72, 88, 0.45) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/40 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {user?.collegeId || 'STU'}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Welcome, {user?.name || 'Campus Student'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Report campus Wi-Fi, computer lab, or dorm infrastructure issues directly to the IT dispatch team and track resolution in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenRoleTester}
              className="px-4 py-2.5 rounded-xl bg-[#464858]/50 hover:bg-[#464858] border border-[#A56F63]/40 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-[#D99B7F]" />
              <span>Verify Security Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campus Service Status for Students */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Campus Wi-Fi</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-heading">Online</div>
          <p className="mt-1 text-[11px] text-slate-400">eduroam 99.8% uptime</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Lab Computers</span>
            <Monitor className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">96%</div>
          <p className="mt-1 text-[11px] text-slate-400">Available across campus</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cloud Printing</span>
            <Printer className="w-4 h-4 text-[#D99B7F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#D99B7F] font-heading">Active</div>
          <p className="mt-1 text-[11px] text-slate-400">Library & Dorm stations</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">My Open Tickets</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">
            {tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Being resolved by field techs</p>
        </div>
      </div>

      {/* Main Content: Quick Report & My Student Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Student Report */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D99B7F]" />
              <h2 className="text-lg font-bold text-white font-heading">Report a Student Issue</h2>
            </div>
            <span className="text-xs text-slate-400">Quick Incident Dispatch</span>
          </div>

          {/* Quick Issue Templates */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Quick Issue Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {studentShortcuts.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyShortcut(sc)}
                  className="p-2 rounded-xl text-left bg-[#202733]/60 hover:bg-[#202733] border border-slate-500/25 hover:border-[#D99B7F]/60 text-slate-200 text-xs transition-all active:scale-98"
                >
                  <div className="font-bold text-white truncate">{sc.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{sc.building}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Issue Summary
              </label>
              <input
                type="text"
                placeholder="e.g. Wi-Fi dropping connection in Dorm Room 304"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Building / Residence
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Library"
                  value={quickBuilding}
                  onChange={(e) => setQuickBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Room / Study Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floor 2 Pod 4"
                  value={quickRoom}
                  onChange={(e) => setQuickRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Problem Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what's not working, error message on screen, or when the problem started..."
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white text-xs placeholder-slate-400"
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
                  <span>NOTIFYING CAMPUS FIELD DISPATCH...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT INCIDENT REPORT</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Student Reported Tickets */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D99B7F]" />
              <h2 className="text-lg font-bold text-white font-heading">My Submitted Reports</h2>
            </div>
            <button
              type="button"
              onClick={fetchStudentTickets}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#464858]/50"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {tickets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/80" />
                <p>No active incidents reported by your account.</p>
                <p className="mt-1 text-[11px] text-slate-500">Need help with campus tech? Submit a report anytime.</p>
              </div>
            ) : (
              tickets.map((tkt) => (
                <div 
                  key={tkt.id}
                  className="p-3.5 rounded-xl bg-[#202733]/70 border border-slate-300/20 hover:border-slate-300/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#D99B7F]">{tkt.ticket_number || tkt.id}</span>
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
                    <span>{tkt.priority} Priority</span>
                  </div>

                  {tkt.technician_name && (
                    <div className="text-[11px] bg-[#0F3040]/70 px-2 py-1 rounded text-slate-300">
                      Assigned Field Specialist: <strong>{tkt.technician_name}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Links Card */}
          <div className="mt-4 pt-3 border-t border-slate-600/20 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Campus Student Help</span>
            <div className="flex flex-col gap-1">
              <a
                href="#eduroam"
                onClick={(e) => { e.preventDefault(); if (onNotify) onNotify('Eduroam: Use your college email and campus password', 'info'); }}
                className="text-[#D99B7F] hover:text-white flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-[#464858]/30 transition-colors"
              >
                <span>How to connect to eduroam Wi-Fi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="#printing"
                onClick={(e) => { e.preventDefault(); if (onNotify) onNotify('Campus printing stations have 200 free semester pages', 'info'); }}
                className="text-[#D99B7F] hover:text-white flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-[#464858]/30 transition-colors"
              >
                <span>Student Cloud Printing Portal & Credits</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
