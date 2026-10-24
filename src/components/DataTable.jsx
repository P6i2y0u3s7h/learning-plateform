import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Skeleton } from './UI';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search records...',
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
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-slate-900 relative ${className}`}>
      {searchable && (
        <div className="px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 font-sans outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key || col.accessor}
                  className={`px-5 py-3.5 text-left font-sans text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-blue-600 select-none transition-colors' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortKey === col.accessor && (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans text-xs sm:text-sm">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-slate-100 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400 font-sans text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key || col.accessor} className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                      {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] ?? '—')}
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
