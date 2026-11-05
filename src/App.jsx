import React, { useState, useEffect, useRef } from 'react';
import CampusLogo from './components/CampusLogo';
import SegmentedToggle from './components/SegmentedToggle';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import Toast from './components/Toast';
import PlatformHeader from './components/dashboard/PlatformHeader';
import RoleAccessTesterModal from './components/dashboard/RoleAccessTesterModal';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ReporterDashboard from './components/dashboard/ReporterDashboard';
import TechnicianDashboard from './components/dashboard/TechnicianDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import NotificationCenterModal from './components/notifications/NotificationCenterModal';
import ErrorBoundary from './components/ui/ErrorBoundary';
import bgImage from './assets/pinterest-bg.jpg';
import { useAuth } from './context/AuthContext';

// Computed once at module load — avoids calling impure Date() during render
const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const { isAuthenticated, isLoading, effectiveRole } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isRoleTesterOpen, setIsRoleTesterOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Parallax & ambient lighting state based on cursor
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;

      setMousePos({ x: normX, y: normY });
      setCardTilt({
        rotateX: -normY * 2.5,
        rotateY: normX * 3,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLoginSuccess = (userData) => {
    triggerToast(`Authenticated as ${userData.name || userData.email} (${userData.role})`, 'success');
  };

  const handleSignUpSuccess = (userData) => {
    triggerToast(`Welcome to CampusFix, ${userData.name}! Account registered as Reporter.`, 'success');
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full flex flex-col overflow-hidden selection:bg-[#D99B7F] selection:text-[#0F3040]"
      style={{ height: '100dvh' }}
    >
      {/* ========================================================
          PREMIUM LIGHT BACKGROUND LAYER (BEHIND ALL CONTENT)
          ======================================================== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: -10 }}>
        {/* 1. Pearl Ivory to Champagne Gradient Base */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'radial-gradient(ellipse at top right, #E8DCC8 0%, #F7F4EE 35%, #FDFCFA 100%)',
          }}
        />

        {/* 2. Subtle Geometric Background (Softened) */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out will-change-transform opacity-[0.035]"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `scale(1.05) translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)`,
            mixBlendMode: 'multiply',
          }}
        />

        {/* 3. Warm Champagne Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.25) 0%, rgba(247, 244, 238, 0.1) 50%, rgba(182, 154, 98, 0.08) 100%)',
          }}
        />

        {/* 4. Soft Muted Sage Accents (Top Left) */}
        <div 
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(169, 184, 170, 0.35) 0%, transparent 65%)',
            filter: 'blur(80px)',
            transform: 'translate(-30%, -30%)',
          }}
        />

        {/* 5. Warm Gold Glow (Bottom Right) */}
        <div 
          className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(182, 154, 98, 0.4) 0%, transparent 65%)',
            filter: 'blur(90px)',
            transform: 'translate(25%, 25%)',
          }}
        />

        {/* 6. Soft Terracotta Accent (Center) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 animate-ambient-light"
          style={{
            background: 'radial-gradient(circle, rgba(201, 135, 114, 0.25) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />

        {/* 7. Delicate Ivory Vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(232, 220, 200, 0.3) 100%)',
          }}
        />
      </div>

      {/* ========================================================
          APPLICATION CONTENT (ABOVE BACKGROUND)
          ======================================================== */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        {/* Role Access Tester Modal */}
        <RoleAccessTesterModal
          isOpen={isRoleTesterOpen}
          onClose={() => setIsRoleTesterOpen(false)}
        />

        {/* Complete Notification Center & Activity Engine Modal */}
        <NotificationCenterModal />

        {/* ========================================================
            INITIAL SESSION LOADING STATE
            ======================================================== */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="p-8 rounded-2xl glass-panel text-center max-w-sm mx-auto animate-fadeIn">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#D99B7F]/20 border border-[#D99B7F]/50 flex items-center justify-center text-[#D99B7F]">
                <span className="w-6 h-6 border-2 border-[#D99B7F] border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Restoring Secure Campus Session</h3>
              <p className="mt-1 text-xs text-slate-300">Verifying university token & authorization profile...</p>
            </div>
          </div>
        ) : isAuthenticated ? (
          /* ========================================================
              AUTHENTICATED ROLE-BASED DASHBOARD APPLICATION
              ======================================================== */
          effectiveRole === 'Student' ? (
            <ErrorBoundary>
              <StudentDashboard 
                onNotify={triggerToast} 
                onOpenRoleTester={() => setIsRoleTesterOpen(true)}
              />
            </ErrorBoundary>
          ) : effectiveRole === 'Technician' ? (
            <ErrorBoundary>
              <TechnicianDashboard 
                onNotify={triggerToast} 
                onOpenRoleTester={() => setIsRoleTesterOpen(true)}
              />
            </ErrorBoundary>
          ) : effectiveRole === 'Administrator' ? (
            <ErrorBoundary>
              <AdminDashboard 
                onNotify={triggerToast} 
                onOpenRoleTester={() => setIsRoleTesterOpen(true)}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <div className="flex-1 flex flex-col min-h-screen bg-[#F5F3EF]">
                <PlatformHeader 
                  onOpenRoleTester={() => setIsRoleTesterOpen(true)}
                  onNotify={triggerToast}
                />

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  <ReporterDashboard 
                    onNotify={triggerToast} 
                    onOpenRoleTester={() => setIsRoleTesterOpen(true)}
                  />
                </main>
              </div>
            </ErrorBoundary>
          )
        ) : (
          /* ========================================================
              PREMIUM SPLIT-SCREEN AUTHENTICATION LAYOUT
              ======================================================== */
          <div className="flex-1 flex flex-col lg:flex-row w-full h-full min-h-0">
            {/* ========================================================
                LEFT SECTION – BRAND & WELCOME EXPERIENCE (60%)
                ======================================================== */}
            <div className="relative flex-[1.4] hidden lg:flex flex-col justify-center items-center px-12 xl:px-16 overflow-hidden">
              {/* Background Image with Overlay */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              
              {/* Pearl/Champagne Overlay */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.92) 0%, rgba(247, 244, 238, 0.95) 50%, rgba(232, 220, 200, 0.90) 100%)',
                }}
              />

              {/* Decorative Geometric Accents */}
              <div 
                className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(23, 59, 70, 0.3) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  transform: 'translate(30%, -30%)',
                }}
              />
              <div 
                className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
                style={{
                  background: 'radial-gradient(circle, rgba(201, 135, 114, 0.4) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                  transform: 'translate(-25%, 25%)',
                }}
              />

              {/* Content */}
              <div className="relative z-10 max-w-2xl text-left">
                {/* Small Logo Badge */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-[#E5DED2] shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#173B46] to-[#0F3040] flex items-center justify-center">
                      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
                        <path d="M8 38V20L24 10L40 20V38" stroke="#C98772" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="24" y1="26" x2="24" y2="38" stroke="#C98772" strokeWidth="2.2" strokeLinecap="round" />
                        <circle cx="24" cy="20" r="3.5" fill="#C98772" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#173B46] tracking-tight">
                      Campus<span className="text-[#C98772]">Fix</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#68777A] font-semibold">Your Campus. Connected.</span>
                  </div>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl xl:text-6xl font-extrabold text-[#173B46] tracking-tight leading-[1.1] mb-6 font-heading">
                  Campus issues.<br />
                  One <span className="text-[#C98772]">smart platform</span>.
                </h1>

                {/* Description */}
                <p className="text-lg text-[#68777A] leading-relaxed mb-10 max-w-xl">
                  Report, track, and resolve campus infrastructure problems faster with one connected platform.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-5">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/60 border border-[#E5DED2] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#C98772]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#173B46] mb-1">Report Incidents Instantly</h3>
                      <p className="text-sm text-[#68777A]">Submit issues from any device with photos and location data.</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/60 border border-[#E5DED2] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#C98772]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#173B46] mb-1">Track Resolution in Real Time</h3>
                      <p className="text-sm text-[#68777A]">Monitor status updates and technician assignments live.</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/60 border border-[#E5DED2] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#C98772]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#173B46] mb-1">Smart Role-Based Access</h3>
                      <p className="text-sm text-[#68777A]">Secure dashboards for students, faculty, technicians, and administrators.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT SECTION – COMPACT AUTHENTICATION CARD (40%)
                ======================================================== */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 lg:px-8 xl:px-12 min-h-0 overflow-y-auto">
              {/* Mobile Header - Only visible on small screens */}
              <div className="lg:hidden w-full mb-6 text-center">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wide text-[#173B46]/70">Services Online</span>
                </div>
              </div>

              {/* Compact Authentication Card */}
              <div className="w-full" style={{ maxWidth: '440px' }}>
                <div 
                  className="relative w-full rounded-[20px] px-6 py-6 overflow-hidden shadow-xl transition-all duration-300"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 244, 238, 0.95) 100%)',
                    border: '1.5px solid rgba(229, 222, 210, 0.8)',
                    boxShadow: '0 20px 50px -12px rgba(23, 59, 70, 0.12), 0 8px 16px -8px rgba(23, 59, 70, 0.08)',
                  }}
                >
                  {/* Top Accent Line */}
                  <div 
                    className="absolute top-0 left-12 right-12 h-[2px]"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(182, 154, 98, 0.4) 50%, transparent 100%)',
                    }}
                  />

                  {/* Small Logo - Desktop Only */}
                  <div className="hidden lg:flex items-center justify-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#173B46] to-[#0F3040] flex items-center justify-center">
                      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
                        <path d="M8 38V20L24 10L40 20V38" stroke="#C98772" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="24" y1="26" x2="24" y2="38" stroke="#C98772" strokeWidth="2.2" strokeLinecap="round" />
                        <circle cx="24" cy="20" r="3.5" fill="#C98772" />
                      </svg>
                    </div>
                    <span className="text-lg font-bold text-[#173B46] tracking-tight">
                      Campus<span className="text-[#C98772]">Fix</span>
                    </span>
                  </div>

                  {/* Full Logo - Mobile Only */}
                  <div className="lg:hidden mb-4">
                    <CampusLogo />
                  </div>

                  {/* Segmented Switch: Login / Sign Up */}
                  <div className="mb-4">
                    <SegmentedToggle 
                      activeTab={activeTab} 
                      onTabChange={(tab) => {
                        setActiveTab(tab);
                      }} 
                    />
                  </div>

                  {/* Form Content with Scrollable Area for Signup */}
                  <div className="relative">
                    {activeTab === 'login' ? (
                      <div key="login-panel" className="animate-fadeIn">
                        <LoginForm
                          onLoginSuccess={handleLoginSuccess}
                          onForgotPasswordClick={() => setIsForgotModalOpen(true)}
                          onSwitchToSignUp={() => setActiveTab('signup')}
                          onNotify={triggerToast}
                        />
                      </div>
                    ) : (
                      <div key="signup-panel" className="animate-fadeIn max-h-[calc(100dvh-280px)] lg:max-h-[calc(100dvh-200px)] overflow-y-auto pr-1">
                        <SignUpForm
                          onSignUpSuccess={handleSignUpSuccess}
                          onSwitchToLogin={() => setActiveTab('login')}
                          onNotify={triggerToast}
                        />
                      </div>
                    )}
                  </div>

                  {/* Security Badge */}
                  <div className="mt-4 pt-3 border-t border-[#E5DED2]/60 flex items-center justify-center gap-2 text-[10px] text-[#68777A]">
                    <svg className="w-3.5 h-3.5 text-[#B69A62]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                    <span>Protected by University SAML & 256-Bit TLS</span>
                  </div>
                </div>

                {/* Emergency Contact - Mobile Only */}
                <div className="lg:hidden mt-4 text-center">
                  <a
                    href="mailto:helpdesk@campus.edu"
                    className="text-xs text-[#68777A] hover:text-[#C98772] transition-colors"
                  >
                    Need urgent assistance? <span className="font-semibold underline">Emergency Desk</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Footer - Only show when authenticated */}
      {isAuthenticated && (
        <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-400/80 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#A56F63]/15">
          <p className="tracking-wide">
            © {CURRENT_YEAR} CampusFix™ Systems. Built for Campus IT Infrastructure Operations.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy: All campus telemetry is encrypted.'); }} className="hover:text-[#D99B7F] transition-colors">
              Privacy Policy
            </a>
            <span className="text-slate-600">•</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast('Acceptable Use Policy for institutional hardware.'); }} className="hover:text-[#D99B7F] transition-colors">
              Terms of Service
            </a>
            <span className="text-slate-600">•</span>
            <a href="#status" onClick={(e) => { e.preventDefault(); triggerToast('Infrastructure Core Status: 99.98% uptime.'); }} className="hover:text-[#D99B7F] transition-colors">
              System Telemetry
            </a>
          </div>
        </footer>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onNotify={(msg) => triggerToast(msg, 'success')}
      />
    </div>
  );
}
