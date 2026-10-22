import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Skeleton } from './UI';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  let filtered = data;
  if (searchable && query) {
    const q = query.toLowerCase();
    filtered = data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  return (
    <div className={`bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-white relative ${className}`}>
      {/* Specular hairline top glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

      {searchable && (
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.01]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 font-mono outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              {columns.map(col => (
                <th
                  key={col.key || col.accessor}
                  className={`px-5 py-3.5 text-left font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-[#CCFF00] select-none transition-colors' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortKey === col.accessor && (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#CCFF00]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#CCFF00]" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-white/5 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500 font-mono text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-white/[0.03] transition-colors">
                  {columns.map(col => (
                    <td key={col.key || col.accessor} className="px-5 py-3.5 text-slate-200 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
