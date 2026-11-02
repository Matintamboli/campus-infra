import React from 'react';
import {
  LogOut,
  X,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function UnifiedSidebar({
  brandRole = 'PORTAL',
  brandSub = 'Infrastructure Incident Management',
  navItems = [],
  activeTab,
  onTabChange,
  user,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
  onOpenRoleTester,
}) {
  const getRoleIcon = () => {
    if (brandRole.toUpperCase().includes('ADMIN')) {
      return <ShieldCheck className="w-5 h-5 text-[#D99B7F]" />;
    }
    if (brandRole.toUpperCase().includes('TECH')) {
      return <Wrench className="w-5 h-5 text-[#D99B7F]" />;
    }
    return <GraduationCap className="w-5 h-5 text-[#D99B7F]" />;
  };

  const content = (
    <aside className="flex flex-col h-full bg-[#0F3040] border-r border-[#183E4C] w-64 max-w-[85vw] sm:max-w-none shrink-0 select-none text-white transition-all">
      {/* ── Brand Header ── */}
      <div className="px-5 py-4 sm:py-5 border-b border-[#183E4C]/80 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#183E4C] to-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-center shadow-sm shrink-0">
            {getRoleIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-lg font-black text-white font-heading tracking-tight">
                Campus<span className="text-[#D99B7F]">Fix</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#183E4C] text-[#D99B7F] border border-[#D99B7F]/30 uppercase tracking-wide">
                {brandRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight truncate max-w-[130px]">{brandSub}</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#183E4C] active:scale-95 transition-all"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Section Label ── */}
      <div className="px-5 pt-3 sm:pt-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80 font-mono">
          Navigation Menu
        </span>
      </div>

      {/* ── Navigation Links ── */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full min-h-[44px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative group active:scale-[0.98] ${
                isActive
                  ? 'bg-[#183E4C] text-white shadow-sm shadow-black/10'
                  : item.highlight
                  ? 'bg-[#A56F63]/15 text-[#D99B7F] hover:bg-[#A56F63]/25 border border-[#A56F63]/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#183E4C]/50'
              }`}
            >
              {/* Active Route Indicator Pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D99B7F] rounded-r-full shadow-sm" />
              )}

              <div className="flex items-center gap-3 min-w-0 pl-1">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 duration-150 ${
                    isActive ? 'text-[#D99B7F]' : item.highlight ? 'text-[#D99B7F]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate tracking-tight">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#D99B7F] text-[#0F3040] shadow-xs'
                      : 'bg-[#183E4C] text-[#D99B7F] border border-[#D99B7F]/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile & Logout Bottom ── */}
      <div className="p-3 border-t border-[#183E4C]/80 space-y-2 bg-[#0C2734]/80">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-[#183E4C]/50 border border-[#183E4C] flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#183E4C] to-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-center text-xs font-bold text-[#D99B7F] flex-shrink-0 shadow-xs">
              {(user?.name || 'User')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Campus Member'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.college_id || user?.role}</p>
            </div>
          </div>

          {onOpenRoleTester && (
            <button
              type="button"
              onClick={onOpenRoleTester}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#D99B7F] hover:bg-[#0F3040] transition-colors flex-shrink-0"
              title="Test Role Permissions"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[42px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 transition-all active:scale-[0.99]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent */}
      <div className="hidden lg:flex h-full shrink-0">{content}</div>

      {/* Mobile Animated Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" />
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out transform ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    </>
  );
}

