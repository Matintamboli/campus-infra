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

// ─── Theme Constants (Enterprise SaaS Palette) ──────────────────────────────
export const CHART_COLORS = {
  deepTeal: '#0F3040',
  tealSlate: '#183E4C',
  mutedSlate: '#464858',
  warmIvory: '#F5F3EF',
  softBorder: '#E7E4DF',
  terracotta: '#A56F63',
  softPeach: '#D99B7F',
  // Status Colors
  resolvedBg: '#DCEDE4',
  resolvedText: '#286448',
  inProgressBg: '#F8EBD2',
  inProgressText: '#93651C',
  criticalBg: '#F5DEDA',
  criticalText: '#A33D35',
  openBg: '#E5EAF0',
  openText: '#405C78',
};

// ─── 1. Interactive SVG Line Chart (Incidents Over Time) ─────────────────────
export function IncidentsLineChart({ data = [], height = 260 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
        <Clock className="w-8 h-8 mb-2 text-[#464858]" />
        <p className="text-sm font-semibold text-[#183E4C]">No incident activity recorded in this period</p>
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
      <div className="flex items-center justify-between mb-3 text-xs text-[#464858]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-[#0F3040]" />
            <span className="font-semibold text-[#0F3040]">Total Reported (Primary)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-[#A56F63]" />
            <span className="font-semibold text-[#A56F63]">Resolved (Secondary)</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#464858]">Peak Volume: {maxTotal}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F3040" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0F3040" stopOpacity="0.0" />
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
                stroke="#E7E4DF"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#464858"
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
        {areaPath && <path d={areaPath} fill="url(#areaGradientLight)" />}

        {/* Resolved Line (Terracotta) */}
        {resolvedPath && (
          <path
            d={resolvedPath}
            fill="none"
            stroke="#A56F63"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Total Line (Deep Teal) */}
        {totalPath && (
          <path
            d={totalPath}
            fill="none"
            stroke="#0F3040"
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
                  stroke="#A56F63"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Invisible large touch target */}
              <circle cx={cx} cy={cyTotal} r="14" fill="transparent" />

              {/* Resolved point (Terracotta) */}
              <circle
                cx={cx}
                cy={getY(d.resolved || 0)}
                r={isHovered ? 5 : 3}
                fill="#A56F63"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Total point (Deep Teal) */}
              <circle
                cx={cx}
                cy={cyTotal}
                r={isHovered ? 6 : 4}
                fill="#0F3040"
                stroke="#FFFFFF"
                strokeWidth="2"
              />

              {/* X Axis Labels */}
              {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={padding.top + plotHeight + 18}
                  fill={isHovered ? '#0F3040' : '#464858'}
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
          className="absolute z-20 pointer-events-none px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E4DF] shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: `${(getY(data[hoveredIdx].total || 0) / height) * 100 - 8}%`,
          }}
        >
          <div className="font-bold text-[#0F3040] border-b border-[#E7E4DF] pb-1 flex items-center justify-between gap-3">
            <span>{data[hoveredIdx].label}</span>
            {data[hoveredIdx].date && (
              <span className="text-[10px] text-[#464858] font-mono">{data[hoveredIdx].date}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 text-[#183E4C]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0F3040]" /> Reported:
            </span>
            <span className="font-black text-[#0F3040] font-mono">{data[hoveredIdx].total || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#183E4C]">
            <span className="flex items-center gap-1.5 font-medium text-[#A56F63]">
              <span className="w-2 h-2 rounded-full bg-[#A56F63]" /> Resolved:
            </span>
            <span className="font-black text-[#A56F63] font-mono">{data[hoveredIdx].resolved || 0}</span>
          </div>
          {data[hoveredIdx].critical > 0 && (
            <div className="flex items-center justify-between gap-4 text-[#A33D35]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#A33D35]" /> Critical:
              </span>
              <span className="font-black text-[#A33D35] font-mono">{data[hoveredIdx].critical}</span>
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
      <div className="h-56 flex flex-col items-center justify-center text-slate-500 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
        <Layers className="w-8 h-8 mb-2 text-[#464858]" />
        <p className="text-xs font-semibold text-[#183E4C]">No records available</p>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Enterprise SaaS Palette for Categories / Segments
  const enterpriseColors = [
    '#0F3040', // Deep Teal
    '#A56F63', // Terracotta
    '#D99B7F', // Soft Peach
    '#183E4C', // Teal Slate
    '#464858', // Muted Slate
    '#286448', // Forest Resolved
    '#93651C', // Amber In-Progress
    '#A33D35', // Crimson Critical
  ];

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
            stroke="#E7E4DF"
            strokeWidth={strokeWidth}
          />

          {data.map((item, idx) => {
            const count = item.count || 0;
            const percent = count / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredSlice === idx;
            const sliceColor = item.color || enterpriseColors[idx % enterpriseColors.length];

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={sliceColor}
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
              <span className="text-xs font-bold text-[#183E4C] truncate max-w-[110px] px-1">
                {data[hoveredSlice].name || data[hoveredSlice].status}
              </span>
              <span className="text-xl font-black text-[#0F3040] font-mono">
                {data[hoveredSlice].count}
              </span>
              <span className="text-[10px] font-bold text-[#A56F63]">
                {data[hoveredSlice].percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#464858]">
                {centerLabel}
              </span>
              <span className="text-2xl font-black text-[#0F3040] font-heading">{total}</span>
              <span className="text-[10px] text-[#464858]">Incidents</span>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full max-w-xs space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const isHovered = hoveredSlice === idx;
          const label = item.name || item.status;
          const sliceColor = item.color || enterpriseColors[idx % enterpriseColors.length];

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-2 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer border ${
                isHovered
                  ? 'bg-white border-[#0F3040]/30 shadow-xs'
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sliceColor }}
                />
                <span className="text-[#183E4C] font-semibold truncate" title={label}>
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                <span className="text-[#0F3040] font-bold">{item.count}</span>
                <span className="text-[#464858]">({item.percentage}%)</span>
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
      <div className="h-48 flex items-center justify-center text-[#464858] rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
        <p className="text-xs font-semibold">No priority data available</p>
      </div>
    );
  }

  // Consistent status badge mappings
  const priorityStyling = {
    Critical: { bg: '#F5DEDA', text: '#A33D35', bar: '#A33D35' },
    High: { bg: '#F8EBD2', text: '#93651C', bar: '#93651C' },
    Medium: { bg: '#E5EAF0', text: '#405C78', bar: '#405C78' },
    Low: { bg: '#F5F3EF', text: '#464858', bar: '#464858' },
  };

  return (
    <div className="space-y-3.5">
      {data.map((item) => {
        const pct = item.percentage || 0;
        const resRate = item.count > 0 ? Math.round((item.resolved / item.count) * 100) : 0;
        const style = priorityStyling[item.priority] || priorityStyling.Medium;

        return (
          <div key={item.priority} className="space-y-1.5 p-3 rounded-xl bg-white border border-[#E7E4DF]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {item.priority}
                </span>
                <span className="text-[11px] text-[#464858] font-mono">
                  {item.resolved} resolved / {item.open} open
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-black text-[#0F3040]">{item.count}</span>
                <span className="text-[#464858] text-[11px]">({pct}%)</span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: style.bar,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#464858]">
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
      <div className="h-48 flex items-center justify-center text-[#464858] rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
        <p className="text-xs font-semibold">No campus building incidents recorded</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((b) => b.total || 0), 1);

  return (
    <div className="space-y-2.5">
      {data.map((b, idx) => {
        const barWidth = Math.round((b.total / maxCount) * 100);

        return (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white border border-[#E7E4DF] hover:border-[#0F3040]/30 transition-all space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-[#0F3040]">
                <Building2 className="w-3.5 h-3.5 text-[#A56F63]" />
                <span>{b.building}</span>
                {b.critical > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F5DEDA] text-[#A33D35]">
                    {b.critical} Critical
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="font-black text-[#0F3040]">{b.total}</span>
                <span className="text-[#464858]">({b.percentage}%)</span>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="h-2 w-full bg-[#E7E4DF] rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: b.critical > 0 ? '#A56F63' : '#0F3040',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#464858]">
              <span className="text-[#286448] font-semibold">{b.resolved} resolved</span>
              <span className="text-[#93651C] font-semibold">{b.inProgress} in progress</span>
              <span className="text-[#405C78] font-semibold">{b.open} open</span>
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
      <div className="h-44 flex items-center justify-center text-[#464858] rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
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
              <span className="text-[10px] font-mono font-bold text-[#464858] group-hover:text-[#0F3040] transition-colors">
                {d.total}
              </span>

              {/* Bar Cluster */}
              <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32 bg-[#F5F3EF] rounded-xl p-1 relative border border-[#E7E4DF]">
                {/* Total Bar (Deep Teal) */}
                <div
                  className="w-1/2 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${totalHeight}%`,
                    backgroundColor: '#0F3040',
                  }}
                  title={`Reported: ${d.total}`}
                />
                {/* Resolved Bar (Terracotta) */}
                <div
                  className="w-1/2 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${resolvedHeight}%`,
                    backgroundColor: '#A56F63',
                  }}
                  title={`Resolved: ${d.resolved}`}
                />
              </div>

              <span className="text-[10px] font-medium text-[#464858] truncate max-w-full text-center">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 text-[11px] text-[#464858] pt-1 border-t border-[#E7E4DF]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#0F3040]" />
          <span className="font-medium">Total Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#A56F63]" />
          <span className="font-medium">Resolved</span>
        </div>
      </div>
    </div>
  );
}

// ─── 6. Technician Performance & Field Workload ──────────────────────────────
export function TechnicianWorkloadChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-[#464858] rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
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
            className="p-4 rounded-2xl bg-white border border-[#E7E4DF] hover:border-[#0F3040]/30 transition-all space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F3040] flex items-center justify-center text-xs font-black text-white">
                  {tech.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F3040]">{tech.name}</h4>
                  <p className="text-[10px] text-[#464858] font-mono">{tech.collegeId} • {tech.department}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEDE4] text-[#286448]">
                Score: {tech.efficiencyScore}/100
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF]">
                <span className="text-[9px] text-[#464858] uppercase font-bold">Assigned</span>
                <div className="text-sm font-black text-[#0F3040] mt-0.5">{tech.assignedTotal}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#DCEDE4]/60 border border-[#286448]/20">
                <span className="text-[9px] text-[#286448] uppercase font-bold">Resolved</span>
                <div className="text-sm font-black text-[#286448] mt-0.5">{tech.resolvedCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F8EBD2]/60 border border-[#93651C]/20">
                <span className="text-[9px] text-[#93651C] uppercase font-bold">Avg Speed</span>
                <div className="text-sm font-black text-[#93651C] mt-0.5">{tech.avgResolutionHours}</div>
              </div>
            </div>

            {/* Resolution rate mini bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#464858] font-medium">Resolution Clearance</span>
                <span className="text-[#0F3040] font-mono font-bold">{tech.resolutionRate}</span>
              </div>
              <div className="h-1.5 w-full bg-[#E7E4DF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F3040] rounded-full"
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
      <div className="h-44 flex items-center justify-center text-[#464858] rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E4DF]">
        <p className="text-xs font-semibold">No affected services data for current filters</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E7E4DF]">
      {data.map((svc, idx) => (
        <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-lg bg-[#F5F3EF] border border-[#E7E4DF] flex items-center justify-center text-[10px] font-mono text-[#0F3040] font-bold">
              #{idx + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#0F3040] truncate">{svc.service}</p>
              <p className="text-[10px] text-[#464858]">{svc.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono flex-shrink-0">
            {svc.criticalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F5DEDA] text-[#A33D35]">
                {svc.criticalCount} Critical
              </span>
            )}
            <div className="text-right">
              <span className="font-black text-[#0F3040]">{svc.count}</span>
              <span className="text-[10px] text-[#464858] ml-1">incidents</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
