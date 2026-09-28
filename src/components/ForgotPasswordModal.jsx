import React, { useState } from 'react';
import { Mail, ArrowRight, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onNotify }) {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      if (onNotify) {
        onNotify(`Password reset instructions dispatched to ${identifier}`);
      }
    }, 1000);
  };

  const handleReset = () => {
    setIsSent(false);
    setIdentifier('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div 
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-7 border border-[#A56F63]/40 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 48, 64, 0.88)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(217, 155, 127, 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSent ? (
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#464858]/40 border border-[#A56F63]/40 flex items-center justify-center text-[#D99B7F] mb-4">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-heading tracking-tight">
              Reset Your Password
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Enter your verified college email address or student/staff ID. We'll send an authenticated recovery token link to restore your account access.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D99B7F] uppercase tracking-wider mb-1.5">
                  College Email or College ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. s.patel@campus.edu or STU-8821"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 px-4 text-xs font-semibold rounded-xl bg-[#464858]/40 hover:bg-[#464858]/60 text-slate-300 border border-[#A56F63]/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !identifier.trim()}
                  className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 text-[#0F3040] shadow-md transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>SEND RESET LINK</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#D99B7F]/15 border border-[#D99B7F]/40 flex items-center justify-center text-[#D99B7F] mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Recovery Link Dispatched
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              We have generated a secure authorization ticket for <strong className="text-[#D99B7F]">{identifier}</strong>. Please check your inbox or campus portal spam folder.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-[#0F3040] transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
                }}
              >
                RETURN TO SIGN IN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
