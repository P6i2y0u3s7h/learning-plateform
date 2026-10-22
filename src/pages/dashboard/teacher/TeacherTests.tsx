import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Clock,
  Award,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { examService } from '../../../services/examService';
import { cacheManager } from '../../../utils/cacheManager';
import type { Test, Question, QuestionType } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const TeacherTests: React.FC = () => {
  useDocumentTitle('Teacher Online Test Management — Brainstorm Academy');
  const { user } = useAuth();

  const cachedTests = cacheManager.get<Test[]>('tests:all');

  const [loading, setLoading] = useState(() => !cachedTests);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>(() => cachedTests || []);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [testForm, setTestForm] = useState({
    title: '',
    subjectName: 'Mathematics',
    classGrade: 'Class 10',
    description: '',
    durationMinutes: 45,
    passingMarks: 18,
    attemptLimit: 0,
    negativeMarking: true,
    isPublished: true,
    allowRetake: true,
  });

  // Questions in authoring modal
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_1',
      questionText: '',
      type: 'single_choice',
      marks: 4,
      negativeMarks: 1,
      options: [
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
        { id: 'opt_3', text: '' },
        { id: 'opt_4', text: '' },
      ],
      correctOptionIds: ['opt_1'],
      explanation: '',
    },
  ]);

  const loadTests = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (tests.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<Test[]>((_, reject) =>
        setTimeout(() => reject(new Error('Tests fetch timed out')), 8000)
      );

      const data = await Promise.race([examService.getAllTests(), timeoutPromise]);
      if (isMountedCheck()) {
        setTests(data);
      }
    } catch (err: any) {
      if (isMountedCheck()) {
        console.warn('[TeacherTests] Load error:', err);
        if (tests.length === 0) {
          setError('Failed to fetch tests catalog.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [tests.length]);

  useEffect(() => {
    let isMounted = true;
    loadTests(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadTests]);

  const handleOpenCreateModal = () => {
    setEditingTestId(null);
    setTestForm({
      title: '',
      subjectName: 'Mathematics',
      classGrade: 'Class 10',
      description: '',
      durationMinutes: 30,
      passingMarks: 16,
      attemptLimit: 0,
      negativeMarking: true,
      isPublished: true,
      allowRetake: true,
    });
    setQuestions([
      {
        id: `q_${Date.now()}_1`,
        questionText: 'What is the sum of roots for x² - 5x + 6 = 0?',
        type: 'single_choice',
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: 'opt_1', text: '5' },
          { id: 'opt_2', text: '-5' },
          { id: 'opt_3', text: '6' },
          { id: 'opt_4', text: '-6' },
        ],
        correctOptionIds: ['opt_1'],
        explanation: 'For quadratic ax² + bx + c = 0, sum of roots is -b/a = -(-5)/1 = 5.',
      },
    ]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: Test) => {
    setEditingTestId(t.id);
    setTestForm({
      title: t.title,
      subjectName: t.subjectName || 'General',
      classGrade: t.classGrade || 'Class 10',
      description: t.description || '',
      durationMinutes: t.durationMinutes || 45,
      passingMarks: t.passingMarks || 16,
      attemptLimit: t.attemptLimit || 0,
      negativeMarking: t.negativeMarking ?? true,
      isPublished: t.isPublished ?? true,
      allowRetake: t.allowRetake ?? true,
    });
    setQuestions(
      t.questions && t.questions.length > 0
        ? JSON.parse(JSON.stringify(t.questions))
        : [
            {
              id: `q_${Date.now()}`,
              questionText: '',
              type: 'single_choice',
              marks: 4,
              negativeMarks: 1,
              options: [
                { id: 'opt_1', text: '' },
                { id: 'opt_2', text: '' },
                { id: 'opt_3', text: '' },
                { id: 'opt_4', text: '' },
              ],
              correctOptionIds: ['opt_1'],
              explanation: '',
            },
          ]
    );
    setModalOpen(true);
  };

  // Add new question to editor
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}_${questions.length + 1}`,
      questionText: '',
      type: 'single_choice',
      marks: 4,
      negativeMarks: 1,
      options: [
        { id: `opt_${Date.now()}_a`, text: '' },
        { id: `opt_${Date.now()}_b`, text: '' },
        { id: `opt_${Date.now()}_c`, text: '' },
        { id: `opt_${Date.now()}_d`, text: '' },
      ],
      correctOptionIds: [`opt_${Date.now()}_a`],
      explanation: '',
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('A test must contain at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.title.trim()) {
      alert('Please enter a test title.');
      return;
    }

    // Verify all questions have text and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} is missing its question statement.`);
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        alert(`Question #${i + 1} has empty option texts. Please fill in all options.`);
        return;
      }
      if (q.correctOptionIds.length === 0) {
        alert(`Please select the correct answer for Question #${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 4), 0);
      const payload: Partial<Test> = {
        ...testForm,
        id: editingTestId || `test_${Date.now()}`,
        instructorId: user?.uid || 'instructor_faculty',
        instructorName: user?.displayName || 'Faculty Member',
        totalMarks,
        questionsCount: questions.length,
        questions,
      };

      const savedId = await examService.saveTest(payload, user?.email || 'teacher');

      if (editingTestId) {
        setTests((prev) =>
          prev.map((t) => (t.id === editingTestId ? ({ ...t, ...payload, id: savedId } as Test) : t))
        );
        setSuccessMsg(`Successfully updated test "${payload.title}".`);
      } else {
        setTests((prev) => [payload as Test, ...prev]);
        setSuccessMsg(`Published new test "${payload.title}".`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[TeacherTests] Save error:', err);
      alert(err?.message || 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (t: Test) => {
    try {
      const updated = await examService.toggleTestPublication(t.id, t.isPublished);
      setTests((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, isPublished: updated } : item))
      );
    } catch (err) {
      alert('Failed to update publication status.');
    }
  };

  const handleDelete = async (t: Test) => {
    if (!confirm(`Are you sure you want to delete test "${t.title}"?`)) return;
    try {
      await examService.deleteTest(t.id);
      setTests((prev) => prev.filter((item) => item.id !== t.id));
      setSuccessMsg(`Deleted "${t.title}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to delete test.');
    }
  };

  const filteredTests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tests.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.subjectName && t.subjectName.toLowerCase().includes(q)) ||
        (t.classGrade && t.classGrade.toLowerCase().includes(q))
    );
  }, [tests, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner - Scrub Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E121A] via-[#090D14] to-[#04060A] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              [ 06 // EVALUATION STUDIO ]
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Online Examination & Quiz Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1 tracking-tight">
              Author timed tests, configure marking rules and question banks, and monitor student evaluation.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer shadow-lg active:scale-95 w-fit flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Create New Test</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-emerald-300 font-mono animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test by title, subject, or class..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 font-mono transition"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Total Tests: <strong className="text-[#CCFF00] font-bold">{tests.length}</strong>
        </div>
      </div>

      {/* Test List Table */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-white/5">
              <Skeleton className="h-5 w-1/3 bg-white/5" />
              <Skeleton className="h-5 w-20 bg-white/5" />
              <Skeleton className="h-5 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white mb-1">
            No Examination Tests Found
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-5">
            Click "Create New Test" to build an interactive timed MCQ assessment.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Test</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#060C17]/90 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5">Test Title</th>
                  <th className="py-4 px-4">Subject & Class</th>
                  <th className="py-4 px-4">Duration</th>
                  <th className="py-4 px-4">Questions & Marks</th>
                  <th className="py-4 px-4">Negative Marking</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {filteredTests.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-sm text-white line-clamp-1">{t.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                        {t.description || 'Curriculum assessment test'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-white block">{t.subjectName || 'General'}</span>
                      <span className="text-[11px] text-slate-400 font-mono block">{t.classGrade || 'Class 10'}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {t.durationMinutes} mins
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      <span>{t.questionsCount || t.questions?.length || 25} Qs</span>
                      <span className="text-slate-500 block text-[11px]">{t.totalMarks || 100} pts</span>
                    </td>
                    <td className="py-4 px-4">
                      {t.negativeMarking ? (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                          -1 penalty
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-mono">
                          None
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(t)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                          t.isPublished
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {t.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-2 text-slate-400 hover:text-[#CCFF00] hover:bg-white/5 rounded-lg transition"
                          title="Edit Test & Questions"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Test"
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

      {/* ======================================================== */}
      {/* TEST AUTHORING & QUESTION BUILDER MODAL                  */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0E121A] rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[92vh] flex flex-col text-white">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] font-mono text-[10px] uppercase tracking-widest mb-2 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              [ TEST_BUILDER_v2 ]
            </div>

            <h3 className="font-display font-bold text-lg text-white mb-1">
              {editingTestId ? 'Edit Examination Test' : 'Create Examination Test'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Configure parameters, negative marking, and question answer keys evaluated securely on the backend.
            </p>

            <form onSubmit={handleSaveTest} className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Test Meta Inputs */}
              <div className="space-y-4 p-5 bg-[#080B11] rounded-2xl border border-white/10">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 mb-1.5">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    placeholder="e.g. Class 10 Physics: Electricity & Circuits Final Mock"
                    className="w-full py-2.5 px-3.5 bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={testForm.subjectName}
                      onChange={(e) => setTestForm({ ...testForm, subjectName: e.target.value })}
                      className="w-full py-2 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 mb-1.5">Class / Target</label>
                    <input
                      type="text"
                      value={testForm.classGrade}
                      onChange={(e) => setTestForm({ ...testForm, classGrade: e.target.value })}
                      className="w-full py-2 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 mb-1.5">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      value={testForm.durationMinutes}
                      onChange={(e) =>
                        setTestForm({ ...testForm, durationMinutes: parseInt(e.target.value) || 30 })
                      }
                      className="w-full py-2 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 mb-1.5">Pass Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={testForm.passingMarks}
                      onChange={(e) =>
                        setTestForm({ ...testForm, passingMarks: parseInt(e.target.value) || 16 })
                      }
                      className="w-full py-2 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testForm.negativeMarking}
                      onChange={(e) => setTestForm({ ...testForm, negativeMarking: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-[#060C17] accent-[#CCFF00]"
                    />
                    <span className="font-mono text-xs text-slate-300">Enable Negative Marking (-1 per wrong)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testForm.allowRetake}
                      onChange={(e) => setTestForm({ ...testForm, allowRetake: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-[#060C17] accent-[#CCFF00]"
                    />
                    <span className="font-mono text-xs text-slate-300">Allow Retakes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testForm.isPublished}
                      onChange={(e) => setTestForm({ ...testForm, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-[#060C17] accent-[#CCFF00]"
                    />
                    <span className="font-mono text-xs text-slate-300">Publish Immediately</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Question Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <span>Question Bank</span>
                    <span className="font-mono text-xs text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/20">
                      {questions.length} Qs • {questions.reduce((s, q) => s + (q.marks || 4), 0)} pts total
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-[#CCFF00] border border-white/10 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-5 bg-[#080B11] rounded-2xl border border-white/10 shadow-lg space-y-3.5 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="font-mono font-bold text-xs text-[#CCFF00] tracking-wide">
                        [ QUESTION #{String(qIdx + 1).padStart(2, '0')} ]
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Question Statement *
                      </label>
                      <textarea
                        rows={2}
                        value={q.questionText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) =>
                            prev.map((item, i) => (i === qIdx ? { ...item, questionText: val } : item))
                          );
                        }}
                        placeholder="Type the question clearly..."
                        className="w-full py-2 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono text-xs outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition"
                        required
                      />
                    </div>

                    {/* Options Grid */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">
                        Options & Correct Key (Select radio to specify correct answer):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctOptionIds.includes(opt.id);
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                                isCorrect
                                  ? 'border-[#CCFF00]/60 bg-[#CCFF00]/10 text-white'
                                  : 'border-white/10 bg-[#060C17] text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_ans_${q.id}`}
                                checked={isCorrect}
                                onChange={() => {
                                  setQuestions((prev) =>
                                    prev.map((item, i) =>
                                      i === qIdx ? { ...item, correctOptionIds: [opt.id] } : item
                                    )
                                  );
                                }}
                                className="w-4 h-4 accent-[#CCFF00]"
                              />
                              <span className="font-mono font-bold text-xs text-slate-400">{letter}.</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setQuestions((prev) =>
                                    prev.map((item, i) =>
                                      i === qIdx
                                        ? {
                                            ...item,
                                            options: item.options.map((o, idx) =>
                                              idx === oIdx ? { ...o, text } : o
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                placeholder={`Option ${letter}`}
                                className="w-full bg-transparent outline-none text-xs font-mono text-white placeholder-slate-500"
                                required
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                        Faculty Explanation / Solution Rationale (Revealed to students after submission)
                      </label>
                      <textarea
                        rows={2}
                        value={q.explanation || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) =>
                            prev.map((item, i) => (i === qIdx ? { ...item, explanation: val } : item))
                          );
                        }}
                        placeholder="Explain why the chosen option is correct..."
                        className="w-full py-1.5 px-3 bg-[#060C17] border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono text-xs outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/80 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-[#CCFF00] hover:bg-white text-black transition shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Saving Assessment...</span>
                    </>
                  ) : (
                    <span>Save & Publish Test</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTests;
