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
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('VERIFY')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('SETTINGS')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Trail</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Administrative Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable, chronological record of privileged platform modifications, course publications, and state changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, admin email, collection, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600"
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full bg-slate-100 rounded-xl" />
            <Skeleton className="h-12 w-full bg-slate-100 rounded-xl" />
            <Skeleton className="h-12 w-full bg-slate-100 rounded-xl" />
            <Skeleton className="h-12 w-full bg-slate-100 rounded-xl" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-800">No Audit Logs Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Actions performed by administrators will appear here with timestamps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Admin Identity</th>
                  <th className="py-3.5 px-4">Collection / Target</th>
                  <th className="py-3.5 px-4">Summary</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px] text-xs text-slate-600">{log.adminEmail || 'admin'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-blue-600">
                          <Database className="w-3.5 h-3.5 text-blue-500" />
                          <span>{log.targetCollection}</span>
                        </div>
                        {log.targetId && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            ID: {log.targetId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200/80 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-500 text-xs block">Action:</span>
                  <p className="font-bold text-slate-900">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Admin:</span>
                  <p className="font-medium text-slate-700 truncate">{selectedLog.adminEmail}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Collection:</span>
                  <p className="font-medium text-blue-600">{selectedLog.targetCollection}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Timestamp:</span>
                  <p className="text-slate-600">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1 text-xs font-semibold">Payload / Event Details:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-56">
                  {selectedLog.details || 'No additional parameters.'}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
