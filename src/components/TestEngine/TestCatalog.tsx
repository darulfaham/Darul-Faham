import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from '../../services/dataService';
import { TestSeries, TestItem, TestAttempt, UserProfile } from '../../types';
import { BookOpen, Award, CheckCircle2, Clock, Play, BarChart3, HelpCircle } from 'lucide-react';

interface TestCatalogProps {
  currentUser: UserProfile;
  onStartTest: (test: TestItem) => void;
}

export const TestCatalog: React.FC<TestCatalogProps> = ({ currentUser, onStartTest }) => {
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    const unsubSeries = onSnapshot(collection(db, 'test_series'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTestSeriesList(list);
    });

    const unsubAttempts = onSnapshot(collection(db, 'test_attempts'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAttempts(list);
    });

    return () => {
      unsubSeries();
      unsubAttempts();
    };
  }, []);

  const userAttempts = currentUser.role === 'STUDENT'
    ? attempts.filter((a) => a.studentId === currentUser.studentId || a.studentId === currentUser.uid)
    : attempts;

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Online Examination & Test Series</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-fidelity exam conditions with automated proctoring timers and anti-tamper tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
          <button
            id="tab-tests-available"
            onClick={() => setActiveTab('available')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'available' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Tests
          </button>
          <button
            id="tab-tests-history"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Attempts ({userAttempts.length})
          </button>
        </div>
      </div>

      {activeTab === 'available' ? (
        <div className="space-y-6">
          {testSeriesList.map((series) => (
            <div key={series.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                    {series.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1.5">{series.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{series.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    Complimentary for DARULFAHAM Enrollees
                  </span>
                </div>
              </div>

              {/* Tests inside Series */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {series.tests.map((test) => {
                  const hasAttempted = attempts.some(
                    (a) => a.testId === test.id && (a.studentId === currentUser.studentId || a.studentId === currentUser.uid)
                  );

                  return (
                    <div
                      key={test.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-bold text-slate-900 leading-snug">{test.title}</h5>
                          {hasAttempted && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              Attempted
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {test.durationMinutes} Mins
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            {test.totalQuestions} Questions
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Award className="h-3.5 w-3.5 text-slate-400" />
                            {test.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">Subject: {test.subject}</span>
                        <button
                          id={`btn-start-test-${test.id}`}
                          onClick={() => onStartTest(test)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-colors"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          {hasAttempted ? 'Re-take Test' : 'Launch Exam'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Past Attempts Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {currentUser.role === 'STUDENT' ? 'Your Exam Attempts' : 'All Student Test Attempts'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Total Recorded: {userAttempts.length}</span>
          </div>

          {userAttempts.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No test attempts recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Start an examination to generate evaluation metrics.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Score / Max</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Time Spent</th>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {att.studentName}
                        <span className="block text-[10px] text-slate-400 font-mono">{att.studentId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{att.testTitle}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {att.marks} / {att.maxMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold px-2 py-0.5 rounded-full ${
                          att.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          att.percentage >= 50 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        #{att.rank || 1}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(att.timestamp).toLocaleDateString()} {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
