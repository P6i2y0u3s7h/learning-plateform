import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  BookOpen,
  Filter,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Lock,
  Image as ImageIcon,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { StudyMaterial } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import PDFViewerModal from '../../../components/common/PDFViewerModal';

const ITEMS_PER_PAGE = 8;

const MATERIAL_TYPES = [
  { key: 'all', label: 'All Resources' },
  { key: 'notes', label: 'PDF Notes' },
  { key: 'worksheet', label: 'Worksheets' },
  { key: 'formula_sheet', label: 'Formula Sheets' },
  { key: 'image', label: 'Diagrams & Images' },
  { key: 'doc', label: 'Docs' },
];

export const StudentStudyMaterials: React.FC = () => {
  useDocumentTitle('Study Materials & Notes — Brainstorm Academy');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Active document preview modal state
  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileUrl: string;
    isDownloadable?: boolean;
    fileType?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMaterials() {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getStudyMaterials();
        if (isMounted) {
          setMaterials(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load study materials:', err);
          setError('Failed to load study materials from library.');
          setLoading(false);
        }
      }
    }

    loadMaterials();
    return () => {
      isMounted = false;
    };
  }, []);

  // Distinct subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.subjectName) set.add(m.subjectName);
    });
    return ['All', ...Array.from(set)];
  }, [materials]);

  // Filtering
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subjectName && item.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.courseTitle && item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject = selectedSubject === 'All' || item.subjectName === selectedSubject;

      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'notes' && (item.fileType === 'notes' || item.fileType === 'pdf')) ||
        item.fileType === selectedType;

      return matchesSearch && matchesSubject && matchesType;
    });
  }, [materials, searchQuery, selectedSubject, selectedType]);

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE) || 1;
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMaterials.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMaterials, currentPage]);

  const handleOpenViewer = (item: StudyMaterial) => {
    setViewingDoc({
      title: item.title,
      fileUrl: item.fileUrl || '',
      isDownloadable: item.isDownloadable !== false,
      fileType: item.fileType,
    });
  };

  const handleDownload = (e: React.MouseEvent, item: StudyMaterial) => {
    e.stopPropagation();
    if (item.isDownloadable === false) {
      alert('This resource is protected by instructor settings and can only be read online.');
      return;
    }
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    } else {
      alert(`Download started for ${item.title}`);
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-500" />;
      case 'worksheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'formula_sheet':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-[#2457A7]" />;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 04 // RESOURCE REPOSITORY ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Study Materials & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Access verified chapter notes, practice worksheets, formula cards, and reference documents.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs by Resource Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
        {MATERIAL_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => {
              setSelectedType(type.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer border ${
              selectedType === type.key
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
                : 'bg-[#0E121A]/85 backdrop-blur-xl border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search & Subject Filters */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search notes, chapters, formulas..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubject(sub);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer border ${
                selectedSubject === sub
                  ? 'bg-[#38BDF8] text-black border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Study Materials Available
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto mb-4 leading-relaxed">
            {materials.length === 0
              ? 'New chapter notes and formula cards will be published by faculty soon.'
              : 'No documents match your filter. Try clearing the search query or selecting a different category.'}
          </p>
          {(searchQuery || selectedSubject !== 'All' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
                setSelectedType('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 border border-[#CCFF00]/30 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedMaterials.map((item) => {
              const isDownloadAllowed = item.isDownloadable !== false;
              return (
                <div
                  key={item.id}
                  className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl hover:border-[#CCFF00]/40 transition-all flex flex-col justify-between group text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        {getTypeIcon(item.fileType)}
                        {item.subjectName || 'General'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isDownloadAllowed
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/30 flex items-center gap-1'
                        }`}
                        title={isDownloadAllowed ? 'Download permitted' : 'Protected: Read Online Only'}
                      >
                        {!isDownloadAllowed && <Lock className="w-2.5 h-2.5" />}
                        {item.fileType || 'PDF'}
                      </span>
                    </div>

                    <h3 className="font-mono font-bold text-sm text-white group-hover:text-[#CCFF00] transition line-clamp-2 mb-1.5">
                      {item.title}
                    </h3>

                    {item.courseTitle && (
                      <p className="text-[11px] font-mono text-slate-400 mb-2 truncate">
                        {item.courseTitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                      {item.description || 'Essential revision guide and conceptual highlights.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.fileSizeMb ? `${item.fileSizeMb} MB` : 'Cloud Doc'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenViewer(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-black transition cursor-pointer"
                        title="Read and Preview Online"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      {isDownloadAllowed ? (
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                          title="Download disabled by administrator/teacher"
                        >
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Protected</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono text-xs text-slate-400">
              <p>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF / Document Viewer Modal */}
      {viewingDoc && (
        <PDFViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.title}
          fileUrl={viewingDoc.fileUrl}
          isDownloadable={viewingDoc.isDownloadable}
        />
      )}
    </div>
  );
};

export default StudentStudyMaterials;
