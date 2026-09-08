import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { History, Search, RefreshCw, Shield, Clock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const search = (searchTerm || '').toLowerCase();
      return (
        !searchTerm ||
        (l.userName || '').toLowerCase().includes(search) ||
        (l.action || '').toLowerCase().includes(search) ||
        (l.entityType || '').toLowerCase().includes(search) ||
        (l.details && l.details.toLowerCase().includes(search))
      );
    });
  }, [logs, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Audit Trail & Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all financial transactions, subscriber updates, staff actions, and invoice generation
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search activity logs by user, action, customer or entity..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">User / Operator</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5 pr-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 pl-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px] uppercase">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-700 uppercase text-[11px]">
                      {log.entityType}
                    </td>

                    <td className="p-3.5 pr-4 text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
