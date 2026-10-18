import React, { useState } from 'react';
import { 
  LogOut, 
  ShieldCheck, 
  Wrench, 
  GraduationCap, 
  User, 
  Bell, 
  Activity, 
  CheckCircle2, 
  ChevronDown,
  Terminal,
  RefreshCw
} from 'lucide-react';
import CampusLogo from '../CampusLogo';
import { useAuth } from '../../context/AuthContext';

export default function PlatformHeader({ onOpenRoleTester, onNotify }) {
  const { user, logout, role } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'Administrator':
        return {
          label: 'Administrator',
          icon: ShieldCheck,
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-400/40',
          textColor: 'text-purple-300',
          dotColor: 'bg-purple-400',
        };
      case 'Technician':
        return {
          label: 'Technician',
          icon: Wrench,
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-400/40',
          textColor: 'text-amber-300',
          dotColor: 'bg-amber-400',
        };
      default:
        return {
          label: 'Reporter',
          icon: GraduationCap,
          bgColor: 'bg-[#D99B7F]/20',
          borderColor: 'border-[#D99B7F]/40',
          textColor: 'text-[#D99B7F]',
          dotColor: 'bg-[#D99B7F]',
        };
    }
  };

  const badge = getRoleBadge(role);
  const BadgeIcon = badge.icon;

  const handleLogout = async () => {
    await logout();
    if (onNotify) onNotify('Signed out of CampusFix', 'info');
  };

  return (
    <header className="relative z-30 w-full border-b border-[#A56F63]/25 backdrop-blur-xl bg-[#0F3040]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A56F63] to-[#D99B7F] p-[1.5px] shadow-lg shadow-black/40">
            <div className="w-full h-full rounded-[10px] bg-[#1a222d] flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-6 h-6 text-[#D99B7F]" fill="none" stroke="currentColor">
                <path d="M8 38V20L24 10L40 20V38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="20" r="3" fill="#D99B7F" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white tracking-tight font-heading">Campus<span className="text-[#D99B7F]">Fix</span></span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#464858]/50 text-slate-300 border border-[#A56F63]/30">v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Campus Infrastructure Incident Platform</p>
          </div>
        </div>

        {/* Center: System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#464858]/20 border border-[#A56F63]/25 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Core Infrastructure: <strong className="text-emerald-400 font-medium">Online</strong></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[11px]">Database: SQLite (WAL)</span>
        </div>

        {/* Right Actions: Role Badge & User Profile */}
        <div className="flex items-center gap-3">
          {/* Diagnostic Role Tester Button */}
          <button
            type="button"
            onClick={onOpenRoleTester}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/35 text-slate-200 text-xs font-medium transition-all active:scale-95 shadow-sm"
            title="Inspect & test role access restrictions"
          >
            <Terminal className="w-3.5 h-3.5 text-[#D99B7F]" />
            <span className="hidden sm:inline">Role Barrier Tester</span>
          </button>

          {/* Active Role Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} animate-pulse`} />
            <BadgeIcon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{badge.label}</span>
          </div>

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#202733]/70 hover:bg-[#202733] border border-slate-300/25 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0F3040] to-[#464858] border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F] font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                  {user?.name || 'Campus Member'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {user?.collegeId || 'ID'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F3040]/95 border border-[#A56F63]/40 shadow-2xl backdrop-blur-2xl p-3 z-50 animate-fadeIn"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className="pb-3 border-b border-[#A56F63]/25 mb-2">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-300 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Campus ID:</span>
                    <span className="font-mono text-slate-200">{user?.collegeId}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200 truncate max-w-[130px]">{user?.department}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={onOpenRoleTester}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#464858]/40 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#D99B7F]" />
                    <span>Run API Security Diagnostic</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
