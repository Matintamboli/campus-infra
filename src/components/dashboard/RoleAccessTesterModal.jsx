import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl p-6 sm:p-7 border border-[#E7E4DF] bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#0F3040]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#E7E4DF] gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-[#A56F63] shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-[#0F3040] font-heading truncate">
                Role-Based Access Barrier Tester
              </h3>
              <p className="text-[11px] sm:text-xs text-[#464858] truncate">
                Identity: <strong className="text-[#0F3040]">{user?.name}</strong> • Role: <span className="text-[#A56F63] font-bold uppercase">{role}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-[#464858] hover:text-[#0F3040] hover:bg-[#F5F3EF] transition-colors shrink-0 active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance */}
        <div className="mt-3 p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E4DF] text-xs text-[#464858] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p>
            This diagnostic tool fires real HTTP requests to server-side endpoints to verify that your active role is permitted or blocked with strict HTTP status codes (<strong>200 OK</strong> vs <strong>403 Forbidden</strong>).
          </p>
          <button
            type="button"
            onClick={handleTestAll}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-[#0F3040] hover:bg-[#183E4C] text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
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
                className="p-4 rounded-xl bg-white border border-[#E7E4DF] text-xs space-y-2.5 transition-all hover:border-[#0F3040]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F3040] text-sm">{ep.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F5F3EF] text-[#464858] border border-[#E7E4DF]">
                        GET {ep.url}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[#464858] text-[11px]">{ep.description}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] flex-wrap">
                      <span className="text-[#464858]">Permitted:</span>
                      {ep.allowedRoles.map((r) => (
                        <span 
                          key={r} 
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            r === role 
                              ? 'bg-[#DCEDE4] text-[#286448] border-[#286448]/30' 
                              : 'bg-[#F5F3EF] text-[#464858] border-[#E7E4DF]'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                      <span className="text-[#E7E4DF]">|</span>
                      <span className="text-[10px] text-[#464858]">
                        Expected: <strong className={isAuthorized ? 'text-[#286448]' : 'text-[#93651C]'}>{isAuthorized ? '200 OK' : '403 Forbidden'}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestEndpoint(ep)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E4DF] border border-[#E7E4DF] text-[#0F3040] font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-[#0F3040] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-[#A56F63]" />
                    )}
                    <span>Run Query</span>
                  </button>
                </div>

                {/* Test Result Display */}
                {result && (
                  <div 
                    className={`mt-2 p-2.5 rounded-lg border text-left flex items-start gap-2.5 animate-fadeIn ${
                      result.status === 200 
                        ? 'bg-[#DCEDE4] border-[#286448]/30 text-[#286448]' 
                        : 'bg-[#F5DEDA] border-[#A33D35]/30 text-[#A33D35]'
                    }`}
                  >
                    {result.status === 200 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#286448] flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#A33D35] flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold">
                          HTTP {result.status} {result.statusText}
                        </span>
                        <span className="text-[10px] opacity-75">Tested at {result.testedAt}</span>
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
        <div className="mt-4 pt-3 border-t border-[#E7E4DF] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E4DF] text-[#0F3040] border border-[#E7E4DF] text-xs font-semibold transition-colors"
          >
            Close Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
