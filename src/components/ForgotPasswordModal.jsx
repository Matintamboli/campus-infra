import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, X, CheckCircle2, Eye, EyeOff, AlertCircle, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordModal({ isOpen, onClose, onNotify }) {
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1: Request, 2: Reset, 3: Completed
  const [identifier, setIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [generatedInfo, setGeneratedInfo] = useState(null);

  if (!isOpen) return null;

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your college email or College ID');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await forgotPassword(identifier.trim());
      setGeneratedInfo(res);
      setResetCode(res.resetCode || '');
      setStep(2);
      if (onNotify) {
        onNotify(`Recovery code generated for ${res.email || identifier}`, 'success');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to locate campus account.');
      if (onNotify) {
        onNotify(err.message || 'Account not found', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMsg('Please enter the recovery reset code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await resetPassword({
        identifier: identifier.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });

      setStep(3);
      if (onNotify) {
        onNotify('Password updated successfully! You may now sign in.', 'success');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
      if (onNotify) {
        onNotify(err.message || 'Reset failed', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setStep(1);
    setIdentifier('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMsg(null);
    setGeneratedInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
      <div 
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-7 border border-[#A56F63]/40 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 48, 64, 0.94)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(217, 155, 127, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseAndReset}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Request Password Reset */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#464858]/40 border border-[#A56F63]/40 flex items-center justify-center text-[#D99B7F] mb-4">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-heading tracking-tight">
              Reset Your Password
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed font-light">
              Enter your verified college email address or student/staff ID. We'll generate an authenticated recovery code to restore your account.
            </p>

            <form onSubmit={handleRequestCode} className="mt-5 space-y-4">
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
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAndReset}
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
                      <span>REQUEST RESET CODE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Enter Recovery Code & Set New Password */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#464858]/40 border border-[#A56F63]/40 flex items-center justify-center text-[#D99B7F] mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-heading tracking-tight">
              Create New Password
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed font-light">
              Enter your recovery reset code and choose a new secure password.
            </p>

            {/* Generated Code Notification Banner */}
            {generatedInfo?.resetCode && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#D99B7F]/15 border border-[#D99B7F]/30 text-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Recovery Code for {generatedInfo.email || identifier}:</span>
                  <span className="font-mono font-bold text-[#D99B7F] text-xs px-2 py-0.5 rounded bg-[#0F3040]">
                    {generatedInfo.resetCode}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5">
              {/* Reset Code */}
              <div>
                <label className="block text-xs font-semibold text-[#D99B7F] uppercase tracking-wider mb-1">
                  Recovery Reset Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RESET-481920"
                  value={resetCode}
                  onChange={(e) => {
                    setResetCode(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl glass-input text-white font-mono placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#D99B7F] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 text-sm rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#D99B7F]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#D99B7F] uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 text-sm rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#D99B7F]"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmNewPassword && confirmNewPassword === newPassword && (
                  <p className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-4 text-xs font-semibold rounded-xl bg-[#464858]/40 hover:bg-[#464858]/60 text-slate-300 border border-[#A56F63]/30"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || newPassword !== confirmNewPassword}
                  className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 text-[#0F3040] shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>UPDATE PASSWORD</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Completed Confirmation */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-3 animate-fadeIn">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-heading">
              Password Updated!
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed font-light">
              Your credentials for <strong className="text-[#D99B7F]">{identifier}</strong> have been securely updated. You can now log into CampusFix with your new password.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-[#0F3040] transition-transform active:scale-95 shadow-lg"
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
