import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Lock,
  Unlock,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { uploadStudyMaterialFile, validateUploadFile } from '../../../firebase/storage';
import type { StudyMaterial } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import PDFViewerModal from '../../../components/common/PDFViewerModal';

const ITEMS_PER_PAGE = 8;

export const AdminMaterials: React.FC = () => {
  useDocumentTitle('Study Materials Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subjectName: 'Mathematics',
    classGrade: 'Class 10',
    courseTitle: '',
    fileUrl: '',
    storagePath: '',
    fileType: 'pdf' as 'pdf' | 'doc' | 'notes' | 'formula_sheet' | 'worksheet' | 'image',
    fileSizeMb: 1.5,
    isPublished: true,
    isDownloadable: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileUrl: string;
    isDownloadable: boolean;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const list = await adminService.getStudyMaterials();
        if (isMounted) {
          setMaterials(list);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminMaterials] Error loading materials:', err);
          setError('Failed to fetch study materials from database.');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    setFormData((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : cleanTitle,
      fileSizeMb: sizeMb,
      fileType: file.type.includes('pdf')
        ? 'pdf'
        : file.type.includes('image')
        ? 'image'
        : 'doc',
    }));
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTitle =
      formData.title.trim() ||
      selectedFile?.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() ||
      '';
    if (!effectiveTitle) return;
    setSaving(true);
    setFileError(null);

    try {
      let finalFileUrl = formData.fileUrl;
      let finalStoragePath = formData.storagePath;

      if (selectedFile) {
        setUploadProgress(10);
        const folder = formData.classGrade.toLowerCase().replace(/\s+/g, '_');
        const uploadResult = await uploadStudyMaterialFile(
          selectedFile,
          folder,
          (progress) => setUploadProgress(progress)
        );
        finalFileUrl = uploadResult.downloadUrl;
        finalStoragePath = uploadResult.storagePath;
      }

      if (!finalFileUrl) {
        finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }

      const payload: Partial<StudyMaterial> = {
        ...formData,
        teacherId: user?.uid || 'admin_academic_lead',
        teacherName: user?.displayName || 'Academic Director',
        fileUrl: finalFileUrl,
        storagePath: finalStoragePath,
      };

      const id = await adminService.createStudyMaterial(payload, user?.email || 'admin');
      const newMaterial: StudyMaterial = {
        id,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(payload as any),
      };

      setMaterials((prev) => [newMaterial, ...prev]);
      setSuccessMsg(`Published resource "${newMaterial.title}".`);
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[AdminMaterials] Create error:', err);
      setError(err?.message || 'Could not save study material.');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleTogglePublish = async (mat: StudyMaterial) => {
    try {
      const updated = await adminService.toggleMaterialPublishStatus(
        mat.id,
        mat.isPublished,
        user?.email || 'admin'
      );
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, isPublished: updated } : m))
      );
    } catch (err) {
      alert('Could not update publication status.');
    }
  };

  const handleDelete = async (mat: StudyMaterial) => {
    if (!confirm(`Permanently delete resource "${mat.title}"?`)) return;
    try {
      await adminService.deleteStudyMaterial(mat.id, user?.email || 'admin');
      setMaterials((prev) => prev.filter((item) => item.id !== mat.id));
    } catch (err) {
      alert('Failed to delete material.');
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.subjectName && m.subjectName.toLowerCase().includes(q)) ||
        (m.classGrade && m.classGrade.toLowerCase().includes(q))
      );
    });
  }, [materials, searchQuery]);

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE) || 1;
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMaterials.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMaterials, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>[ ARCHIVE INDEX · STUDY MATERIALS ]</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              Study Materials & Notes
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
              Upload chapter notes, formula sheets, and PDF question banks stored securely in Firebase Storage.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData({
                title: '',
                subjectName: 'Mathematics',
                classGrade: 'Class 10',
                courseTitle: '',
                fileUrl: '',
                storagePath: '',
                fileType: 'pdf',
                fileSizeMb: 1.5,
                isPublished: true,
                isDownloadable: true,
              });
              setSelectedFile(null);
              setFileError(null);
              setUploadProgress(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer shadow-lg w-fit self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Material</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-white font-mono animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#CCFF00]" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search documents by title or subject..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#060C17] border border-white/15 text-white placeholder-slate-500 rounded-xl outline-none font-mono focus:border-[#CCFF00]"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          TOTAL: <strong className="text-[#CCFF00]">{materials.length}</strong> DOCUMENTS
        </span>
      </div>

      {/* Materials Table */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-white/5">
              <Skeleton className="h-4 w-40 bg-white/5" />
              <Skeleton className="h-4 w-20 bg-white/5" />
              <Skeleton className="h-4 w-12 bg-white/5" />
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white mb-1">
            No Study Materials Found
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-5">
            Click "+ Upload Material" to publish notes or formula cards.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent pointer-events-none" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Document Title</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Type & Size</th>
                    <th className="py-3.5 px-4">Download Permission</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {paginatedMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-4 px-6 font-bold text-sm text-white">
                        {m.title}
                        {m.courseTitle && (
                          <span className="block text-[11px] font-normal font-mono text-slate-400">
                            {m.courseTitle}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-mono font-bold text-[#CCFF00] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                          {m.subjectName || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-400 uppercase">
                        {m.fileType || 'PDF'} ({m.fileSizeMb || 1.5} MB)
                      </td>
                      <td className="py-4 px-4">
                        {m.isDownloadable !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2.5 py-0.5 rounded-full">
                            <Unlock className="w-3 h-3" />
                            PERMITTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            ONLINE ONLY
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleTogglePublish(m)}
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition cursor-pointer border ${
                            m.isPublished
                              ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m.isPublished ? 'PUBLISHED' : 'HIDDEN'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() =>
                            setPreviewDoc({
                              title: m.title,
                              fileUrl: m.fileUrl,
                              isDownloadable: m.isDownloadable !== false,
                            })
                          }
                          className="p-2 text-slate-400 hover:text-[#CCFF00] inline-block rounded-lg hover:bg-white/5 transition cursor-pointer"
                          title="Preview Online"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {m.fileUrl && m.isDownloadable !== false && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-white inline-block rounded-lg hover:bg-white/5 transition"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-2xl">
              <p className="text-xs font-mono text-slate-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-4">
              Upload Study Resource
            </h3>

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Document Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Class 10 Physics Formulas & Key Definitions"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Class / Category</label>
                  <input
                    type="text"
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">File Type</label>
                <select
                  value={formData.fileType}
                  onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="formula_sheet">Formula Sheet</option>
                  <option value="notes">Revision Notes</option>
                  <option value="worksheet">Practice Worksheet</option>
                  <option value="doc">Word / Doc</option>
                  <option value="image">Diagram / Image</option>
                </select>
              </div>

              {/* Physical File Upload */}
              <div className="p-4 bg-[#060C17] border-2 border-dashed border-white/20 rounded-2xl">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-[#CCFF00] mx-auto mb-2 opacity-80" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-mono font-bold text-[#CCFF00] hover:underline">
                      {selectedFile ? selectedFile.name : 'Select file to upload to Firebase Storage'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Max size: 25 MB for PDF/Docs, 10 MB for Images. Enforced by Storage Security Rules.
                  </p>
                </div>
                {fileError && (
                  <p className="text-[11px] font-mono font-bold text-rose-400 mt-2 text-center">
                    {fileError}
                  </p>
                )}
                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Uploading to Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#CCFF00] h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Or External Cloud Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://storage.googleapis.com/... or Google Drive"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-white outline-none focus:border-[#CCFF00] font-mono"
                />
              </div>

              {/* Permissions */}
              <div className="p-3 bg-[#060C17] border border-white/10 rounded-2xl space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-mono text-white text-xs">Permit Student Download</span>
                  <input
                    type="checkbox"
                    checked={formData.isDownloadable}
                    onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                    className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00] accent-[#CCFF00]"
                  />
                </label>
                <p className="text-[10px] text-slate-500 font-mono">
                  When disabled, students can only read online inside the platform.
                </p>

                <div className="border-t border-white/10 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-mono text-white text-xs">Publish Resource Immediately</span>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00] accent-[#CCFF00]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF / Document Modal Preview */}
      {previewDoc && (
        <PDFViewerModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          fileUrl={previewDoc.fileUrl}
          isDownloadable={previewDoc.isDownloadable}
        />
      )}
    </div>
  );
};

export default AdminMaterials;
