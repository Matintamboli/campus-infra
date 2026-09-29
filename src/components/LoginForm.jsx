import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

export default function LoginForm({ 
  onLoginSuccess, 
  onForgotPasswordClick, 
  onSwitchToSignUp,
  onNotify 
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Please provide your College Email or Student/Staff ID';
    }
    if (!password) {
      errs.password = 'Password is required to authenticate';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      if (onNotify) onNotify('Please review highlighted fields', 'error');
      return;
    }

    setIsLoading(true);

    // Simulated authentic authentication response
    setTimeout(() => {
      setIsLoading(false);
      // Determine simulated role based on identifier or credentials
      let role = 'Student';
      let name = 'Alex Rivera';
      if (identifier.toLowerCase().includes('tech') || identifier.toLowerCase().includes('admin')) {
        role = 'Technician';
        name = 'Marcus Vance (Senior Systems Engineer)';
      } else if (identifier.toLowerCase().includes('fac') || identifier.toLowerCase().includes('prof')) {
        role = 'Faculty / Staff';
        name = 'Dr. Elena Rostova (Dept of CS)';
      }

      onLoginSuccess({
        type: 'password',
        identifier,
        role,
        name,
        rememberMe,
        token: 'CFX_AUTH_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
    }, 1100);
  };

  const handleQuickFill = (roleType) => {
    if (roleType === 'student') {
      setIdentifier('alex.student@campus.edu');
      setPassword('campus2026!');
      if (onNotify) onNotify('Loaded verified Student credentials', 'info');
    } else if (roleType === 'tech') {
      setIdentifier('m.vance.tech@campus.edu');
      setPassword('infraOps99#');
      if (onNotify) onNotify('Loaded Field Technician credentials', 'info');
    }
    setErrors({});
  };

  return (
    <div className="w-full">
      {/* Form Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight font-heading">
          Welcome Back
        </h2>
        <p className="mt-1 text-xs sm:text-[13px] text-slate-300/80 font-light">
          Sign in to continue to <span className="text-[#D99B7F] font-medium">CampusFix</span>.
        </p>
      </div>

      {/* Quick Demo Pre-fill Chips */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-[11px] text-slate-400 font-medium">Quick Demo:</span>
        <button
          type="button"
          onClick={() => handleQuickFill('student')}
          className="text-[11px] px-2.5 py-1 rounded-full bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 hover:border-[#D99B7F]/60 text-slate-200 transition-all active:scale-95"
          title="Autofill student account"
        >
          🎓 Student
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill('tech')}
          className="text-[11px] px-2.5 py-1 rounded-full bg-[#464858]/40 hover:bg-[#464858]/70 border border-[#A56F63]/30 hover:border-[#D99B7F]/60 text-slate-200 transition-all active:scale-95"
          title="Autofill technician account"
        >
          🔧 Technician
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Field */}
        <div>
          <label 
            htmlFor="login-identifier" 
            className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1.5"
          >
            College Email or College ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors({ ...errors, identifier: null });
              }}
              placeholder="e.g. s.patel@campus.edu or STU-8821"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                errors.identifier ? 'border-red-400/80' : ''
              }`}
            />
          </div>
          {errors.identifier && (
            <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label 
            htmlFor="login-password" 
            className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              placeholder="••••••••••••"
              className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                errors.password ? 'border-red-400/80' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#D99B7F] transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5 text-xs">
          <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#A56F63]/50 text-[#D99B7F] bg-[#464858]/40 focus:ring-1 focus:ring-[#D99B7F] focus:ring-offset-0 transition cursor-pointer accent-[#D99B7F]"
            />
            <span className="text-[13px]">Remember me</span>
          </label>

          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[13px] font-medium text-[#D99B7F] hover:text-[#e4b5a0] transition-colors hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D99B7F] rounded"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          id="btn-login-submit"
          disabled={isLoading}
          className="group relative w-full py-3 px-5 rounded-xl font-bold text-sm tracking-wide text-[#0F3040] shadow-lg shadow-[#0F3040]/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 overflow-hidden animate-shimmer"
          style={{
            background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
            boxShadow: '0 8px 24px -4px rgba(217, 155, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>LOGIN TO CAMPUSFIX</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </div>
        </button>

        {/* Delicate Divider */}
        <div className="relative flex items-center justify-center pt-2 pb-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-400/30" />
          </div>
          <div className="relative px-3 bg-[#18202d] text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 rounded border border-slate-500/20">
            OR CONTINUE WITH
          </div>
        </div>

        {/* Google Authentication Button */}
        <GoogleAuthButton onGoogleSuccess={onLoginSuccess} mode="login" />

        {/* Direct Switch to Sign Up link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          New to CampusFix?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-[#D99B7F] font-semibold hover:underline hover:text-white transition-colors ml-1 focus:outline-none"
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
