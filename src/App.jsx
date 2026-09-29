import React, { useState, useEffect, useRef } from 'react';
import CampusLogo from './components/CampusLogo';
import SegmentedToggle from './components/SegmentedToggle';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import AuthSuccessModal from './components/AuthSuccessModal';
import Toast from './components/Toast';
import bgImage from './assets/pinterest-bg.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [authData, setAuthData] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Parallax & ambient lighting state based on cursor
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -1 and 1
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;

      setMousePos({ x: normX, y: normY });
      // Subtle 3D tilt for the floating card (max 3 degrees for elegance)
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

  const handleLoginSuccess = (data) => {
    setAuthData(data);
    triggerToast(`Authenticated as ${data.name || data.identifier}`, 'success');
  };

  const handleSignUpSuccess = (data) => {
    setAuthData(data);
    triggerToast(`Welcome to CampusFix, ${data.name}!`, 'success');
  };

  const handleSignOut = () => {
    setAuthData(null);
    triggerToast('Signed out of CampusFix', 'info');
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-[#D99B7F] selection:text-[#0F3040]"
    >
      {/* ========================================================
          1. FULL-SCREEN BACKGROUND WITH EXACT PINTEREST TEXTURE
          ======================================================== */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 transition-transform duration-700 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `scale(1.05) translate(${mousePos.x * -12}px, ${mousePos.y * -12}px)`,
        }}
      />

      {/* Dark Teal Primary Tint Overlay (#0F3040 at ~48% opacity) */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundColor: '#0F3040',
          opacity: 0.48,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Soft Muted Slate Tint Overlay (#464858) */}
      <div 
        className="fixed inset-0 z-[2] pointer-events-none opacity-35"
        style={{
          background: 'linear-gradient(135deg, rgba(70, 72, 88, 0.4) 0%, rgba(15, 48, 64, 0.6) 100%)',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Gentle Vignette for Depth */}
      <div className="fixed inset-0 z-[3] pointer-events-none cinematic-vignette" />

      {/* Slow, ambient glowing light orbs in background (#D99B7F & #0F3040) */}
      <div 
        className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none z-[4] animate-ambient-light"
        style={{
          background: 'radial-gradient(circle, rgba(217, 155, 127, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div 
        className="fixed bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[650px] h-[650px] rounded-full pointer-events-none z-[4] animate-ambient-light"
        style={{
          background: 'radial-gradient(circle, rgba(165, 111, 99, 0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '-5s',
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Top Header Bar / Brand Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium tracking-wide text-slate-300/80 uppercase font-heading">
            Campus Infrastructure Services: <span className="text-emerald-400 font-semibold">Online</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs text-slate-400 font-light">
            Need urgent technician assistance?
          </span>
          <a
            href="mailto:helpdesk@campus.edu"
            className="text-xs font-medium text-[#D99B7F] hover:text-white px-3 py-1.5 rounded-lg bg-[#464858]/30 border border-[#A56F63]/30 transition-all hover:bg-[#464858]/60"
          >
            Emergency Desk
          </a>
        </div>
      </header>

      {/* ========================================================
          3. CENTERED GLASSMORPHIC AUTHENTICATION CARD
          ======================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
        <div 
          className="relative w-full max-w-[450px] transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
          }}
        >
          {/* Faint Silver / Platinum Glow Behind the Card */}
          <div 
            className="absolute -inset-4 sm:-inset-6 rounded-[36px] pointer-events-none opacity-60 blur-2xl transition-all duration-700"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(226, 232, 240, 0.35) 0%, rgba(148, 163, 184, 0.18) 50%, transparent 80%)',
            }}
          />

          {/* Main Silver Card Surface */}
          <div 
            className="relative w-full rounded-[24px] p-6 sm:p-8 backdrop-blur-[28px] border border-slate-300/40 overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              background: 'linear-gradient(145deg, rgba(226, 232, 240, 0.24) 0%, rgba(160, 174, 192, 0.12) 48%, rgba(120, 134, 150, 0.22) 100%), rgba(20, 26, 36, 0.84)',
              boxShadow: `
                0 35px 85px -15px rgba(0, 0, 0, 0.9),
                0 0 50px -5px rgba(226, 232, 240, 0.22),
                inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.75),
                inset 0 -1px 1px 0 rgba(148, 163, 184, 0.35),
                inset 0 0 35px 0 rgba(226, 232, 240, 0.1)
              `,
            }}
          >
            {/* Top Liquid Silver Specular Highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

            {/* Brand Logo & Presentation */}
            <div className="mb-6">
              <CampusLogo />
            </div>

            {/* Segmented Switch: Login / Sign Up */}
            <div className="mb-6">
              <SegmentedToggle 
                activeTab={activeTab} 
                onTabChange={(tab) => {
                  setActiveTab(tab);
                }} 
              />
            </div>

            {/* Animated Tab View with fade-and-slide */}
            <div className="relative min-h-[360px] transition-all duration-300">
              {activeTab === 'login' ? (
                <div 
                  key="login-panel"
                  className="animate-fadeIn"
                >
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onForgotPasswordClick={() => setIsForgotModalOpen(true)}
                    onSwitchToSignUp={() => setActiveTab('signup')}
                    onNotify={triggerToast}
                  />
                </div>
              ) : (
                <div 
                  key="signup-panel"
                  className="animate-fadeIn"
                >
                  <SignUpForm
                    onSignUpSuccess={handleSignUpSuccess}
                    onSwitchToLogin={() => setActiveTab('login')}
                    onNotify={triggerToast}
                  />
                </div>
              )}
            </div>

            {/* Security Badge in Card Footer */}
            <div className="mt-6 pt-4 border-t border-[#A56F63]/20 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <svg className="w-3.5 h-3.5 text-[#D99B7F]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              <span>Protected by University SAML & 256-Bit TLS Encryption</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-400/80 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#A56F63]/15">
        <p className="tracking-wide">
          © {new Date().getFullYear()} CampusFix™ Systems. Built for Campus IT Infrastructure Operations.
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onNotify={(msg) => triggerToast(msg, 'success')}
      />

      {/* Authenticated Success Modal */}
      <AuthSuccessModal
        authData={authData}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
