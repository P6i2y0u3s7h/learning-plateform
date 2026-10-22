import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Database,
  FileCode,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import type { AuditLog } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminAuditLogs: React.FC = () => {
  useDocumentTitle('Administrative Audit Trail — Super Admin');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await adminService.getAuditLogs();
      setLogs(list);
      setLoading(false);
    } catch (err) {
      console.error('[AdminAuditLogs] Error fetching logs:', err);
      setError('Failed to fetch administrative audit records.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.action?.toLowerCase().includes(q) ||
      log.adminEmail?.toLowerCase().includes(q) ||
      log.targetCollection?.toLowerCase().includes(q) ||
      log.targetId?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const getActionBadgeClass = (action: string) => {
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('REFUND')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('VERIFY')) {
      return 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30';
    }
    if (action.includes('UPDATE') || action.includes('SETTINGS')) {
      return 'bg-amber-400/10 text-amber-300 border-amber-400/20';
    }
    return 'bg-sky-400/10 text-sky-300 border-sky-400/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>[ SECURITY INDEX · AUDIT TRAIL ]</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              Administrative Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
              Immutable, chronological record of privileged platform modifications, course publications, and state changes.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Trail</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, admin email, collection, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-[#060C17] border border-white/15 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-white/15 bg-[#060C17] text-slate-300 focus:outline-none focus:border-[#CCFF00]"
          >
            <option value="all">ALL ACTION TYPES ({logs.length})</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full bg-white/5 rounded-xl" />
            <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
            <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
            <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-mono font-bold text-white">No Audit Logs Found</p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Actions performed by administrators will appear here with cryptographic timestamps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-mono font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Admin Identity</th>
                  <th className="py-3.5 px-4">Collection / Target</th>
                  <th className="py-3.5 px-4">Summary</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px] font-mono text-xs text-slate-300">{log.adminEmail || 'admin'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        <div className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[#CCFF00]">{log.targetCollection}</span>
                        </div>
                        {log.targetId && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            ID: {log.targetId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate font-mono">
                        {log.details || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 text-xs font-mono font-bold bg-white/5 border border-white/10 hover:border-[#CCFF00]/40 hover:bg-white/10 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-white/15 shadow-2xl space-y-4 relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#CCFF00]" />
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#060C17] border border-white/10 rounded-xl">
                <div>
                  <span className="text-slate-500 font-mono text-[11px] block">Action:</span>
                  <p className="font-mono font-bold text-[#CCFF00]">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px] block">Admin:</span>
                  <p className="font-mono text-white truncate">{selectedLog.adminEmail}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px] block">Collection:</span>
                  <p className="font-mono text-slate-300">{selectedLog.targetCollection}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px] block">Timestamp:</span>
                  <p className="font-mono text-slate-400">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-mono text-slate-400 block mb-1 text-xs">Payload / Event Details:</span>
                <pre className="p-3 bg-[#060C17] border border-white/10 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-56">
                  {selectedLog.details || 'No additional parameters.'}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2.5 text-xs font-mono font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
