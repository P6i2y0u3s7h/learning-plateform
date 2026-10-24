import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  X,
  Search,
  Eye,
  CheckCircle2,
  Lock,
  Unlock,
  Upload,
  Globe,
  Loader2,
  Sparkles,
  Edit2,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { uploadStudyMaterialFile, validateUploadFile } from '../../../firebase/storage';
import type { StudyMaterial } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import PDFViewerModal from '../../../components/common/PDFViewerModal';
import { cacheManager } from '../../../utils/cacheManager';

export const TeacherMaterials: React.FC = () => {
  useDocumentTitle('Teacher Notes & Materials — Brainstorm Academy');
  const { user } = useAuth();

  const cachedMaterials = cacheManager.get<StudyMaterial[]>('materials:all');

  const [loading, setLoading] = useState(() => !cachedMaterials);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => cachedMaterials || []);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    subjectName: 'Mathematics',
    classGrade: 'Class 10',
    courseTitle: '',
    description: '',
    fileType: 'pdf' as 'pdf' | 'doc' | 'notes' | 'formula_sheet' | 'worksheet' | 'image',
    fileUrl: '',
    storagePath: '',
    fileSizeMb: 1.5,
    isPublished: true,
    isDownloadable: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileUrl: string;
    isDownloadable?: boolean;
  } | null>(null);

  const loadMaterials = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (materials.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<StudyMaterial[]>((_, reject) =>
        setTimeout(() => reject(new Error('Materials fetch timed out')), 8000)
      );
      const data = await Promise.race([adminService.getStudyMaterials(), timeoutPromise]);
      if (isMountedCheck()) {
        setMaterials(data);
      }
    } catch (err: any) {
      if (isMountedCheck()) {
        console.warn('[TeacherMaterials] Error loading materials:', err);
        if (materials.length === 0) {
          setError('Failed to fetch study materials from database.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [materials.length]);

  useEffect(() => {
    let isMounted = true;
    loadMaterials(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadMaterials]);

  const handleOpenCreateModal = () => {
    setEditingMaterial(null);
    setFormData({
      title: '',
      subjectName: 'Mathematics',
      classGrade: 'Class 10',
      courseTitle: '',
      description: '',
      fileType: 'pdf',
      fileUrl: '',
      storagePath: '',
      fileSizeMb: 1.5,
      isPublished: true,
      isDownloadable: true,
    });
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (mat: StudyMaterial) => {
    setEditingMaterial(mat);
    setFormData({
      title: mat.title,
      subjectName: mat.subjectName || 'Mathematics',
      classGrade: mat.classGrade || 'Class 10',
      courseTitle: mat.courseTitle || '',
      description: mat.description || '',
      fileType: mat.fileType || 'pdf',
      fileUrl: mat.fileUrl || '',
      storagePath: mat.storagePath || '',
      fileSizeMb: mat.fileSizeMb || 1.5,
      isPublished: mat.isPublished ?? true,
      isDownloadable: mat.isDownloadable ?? true,
    });
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, { maxSizeMb: 25 });
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    setFormData((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : cleanTitle,
      fileSizeMb: sizeMb,
      fileType: file.type.includes('image')
        ? 'image'
        : file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')
        ? 'doc'
        : 'pdf',
    }));
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTitle =
      formData.title.trim() ||
      selectedFile?.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() ||
      '';
    if (!effectiveTitle) {
      alert('Please provide a document title.');
      return;
    }

    setSaving(true);
    setFileError(null);
    setError(null);

    try {
      let finalFileUrl = formData.fileUrl;
      let finalStoragePath = formData.storagePath;

      // If a new physical file was chosen, upload to Firebase Storage
      if (selectedFile) {
        setUploadProgress(10);
        const gradeFolder = formData.classGrade.toLowerCase().replace(/\s+/g, '_');
        const uploadResult = await uploadStudyMaterialFile(
          selectedFile,
          gradeFolder,
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
        title: effectiveTitle,
        teacherId: user?.uid || 'instructor_faculty',
        teacherName: user?.displayName || 'Faculty Instructor',
        fileUrl: finalFileUrl,
        storagePath: finalStoragePath,
      };

      if (editingMaterial) {
        await adminService.updateStudyMaterial(
          editingMaterial.id,
          payload,
          user?.email || 'teacher'
        );
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === editingMaterial.id
              ? { ...m, ...payload, updatedAt: new Date().toISOString() }
              : m
          )
        );
        setSuccessMsg(`Updated "${payload.title}" successfully.`);
      } else {
        const newId = await adminService.createStudyMaterial(
          payload,
          user?.email || 'teacher'
        );
        const created: StudyMaterial = {
          id: newId,
          downloadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(payload as any),
        };
        setMaterials((prev) => [created, ...prev]);
        setSuccessMsg(`Published note "${payload.title}" successfully.`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[TeacherMaterials] Save failed:', err);
      setError(err?.message || 'Failed to save study material.');
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
        user?.email || 'teacher'
      );
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, isPublished: updated } : m))
      );
    } catch (err) {
      alert('Could not update publication status.');
    }
  };

  const handleDelete = async (mat: StudyMaterial) => {
    if (!confirm(`Are you sure you want to delete "${mat.title}"?`)) return;
    try {
      await adminService.deleteStudyMaterial(mat.id, user?.email || 'teacher');
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      setSuccessMsg(`Removed "${mat.title}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to delete material.');
    }
  };

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.subjectName && m.subjectName.toLowerCase().includes(q)) ||
        (m.classGrade && m.classGrade.toLowerCase().includes(q))
    );
  }, [materials, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Curriculum Authoring
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Teacher Notes & Study Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload PDFs, worksheets, and chapter resources stored securely in Firebase Storage.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Upload Note</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, class..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span>Total Materials: <strong className="text-slate-900 font-bold">{materials.length}</strong></span>
          <span>Published: <strong className="text-blue-600 font-bold">{materials.filter((m) => m.isPublished).length}</strong></span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">
            No Study Documents Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Click "Upload Note" to upload chapter notes or worksheets to the repository.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Upload Note</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-4 px-5">Document Title</th>
                  <th className="py-4 px-4">Subject & Class</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Size</th>
                  <th className="py-4 px-4">Download Permission</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-sm text-slate-900 line-clamp-1">
                        {mat.title}
                      </div>
                      {mat.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {mat.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 block">{mat.subjectName || 'General'}</span>
                      <span className="text-[11px] text-slate-500 block">{mat.classGrade || 'All Classes'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {mat.fileType || 'PDF'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {mat.fileSizeMb ? `${mat.fileSizeMb} MB` : '–'}
                    </td>
                    <td className="py-4 px-4">
                      {mat.isDownloadable !== false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                          <Unlock className="w-3 h-3" />
                          Permitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
                          <Lock className="w-3 h-3" />
                          Online Only
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(mat)}
                        className="cursor-pointer"
                        title="Click to toggle publication"
                      >
                        {mat.isPublished ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
                            Published
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition">
                            Draft
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            setPreviewDoc({
                              title: mat.title,
                              fileUrl: mat.fileUrl,
                              isDownloadable: mat.isDownloadable !== false,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Preview Online"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(mat)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Note Authoring
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">
              {editingMaterial ? 'Edit Study Material' : 'Upload Study Document'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Stored securely in Firebase Cloud Storage and accessible to enrolled students.
            </p>

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Key Theorems & Proofs"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Class / Grade
                  </label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="AMU / Jamia">AMU / Jamia</option>
                    <option value="Competitive Exam">Competitive Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Material Type
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="notes">Revision Notes</option>
                    <option value="worksheet">Practice Worksheet</option>
                    <option value="formula_sheet">Formula Sheet</option>
                    <option value="doc">Word / Doc</option>
                    <option value="image">Diagram / Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Associated Course
                  </label>
                  <input
                    type="text"
                    value={formData.courseTitle}
                    onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                    placeholder="e.g. Class 10 Science"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Highlights, chapters covered, or prerequisites..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              {/* File Upload Zone */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-400 transition">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold text-blue-600 hover:underline uppercase tracking-wider">
                      {selectedFile ? selectedFile.name : 'Choose file to upload'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Max size: 25 MB for PDF/Docs, 10 MB for Images. Enforced by Storage Security Rules.
                  </p>
                </div>
                {fileError && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-2 text-center">
                    {fileError}
                  </p>
                )}
                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Uploading to Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fallback Direct URL if external */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                  Or External Cloud Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              {/* Permission & Publication Toggles */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs uppercase tracking-wider text-slate-900 font-semibold">
                    Permit Student Download
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.isDownloadable}
                    onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </label>
                <p className="text-[10px] text-slate-500">
                  When disabled, students can only read this document online via the protected in-app viewer.
                </p>

                <div className="border-t border-slate-200 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs uppercase tracking-wider text-slate-900 font-semibold">
                      Publish Immediately
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Note...</span>
                    </>
                  ) : (
                    <span>{editingMaterial ? 'Save Changes' : 'Publish Note'}</span>
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

export default TeacherMaterials;
