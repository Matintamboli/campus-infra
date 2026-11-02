import React from 'react';

/**
 * Enterprise Status and Priority Badge Component
 * Strictly conforms to CampusFix enterprise status color tokens:
 * - Resolved: #DCEDE4 bg, #286448 text
 * - In Progress: #F8EBD2 bg, #93651C text
 * - Critical: #F5DEDA bg, #A33D35 text
 * - Open: #E5EAF0 bg, #405C78 text
 */
export function getStatusStyle(status = '') {
  const s = String(status).toLowerCase();
  if (s === 'resolved' || s === 'closed' || s === 'active') {
    return {
      bg: '#DCEDE4',
      text: '#286448',
      border: 'rgba(40, 100, 72, 0.2)',
    };
  }
  if (s === 'in progress' || s === 'assigned' || s === 'high') {
    return {
      bg: '#F8EBD2',
      text: '#93651C',
      border: 'rgba(147, 101, 28, 0.25)',
    };
  }
  if (s === 'critical' || s === 'overdue' || s === 'suspended' || s === 'deactivated') {
    return {
      bg: '#F5DEDA',
      text: '#A33D35',
      border: 'rgba(163, 61, 53, 0.25)',
    };
  }
  // Default / Open / Medium / Low
  if (s === 'low') {
    return {
      bg: '#F5F3EF',
      text: '#464858',
      border: '#E7E4DF',
    };
  }
  return {
    bg: '#E5EAF0',
    text: '#405C78',
    border: 'rgba(64, 92, 120, 0.25)',
  };
}

export default function StatusBadge({ status, size = 'default', className = '' }) {
  const style = getStatusStyle(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full font-mono uppercase tracking-wider border shadow-xs transition-colors select-none ${sizeClasses} ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.text }}
      />
      <span>{status}</span>
    </span>
  );
}
