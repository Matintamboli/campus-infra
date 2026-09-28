import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ChevronDown, 
  Check, 
  GraduationCap, 
  Briefcase, 
  Wrench,
  ShieldCheck 
} from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

export default function SignUpForm({ 
  onSignUpSuccess, 
  onSwitchToLogin,
  onNotify 
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [role, setRole] = useState('Student');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const roleOptions = [
    {
      id: 'Student',
      label: 'Student',
      desc: 'Report classroom, lab & Wi-Fi issues',
      icon: GraduationCap,
    },
    {
      id: 'Faculty / Staff',
      label: 'Faculty / Staff',
      desc: 'Department equipment & office requests',
      icon: Briefcase,
    },
    {
      id: 'Technician',
      label: 'Technician',
      desc: 'Inspect, prioritize & resolve campus tickets',
      icon: Wrench,
    },
  ];

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordScore = getPasswordStrength();

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!email.trim()) {
      errs.email = 'College email is required';
    } else if (!email.includes('@')) {
      errs.email = 'Please provide a valid campus email address';
    }
    if (!collegeId.trim()) {
      errs.collegeId = 'College / Staff ID is required';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Minimum 6 characters required';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      if (onNotify) onNotify('Please complete all required fields correctly', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSignUpSuccess({
        type: 'registration',
        name: fullName,
        email,
        collegeId,
        role,
        token: 'CFX_NEW_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
    }, 1200);
  };

  const selectedRoleObj = roleOptions.find((r) => r.id === role) || roleOptions[0];
  const SelectedIcon = selectedRoleObj.icon;

  return (
    <div className="w-full">
      {/* Form Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight font-heading">
          Create Your Account
        </h2>
        <p className="mt-1 text-xs sm:text-[13px] text-slate-300/80 font-light">
          Get connected to your campus.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label 
            htmlFor="signup-fullname" 
            className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="signup-fullname"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Maya Lin"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({ ...errors, fullName: null });
              }}
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                errors.fullName ? 'border-red-400/80' : ''
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.fullName}</p>
          )}
        </div>

        {/* 2-Column Row: College Email & College ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* College Email */}
          <div>
            <label 
              htmlFor="signup-email" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1"
            >
              College Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="maya@campus.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                  errors.email ? 'border-red-400/80' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.email}</p>
            )}
          </div>

          {/* College ID */}
          <div>
            <label 
              htmlFor="signup-id" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1"
            >
              College ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="signup-id"
                type="text"
                required
                placeholder="STU-2026-442"
                value={collegeId}
                onChange={(e) => {
                  setCollegeId(e.target.value);
                  if (errors.collegeId) setErrors({ ...errors, collegeId: null });
                }}
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                  errors.collegeId ? 'border-red-400/80' : ''
                }`}
              />
            </div>
            {errors.collegeId && (
              <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.collegeId}</p>
            )}
          </div>
        </div>

        {/* Role Selection Dropdown */}
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1">
            Campus Role
          </label>
          <button
            type="button"
            id="role-dropdown-trigger"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl glass-input text-left text-slate-200 focus:outline-none focus:border-[#D99B7F]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-[#D99B7F]/20 text-[#D99B7F]">
                <SelectedIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">{selectedRoleObj.label}</span>
                <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
                  — {selectedRoleObj.desc}
                </span>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-[#D99B7F] transition-transform duration-200 ${
                isRoleDropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Role Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-xl bg-[#0F3040]/95 border border-[#A56F63]/40 backdrop-blur-xl shadow-2xl p-1.5 space-y-1 animate-fadeIn">
              {roleOptions.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = item.id === role;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRole(item.id);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'bg-[#464858]/50 border border-[#D99B7F]/40 text-white' 
                        : 'hover:bg-[#464858]/30 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-[#D99B7F] text-[#0F3040]' : 'bg-[#464858]/60 text-[#D99B7F]'}`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D99B7F]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2-Column Row: Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div>
            <label 
              htmlFor="signup-password" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                  errors.password ? 'border-red-400/80' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#D99B7F] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label 
              htmlFor="signup-confirm-password" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                  errors.confirmPassword ? 'border-red-400/80' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#D99B7F] transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Password Security</span>
              <span className="font-medium text-[#D99B7F]">
                {passwordScore <= 2 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#464858]/50 rounded-full overflow-hidden flex gap-1">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  passwordScore >= 1 ? 'w-1/3 bg-[#A56F63]' : 'w-0'
                }`} 
              />
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  passwordScore >= 3 ? 'w-1/3 bg-[#D99B7F]' : 'w-0'
                }`} 
              />
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  passwordScore >= 4 ? 'w-1/3 bg-emerald-400' : 'w-0'
                }`} 
              />
            </div>
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="submit"
          id="btn-signup-submit"
          disabled={isLoading}
          className="group relative w-full mt-2 py-3 px-5 rounded-xl font-bold text-sm tracking-wide text-[#0F3040] shadow-lg shadow-[#0F3040]/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 overflow-hidden animate-shimmer"
          style={{
            background: 'linear-gradient(135deg, #A56F63 0%, #D99B7F 100%)',
            boxShadow: '0 8px 24px -4px rgba(217, 155, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                <span>CREATING CAMPUS ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
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
        <GoogleAuthButton onGoogleSuccess={onSignUpSuccess} mode="signup" />

        {/* Already have an account link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#D99B7F] font-semibold hover:underline hover:text-white transition-colors ml-1 focus:outline-none"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}
