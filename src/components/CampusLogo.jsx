import React from 'react';

/**
 * CampusFix Logo - Premium Royal Edition
 * Modern campus building with elegant pearl ivory and deep teal colors
 */
export default function CampusLogo({ size: _size = 'default' }) {
  return (
    <div className="flex flex-col items-center select-none">
      {/* Icon Emblem */}
      <div className="relative group">
        {/* Soft warm gold glow */}
        <div 
          className="absolute -inset-2 rounded-2xl opacity-30 blur-lg transition-all duration-700 group-hover:opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(182, 154, 98, 0.4) 0%, rgba(201, 135, 114, 0.3) 60%, transparent 80%)' }}
        />

        <div className="relative w-12 h-12 rounded-xl p-[1px] bg-gradient-to-br from-[#B69A62]/30 via-[#E8DCC8]/20 to-white/40 shadow-md">
          <div className="w-full h-full rounded-[11px] bg-white/95 backdrop-blur-sm flex items-center justify-center border border-[#E5DED2]/80">
            <svg
              viewBox="0 0 48 48"
              className="w-7 h-7 drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Campus Building Outline */}
              <path
                d="M8 38V20L24 10L40 20V38"
                stroke="#173B46"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Building Columns */}
              <line x1="16" y1="24" x2="16" y2="38" stroke="#A9B8AA" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <line x1="24" y1="26" x2="24" y2="38" stroke="#173B46" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="32" y1="24" x2="32" y2="38" stroke="#A9B8AA" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              {/* Roof Accent */}
              <path
                d="M20 7.5L24 5L28 7.5"
                stroke="#C98772"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Foundation */}
              <path
                d="M5 38H43"
                stroke="#173B46"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Central Network Node */}
              <circle
                cx="24"
                cy="20"
                r="3.5"
                fill="#C98772"
                className="animate-pulse"
              />
              {/* Connection Pulse */}
              <circle
                cx="24"
                cy="20"
                r="6.5"
                stroke="#B69A62"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                strokeOpacity="0.6"
              />
              {/* Alert Spark */}
              <path
                d="M24 13.5V11"
                stroke="#C98772"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Name */}
      <div className="mt-2.5 flex items-center tracking-tight">
        <span className="text-[22px] font-extrabold text-[#173B46] tracking-tight font-heading">
          Campus
        </span>
        <span className="text-[22px] font-extrabold text-[#C98772] tracking-tight font-heading">
          Fix
        </span>
        <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#C98772] inline-block mb-0.5 animate-pulse" />
      </div>

      {/* Tagline */}
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B69A62] font-heading">
        Your campus. Connected.
      </p>

      {/* Supporting text */}
      <p className="mt-1 text-[12px] text-[#68777A] text-center max-w-[320px] leading-relaxed font-light">
        One smart platform to report, track, and resolve campus infrastructure issues.
      </p>
    </div>
  );
}
