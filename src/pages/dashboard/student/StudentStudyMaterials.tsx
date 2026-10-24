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

      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Resource Repository
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Study Materials & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access verified chapter notes, practice worksheets, formula cards, and reference documents.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs by Resource Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {MATERIAL_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => {
              setSelectedType(type.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer border ${
              selectedType === type.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search & Subject Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
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
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border ${
                selectedSubject === sub
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 tracking-tight">
            No Study Materials Available
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
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
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        {getTypeIcon(item.fileType)}
                        {item.subjectName || 'General'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                          isDownloadAllowed
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1'
                        }`}
                        title={isDownloadAllowed ? 'Download permitted' : 'Protected: Read Online Only'}
                      >
                        {!isDownloadAllowed && <Lock className="w-2.5 h-2.5" />}
                        {item.fileType || 'PDF'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mb-1.5">
                      {item.title}
                    </h3>

                    {item.courseTitle && (
                      <p className="text-[11px] text-slate-400 mb-2 truncate">
                        {item.courseTitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {item.description || 'Essential revision guide and conceptual highlights.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.fileSizeMb ? `${item.fileSizeMb} MB` : 'Cloud Doc'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenViewer(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                        title="Read and Preview Online"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      {isDownloadAllowed ? (
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed"
                          title="Download disabled by administrator/teacher"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
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
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500 font-medium">
              <p>
                Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
