import React from 'react';

/**
 * Custom CampusFix Logo
 * Features a modern campus building silhouette fused with an incident-alert
 * network pulse node, rendered in Dusty Terracotta (#A56F63) and Soft Peach (#D99B7F).
 */
export default function CampusLogo({ size = 'default' }) {
  return (
    <div className="flex flex-col items-center select-none">
      {/* Icon Emblem */}
      <div className="relative group">
        {/* Subtle glow behind emblem */}
        <div 
          className="absolute -inset-2 rounded-2xl opacity-40 blur-md transition-all duration-700 group-hover:opacity-75 group-hover:blur-lg"
          style={{ background: 'radial-gradient(circle, #D99B7F 0%, #A56F63 60%, transparent 80%)' }}
        />

        <div className="relative w-14 h-14 rounded-2xl p-[1px] bg-gradient-to-br from-white/70 via-slate-300/40 to-slate-400/20 shadow-lg shadow-black/40">
          <div className="w-full h-full rounded-[15px] bg-[#1a222d]/95 backdrop-blur-md flex items-center justify-center border border-slate-300/30">
            <svg
              viewBox="0 0 48 48"
              className="w-8 h-8 drop-shadow-[0_2px_8px_rgba(217,155,127,0.35)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Campus Building Outline */}
              <path
                d="M8 38V20L24 10L40 20V38"
                stroke="#A56F63"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Building Columns / Infrastructure pillars */}
              <line x1="16" y1="24" x2="16" y2="38" stroke="#A56F63" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <line x1="24" y1="26" x2="24" y2="38" stroke="#D99B7F" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="32" y1="24" x2="32" y2="38" stroke="#A56F63" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              {/* Campus Pediment / Roof Accent */}
              <path
                d="M20 7.5L24 5L28 7.5"
                stroke="#D99B7F"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Foundation Line */}
              <path
                d="M5 38H43"
                stroke="#A56F63"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Central Dynamic Network / Incident Node */}
              <circle
                cx="24"
                cy="20"
                r="3.5"
                fill="#D99B7F"
                className="animate-pulse"
              />
              {/* Connection Pulse Rings */}
              <circle
                cx="24"
                cy="20"
                r="6.5"
                stroke="#D99B7F"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                strokeOpacity="0.8"
              />
              {/* Incident Alert Spark */}
              <path
                d="M24 13.5V11"
                stroke="#D99B7F"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Name */}
      <div className="mt-3 flex items-center tracking-tight">
        <span className="text-2xl font-extrabold text-white tracking-tight font-heading">
          Campus
        </span>
        <span className="text-2xl font-extrabold text-[#D99B7F] tracking-tight font-heading">
          Fix
        </span>
        <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#D99B7F] inline-block mb-1 animate-pulse" />
      </div>

      {/* Tagline */}
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#D99B7F]/90 font-heading">
        Your campus. Connected.
      </p>

      {/* Supporting text */}
      <p className="mt-1 text-[13px] text-slate-300/80 text-center max-w-[340px] leading-relaxed font-light">
        One smart platform to report, track, and resolve campus infrastructure issues.
      </p>
    </div>
  );
}
