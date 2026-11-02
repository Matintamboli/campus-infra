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
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import { useAuth } from '../context/AuthContext';

export default function SignUpForm({ 
  onSignUpSuccess, 
  onSwitchToLogin,
  onNotify 
}) {
  const { register } = useAuth();
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
  const [serverError, setServerError] = useState(null);

  // STRICT SECURITY: Public registration only allows Student or Faculty / Staff
  const roleOptions = [
    {
      id: 'Student',
      label: 'Student',
      desc: 'Report classroom, lab, dorm & Wi-Fi issues',
      icon: GraduationCap,
    },
    {
      id: 'Faculty / Staff',
      label: 'Faculty / Staff',
      desc: 'Department equipment, office & research labs',
      icon: Briefcase,
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      if (onNotify) onNotify('Please complete all required fields correctly', 'error');
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      const data = await register({
        fullName,
        email,
        collegeId,
        password,
        roleRequested: role,
      });

      setIsLoading(false);
      if (onSignUpSuccess) {
        onSignUpSuccess(data.user);
      }
      if (onNotify) {
        onNotify(data.message || 'Registration complete! Welcome to CampusFix.', 'success');
      }
    } catch (err) {
      setIsLoading(false);
      setServerError(err.message || 'Registration failed. Please check your details.');
      if (onNotify) onNotify(err.message || 'Registration failed', 'error');
    }
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
          Join your university campus infrastructure operations.
        </p>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

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

        {/* Role Selection Dropdown: Strictly Student or Faculty/Staff */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200/90">
              Campus Role
            </label>
            <span className="text-[10px] text-slate-400">Public Registration</span>
          </div>
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
                        ? 'bg-[#464858]/80 text-[#D99B7F] border border-[#A56F63]/40' 
                        : 'hover:bg-[#464858]/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon className="w-4 h-4 text-[#D99B7F]" />
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-300 font-light">{item.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D99B7F]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Privilege Security Notice */}
          <div className="mt-1 flex items-start gap-1.5 text-[10.5px] text-slate-400 px-1 leading-tight">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D99B7F] flex-shrink-0 mt-0.5" />
            <span>Technician and Administrator roles require authorized elevation by campus IT directors.</span>
          </div>
        </div>

        {/* Password Field with Visibility Toggle */}
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
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
                if (confirmPassword && e.target.value !== confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                } else if (confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }
              }}
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
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.password}</p>
          )}

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2 space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Strength:</span>
                <span className={`font-bold ${
                  passwordScore <= 2 ? 'text-red-400' :
                  passwordScore <= 3 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {passwordScore <= 2 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong & Resilient'}
                </span>
              </div>
              <div className="h-1 w-full bg-[#464858]/60 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-full flex-1 transition-all duration-300 ${
                      lvl <= passwordScore
                        ? passwordScore <= 2
                          ? 'bg-red-400'
                          : passwordScore <= 3
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password with Visibility Toggle & Match Validation */}
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
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value !== password) {
                  setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                } else {
                  setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }
              }}
              className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl glass-input text-white placeholder-slate-400/80 focus:outline-none ${
                errors.confirmPassword ? 'border-red-400/80' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#D99B7F] transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[11px] text-red-300 font-medium pl-1">{errors.confirmPassword}</p>
          )}
          {confirmPassword && confirmPassword === password && (
            <p className="mt-1 text-[11px] text-emerald-400 font-medium pl-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Passwords match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-signup-submit"
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
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>REGISTER FOR CAMPUSFIX</span>
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
            OR REGISTER WITH
          </div>
        </div>

        {/* Google Authentication Button */}
        <GoogleAuthButton onGoogleSuccess={onSignUpSuccess} mode="signup" />

        {/* Switch to Login Link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          Already registered?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#D99B7F] font-semibold hover:underline hover:text-white transition-colors ml-1 focus:outline-none"
          >
            Sign in here
          </button>
        </div>
      </form>
    </div>
  );
}
