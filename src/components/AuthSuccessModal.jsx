import React from 'react';
import { CheckCircle2, ShieldCheck, User, LogOut, ArrowRight, Activity, Clock } from 'lucide-react';

export default function AuthSuccessModal({ authData, onSignOut }) {
  if (!authData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-[24px] p-6 sm:p-8 border border-[#A56F63]/40 shadow-2xl overflow-hidden text-center"
        style={{
          background: 'rgba(15, 48, 64, 0.92)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(217, 155, 127, 0.18)',
        }}
      >
        {/* Glow badge */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#D99B7F]/15 border border-[#D99B7F]/50 flex items-center justify-center text-[#D99B7F] mb-4 shadow-[0_0_30px_rgba(217,155,127,0.3)] animate-pulse">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-2xl font-bold text-white font-heading tracking-tight">
          Authenticated Successfully
        </h3>
        <p className="mt-1 text-xs text-slate-300">
          Welcome to the CampusFix Infrastructure Network
        </p>

        {/* User Profile Card */}
        <div className="mt-5 p-4 rounded-xl bg-[#464858]/35 border border-[#A56F63]/30 text-left space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#A56F63]/20">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Identity</span>
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {authData.name || authData.identifier || authData.email || 'Campus Member'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#A56F63]/20">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Assigned Role</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D99B7F]/20 text-[#D99B7F] border border-[#D99B7F]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D99B7F]" />
              {authData.role || 'Student'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Session Token</span>
            <span className="text-[11px] font-mono text-slate-300 bg-[#0F3040]/70 px-2 py-0.5 rounded border border-[#A56F63]/20">
              {authData.token || 'CFX_SECURE_TOKEN'}
            </span>
          </div>
        </div>

        {/* Operations Platform Scope Note */}
        <div className="mt-4 p-3 rounded-lg bg-[#0F3040]/60 border border-[#A56F63]/20 text-[11px] text-slate-300/90 text-left flex items-start gap-2">
          <Activity className="w-4 h-4 text-[#D99B7F] flex-shrink-0 mt-0.5" />
          <span>
            Campus operations initialized for {authData.role || 'User'}. Incident monitoring, lab telemetry, and priority workflows are synced.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 text-[#0F3040] shadow-md transition-all hover:brightness-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>TEST SIGN OUT / SWITCH USER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
