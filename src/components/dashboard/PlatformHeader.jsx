import React, { useState } from 'react';
import { 
  LogOut, 
  ShieldCheck, 
  Wrench, 
  GraduationCap, 
  Briefcase,
  ChevronDown,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

export default function PlatformHeader({ onOpenRoleTester, onNotify }) {
  const { user, logout, effectiveRole } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getRoleBadge = (effRole) => {
    switch (effRole) {
      case 'Administrator':
        return {
          label: 'Administrator',
          icon: ShieldCheck,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          dotColor: 'bg-purple-600',
        };
      case 'Technician':
        return {
          label: 'Technician',
          icon: Wrench,
          bgColor: 'bg-[#F8EBD2]',
          borderColor: 'border-[#F8EBD2]',
          textColor: 'text-[#93651C]',
          dotColor: 'bg-[#93651C]',
        };
      case 'Faculty / Staff':
        return {
          label: 'Faculty / Staff',
          icon: Briefcase,
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
          textColor: 'text-sky-700',
          dotColor: 'bg-sky-600',
        };
      default:
        return {
          label: 'Student',
          icon: GraduationCap,
          bgColor: 'bg-[#E5EAF0]',
          borderColor: 'border-[#E5EAF0]',
          textColor: 'text-[#405C78]',
          dotColor: 'bg-[#405C78]',
        };
    }
  };

  const badge = getRoleBadge(effectiveRole);
  const BadgeIcon = badge.icon;

  const handleLogout = async () => {
    await logout();
    if (onNotify) onNotify('Signed out of CampusFix', 'info');
  };

  return (
    <header className="relative z-30 w-full border-b border-[#E7E4DF] bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F3040] p-2 flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 48 48" className="w-6 h-6 text-[#D99B7F]" fill="none" stroke="currentColor">
              <path d="M8 38V20L24 10L40 20V38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="20" r="3" fill="#D99B7F" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-[#0F3040] tracking-tight font-heading">Campus<span className="text-[#A56F63]">Fix</span></span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F3EF] text-[#464858] border border-[#E7E4DF]">v1.0</span>
            </div>
            <p className="text-[11px] text-[#464858] hidden sm:block">Campus Infrastructure Incident Platform</p>
          </div>
        </div>

        {/* Center: System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#464858]">
          <span className="w-2 h-2 rounded-full bg-[#286448] animate-pulse" />
          <span>Core Infrastructure: <strong className="text-[#286448] font-medium">Online</strong></span>
          <span className="text-[#E7E4DF]">•</span>
          <span className="text-[#464858] font-mono text-[11px]">Database: SQLite (WAL)</span>
        </div>

        {/* Right Actions: Role Badge & User Profile */}
        <div className="flex items-center gap-3">
          {/* Diagnostic Role Tester Button */}
          <button
            type="button"
            onClick={onOpenRoleTester}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] border border-[#E7E4DF] text-[#0F3040] text-xs font-medium transition-all active:scale-95 shadow-xs"
            title="Inspect & test role access restrictions"
          >
            <Terminal className="w-3.5 h-3.5 text-[#A56F63]" />
            <span className="hidden sm:inline">Role Barrier Tester</span>
          </button>

          {/* Active Role Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} animate-pulse`} />
            <BadgeIcon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{badge.label}</span>
          </div>

          {/* Professional Notification Bell */}
          <NotificationBell />

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] border border-[#E7E4DF] transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0F3040] text-[#D99B7F] flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-[#0F3040] leading-tight truncate max-w-[120px]">
                  {user?.name || 'Campus Member'}
                </div>
                <div className="text-[10px] text-[#464858] font-mono leading-tight">
                  {user?.collegeId || 'ID'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#464858]" />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-2xl bg-white border border-[#E7E4DF] shadow-xl p-3 z-50 animate-fadeIn"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className="pb-3 border-b border-[#E7E4DF] mb-2">
                  <p className="text-xs font-bold text-[#0F3040] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#464858] truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-[#464858]">Campus ID:</span>
                    <span className="font-mono text-[#0F3040] font-medium">{user?.collegeId}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span className="text-[#464858]">Department:</span>
                    <span className="text-[#0F3040] truncate max-w-[130px] font-medium">{user?.department}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={onOpenRoleTester}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#A56F63]" />
                    <span>Run API Security Diagnostic</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A33D35] hover:text-[#A33D35] hover:bg-[#F5DEDA] transition-colors"
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
            className="p-2 rounded-xl text-[#464858] hover:text-[#A33D35] hover:bg-[#F5DEDA] border border-transparent transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
