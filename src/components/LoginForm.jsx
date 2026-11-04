import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import { useAuth } from '../context/AuthContext';

export default function LoginForm({ 
  onLoginSuccess, 
  onForgotPasswordClick, 
  onSwitchToSignUp,
  onNotify 
}) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem('campusfix_remembered_identifier') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('campusfix_remember_me') !== 'false';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      if (onNotify) onNotify('Please review highlighted fields', 'error');
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      localStorage.setItem('campusfix_remember_me', rememberMe ? 'true' : 'false');
      const data = await login(identifier, password, rememberMe);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setIsLoading(false);
      setServerError(err.message || 'Authentication failed. Please verify credentials.');
      if (onNotify) onNotify(err.message || 'Authentication failed', 'error');
    }
  };

  const handleQuickFill = (roleType) => {
    if (roleType === 'student') {
      setIdentifier('alex.student@campus.edu');
      setPassword('campus2026!');
      if (onNotify) onNotify('Loaded Student credentials', 'info');
    } else if (roleType === 'faculty') {
      setIdentifier('elena.faculty@campus.edu');
      setPassword('faculty2026!');
      if (onNotify) onNotify('Loaded Faculty credentials', 'info');
    } else if (roleType === 'tech') {
      setIdentifier('m.vance.tech@campus.edu');
      setPassword('infraOps99#');
      if (onNotify) onNotify('Loaded Field Technician credentials', 'info');
    } else if (roleType === 'admin') {
      setIdentifier('admin@campus.edu');
      setPassword('adminPass123!');
      if (onNotify) onNotify('Loaded Administrator credentials', 'info');
    }
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="w-full">
      {/* Form Header */}
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-[#173B46] tracking-tight font-heading">
          Welcome Back
        </h2>
        <p className="mt-0.5 text-[11px] text-[#68777A] font-light">
          Sign in to continue to <span className="text-[#C98772] font-medium">CampusFix</span>
        </p>
      </div>

      {/* Quick Demo Pre-fill Chips - Compact Single Row */}
      <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
        <span className="text-[9px] text-[#68777A] font-medium mr-0.5">Demo:</span>
        <button
          type="button"
          onClick={() => handleQuickFill('student')}
          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#E5DED2] hover:border-[#C98772]/40 text-[#173B46] hover:text-[#C98772] transition-all active:scale-95 shadow-sm"
          title="Autofill Student account"
        >
          🎓 Student
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill('faculty')}
          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#E5DED2] hover:border-[#C98772]/40 text-[#173B46] hover:text-[#C98772] transition-all active:scale-95 shadow-sm"
          title="Autofill Faculty account"
        >
          💼 Faculty
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill('tech')}
          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#E5DED2] hover:border-[#C98772]/40 text-[#173B46] hover:text-[#C98772] transition-all active:scale-95 shadow-sm"
          title="Autofill Technician account"
        >
          🔧 Tech
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill('admin')}
          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#E5DED2] hover:border-[#C98772]/40 text-[#173B46] hover:text-[#C98772] transition-all active:scale-95 shadow-sm"
          title="Autofill Administrator account"
        >
          🛡️ Admin
        </button>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-2.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Identifier Field */}
        <div>
          <label 
            htmlFor="login-identifier" 
            className="block text-[10px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
          >
            College Email or College ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#68777A]">
              <Mail className="w-4 h-4" />
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
              placeholder="e.g. s.patel@campus.edu"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                errors.identifier ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
              }`}
            />
          </div>
          {errors.identifier && (
            <p className="mt-0.5 text-[10px] text-red-600 font-medium pl-1">
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label 
            htmlFor="login-password" 
            className="block text-[10px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#68777A]">
              <Lock className="w-4 h-4" />
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
              className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                errors.password ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#68777A] hover:text-[#C98772] transition-colors focus:outline-none"
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
            <p className="mt-0.5 text-[10px] text-red-600 font-medium pl-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-[#173B46] hover:text-[#0F3040] cursor-pointer select-none">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#E5DED2] text-[#173B46] bg-white focus:ring-1 focus:ring-[#173B46] focus:ring-offset-0 transition cursor-pointer accent-[#173B46]"
            />
            <span className="text-[11px]">Remember me</span>
          </label>

          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[11px] font-medium text-[#C98772] hover:text-[#173B46] transition-colors hover:underline focus:outline-none"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          id="btn-login-submit"
          disabled={isLoading}
          className="group relative w-full py-2 px-4 rounded-lg font-bold text-sm tracking-wide text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75"
          style={{
            background: 'linear-gradient(135deg, #173B46 0%, #0F3040 100%)',
            boxShadow: '0 4px 16px rgba(23, 59, 70, 0.25)',
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="relative flex items-center justify-center pt-1.5 pb-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5DED2]" />
          </div>
          <div className="relative px-2.5 bg-[#F7F4EE] text-[8px] font-semibold uppercase tracking-[0.2em] text-[#68777A]">
            OR CONTINUE WITH
          </div>
        </div>

        {/* Google Authentication Button */}
        <GoogleAuthButton onGoogleSuccess={onLoginSuccess} mode="login" />

        {/* Direct Switch to Sign Up link */}
        <div className="pt-1 text-center text-[11px] text-[#68777A]">
          New to CampusFix?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-[#C98772] font-semibold hover:underline hover:text-[#173B46] transition-colors ml-0.5 focus:outline-none"
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
