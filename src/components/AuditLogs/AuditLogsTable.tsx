import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, orderBy } from '../../services/dataService';
import { AuditLog, UserProfile } from '../../types';
import { Shield, ShieldAlert, ShieldCheck, FileSpreadsheet, Lock, AlertTriangle, Filter, Search } from 'lucide-react';

interface AuditLogsTableProps {
  currentUser: UserProfile;
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLogs(items);
    });
    return () => unsub();
  }, []);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Privileged Audit Log Archive</h3>
        <p className="text-xs text-slate-500 mt-1">
          Access is strictly restricted to SUPER_ADMIN and ADMIN credentials per Section 8 Firestore Security Rules.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.adminName && log.adminName.toLowerCase().includes(q)) ||
        (log.targetStudent && log.targetStudent.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cryptographic Security & Audit Logs</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log record for Aadhaar viewing events, role assignments, and space allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {logs.length} Total Events
          </span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-audit-input"
            type="text"
            placeholder="Search by action, operator, student ID, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${severityFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Severities
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-3 py-1.5 rounded-lg transition-all ${severityFilter === 'high' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            High ({logs.filter((l) => l.severity === 'high').length})
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-3 py-1.5 rounded-lg transition-all ${severityFilter === 'medium' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Medium ({logs.filter((l) => l.severity === 'medium').length})
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Timestamp & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      log.severity === 'high'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : log.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {log.severity === 'high' ? <ShieldAlert className="h-3 w-3 text-rose-600" /> : <ShieldCheck className="h-3 w-3 text-emerald-600" />}
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {log.adminName || log.adminId}
                    <span className="block text-[10px] text-slate-400 font-mono">{log.adminId}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-600 font-semibold">
                    {log.targetStudent || 'System Wide'}
                    {log.targetStudentName && (
                      <span className="block text-[10px] text-slate-500 font-sans font-normal">{log.targetStudentName}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {log.details || 'Standard operational protocol executed.'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    <div>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</div>
                    {log.ip && <div className="text-[10px] text-slate-400">IP: {log.ip}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
