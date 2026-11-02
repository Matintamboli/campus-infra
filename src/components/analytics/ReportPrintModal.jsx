import React from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';

export default function ReportPrintModal({
  isOpen,
  onClose,
  reportData,
  appliedFilters,
  currentUser,
  onExportCsv,
}) {
  if (!isOpen || !reportData) return null;

  const { kpis, charts, ticketsLedger, reportMetadata } = reportData;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container - on print, expands to full page with white theme */}
      <div className="bg-[#101721] print:bg-white text-slate-100 print:text-black w-full max-w-5xl rounded-3xl print:rounded-none border border-slate-700/80 print:border-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-[#1a222d] border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Institutional Report Preview</h3>
              <p className="text-[10px] text-slate-400">
                Ready for institutional review, archival print, or export as PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#202733] border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#0F3040] flex items-center gap-1.5 shadow transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #A56F63, #D99B7F)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 print:p-0 print:space-y-6 text-sm">
          {/* ── Document Header ── */}
          <div className="border-b-2 border-[#D99B7F] print:border-black pb-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-[#D99B7F]/20 text-[#D99B7F] print:bg-slate-200 print:text-black border border-[#D99B7F]/30 print:border-black">
                    Official Institutional Audit
                  </span>
                  <span className="text-xs text-slate-400 print:text-slate-600 font-mono">
                    REF: CFX-AUD-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black font-heading mt-2">
                  CampusFix Infrastructure Operations & Performance Report
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-700">
                  Facilities Management, Network Architecture, and Incident Resolution Velocity Audit
                </p>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-400 print:text-slate-700 flex-shrink-0">
                <p className="font-bold text-white print:text-black">DIRECTORATE OF FACILITIES</p>
                <p>Campus Operations Division</p>
                <p>{new Date().getFullYear()} Academic Year</p>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="p-3.5 rounded-2xl bg-[#161d27] print:bg-slate-100 border border-slate-800 print:border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Generated On
                </span>
                <span className="font-medium text-slate-200 print:text-black">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Requested By
                </span>
                <span className="font-medium text-slate-200 print:text-black">
                  {currentUser?.name || reportMetadata?.generatedBy || 'Administrator'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Authority Role
                </span>
                <span className="font-medium text-slate-200 print:text-black">
                  {currentUser?.role || reportMetadata?.generatedRole || 'Administrator'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Time Window
                </span>
                <span className="font-medium text-[#D99B7F] print:text-black capitalize font-bold">
                  {appliedFilters.timeRange === '7d'
                    ? 'Last 7 Days'
                    : appliedFilters.timeRange === '30d'
                    ? 'Last 30 Days'
                    : appliedFilters.timeRange === '3m'
                    ? 'Last 3 Months'
                    : appliedFilters.timeRange === 'today'
                    ? 'Today'
                    : appliedFilters.timeRange === 'custom'
                    ? `Custom (${appliedFilters.startDate || '—'} to ${appliedFilters.endDate || '—'})`
                    : 'All Historical'}
                </span>
              </div>
            </div>

            {/* Filter Manifest Badges */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
              <span className="text-slate-400 print:text-slate-600 font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3" /> Active Filter Scope:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 print:bg-slate-200 text-slate-300 print:text-black font-mono">
                Building: {appliedFilters.building || 'All'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 print:bg-slate-200 text-slate-300 print:text-black font-mono">
                Category: {appliedFilters.category || 'All'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 print:bg-slate-200 text-slate-300 print:text-black font-mono">
                Priority: {appliedFilters.priority || 'All'}
              </span>
            </div>
          </div>

          {/* ── Section 1: Executive KPI Scorecard ── */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#D99B7F] print:text-black flex items-center gap-2">
              <span>1. Executive Performance Indicators</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold">Total Logged</span>
                <div className="text-2xl font-black text-white print:text-black font-heading mt-1">
                  {kpis.totalIncidents}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Incidents logged</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-amber-400 print:text-amber-800 uppercase font-bold">Open Active</span>
                <div className="text-2xl font-black text-amber-300 print:text-black font-heading mt-1">
                  {kpis.openIncidents}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Awaiting triage</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-emerald-400 print:text-emerald-800 uppercase font-bold">Resolved Total</span>
                <div className="text-2xl font-black text-emerald-300 print:text-black font-heading mt-1">
                  {kpis.resolvedIncidents}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Successfully closed</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-red-400 print:text-red-800 uppercase font-bold">Critical Severity</span>
                <div className="text-2xl font-black text-red-300 print:text-black font-heading mt-1">
                  {kpis.criticalIncidents}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Highest tier</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-purple-400 print:text-purple-800 uppercase font-bold">Avg Response Time</span>
                <div className="text-2xl font-black text-purple-300 print:text-black font-heading mt-1">
                  {kpis.avgResponseTime}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Creation to dispatch</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-[#D99B7F] print:text-black uppercase font-bold">Avg Resolution Time</span>
                <div className="text-2xl font-black text-[#D99B7F] print:text-black font-heading mt-1">
                  {kpis.avgResolutionTime}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Creation to completion</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-sky-400 print:text-sky-800 uppercase font-bold">Resolution Rate</span>
                <div className="text-2xl font-black text-sky-300 print:text-black font-heading mt-1">
                  {kpis.resolutionRate}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Clearance efficiency</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d27] print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-rose-400 print:text-rose-800 uppercase font-bold">Recurring Issues</span>
                <div className="text-2xl font-black text-rose-300 print:text-black font-heading mt-1">
                  {kpis.recurringIncidents}
                </div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Cluster repeat count</span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Distribution Tables ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Category breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
                Category Incident Density
              </h3>
              <table className="w-full text-xs text-left border-collapse border border-slate-800 print:border-slate-300">
                <thead>
                  <tr className="bg-[#17202b] print:bg-slate-200 text-slate-300 print:text-black">
                    <th className="p-2 border border-slate-800 print:border-slate-300">Category</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Incidents</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.categoryDistribution?.map((cat, i) => (
                    <tr key={i} className="border-b border-slate-800/60 print:border-slate-300">
                      <td className="p-2 border border-slate-800 print:border-slate-300 font-medium text-slate-200 print:text-black">
                        {cat.name}
                      </td>
                      <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono font-bold text-white print:text-black">
                        {cat.count}
                      </td>
                      <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-slate-400 print:text-slate-700">
                        {cat.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Building Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
                Campus Building Distribution
              </h3>
              <table className="w-full text-xs text-left border-collapse border border-slate-800 print:border-slate-300">
                <thead>
                  <tr className="bg-[#17202b] print:bg-slate-200 text-slate-300 print:text-black">
                    <th className="p-2 border border-slate-800 print:border-slate-300">Building</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Total</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Resolved</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.buildingDistribution?.slice(0, 6).map((b, i) => (
                    <tr key={i} className="border-b border-slate-800/60 print:border-slate-300">
                      <td className="p-2 border border-slate-800 print:border-slate-300 font-medium text-slate-200 print:text-black">
                        {b.building}
                      </td>
                      <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono font-bold text-white print:text-black">
                        {b.total}
                      </td>
                      <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-emerald-400 print:text-emerald-800 font-semibold">
                        {b.resolved}
                      </td>
                      <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-amber-400 print:text-amber-800 font-semibold">
                        {b.open}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 3: Technician Workload ── */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
              Technician Field Resolution Performance
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-800 print:border-slate-300">
              <thead>
                <tr className="bg-[#17202b] print:bg-slate-200 text-slate-300 print:text-black">
                  <th className="p-2 border border-slate-800 print:border-slate-300">Technician</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300">Department</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Assigned</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Resolved</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Clearance</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Avg Velocity</th>
                </tr>
              </thead>
              <tbody>
                {charts.technicianWorkload?.map((tech) => (
                  <tr key={tech.id} className="border-b border-slate-800/60 print:border-slate-300">
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-bold text-white print:text-black">
                      {tech.name} ({tech.collegeId})
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-700">
                      {tech.department}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-slate-200 print:text-black font-semibold">
                      {tech.assignedTotal}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-emerald-400 print:text-emerald-800 font-bold">
                      {tech.resolvedCount}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-slate-300 print:text-black">
                      {tech.resolutionRate}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-mono text-[#D99B7F] print:text-black font-semibold">
                      {tech.avgResolutionHours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Section 4: Incident Register Ledger ── */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center justify-between">
              <span>Detailed Incident Audit Ledger</span>
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 font-normal">
                Showing {ticketsLedger?.length || 0} incidents
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-800 print:border-slate-300">
                <thead>
                  <tr className="bg-[#17202b] print:bg-slate-200 text-slate-300 print:text-black">
                    <th className="p-2 border border-slate-800 print:border-slate-300">Ticket #</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Title</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Category</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Priority</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Location</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Technician</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Status</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Reported</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsLedger?.slice(0, 30).map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/60 print:border-slate-300">
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 font-mono font-bold text-[#D99B7F] print:text-black">
                        {t.ticketNumber}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 max-w-[200px] truncate text-slate-200 print:text-black font-medium">
                        {t.title}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 text-slate-300 print:text-black">
                        {t.category}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 font-semibold">
                        <span
                          className={
                            t.priority === 'Critical'
                              ? 'text-red-400 print:text-red-800'
                              : t.priority === 'High'
                              ? 'text-amber-400 print:text-amber-800'
                              : 'text-slate-300 print:text-black'
                          }
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-700">
                        {t.building} - {t.room}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 text-slate-300 print:text-black">
                        {t.technicianName}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 font-semibold">
                        <span
                          className={
                            t.status === 'Resolved' || t.status === 'Closed'
                              ? 'text-emerald-400 print:text-emerald-800'
                              : t.status === 'Open'
                              ? 'text-amber-400 print:text-amber-800'
                              : 'text-sky-400 print:text-sky-800'
                          }
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 text-right font-mono text-slate-400 print:text-slate-600">
                        {t.createdAt?.slice(0, 10)}
                      </td>
                      <td className="p-1.5 border border-slate-800 print:border-slate-300 text-right font-mono font-bold text-slate-200 print:text-black">
                        {t.durationHours ? `${t.durationHours}h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 5: Institutional Attestation & Sign-Off ── */}
          <div className="pt-8 border-t-2 border-slate-800 print:border-slate-400 grid grid-cols-2 gap-12 text-xs">
            <div className="space-y-4">
              <p className="text-slate-400 print:text-slate-600 italic">
                "I hereby certify that this audit report accurately represents the recorded operational infrastructure events, maintenance schedules, and SLA timestamps within the campus database."
              </p>
              <div className="pt-8 border-b border-dashed border-slate-600 print:border-black max-w-xs" />
              <div>
                <p className="font-bold text-white print:text-black">Director of Campus Infrastructure</p>
                <p className="text-[10px] text-slate-400 print:text-slate-600">Institutional Facilities Authority</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-400 print:text-slate-600 italic">
                "Technician dispatches, maintenance logs, and resolution verifications have been reconciled against automated network telemetry and field reports."
              </p>
              <div className="pt-8 border-b border-dashed border-slate-600 print:border-black max-w-xs" />
              <div>
                <p className="font-bold text-white print:text-black">Operations Lead & Systems Administrator</p>
                <p className="text-[10px] text-slate-400 print:text-slate-600">Campus Infrastructure Incident Center</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

