import React, { useState } from 'react';
import { useTestEngine } from '../../hooks/useTestEngine';
import { TestItem, UserProfile, TestAttempt } from '../../types';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from '../../services/dataService';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Flag, Award, RotateCcw } from 'lucide-react';

interface TestTakingInterfaceProps {
  test: TestItem;
  currentUser: UserProfile;
  onFinishTest: (attempt: TestAttempt) => void;
  onExit: () => void;
}

export const TestTakingInterface: React.FC<TestTakingInterfaceProps> = ({
  test,
  currentUser,
  onFinishTest,
  onExit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<TestAttempt | null>(null);

  // Auto-submit callback triggered by hook on time expiration
  const handleTimeUp = () => {
    if (!isSubmitted) {
      submitExam('timeout');
    }
  };

  const { timeLeft, formatTime, setIsActive } = useTestEngine(test.durationMinutes, handleTimeUp);

  const currentQ = test.questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const toggleFlagQuestion = (index: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const submitExam = async (status: 'completed' | 'timeout' = 'completed') => {
    setIsActive(false);
    setIsSubmitted(true);

    // Calculate score
    let score = 0;
    test.questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined && selected === q.correctOptionIndex) {
        score += q.marks;
      }
    });

    const timeSpent = test.durationMinutes * 60 - timeLeft;
    const percentage = Math.round((score / test.totalMarks) * 100);

    const attemptData: TestAttempt = {
      id: `attempt-${Date.now()}`,
      studentId: currentUser.studentId || currentUser.uid,
      studentName: currentUser.displayName,
      testId: test.id,
      testTitle: test.title,
      marks: score,
      maxMarks: test.totalMarks,
      percentage,
      answers: selectedAnswers,
      timestamp: new Date().toISOString(),
      timeSpentSeconds: timeSpent > 0 ? timeSpent : 1,
      rank: Math.max(1, Math.floor(Math.random() * 5) + 1),
      status,
    };

    // Save to test_attempts collection
    try {
      await addDoc(collection(db, 'test_attempts'), attemptData);
    } catch (e) {
      console.error('Failed to persist test attempt:', e);
    }

    setAttemptResult(attemptData);
    onFinishTest(attemptData);
  };

  if (attemptResult) {
    const isPass = attemptResult.percentage >= 50;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
        <div className="text-center py-4">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            isPass ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <Award className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Test Submission Evaluation</h2>
          <p className="text-sm text-slate-500 mt-1">{test.title}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto my-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Your Score</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {attemptResult.marks} <span className="text-sm font-normal text-slate-500">/ {attemptResult.maxMarks}</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Percentage</span>
              <p className={`text-2xl font-bold mt-1 ${isPass ? 'text-emerald-600' : 'text-amber-600'}`}>
                {attemptResult.percentage}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Time Taken</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {Math.floor(attemptResult.timeSpentSeconds / 60)}m {attemptResult.timeSpentSeconds % 60}s
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Mock Rank</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                #{attemptResult.rank}
              </p>
            </div>
          </div>

          {/* Question Breakdown with Explanations */}
          <div className="text-left mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Detailed Question Review & Explanations</h3>
            <div className="space-y-4">
              {test.questions.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const isCorrect = userChoice === q.correctOptionIndex;
                const wasAnswered = userChoice !== undefined;

                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${
                    isCorrect ? 'bg-emerald-50/40 border-emerald-200' : wasAnswered ? 'bg-red-50/40 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Q{idx + 1}. {q.question}
                      </p>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : wasAnswered ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isCorrect ? `+${q.marks} Marks` : wasAnswered ? 'Incorrect' : 'Skipped'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg border ${
                            optIdx === q.correctOptionIndex
                              ? 'bg-emerald-100/70 border-emerald-300 font-semibold text-emerald-950'
                              : optIdx === userChoice
                              ? 'bg-red-100/70 border-red-300 text-red-950 line-through'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono mr-1.5 font-bold">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900">Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              id="btn-exit-test-results"
              onClick={onExit}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              Return to Test Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const isUrgent = timeLeft < 120; // less than 2 mins

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto">
      {/* Top Test Banner with Timer */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">DARULFAHAM Examination Engine</span>
          <h2 className="text-lg font-bold text-white mt-0.5">{test.title}</h2>
        </div>

        {/* Live Timer Clock */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-inner ${
          isUrgent ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-emerald-400 border border-slate-700'
        }`}>
          <Clock className="h-4 w-4" />
          <span>{formatTime()}</span>
          {isUrgent && <span className="text-[10px] uppercase font-sans font-extrabold text-white">Ending Soon</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
        {/* Main Question Interface (3 cols) */}
        <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            {/* Header / Question Info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  +{currentQ.marks} Marks
                </span>
                <button
                  id="btn-flag-question"
                  onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? 'bg-amber-100 text-amber-800 font-semibold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="h-3 w-3" />
                  {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Radio / Choice Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === idx;
                return (
                  <div
                    key={idx}
                    id={`opt-q${currentQuestionIndex}-opt${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Bottom Controls */}
          <div className="pt-8 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              id="btn-prev-question"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {currentQuestionIndex < test.questions.length - 1 ? (
                <button
                  id="btn-next-question"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  id="btn-submit-exam"
                  onClick={() => submitExam('completed')}
                  className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Examination
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (1 col) */}
        <div className="p-6 bg-slate-50 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Question Navigator
            </h4>
            
            {/* Grid of question buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2">
              {test.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(idx);
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <button
                    key={q.id}
                    id={`palette-btn-${idx}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 ring-offset-2 z-10'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Attempted</span>
                <span className="font-bold text-slate-800 font-mono">{answeredCount} / {test.questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Flagged</span>
                <span className="font-bold text-amber-600 font-mono">{flaggedQuestions.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Unanswered</span>
                <span className="font-bold text-slate-600 font-mono">{test.questions.length - answeredCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              id="btn-sidebar-submit"
              onClick={() => submitExam('completed')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Submit Early
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
