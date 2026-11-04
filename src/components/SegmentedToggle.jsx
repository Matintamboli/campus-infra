import React from 'react';

/**
 * Segmented Control - Premium Royal Edition
 * Elegant toggle with champagne and deep teal styling
 */
export default function SegmentedToggle({ activeTab, onTabChange }) {
  return (
    <div 
      className="relative p-1 rounded-xl bg-white/60 border border-[#E5DED2] backdrop-blur-sm flex items-center shadow-sm"
      role="tablist"
      aria-label="Authentication Options"
    >
      {/* Sliding Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md"
        style={{
          left: activeTab === 'login' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
          background: 'linear-gradient(135deg, #173B46 0%, #0F3040 100%)',
          boxShadow: '0 2px 8px rgba(23, 59, 70, 0.25)',
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
        className={`relative z-10 w-1/2 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 text-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B69A62] ${
          activeTab === 'login'
            ? 'text-white font-bold'
            : 'text-[#68777A] hover:text-[#173B46]'
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
        className={`relative z-10 w-1/2 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 text-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B69A62] ${
          activeTab === 'signup'
            ? 'text-white font-bold'
            : 'text-[#68777A] hover:text-[#173B46]'
        }`}
      >
        Sign Up
      </button>
    </div>
  );
}
