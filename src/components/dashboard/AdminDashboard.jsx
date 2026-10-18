import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Wrench, 
  GraduationCap, 
  Activity, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard({ onNotify, onOpenRoleTester }) {
  const { user, token } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }

      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (onNotify) onNotify('Failed to query administrative records', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [token, onNotify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Promotes or changes user role via administrative process (Requirement 8)
   */
  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;

    setUpdatingUserId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }

      // Update state locally
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );

      if (onNotify) {
        onNotify(`Updated ${targetUser.name}'s role to ${newRole}`, 'success');
      }
    } catch (err) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const categories = [
    { name: 'Network Infrastructure', code: 'network', activeTickets: 4, sla: '2 Hours' },
    { name: 'Hardware Systems', code: 'hardware', activeTickets: 3, sla: '4 Hours' },
    { name: 'Software & OS', code: 'software', activeTickets: 2, sla: '8 Hours' },
    { name: 'Power & Electrical', code: 'power', activeTickets: 1, sla: '1 Hour' },
    { name: 'Classroom Equipment', code: 'classroom', activeTickets: 5, sla: '2 Hours' },
    { name: 'Campus Servers', code: 'servers', activeTickets: 1, sla: '30 Mins' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Hero Banner */}
      <div 
        className="relative rounded-2xl p-6 sm:p-8 border border-purple-500/30 overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 48, 64, 0.95) 0%, rgba(88, 50, 90, 0.4) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                Operations Command Center
              </span>
              <span className="text-xs text-slate-400 font-mono">Administrator: {user?.name}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              Campus Infrastructure Administration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Manage campus members, designate privileged Technician and Administrator credentials, oversee infrastructure category SLAs, and audit operations logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenRoleTester}
              className="px-4 py-2.5 rounded-xl bg-[#464858]/50 hover:bg-[#464858] border border-purple-500/30 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Verify RBAC Matrix</span>
            </button>
            <button
              type="button"
              onClick={fetchUsers}
              className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/40 text-purple-300 transition-all active:scale-95"
              title="Refresh User Directory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-heading">
            {stats?.totalUsers || usersList.length}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Persisted in SQLite database</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Field Technicians</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300 font-heading">
            {usersList.filter((u) => u.role === 'Technician').length}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Assigned to field tickets</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Reporters</span>
            <GraduationCap className="w-4 h-4 text-[#D99B7F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#D99B7F] font-heading">
            {usersList.filter((u) => u.role === 'Reporter').length}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Students & Faculty</p>
        </div>

        <div className="p-4 rounded-xl bg-[#202733]/60 border border-slate-300/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">System Telemetry</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-heading">99.98%</div>
          <p className="mt-1 text-[10px] text-slate-400">SLA compliance rate</p>
        </div>
      </div>

      {/* User Directory & Role Promotion Table */}
      <div className="p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#A56F63]/25">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white font-heading">Campus User Directory & Role Management</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly enforces Requirement 8: Public registrations cannot self-assign privileged roles. Elevated roles are provisioned below.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
            {usersList.length} Persisted Users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F3040]/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">User</th>
                <th className="py-3 px-3">Campus ID</th>
                <th className="py-3 px-3">Type / Dept</th>
                <th className="py-3 px-3">Current Role</th>
                <th className="py-3 px-3">Registered</th>
                <th className="py-3 px-3 rounded-r-xl text-right">Assign Privileged Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {usersList.map((u) => {
                const isCurrentLoggedIn = u.id === user?.id;
                const isUpdating = updatingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#202733]/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrentLoggedIn && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">You</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">{u.college_id}</td>

                    <td className="py-3 px-3">
                      <div>{u.user_type}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{u.department}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'Administrator' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        u.role === 'Technician' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-[#D99B7F]/20 text-[#D99B7F] border-[#D99B7F]/40'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Role Promotion Select */}
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isUpdating ? (
                          <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg glass-input text-white bg-[#0F3040] border-purple-500/30 focus:border-purple-400"
                          >
                            <option value="Reporter">Reporter</option>
                            <option value="Technician">Technician</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Categories & SLA Matrix */}
      <div className="p-6 rounded-2xl bg-[#1a222d]/85 border border-slate-300/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#A56F63]/25">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D99B7F]" />
            <h2 className="text-lg font-bold text-white font-heading">Campus Infrastructure Categories & SLA Standards</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Core Classifications</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.code} className="p-3.5 rounded-xl bg-[#202733]/60 border border-slate-300/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{cat.name}</span>
                <span className="font-mono text-[10px] text-slate-400">/{cat.code}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">SLA Target:</span>
                <span className="font-semibold text-emerald-400">{cat.sla}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Open Tickets:</span>
                <span className="font-bold text-[#D99B7F]">{cat.activeTickets}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
