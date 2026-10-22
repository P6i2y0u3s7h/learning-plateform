import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  Filter,
  AlertCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Percent,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { examService } from '../../../services/examService';
import type { TestAttempt, Test, Question } from '../../../types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const TestResultDetail: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  useDocumentTitle('Test Result & Detailed Solutions — Brainstorm Academy');

  useEffect(() => {
    let isMounted = true;
    async function loadResult() {
      if (!attemptId || !user?.uid) return;
      try {
        setLoading(true);
        setError(null);
        const data = await examService.getAttemptWithSolutions(attemptId, user.uid);
        if (isMounted) {
          setAttempt(data.attempt);
          setTest(data.test);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[TestResultDetail] Load error:', err);
          setError(err?.message || 'Failed to retrieve test evaluation.');
          setLoading(false);
        }
      }
    }

    loadResult();
    return () => {
      isMounted = false;
    };
  }, [attemptId, user?.uid]);

  // Map responses by question ID
  const responseMap = useMemo(() => {
    if (!attempt || !attempt.responses) return new Map();
    const map = new Map();
    for (const res of attempt.responses) {
      map.set(res.questionId, res);
    }
    return map;
  }, [attempt]);

  // Questions filtered
  const filteredQuestions = useMemo(() => {
    if (!test || !test.questions) return [];
    return test.questions.filter((q) => {
      const res = responseMap.get(q.id);
      const isUnattempted = !res || res.selectedOptionIds.length === 0;
      const isCorrect = res && res.isCorrect;

      if (filterMode === 'correct') return isCorrect;
      if (filterMode === 'incorrect') return !isUnattempted && !isCorrect;
      if (filterMode === 'unattempted') return isUnattempted;
      return true;
    });
  }, [test, responseMap, filterMode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-mono">
        <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin mb-4" />
        <h2 className="font-bold text-lg text-white">
          Compiling Examination Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Evaluating answer keys, calculating percentile marks, and loading explanations...
        </p>
      </div>
    );
  }

  if (error || !attempt || !test) {
    return (
      <div className="max-w-md mx-auto p-8 bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl text-center my-12 text-white font-mono">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-white mb-1">
          Assessment Record Not Found
        </h3>
        <p className="text-xs text-slate-400 mb-6">{error || 'Could not load result.'}</p>
        <Link
          to="/dashboard/student/tests"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition"
        >
          Back to Tests
        </Link>
      </div>
    );
  }

  const isPass = attempt.isPassed;
  const timeTakenMins = Math.round((attempt.timeSpentSeconds || 0) / 60);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between font-mono">
        <Link
          to="/dashboard/student/results"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#38BDF8] hover:text-[#CCFF00] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>[ ALL TEST RESULTS ]</span>
        </Link>
        <span className="text-xs text-slate-500">
          Attempted on {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Today'}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 1. SCORE HERO CARD                                       */}
      {/* ======================================================== */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap font-mono">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPass
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                }`}
              >
                {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {isPass ? 'PASSED ASSESSMENT' : 'NEEDS REINFORCEMENT'}
              </span>
              <span className="text-xs text-slate-400">
                Passing Req: {test.passingMarks} Pts
              </span>
            </div>

            <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
              {test.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {test.subjectName || 'Curriculum Subject'} • {test.classGrade || 'Class Batch'}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-5 bg-[#060C17] rounded-2xl p-5 border border-white/15 font-mono">
            <div className="text-center">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Score Obtained</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#CCFF00] mt-0.5">
                {attempt.score} <span className="text-sm text-slate-400 font-normal">/ {attempt.totalMarks}</span>
              </p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div className="text-center">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Percentage</p>
              <p className="font-bold text-3xl sm:text-4xl text-white mt-0.5">
                {attempt.percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Action bar inside hero */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#CCFF00]" />
              Time: <strong className="text-white">{timeTakenMins > 0 ? `${timeTakenMins} Mins` : '< 1 Min'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              Accuracy: <strong className="text-white">{attempt.accuracyPercentage || 0}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {test.allowRetake && (
              <button
                onClick={() => navigate(`/dashboard/student/exam/${test.id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CCFF00] hover:bg-white text-black transition shadow-[0_0_12px_rgba(204,255,0,0.25)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            )}
            <Link
              to="/dashboard/student/tests"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS BREAKDOWN GRID                                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-xl flex items-center gap-3.5 text-white">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Correct</p>
            <p className="font-bold text-xl text-white mt-0.5">
              {attempt.correctAnswersCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-xl flex items-center gap-3.5 text-white">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center font-bold flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Incorrect</p>
            <p className="font-bold text-xl text-white mt-0.5">
              {attempt.incorrectAnswersCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-xl flex items-center gap-3.5 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center font-bold flex-shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Unattempted</p>
            <p className="font-bold text-xl text-white mt-0.5">
              {attempt.unattemptedCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-xl flex items-center gap-3.5 text-white">
          <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center font-bold flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Accuracy Rate</p>
            <p className="font-bold text-xl text-white mt-0.5">
              {attempt.accuracyPercentage || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. QUESTION-BY-QUESTION SOLUTIONS REVIEW                 */}
      {/* ======================================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
              <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-wider font-bold">
                ANSWER EVALUATION
              </span>
            </div>
            <h2 className="font-mono font-bold text-xl text-white">
              Comprehensive Answer Key & Solutions
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Review correct answers, your chosen selections, and detailed faculty step-by-step rationales.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono">
            {[
              { id: 'all', label: `All (${test.questions?.length || 0})` },
              { id: 'correct', label: `Correct (${attempt.correctAnswersCount || 0})` },
              { id: 'incorrect', label: `Incorrect (${attempt.incorrectAnswersCount || 0})` },
              { id: 'unattempted', label: `Skipped (${attempt.unattemptedCount || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.25)]'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-5">
          {filteredQuestions.map((q, qIdx) => {
            const res = responseMap.get(q.id);
            const userSelections = res ? res.selectedOptionIds : [];
            const isUnattempted = userSelections.length === 0;
            const isCorrect = res && res.isCorrect;

            return (
              <div
                key={q.id}
                className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl space-y-5 text-white"
              >
                {/* Header status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      Question {test.questions ? test.questions.indexOf(q) + 1 : qIdx + 1}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                        <Check className="w-3 h-3" /> Correct (+{res?.marksObtained || q.marks})
                      </span>
                    ) : isUnattempted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-400 border border-white/10">
                        Unattempted (0 Marks)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <X className="w-3 h-3" /> Incorrect ({res?.marksObtained || 0} Marks)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Max Marks: {q.marks} {test.negativeMarking ? `• Penalty: -${q.negativeMarks}` : ''}
                  </span>
                </div>

                {/* Question Statement */}
                <p className="text-sm text-slate-100 font-medium leading-relaxed font-sans">
                  {q.questionText}
                </p>

                {/* Options List */}
                <div className="space-y-2.5 pt-1 font-mono">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = userSelections.includes(opt.id);
                    const isRightAnswer = (q.correctOptionIds || []).includes(opt.id);

                    let optionStyle = 'border-white/10 bg-[#060C17] text-slate-300';
                    let letterStyle = 'bg-white/10 text-slate-300';

                    if (isRightAnswer) {
                      optionStyle = 'border-[#10B981] bg-[#10B981]/10 text-emerald-200';
                      letterStyle = 'bg-[#10B981] text-black font-black';
                    } else if (isSelected && !isRightAnswer) {
                      optionStyle = 'border-red-500 bg-red-950/30 text-red-300';
                      letterStyle = 'bg-red-500 text-white font-black';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${letterStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="font-medium leading-relaxed font-sans">{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRightAnswer && (
                            <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/20 border border-[#10B981]/30 px-2 py-0.5 rounded-md uppercase">
                              Correct Choice
                            </span>
                          )}
                          {isSelected && !isRightAnswer && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded-md uppercase">
                              Your Selection
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1 font-mono">
                    <p className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Faculty Explanation & Concept Highlights
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestResultDetail;
