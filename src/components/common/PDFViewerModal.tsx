import React from 'react';
import {
  FileText,
  Download,
  X,
  ExternalLink,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import type { StudyMaterial } from '../../types';

export interface PDFViewerModalProps {
  material?: StudyMaterial | null;
  title?: string;
  fileUrl?: string;
  isDownloadable?: boolean;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  material,
  title,
  fileUrl,
  isDownloadable,
  isOpen,
  onClose,
  canDownload = true,
}) => {
  if (!isOpen || (!material && !fileUrl)) return null;

  const docTitle = material?.title || title || 'Study Material';
  const docUrl = material?.fileUrl || fileUrl || '';
  const isDownloadPermitted =
    canDownload &&
    (material ? material.isDownloadable !== false : isDownloadable !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2457A7]/10 text-[#2457A7] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#172033] truncate">
                {docTitle}
              </h3>
              <p className="text-[11px] text-gray-500 truncate">
                {material?.subjectName || 'Study Resource'} • {(material?.fileType || 'PDF').toUpperCase()} • {material?.fileSizeMb || 1.5} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden sm:inline">Pop-out</span>
              </a>
            )}
            {isDownloadPermitted ? (
              <a
                href={docUrl}
                download={docTitle}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17365D] hover:bg-[#2457A7] text-white text-xs font-bold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                <Lock className="w-3 h-3" />
                <span>Read Only</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              aria-label="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF / Document Embed Viewer */}
        <div className="flex-1 w-full bg-slate-900 overflow-hidden relative">
          {docUrl ? (
            <iframe
              src={`${docUrl}#toolbar=0`}
              title={docTitle}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
              <FileText className="w-16 h-16 text-slate-500 mb-3" />
              <p className="text-base font-bold">Document Stream Ready</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Document preview is available for download or inline reading.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;
