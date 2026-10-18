import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RoleAccessTesterModal({ isOpen, onClose }) {
  const { user, token, role } = useAuth();
  const [results, setResults] = useState({});
  const [loadingEndpoint, setLoadingEndpoint] = useState(null);

  if (!isOpen) return null;

  const testEndpoints = [
    {
      id: 'reporter',
      name: 'Reporter Incident Hub API',
      url: '/api/protected/reporter-area',
      allowedRoles: ['Reporter', 'Technician', 'Administrator'],
      description: 'Allows filing incidents and tracking own issues. Open to all authenticated campus members.',
    },
    {
      id: 'technician',
      name: 'Technician Operations Queue API',
      url: '/api/protected/technician-queue',
      allowedRoles: ['Technician', 'Administrator'],
      description: 'Allows updating ticket status and technical diagnostics. Restricted to Technicians and Admins.',
    },
    {
      id: 'admin',
      name: 'Campus Operations Control Console API',
      url: '/api/protected/admin-console',
      allowedRoles: ['Administrator'],
      description: 'Allows platform configuration, SLA audits, and global overrides. Restricted strictly to Administrators.',
    },
    {
      id: 'admin_users',
      name: 'Admin User Management API',
      url: '/api/admin/users',
      allowedRoles: ['Administrator'],
      description: 'Allows viewing all registered users and promoting privileged roles. Restricted to Administrators.',
    },
  ];

  const handleTestEndpoint = async (endpoint) => {
    setLoadingEndpoint(endpoint.id);
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          status: response.status,
          statusText: response.statusText || (response.status === 200 ? 'OK' : 'Forbidden'),
          data,
          testedAt: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          status: 500,
          statusText: 'Network Error',
          data: { error: 'NETWORK_ERROR', message: err.message },
          testedAt: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoadingEndpoint(null);
    }
  };

  const handleTestAll = async () => {
    for (const ep of testEndpoints) {
      await handleTestEndpoint(ep);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl rounded-2xl p-6 sm:p-7 border border-[#A56F63]/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: 'rgba(15, 48, 64, 0.94)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.85), 0 0 50px rgba(217, 155, 127, 0.15)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#A56F63]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#464858]/50 border border-[#A56F63]/40 text-[#D99B7F]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Role-Based Access Control (RBAC) Barrier Tester
              </h3>
              <p className="text-xs text-slate-300">
                Current Authenticated Identity: <strong className="text-white">{user?.name}</strong> | Role: <span className="text-[#D99B7F] font-bold uppercase">{role}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#464858]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance */}
        <div className="mt-3 p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 text-xs text-slate-300 flex items-center justify-between gap-3">
          <p>
            This diagnostic tool fires real HTTP requests to server-side endpoints to verify that your active role is permitted or blocked with strict HTTP status codes (<strong>200 OK</strong> vs <strong>403 Forbidden</strong>).
          </p>
          <button
            type="button"
            onClick={handleTestAll}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#D99B7F] text-[#0F3040] font-bold text-xs hover:brightness-105 active:scale-95 transition-all"
          >
            Test All Barrier APIs
          </button>
        </div>

        {/* Endpoints List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {testEndpoints.map((ep) => {
            const result = results[ep.id];
            const isAuthorized = ep.allowedRoles.includes(role);
            const isLoading = loadingEndpoint === ep.id;

            return (
              <div 
                key={ep.id}
                className="p-3.5 rounded-xl bg-[#202733]/70 border border-slate-300/20 text-xs space-y-2 transition-all hover:border-slate-300/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ep.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0F3040] text-slate-300 border border-[#A56F63]/30">
                        GET {ep.url}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-400 text-[11px]">{ep.description}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">Permitted Roles:</span>
                      {ep.allowedRoles.map((r) => (
                        <span 
                          key={r} 
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            r === role 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-[#464858]/40 text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestEndpoint(ep)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#464858]/50 hover:bg-[#464858]/90 border border-[#A56F63]/40 text-white font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-[#D99B7F] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-[#D99B7F]" />
                    )}
                    <span>Run Query</span>
                  </button>
                </div>

                {/* Test Result Display */}
                {result && (
                  <div 
                    className={`mt-2 p-2.5 rounded-lg border text-left flex items-start gap-2.5 animate-fadeIn ${
                      result.status === 200 
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    }`}
                  >
                    {result.status === 200 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold">
                          HTTP {result.status} {result.statusText}
                        </span>
                        <span className="text-[10px] text-slate-400">Tested at {result.testedAt}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {result.data.message || (result.status === 200 ? 'Access Granted' : 'Access Restricted')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-[#A56F63]/30 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#464858]/60 hover:bg-[#464858] text-white text-xs font-semibold transition-colors"
          >
            Close Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
