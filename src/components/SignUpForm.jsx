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
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-[22px] font-bold text-[#173B46] tracking-tight font-heading">
          Create Your Account
        </h2>
        <p className="mt-1 text-xs text-[#68777A] font-light">
          Join your university campus infrastructure operations.
        </p>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Full Name */}
        <div>
          <label 
            htmlFor="signup-fullname" 
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#68777A]">
              <User className="w-4 h-4" />
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
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                errors.fullName ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-[10px] text-red-600 font-medium pl-1">{errors.fullName}</p>
          )}
        </div>

        {/* 2-Column Row: College Email & College ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* College Email */}
          <div>
            <label 
              htmlFor="signup-email" 
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
            >
              College Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#68777A]">
                <Mail className="w-4 h-4" />
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
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                  errors.email ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[10px] text-red-600 font-medium pl-1">{errors.email}</p>
            )}
          </div>

          {/* College ID */}
          <div>
            <label 
              htmlFor="signup-id" 
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
            >
              College ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#68777A]">
                <CreditCard className="w-4 h-4" />
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
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                  errors.collegeId ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
                }`}
              />
            </div>
            {errors.collegeId && (
              <p className="mt-1 text-[10px] text-red-600 font-medium pl-1">{errors.collegeId}</p>
            )}
          </div>
        </div>

        {/* Role Selection Dropdown */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46]">
              Campus Role
            </label>
            <span className="text-[9px] text-[#68777A]">Public Registration</span>
          </div>
          <button
            type="button"
            id="role-dropdown-trigger"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/80 border border-[#E5DED2] text-left text-[#173B46] focus:outline-none focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10 transition-all hover:bg-white"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-[#C98772]/10 text-[#C98772]">
                <SelectedIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[#173B46]">{selectedRoleObj.label}</span>
                <span className="hidden sm:inline-block text-[10px] text-[#68777A] ml-2">
                  — {selectedRoleObj.desc}
                </span>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-[#C98772] transition-transform duration-200 ${
                isRoleDropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Role Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-xl bg-white border border-[#E5DED2] shadow-xl p-1.5 space-y-1 animate-fadeIn">
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
                        ? 'bg-[#173B46]/5 text-[#173B46] border border-[#E5DED2]' 
                        : 'hover:bg-[#F7F4EE] text-[#173B46]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon className="w-4 h-4 text-[#C98772]" />
                      <div>
                        <div className="text-xs font-bold text-[#173B46]">{item.label}</div>
                        <div className="text-[10px] text-[#68777A] font-light">{item.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C98772]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Privilege Security Notice */}
          <div className="mt-1 flex items-start gap-1.5 text-[10px] text-[#68777A] px-1 leading-tight">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B69A62] flex-shrink-0 mt-0.5" />
            <span>Technician and Administrator roles require authorized elevation by campus IT directors.</span>
          </div>
        </div>

        {/* Password Field with Visibility Toggle */}
        <div>
          <label 
            htmlFor="signup-password" 
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#68777A]">
              <Lock className="w-4 h-4" />
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
              className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                errors.password ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#68777A] hover:text-[#C98772] transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[10px] text-red-600 font-medium pl-1">{errors.password}</p>
          )}

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-1.5 space-y-0.5 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#68777A]">Strength:</span>
                <span className={`font-bold ${
                  passwordScore <= 2 ? 'text-red-500' :
                  passwordScore <= 3 ? 'text-amber-500' :
                  'text-emerald-500'
                }`}>
                  {passwordScore <= 2 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong & Resilient'}
                </span>
              </div>
              <div className="h-1 w-full bg-[#E5DED2] rounded-full overflow-hidden flex gap-0.5">
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#173B46] mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#68777A]">
              <Lock className="w-4 h-4" />
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
              className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-white/80 border text-[#173B46] placeholder-[#68777A]/60 focus:outline-none focus:bg-white transition-all ${
                errors.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-[#E5DED2] focus:border-[#173B46] focus:ring-2 focus:ring-[#173B46]/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#68777A] hover:text-[#C98772] transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[10px] text-red-600 font-medium pl-1">{errors.confirmPassword}</p>
          )}
          {confirmPassword && confirmPassword === password && (
            <p className="mt-1 text-[10px] text-emerald-600 font-medium pl-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Passwords match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-signup-submit"
          disabled={isLoading}
          className="group relative w-full py-2.5 px-5 rounded-xl font-bold text-sm tracking-wide text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75"
          style={{
            background: 'linear-gradient(135deg, #173B46 0%, #0F3040 100%)',
            boxShadow: '0 4px 16px rgba(23, 59, 70, 0.25)',
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="w-full border-t border-[#E5DED2]" />
          </div>
          <div className="relative px-3 bg-[#F7F4EE] text-[9px] font-semibold uppercase tracking-[0.2em] text-[#68777A]">
            OR REGISTER WITH
          </div>
        </div>

        {/* Google Authentication Button */}
        <GoogleAuthButton onGoogleSuccess={onSignUpSuccess} mode="signup" />

        {/* Switch to Login Link */}
        <div className="pt-1 text-center text-xs text-[#68777A]">
          Already registered?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#C98772] font-semibold hover:underline hover:text-[#173B46] transition-colors ml-1 focus:outline-none"
          >
            Sign in here
          </button>
        </div>
      </form>
    </div>
  );
}
