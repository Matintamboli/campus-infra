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
    <aside className="flex flex-col h-full bg-[#0F3040] border-r border-[#183E4C] w-64 shrink-0 select-none text-white">
      {/* ── Brand Header ── */}
      <div className="px-5 py-5 border-b border-[#183E4C] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#183E4C] border border-[#D99B7F]/40 flex items-center justify-center shadow-md">
            {getRoleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-white font-heading tracking-tight">
                Campus<span className="text-[#D99B7F]">Fix</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#183E4C] text-[#D99B7F] border border-[#D99B7F]/30 uppercase">
                {brandRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">{brandSub}</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#183E4C]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                isActive
                  ? 'bg-[#183E4C] text-white shadow-sm'
                  : item.highlight
                  ? 'bg-[#A56F63]/20 text-[#D99B7F] hover:bg-[#A56F63]/30 border border-[#A56F63]/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#183E4C]/60'
              }`}
            >
              {/* Active Route Indicator Pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D99B7F] rounded-r-md shadow-sm" />
              )}

              <div className="flex items-center gap-3 min-w-0 pl-1">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#D99B7F]' : item.highlight ? 'text-[#D99B7F]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isActive
                      ? 'bg-[#D99B7F] text-[#0F3040]'
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
      <div className="p-3 border-t border-[#183E4C] space-y-2 bg-[#0C2734]">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-[#183E4C]/60 border border-slate-700/50 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-center text-xs font-bold text-[#D99B7F] flex-shrink-0">
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
              className="p-1 rounded-lg text-slate-400 hover:text-[#D99B7F] hover:bg-[#0F3040] transition-colors flex-shrink-0"
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 transition-all"
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
      <div className="hidden lg:flex h-full">{content}</div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={onCloseMobile}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
