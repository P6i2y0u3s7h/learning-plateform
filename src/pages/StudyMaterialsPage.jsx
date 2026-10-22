import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Download, Search, Filter, BookOpen, Layers,
  ChevronRight, CheckCircle2, Eye, Sparkles, Lock, Unlock, ArrowRight
} from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import Modal from '../components/Modal';
import PDFViewerModal from '../components/common/PDFViewerModal';
import { studentService } from '../services/studentService';

export default function StudyMaterialsPage() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDocViewer, setActiveDocViewer] = useState(null);
  const [liveMaterials, setLiveMaterials] = useState([]);

  useEffect(() => {
    let isMounted = true;
    studentService.getStudyMaterials().then((data) => {
      if (isMounted && data && data.length > 0) {
        setLiveMaterials(data);
      }
    }).catch((err) => console.warn('Could not load live study materials:', err));
    return () => { isMounted = false; };
  }, []);

  const materials = [
    {
      id: 'sm1',
      title: 'Class 10 Mathematics Complete Chapter 1-5 Formula Sheet',
      subject: 'Mathematics',
      class: 'Class 10',
      type: 'Formula Sheet',
      fileSize: '2.4 MB',
      pages: 14,
      downloads: '1.2k',
      date: 'Oct 2026',
    },
    {
      id: 'sm2',
      title: 'Class 10 Science Chemical Reactions & Equations Handcrafted Notes',
      subject: 'Science',
      class: 'Class 10',
      type: 'Revision Notes',
      fileSize: '4.8 MB',
      pages: 28,
      downloads: '980',
      date: 'Oct 2026',
    },
    {
      id: 'sm3',
      title: 'Class 12 Physics Electromagnetism High-Weightage Derivations',
      subject: 'Physics',
      class: 'Class 12',
      type: 'Derivations Guide',
      fileSize: '5.1 MB',
      pages: 36,
      downloads: '2.1k',
      date: 'Sep 2026',
    },
    {
      id: 'sm4',
      title: 'AMU Class 11 Entrance Exam Previous 10 Years Solved Questions',
      subject: 'All Subjects',
      class: 'AMU Entrance',
      type: 'PYQ Question Bank',
      fileSize: '8.3 MB',
      pages: 64,
      downloads: '3.4k',
      date: 'Aug 2026',
    },
    {
      id: 'sm5',
      title: 'Class 9 Mathematics Geometry & Mensuration Theorems Summary',
      subject: 'Mathematics',
      class: 'Class 9',
      type: 'Concept Map',
      fileSize: '3.1 MB',
      pages: 18,
      downloads: '850',
      date: 'Oct 2026',
    },
    {
      id: 'sm6',
      title: 'Class 11 Chemistry Periodic Classification & Chemical Bonding Mindmap',
      subject: 'Chemistry',
      class: 'Class 11',
      type: 'Mindmap',
      fileSize: '6.2 MB',
      pages: 22,
      downloads: '1.5k',
      date: 'Sep 2026',
    },
  ];

  const formattedLive = liveMaterials.map((m) => ({
    id: m.id,
    title: m.title,
    subject: m.subjectName || 'General',
    class: m.classGrade || 'All Classes',
    type: m.fileType === 'formula_sheet' ? 'Formula Sheet' : m.fileType === 'worksheet' ? 'Worksheet' : 'Revision Notes',
    fileSize: m.fileSizeMb ? `${m.fileSizeMb} MB` : '2.1 MB',
    pages: 18,
    downloads: `${m.downloadCount || 0}`,
    date: 'Recent',
    fileUrl: m.fileUrl,
    isDownloadable: m.isDownloadable !== false,
  }));

  const allMaterials = [...formattedLive, ...materials];

  const classes = ['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'AMU Entrance'];

  const filtered = allMaterials.filter((item) => {
    const matchClass = selectedClass === 'All' || item.class === selectedClass;
    const matchSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSubject && matchSearch;
  });

  return (
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold">DIGITAL STUDY MATERIALS</span>
        </div>

        {/* Hero Header */}
        <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-8 sm:p-12 mb-12 text-white relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>CURATED DIGITAL REVISION REPOSITORY</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight mb-4 text-white">
            HIGH-YIELD NOTES &{' '}
            <span className="font-editorial italic font-normal text-slate-300 normal-case">
              Handcrafted Blueprints.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-6 font-sans">
            Access chapter notes, formula sheets, NCERT solutions, previous 10-year question banks, and concise revision summaries designed for academic excellence.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#0E121A] rounded-2xl border border-white/10 p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Field */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, chapters, formulas..."
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition"
              />
            </div>

            {/* Quick Stats */}
            <div className="font-mono text-xs text-slate-400">
              SHOWING <span className="font-bold text-[#CCFF00]">{filtered.length}</span> RESOURCES
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
            <span className="font-mono text-xs text-slate-500 uppercase mr-2">
              FILTER GRADE:
            </span>
            {classes.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`text-xs font-mono uppercase px-3.5 py-1.5 rounded-full transition cursor-pointer border ${
                  selectedClass === c
                    ? 'bg-white text-black border-white font-extrabold shadow-sm'
                    : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Material Grid */}
        {filtered.length === 0 ? (
          <div className="bg-[#0E121A] rounded-2xl p-16 text-center border border-white/10">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="font-display font-extrabold text-white text-base mb-1 uppercase">No Materials Found</h3>
            <p className="text-xs text-slate-400 font-sans">Try adjusting your search query or grade level filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-[#0E121A] rounded-2xl border border-white/10 hover:border-white/25 hover:bg-[#121722] p-6 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#CCFF00] transition-colors">
                      <FileText className="w-5 h-5 text-slate-300 group-hover:text-black transition-colors" />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-1 rounded-full border border-[#CCFF00]/25">
                      {item.type}
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-white text-base mb-3 group-hover:text-[#CCFF00] transition-colors line-clamp-2 uppercase">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-3 font-mono text-xs text-slate-400 mb-6">
                    <span className="text-white font-bold">{item.class}</span>
                    <span>•</span>
                    <span>{item.subject}</span>
                    <span>•</span>
                    <span>{item.pages} PGS</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-slate-500">{item.fileSize} PDF</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDocViewer({
                          title: item.title,
                          fileUrl: item.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                          isDownloadable: item.isDownloadable !== false,
                        })
                      }
                      className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/5 font-mono text-xs transition cursor-pointer flex items-center gap-1 border border-white/10"
                      title="Read Online"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                    {item.isDownloadable !== false ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.fileUrl) {
                            window.open(item.fileUrl, '_blank');
                          } else {
                            alert(`Download started for: ${item.title}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-full bg-white text-black hover:bg-[#CCFF00] hover:text-black font-mono text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <Lock className="w-3 h-3 text-slate-500" />
                        View Only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PDF Viewer Modal */}
        {activeDocViewer && (
          <PDFViewerModal
            isOpen={!!activeDocViewer}
            onClose={() => setActiveDocViewer(null)}
            title={activeDocViewer.title}
            fileUrl={activeDocViewer.fileUrl}
            isDownloadable={activeDocViewer.isDownloadable}
          />
        )}
      </div>
    </div>
  );
}
