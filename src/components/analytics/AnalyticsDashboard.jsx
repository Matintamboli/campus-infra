import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  RefreshCw,
  Filter,
  Calendar,
  Building2,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Search,
  Layers,
  ChevronDown,
  X,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  IncidentsLineChart,
  DonutChart,
  PriorityBarChart,
  BuildingDistributionChart,
  MonthlyTrendsChart,
  TechnicianWorkloadChart,
  FrequentlyAffectedServices,
} from './AnalyticsCharts';
import ReportPrintModal from './ReportPrintModal';
import StatusBadge from '../ui/StatusBadge';

export default function AnalyticsDashboard({ onNavigateToIncident }) {
  const { token, user } = useAuth();

  // ── Filters State ──────────────────────────────────────────────────────────
  const [timeRange, setTimeRange] = useState('30d'); // 'today' | '7d' | '30d' | '3m' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [building, setBuilding] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [searchLedger, setSearchLedger] = useState('');

  // ── Data & Loading State ───────────────────────────────────────────────────
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // ── Fetch Analytics Data ───────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (timeRange === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (building !== 'all') params.append('building', building);
      if (category !== 'all') params.append('category', category);
      if (priority !== 'all') params.append('priority', priority);

      const res = await fetch(`/api/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Analytics API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('[Analytics Fetch Error]:', err);
      setError(err.message || 'Failed to load institutional analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [token, timeRange, startDate, endDate, building, category, priority]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    if (!token) return;
    setIsExportingCsv(true);
    try {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (timeRange === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (building !== 'all') params.append('building', building);
      if (category !== 'all') params.append('category', category);
      if (priority !== 'all') params.append('priority', priority);

      const res = await fetch(`/api/analytics/export/csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export CSV failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusFix-Incident-Report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[CSV Export Error]:', err);
      alert('Failed to export CSV report. Please try again.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // ── Reset Filters ──────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setTimeRange('30d');
    setStartDate('');
    setEndDate('');
    setBuilding('all');
    setCategory('all');
    setPriority('all');
    setSearchLedger('');
  };

  const hasActiveFilters =
    timeRange !== '30d' || building !== 'all' || category !== 'all' || priority !== 'all';

  // ── Filtered Ledger Table ──────────────────────────────────────────────────
  const filteredLedger = useMemo(() => {
    if (!data?.ticketsLedger) return [];
    if (!searchLedger.trim()) return data.ticketsLedger;
    const q = searchLedger.toLowerCase();
    return data.ticketsLedger.filter(
      (t) =>
        (t.ticketNumber || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.building || '').toLowerCase().includes(q) ||
        (t.room || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.technicianName || '').toLowerCase().includes(q)
    );
  }, [data?.ticketsLedger, searchLedger]);

  const kpis = data?.kpis || {
    totalIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    recurringIncidents: 0,
    avgResponseTime: '—',
    avgResolutionTime: '—',
    resolutionRate: '0%',
  };

  const charts = data?.charts || {};
  const filterOptions = data?.filterOptions || { buildings: [], categories: [], priorities: [] };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Report Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E7E4DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#183E4C] text-[#D99B7F]">
              Campus Operations Intelligence
            </span>
            <span className="text-xs text-[#464858] font-mono">Live Database Aggregation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F3040] font-heading mt-1 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#A56F63]" />
            <span>Infrastructure Analytics & SLA Performance</span>
          </h1>
          <p className="text-xs text-[#464858] mt-0.5">
            Institutional operational metrics, velocity tracking, incident patterns, and field technician dispatch efficiency.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E7E4DF] text-[#464858] hover:text-[#0F3040] hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A56F63]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExportingCsv || !data}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#E7E4DF] text-[#183E4C] hover:text-[#0F3040] hover:border-[#0F3040]/30 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#A56F63]" />
            <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!data}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-[#0F3040] hover:bg-[#183E4C] flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#D99B7F]" />
            <span>Generate PDF / Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Range Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#464858] uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#A56F63]" /> Range:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '3m', label: 'Last 3 Months' },
              { id: 'all', label: 'All History' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => {
              const isActive = timeRange === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTimeRange(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0F3040] text-white font-bold shadow-xs'
                      : 'bg-[#F5F3EF] text-[#464858] hover:text-[#0F3040] border border-[#E7E4DF]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#A33D35] hover:underline flex items-center gap-1 transition-colors self-start lg:self-auto font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Custom Date Pickers */}
        {timeRange === 'custom' && (
          <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[#183E4C] font-semibold">Custom Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#464858]">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E4DF] text-[#0F3040] font-mono text-xs outline-none focus:border-[#0F3040]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#464858]">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E4DF] text-[#0F3040] font-mono text-xs outline-none focus:border-[#0F3040]"
              />
            </div>
          </div>
        )}

        {/* Multi-Select Filters: Building, Category, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E7E4DF]">
          {/* Building */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#464858] mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#A56F63]" /> Building
            </label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#0F3040] font-medium focus:outline-none focus:border-[#0F3040] transition-colors"
            >
              <option value="all">All Campus Buildings</option>
              {filterOptions.buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#464858] mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#A56F63]" /> Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#0F3040] font-medium focus:outline-none focus:border-[#0F3040] transition-colors"
            >
              <option value="all">All Infrastructure Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#464858] mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-[#A56F63]" /> Severity Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#0F3040] font-medium focus:outline-none focus:border-[#0F3040] transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#F5DEDA] border border-[#A33D35]/30 text-[#A33D35] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#A33D35]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3 py-1 rounded-lg bg-white text-[#A33D35] font-bold text-[11px] border border-[#A33D35]/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 8 KEY PERFORMANCE INDICATOR CARDS (Clean White Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#464858]">Total Logged</span>
          <div className="text-2xl font-black text-[#0F3040] font-heading">{kpis.totalIncidents}</div>
          <p className="text-[10px] text-[#464858] truncate">Filtered window</p>
        </div>

        {/* 2. Open Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#405C78]">Open Triage</span>
          <div className="text-2xl font-black text-[#405C78] font-heading">{kpis.openIncidents}</div>
          <p className="text-[10px] text-[#405C78] truncate">Pending dispatch</p>
        </div>

        {/* 3. Resolved Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#286448]">Resolved</span>
          <div className="text-2xl font-black text-[#286448] font-heading">{kpis.resolvedIncidents}</div>
          <p className="text-[10px] text-[#286448] truncate">Complete / Closed</p>
        </div>

        {/* 4. Critical Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A33D35]">Critical</span>
          <div className="text-2xl font-black text-[#A33D35] font-heading">{kpis.criticalIncidents}</div>
          <p className="text-[10px] text-[#A33D35] truncate">Immediate hazard</p>
        </div>

        {/* 5. Avg Response Time */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#183E4C]">Avg Response</span>
          <div className="text-2xl font-black text-[#183E4C] font-heading">{kpis.avgResponseTime}</div>
          <p className="text-[10px] text-[#464858] truncate">Log to first note</p>
        </div>

        {/* 6. Avg Resolution Time */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A56F63]">Avg Resolution</span>
          <div className="text-2xl font-black text-[#A56F63] font-heading">{kpis.avgResolutionTime}</div>
          <p className="text-[10px] text-[#464858] truncate">Log to resolved</p>
        </div>

        {/* 7. Resolution Rate */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#286448]">Clearance</span>
          <div className="text-2xl font-black text-[#286448] font-heading">{kpis.resolutionRate}</div>
          <p className="text-[10px] text-[#464858] truncate">Ratio completed</p>
        </div>

        {/* 8. Recurring Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E4DF] shadow-xs space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#93651C]">Recurring</span>
          <div className="text-2xl font-black text-[#93651C] font-heading">{kpis.recurringIncidents}</div>
          <p className="text-[10px] text-[#464858] truncate">Cluster repeats</p>
        </div>
      </div>

      {/* ── EMPTY STATE (If zero records match filters) ── */}
      {kpis.totalIncidents === 0 && !isLoading && (
        <div className="p-12 rounded-3xl bg-white border border-[#E7E4DF] text-center space-y-3 shadow-xs">
          <Layers className="w-12 h-12 mx-auto text-[#464858]" />
          <h3 className="text-base font-bold text-[#0F3040]">No incidents match the applied filter criteria</h3>
          <p className="text-xs text-[#464858] max-w-md mx-auto">
            Try expanding the date range (e.g. "Last 3 Months" or "All History") or clearing building/category filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F3040] hover:bg-[#183E4C]"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* ── CHARTS SECTION (White Cards on Warm Ivory) ── */}
      {kpis.totalIncidents > 0 && (
        <div className="space-y-6">
          {/* Row 1: Line Chart (Over Time) + Category Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Incidents Reported Over Time */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#A56F63]" />
                    <span>Incidents Reported Over Time</span>
                  </h3>
                  <p className="text-[11px] text-[#464858]">
                    Velocity timeline showing reported volume vs resolved completions
                  </p>
                </div>
              </div>
              <IncidentsLineChart data={charts.incidentsOverTime} />
            </div>

            {/* Chart 2: Incidents by Category */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#A56F63]" />
                  <span>Incidents by Category</span>
                </h3>
                <p className="text-[11px] text-[#464858]">Proportional share by infrastructure domain</p>
              </div>
              <DonutChart data={charts.categoryDistribution} title="Category Share" centerLabel="Total" />
            </div>
          </div>

          {/* Row 2: Priority Bar Chart + Status Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 3: Priority Severity Breakdown */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#93651C]" />
                  <span>Incidents by Priority & Severity</span>
                </h3>
                <p className="text-[11px] text-[#464858]">
                  Critical, High, Medium, and Low clearance rates
                </p>
              </div>
              <PriorityBarChart data={charts.priorityDistribution} />
            </div>

            {/* Chart 4: Lifecycle Status Distribution */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#405C78]" />
                  <span>Incidents by Lifecycle Status</span>
                </h3>
                <p className="text-[11px] text-[#464858]">Active operational progression queue</p>
              </div>
              <DonutChart data={charts.statusDistribution} title="Status Flow" centerLabel="Active" />
            </div>
          </div>

          {/* Row 3: Building Distribution + Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 5: Building-Wise Incident Distribution */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0F3040]" />
                  <span>Building-Wise Incident Distribution</span>
                </h3>
                <p className="text-[11px] text-[#464858]">Campus locations ranked by maintenance volume</p>
              </div>
              <BuildingDistributionChart data={charts.buildingDistribution} />
            </div>

            {/* Chart 7: Monthly Incident Trends */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#286448]" />
                  <span>Monthly Incident & Resolution Trends</span>
                </h3>
                <p className="text-[11px] text-[#464858]">
                  Comparative 6-month historical volume and throughput
                </p>
              </div>
              <MonthlyTrendsChart data={charts.monthlyTrends} />
            </div>
          </div>

          {/* Row 4: Technician Workload + Frequently Affected Services */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 6: Technician Performance & Workload */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#0F3040]" />
                  <span>Technician Performance & Field Workload</span>
                </h3>
                <p className="text-[11px] text-[#464858]">
                  Task allocation, resolution velocity, and specialist clearance ratings
                </p>
              </div>
              <TechnicianWorkloadChart data={charts.technicianWorkload} />
            </div>

            {/* Chart 8: Frequently Affected Campus Services */}
            <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#93651C]" />
                  <span>Frequently Affected Services</span>
                </h3>
                <p className="text-[11px] text-[#464858]">Institutional campus services ranked by tickets</p>
              </div>
              <FrequentlyAffectedServices data={charts.affectedServices} />
            </div>
          </div>

          {/* ── Row 5: Detailed Incident Records Ledger (Searchable Table) ── */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E4DF] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3040] font-heading flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A56F63]" />
                  <span>Filtered Incident Records Ledger</span>
                  <span className="text-xs text-[#464858] font-mono">({filteredLedger.length})</span>
                </h3>
                <p className="text-[11px] text-[#464858]">
                  Individual database records matching applied filter criteria with calculated resolution times
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#464858]" />
                <input
                  type="text"
                  placeholder="Search ledger by ticket, title, building..."
                  value={searchLedger}
                  onChange={(e) => setSearchLedger(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#0F3040] placeholder-slate-400 focus:outline-none focus:border-[#0F3040]"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E7E4DF]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F3EF] text-[#464858] text-[10px] uppercase font-bold tracking-wider border-b border-[#E7E4DF]">
                  <tr>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Issue Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Building / Room</th>
                    <th className="p-3">Technician</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Reported</th>
                    <th className="p-3 text-right">Resolution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E4DF]">
                  {filteredLedger.slice(0, 25).map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onNavigateToIncident && onNavigateToIncident(t.id)}
                      className="hover:bg-[#F5F3EF]/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-mono font-bold text-[#0F3040] group-hover:underline flex items-center gap-1.5">
                        <span>{t.ticketNumber}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="p-3 font-semibold text-[#183E4C] max-w-xs truncate">{t.title}</td>
                      <td className="p-3 text-[#464858]">{t.category}</td>
                      <td className="p-3">
                        <StatusBadge status={t.priority} size="sm" />
                      </td>
                      <td className="p-3 text-[#464858]">
                        {t.building} <span className="text-slate-400">• {t.room}</span>
                      </td>
                      <td className="p-3 text-[#464858]">{t.technicianName}</td>
                      <td className="p-3">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="p-3 text-right font-mono text-[#464858]">{t.createdAt?.slice(0, 10)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#A56F63]">
                        {t.durationHours ? `${t.durationHours}h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLedger.length > 25 && (
              <div className="p-2 text-center text-xs text-[#464858] font-mono">
                Showing top 25 of {filteredLedger.length} incidents. Export CSV to analyze complete database records.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Report Print / PDF Modal ── */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={data}
        appliedFilters={{
          timeRange,
          startDate,
          endDate,
          building,
          category,
          priority,
        }}
        currentUser={user}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
}
