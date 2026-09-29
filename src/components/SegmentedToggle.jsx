import React from 'react';

/**
 * Segmented Control for switching between Login and Sign Up
 * Features smooth sliding indicator, soft peach/terracotta styling, and accessible keyboard focus.
 */
export default function SegmentedToggle({ activeTab, onTabChange }) {
  return (
    <div 
      className="relative p-1 rounded-xl bg-[#202733]/65 border border-slate-300/35 backdrop-blur-md flex items-center shadow-inner"
      role="tablist"
      aria-label="Authentication Options"
    >
      {/* Sliding Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md"
        style={{
          left: activeTab === 'login' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
          background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
          boxShadow: '0 4px 14px rgba(217, 155, 127, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        }}
      />

      {/* Login Tab Button */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'login'}
        id="tab-login"
        aria-controls="panel-login"
        onClick={() => onTabChange('login')}
        className={`relative z-10 w-1/2 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 text-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B7F] ${
          activeTab === 'login'
            ? 'text-[#0F3040] font-bold drop-shadow-sm'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Login
      </button>

      {/* Sign Up Tab Button */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'signup'}
        id="tab-signup"
        aria-controls="panel-signup"
        onClick={() => onTabChange('signup')}
        className={`relative z-10 w-1/2 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 text-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B7F] ${
          activeTab === 'signup'
            ? 'text-[#0F3040] font-bold drop-shadow-sm'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Sign Up
      </button>
    </div>
  );
}
