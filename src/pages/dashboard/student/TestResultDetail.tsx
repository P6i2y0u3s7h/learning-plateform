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
    <div className="space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between text-xs font-medium">
        <Link
          to="/dashboard/student/results"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Test Results</span>
        </Link>
        <span className="text-slate-400">
          Attempted on {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Today'}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 1. SCORE HERO CARD                                       */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isPass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                {isPass ? 'Passed Assessment' : 'Needs Reinforcement'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Passing Req: {test.passingMarks} Pts
              </span>
            </div>

            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {test.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {test.subjectName || 'Curriculum Subject'} • {test.classGrade || 'Class Batch'}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-5 bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Score Obtained</p>
              <p className="font-extrabold text-3xl sm:text-4xl text-blue-600 mt-0.5">
                {attempt.score} <span className="text-sm text-slate-400 font-normal">/ {attempt.totalMarks}</span>
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Percentage</p>
              <p className="font-extrabold text-3xl sm:text-4xl text-slate-900 mt-0.5">
                {attempt.percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Action bar inside hero */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Time: <strong className="text-slate-900">{timeTakenMins > 0 ? `${timeTakenMins} Mins` : '< 1 Min'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Accuracy: <strong className="text-slate-900">{attempt.accuracyPercentage || 0}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {test.allowRetake && (
              <button
                onClick={() => navigate(`/dashboard/student/exam/${test.id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            )}
            <Link
              to="/dashboard/student/tests"
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS BREAKDOWN GRID                                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 text-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Correct</p>
            <p className="font-extrabold text-xl text-slate-900 mt-0.5">
              {attempt.correctAnswersCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 text-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Incorrect</p>
            <p className="font-extrabold text-xl text-slate-900 mt-0.5">
              {attempt.incorrectAnswersCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 text-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center font-bold flex-shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unattempted</p>
            <p className="font-extrabold text-xl text-slate-900 mt-0.5">
              {attempt.unattemptedCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 text-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Accuracy Rate</p>
            <p className="font-extrabold text-xl text-slate-900 mt-0.5">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Answer Evaluation
            </div>
            <h2 className="font-bold text-xl text-slate-900">
              Comprehensive Answer Key & Solutions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct answers, your chosen selections, and detailed faculty step-by-step rationales.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
            {[
              { id: 'all', label: `All (${test.questions?.length || 0})` },
              { id: 'correct', label: `Correct (${attempt.correctAnswersCount || 0})` },
              { id: 'incorrect', label: `Incorrect (${attempt.incorrectAnswersCount || 0})` },
              { id: 'unattempted', label: `Skipped (${attempt.unattemptedCount || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
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
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5 text-slate-900"
              >
                {/* Header status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Question {test.questions ? test.questions.indexOf(q) + 1 : qIdx + 1}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Correct (+{res?.marksObtained || q.marks})
                      </span>
                    ) : isUnattempted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Unattempted (0 Marks)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3 text-rose-600" /> Incorrect ({res?.marksObtained || 0} Marks)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Max Marks: {q.marks} {test.negativeMarking ? `• Penalty: -${q.negativeMarks}` : ''}
                  </span>
                </div>

                {/* Question Statement */}
                <p className="text-sm text-slate-900 font-medium leading-relaxed font-sans">
                  {q.questionText}
                </p>

                {/* Options List */}
                <div className="space-y-2.5 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = userSelections.includes(opt.id);
                    const isRightAnswer = (q.correctOptionIds || []).includes(opt.id);

                    let optionStyle = 'border-slate-200 bg-slate-50 text-slate-700';
                    let letterStyle = 'bg-slate-200 text-slate-700';

                    if (isRightAnswer) {
                      optionStyle = 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-medium';
                      letterStyle = 'bg-emerald-600 text-white font-bold';
                    } else if (isSelected && !isRightAnswer) {
                      optionStyle = 'border-rose-300 bg-rose-50/80 text-rose-950 font-medium';
                      letterStyle = 'bg-rose-600 text-white font-bold';
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
                          <span className="leading-relaxed font-sans">{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRightAnswer && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md uppercase">
                              Correct Choice
                            </span>
                          )}
                          {isSelected && !isRightAnswer && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md uppercase">
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
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Faculty Explanation & Concept Highlights
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
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
