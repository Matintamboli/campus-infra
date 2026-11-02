import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Wrench,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

// ─── Theme Constants ─────────────────────────────────────────────────────────
export const CHART_COLORS = {
  teal: '#0F3040',
  roseGold: '#D99B7F',
  terracotta: '#A56F63',
  slate: '#464858',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  sky: '#38bdf8',
  purple: '#a855f7',
  indigo: '#6366f1',
};

// ─── 1. Interactive SVG Line Chart (Incidents Over Time) ─────────────────────
export function IncidentsLineChart({ data = [], height = 260 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <Clock className="w-8 h-8 mb-2 text-slate-600" />
        <p className="text-sm font-semibold">No incident activity recorded in this period</p>
      </div>
    );
  }

  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const width = 640;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxTotal = Math.max(...data.map((d) => d.total || 0), 4);
  const yTicks = 4;
  const yStep = Math.ceil(maxTotal / yTicks);
  const yMax = yStep * yTicks;

  const getX = (index) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val) => {
    return padding.top + plotHeight - (val / yMax) * plotHeight;
  };

  // Build path strings
  const totalPoints = data.map((d, i) => `${getX(i)},${getY(d.total || 0)}`);
  const resolvedPoints = data.map((d, i) => `${getX(i)},${getY(d.resolved || 0)}`);

  const totalPath = totalPoints.length > 0 ? `M ${totalPoints.join(' L ')}` : '';
  const resolvedPath = resolvedPoints.length > 0 ? `M ${resolvedPoints.join(' L ')}` : '';

  // Area under total curve
  const areaPath =
    totalPoints.length > 0
      ? `M ${getX(0)},${padding.top + plotHeight} L ${totalPoints.join(' L ')} L ${getX(
          data.length - 1
        )},${padding.top + plotHeight} Z`
      : '';

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#D99B7F]" />
            <span className="font-semibold text-slate-300">Total Reported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">Resolved</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Max Peak: {maxTotal} incidents</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D99B7F" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D99B7F" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = yStep * i;
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeOpacity="0.5"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

        {/* Resolved Line */}
        {resolvedPath && (
          <path
            d={resolvedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Total Line */}
        {totalPath && (
          <path
            d={totalPath}
            fill="none"
            stroke="#D99B7F"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Dots and Vertical Hover Guideline */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cyTotal = getY(d.total || 0);
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <line
                  x1={cx}
                  y1={padding.top}
                  x2={cx}
                  y2={padding.top + plotHeight}
                  stroke="#D99B7F"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {/* Invisible large touch target */}
              <circle cx={cx} cy={cyTotal} r="14" fill="transparent" />

              {/* Resolved point */}
              <circle
                cx={cx}
                cy={getY(d.resolved || 0)}
                r={isHovered ? 5 : 3}
                fill="#10b981"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Total point */}
              <circle
                cx={cx}
                cy={cyTotal}
                r={isHovered ? 6 : 4}
                fill="#D99B7F"
                stroke="#0F3040"
                strokeWidth="2"
              />

              {/* X Axis Labels */}
              {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={padding.top + plotHeight + 18}
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded-xl bg-[#1e293b]/95 border border-[#D99B7F]/40 shadow-xl backdrop-blur-md text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: `${(getY(data[hoveredIdx].total || 0) / height) * 100 - 8}%`,
          }}
        >
          <div className="font-bold text-white border-b border-slate-700/60 pb-1 flex items-center justify-between gap-3">
            <span>{data[hoveredIdx].label}</span>
            {data[hoveredIdx].date && (
              <span className="text-[10px] text-slate-400 font-mono">{data[hoveredIdx].date}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#D99B7F]" /> Total Reported:
            </span>
            <span className="font-extrabold text-[#D99B7F] font-mono">{data[hoveredIdx].total || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Resolved:
            </span>
            <span className="font-extrabold text-emerald-400 font-mono">{data[hoveredIdx].resolved || 0}</span>
          </div>
          {data[hoveredIdx].critical > 0 && (
            <div className="flex items-center justify-between gap-4 text-red-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Critical:
              </span>
              <span className="font-extrabold text-red-400 font-mono">{data[hoveredIdx].critical}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 2. Interactive SVG Donut Chart (Category & Status) ───────────────────────
export function DonutChart({
  data = [],
  title = 'Distribution',
  size = 200,
  strokeWidth = 26,
  centerLabel = 'Total',
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = data.reduce((acc, curr) => acc + (curr.count || 0), 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <Layers className="w-8 h-8 mb-2 text-slate-600" />
        <p className="text-xs font-semibold">No records available</p>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 w-full">
      {/* SVG Ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />

          {data.map((item, idx) => {
            const count = item.count || 0;
            const percent = count / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredSlice === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color || CHART_COLORS.roseGold}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>

        {/* Center Details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {hoveredSlice !== null && data[hoveredSlice] ? (
            <>
              <span className="text-xs font-bold text-slate-300 truncate max-w-[110px] px-1">
                {data[hoveredSlice].name || data[hoveredSlice].status}
              </span>
              <span className="text-xl font-extrabold text-white font-mono">
                {data[hoveredSlice].count}
              </span>
              <span className="text-[10px] font-semibold text-[#D99B7F]">
                {data[hoveredSlice].percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {centerLabel}
              </span>
              <span className="text-2xl font-black text-white font-heading">{total}</span>
              <span className="text-[10px] text-slate-400">Incidents</span>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full max-w-xs space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const isHovered = hoveredSlice === idx;
          const label = item.name || item.status;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-2 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                isHovered ? 'bg-[#202733] border border-slate-700' : 'hover:bg-[#1a222d]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 font-medium truncate" title={label}>
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                <span className="text-white font-bold">{item.count}</span>
                <span className="text-slate-400">({item.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 3. Priority Severity Bar Chart ──────────────────────────────────────────
export function PriorityBarChart({ data = [] }) {
  const total = data.reduce((acc, curr) => acc + (curr.count || 0), 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <p className="text-xs font-semibold">No priority data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {data.map((item) => {
        const pct = item.percentage || 0;
        const resRate = item.count > 0 ? Math.round((item.resolved / item.count) * 100) : 0;

        return (
          <div key={item.priority} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-bold text-white">{item.priority} Priority</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({item.resolved} resolved / {item.open} open)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-extrabold text-white">{item.count}</span>
                <span className="text-slate-400 text-[11px]">({pct}%)</span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Resolution Rate: {resRate}%</span>
              <span>{item.open > 0 ? `${item.open} action required` : 'All cleared'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 4. Building-Wise Incident Distribution ─────────────────────────────────
export function BuildingDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <p className="text-xs font-semibold">No campus building incidents recorded</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((b) => b.total || 0), 1);

  return (
    <div className="space-y-3">
      {data.map((b, idx) => {
        const barWidth = Math.round((b.total / maxCount) * 100);

        return (
          <div
            key={idx}
            className="p-3 rounded-xl bg-[#17202b]/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span>{b.building}</span>
                {b.critical > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {b.critical} Critical
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="font-extrabold text-white">{b.total}</span>
                <span className="text-slate-400">incidents ({b.percentage}%)</span>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barWidth}%`,
                  background:
                    b.critical > 0
                      ? 'linear-gradient(90deg, #ef4444, #D99B7F)'
                      : 'linear-gradient(90deg, #A56F63, #D99B7F)',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold">{b.resolved} resolved</span>
              <span className="text-sky-400 font-semibold">{b.inProgress} in progress</span>
              <span className="text-amber-400 font-semibold">{b.open} open</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 5. Monthly Incident Trends (Comparative 6-Month Chart) ───────────────────
export function MonthlyTrendsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <p className="text-xs font-semibold">Insufficient historical data for monthly trend analysis</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total || 0), 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2 items-end h-44 pt-4 px-2">
        {data.map((d, i) => {
          const totalHeight = Math.max(12, Math.round(((d.total || 0) / maxVal) * 100));
          const resolvedHeight = Math.max(8, Math.round(((d.resolved || 0) / maxVal) * 100));

          return (
            <div key={i} className="flex flex-col items-center h-full justify-end gap-1.5 group">
              <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-white transition-colors">
                {d.total}
              </span>

              {/* Bar Cluster */}
              <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32 bg-slate-900/60 rounded-xl p-1 relative">
                {/* Total Bar */}
                <div
                  className="w-1/2 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                  style={{
                    height: `${totalHeight}%`,
                    backgroundColor: '#D99B7F',
                  }}
                  title={`Reported: ${d.total}`}
                />
                {/* Resolved Bar */}
                <div
                  className="w-1/2 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                  style={{
                    height: `${resolvedHeight}%`,
                    backgroundColor: '#10b981',
                  }}
                  title={`Resolved: ${d.resolved}`}
                />
              </div>

              <span className="text-[10px] font-medium text-slate-400 truncate max-w-full text-center">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#D99B7F]" />
          <span>Reported Incidents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span>Resolved Incidents</span>
        </div>
      </div>
    </div>
  );
}

// ─── 6. Technician Performance & Field Workload ──────────────────────────────
export function TechnicianWorkloadChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <p className="text-xs font-semibold">No technician assignments in this window</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {data.map((tech) => {
        return (
          <div
            key={tech.id}
            className="p-4 rounded-2xl bg-[#17202b]/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-center text-xs font-black text-[#D99B7F]">
                  {tech.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{tech.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{tech.collegeId} • {tech.department}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D99B7F]/10 text-[#D99B7F] border border-[#D99B7F]/20">
                Score: {tech.efficiencyScore}/100
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase">Assigned</span>
                <div className="text-sm font-extrabold text-white mt-0.5">{tech.assignedTotal}</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[9px] text-emerald-400 uppercase">Resolved</span>
                <div className="text-sm font-extrabold text-emerald-300 mt-0.5">{tech.resolvedCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#D99B7F]/10 border border-[#D99B7F]/20">
                <span className="text-[9px] text-[#D99B7F] uppercase">Avg Speed</span>
                <div className="text-sm font-extrabold text-[#D99B7F] mt-0.5">{tech.avgResolutionHours}</div>
              </div>
            </div>

            {/* Resolution rate mini bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Resolution Clearance Rate</span>
                <span className="text-white font-mono font-bold">{tech.resolutionRate}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#A56F63] to-emerald-400 rounded-full"
                  style={{ width: tech.resolutionRate }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 7. Frequently Affected Campus Services ─────────────────────────────────
export function FrequentlyAffectedServices({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-500 rounded-2xl bg-[#141a24]/50 border border-slate-800">
        <p className="text-xs font-semibold">No affected services data for current filters</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/80">
      {data.map((svc, idx) => (
        <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-lg bg-[#202733] border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold">
              #{idx + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{svc.service}</p>
              <p className="text-[10px] text-slate-400">{svc.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono flex-shrink-0">
            {svc.criticalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {svc.criticalCount} Critical
              </span>
            )}
            <div className="text-right">
              <span className="font-extrabold text-[#D99B7F]">{svc.count}</span>
              <span className="text-[10px] text-slate-400 ml-1">incidents</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

