import React, { useState, useEffect } from 'react';
import {
  Award,
  Trophy,
  Search,
  Filter,
  Eye,
  EyeOff,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  X,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { UserProfile, InstitutionResult } from '../../types';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../../services/dataService';

interface PastResultsSectionProps {
  currentUser: UserProfile;
}

export const PastResultsSection: React.FC<PastResultsSectionProps> = ({ currentUser }) => {
  const [results, setResults] = useState<InstitutionResult[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<InstitutionResult | null>(null);
  const [formData, setFormData] = useState({
    academicYear: '2025-26',
    examName: 'UPSC Civil Services Examination',
    studentId: '',
    studentName: '',
    displayNameType: 'FULL' as 'FULL' | 'INITIALS' | 'ANONYMOUS',
    achievementTitle: 'All India Rank 42',
    rank: 42,
    percentile: 99.8,
    marksObtained: 1045,
    totalMarks: 1750,
    showMarks: true,
    showPhoto: false,
    photoUrl: '',
    testimonial: 'The rigorous silence and discipline of DARULFAHAM Sanctum was indispensable.',
    isFeatured: true,
    isPublished: true,
  });

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'institutionResults'), (snap) => {
      const list = snap.docs.map((d, index) => {
        const rawData = typeof d.data === 'function' ? d.data() : d;
        return {
          id: d.id || rawData?.id || `res-${index}`,
          ...rawData,
          academicYear: rawData?.academicYear || '2025-26',
          examName: rawData?.examName || rawData?.exam || 'Competitive Examination',
          achievementTitle: rawData?.achievementTitle || rawData?.achievement || 'Academic Ranker',
          marksObtained: rawData?.marksObtained ?? rawData?.marks,
          totalMarks: rawData?.totalMarks ?? rawData?.maxMarks,
        };
      }) as InstitutionResult[];
      setResults(list);
    });
    return () => unsub();
  }, []);

  const academicYears = [
    'ALL',
    ...Array.from(
      new Set(
        results
          .map((r) => r.academicYear)
          .filter((yr): yr is string => typeof yr === 'string' && yr.trim().length > 0)
      )
    ),
  ];

  const exams = [
    'ALL',
    ...Array.from(
      new Set(
        results
          .map((r) => r.examName || r.exam)
          .filter((ex): ex is string => typeof ex === 'string' && ex.trim().length > 0)
      )
    ),
  ];

  const filteredResults = results.filter((r) => {
    if (!isAdmin && r.isPublished === false && r.status !== 'PUBLISHED') return false;

    const examVal = r.examName || r.exam || '';
    const matchesYear = selectedYear === 'ALL' || r.academicYear === selectedYear;
    const matchesExam = selectedExam === 'ALL' || examVal === selectedExam;
    const studentName = r.studentName || '';
    const achievement = r.achievementTitle || r.achievement || '';
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      studentName.toLowerCase().includes(q) ||
      achievement.toLowerCase().includes(q) ||
      examVal.toLowerCase().includes(q);

    return matchesYear && matchesExam && matchesSearch;
  });

  // Safe Display Name Formatter based on Student Privacy Settings
  const getRenderedName = (res: InstitutionResult) => {
    if (res.displayNameType === 'ANONYMOUS') {
      return `DARULFAHAM Aspirant #${res.studentId ? res.studentId.slice(-5) : 'XXXX'}`;
    }
    if (res.displayNameType === 'INITIALS') {
      const parts = res.studentName.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1][0]}.`;
      }
      return `${res.studentName[0]}.`;
    }
    return res.studentName;
  };

  const handleOpenAdd = () => {
    setEditingResult(null);
    setFormData({
      academicYear: '2025-26',
      examName: 'UPSC Civil Services Examination',
      studentId: 'DF-2026-00001',
      studentName: 'Zeeshan Alam',
      displayNameType: 'FULL',
      achievementTitle: 'All India Rank 42',
      rank: 42,
      percentile: 99.8,
      marksObtained: 1045,
      totalMarks: 1750,
      showMarks: true,
      showPhoto: false,
      photoUrl: '',
      testimonial: 'The quiet focus of DARULFAHAM study space enabled me to clear on my first attempt.',
      isFeatured: true,
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: InstitutionResult) => {
    setEditingResult(res);
    setFormData({
      academicYear: res.academicYear,
      examName: res.examName,
      studentId: res.studentId || '',
      studentName: res.studentName,
      displayNameType: res.displayNameType,
      achievementTitle: res.achievementTitle,
      rank: res.rank || 0,
      percentile: res.percentile || 0,
      marksObtained: res.marksObtained || 0,
      totalMarks: res.totalMarks || 0,
      showMarks: res.showMarks,
      showPhoto: res.showPhoto,
      photoUrl: res.photoUrl || '',
      testimonial: res.testimonial || '',
      isFeatured: res.isFeatured,
      isPublished: res.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.achievementTitle.trim()) return;

    if (editingResult) {
      await updateDoc(doc(db, 'institutionResults', editingResult.id), {
        ...formData,
        rank: formData.rank ? Number(formData.rank) : undefined,
        percentile: formData.percentile ? Number(formData.percentile) : undefined,
        marksObtained: formData.marksObtained ? Number(formData.marksObtained) : undefined,
        totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newRecord: Omit<InstitutionResult, 'id'> = {
        ...formData,
        rank: formData.rank ? Number(formData.rank) : undefined,
        percentile: formData.percentile ? Number(formData.percentile) : undefined,
        marksObtained: formData.marksObtained ? Number(formData.marksObtained) : undefined,
        totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'institutionResults'), newRecord);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete result record "${title}"?`)) {
      await deleteDoc(doc(db, 'institutionResults', id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Institutional Results & Hall of Rankers
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-600" />
              Excellence Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official records of civil service and national competitive achievements of DARULFAHAM scholars.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Institution Result</span>
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="font-bold text-slate-800">Privacy-Guaranteed Publication Standards</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            In accordance with DARULFAHAM data ethics, student contact numbers and Aadhaar documents are never published. Toppers and qualifiers may opt for Full Name, Initials (e.g. Fatima Z.), or Anonymous Ranker representation.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, achievement, rank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Year Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {academicYears.map((yr, idx) => (
                <option key={yr ? `year-${yr}` : `year-idx-${idx}`} value={yr}>
                  {yr === 'ALL' ? 'All Years' : yr}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Exam:</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {exams.map((ex, idx) => (
                <option key={ex ? `exam-${ex}` : `exam-idx-${idx}`} value={ex}>
                  {ex === 'ALL' ? 'All Exams' : ex}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Trophy className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm">No institutional results match the criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different academic year or exam.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResults.map((item, index) => (
            <div
              key={item.id ? `res-card-${item.id}` : `res-card-${index}`}
              className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative ${
                item.isFeatured ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/20 to-white' : 'border-slate-200/80'
              }`}
            >
              {/* Card Header Badge */}
              <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.academicYear}
                    </span>
                    {item.isFeatured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">
                    {item.achievementTitle || item.achievement}
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    {item.examName || item.exam}
                  </p>
                </div>

                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {item.rank ? `#${item.rank}` : <Award className="h-5 w-5" />}
                </div>
              </div>

              {/* Scholar Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {getRenderedName(item).charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{getRenderedName(item)}</p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        Privacy Mode: {item.displayNameType}
                      </span>
                    </div>
                  </div>

                  {item.percentile && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600 font-mono">{item.percentile}%ile</p>
                      <span className="text-[10px] text-slate-400">Score</span>
                    </div>
                  )}
                </div>

                {item.showMarks && (item.marksObtained ?? item.marks) && (item.totalMarks ?? item.maxMarks) && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Verified Marks:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.marksObtained ?? item.marks} / {item.totalMarks ?? item.maxMarks}
                    </span>
                  </div>
                )}

                {(item.testimonial || item.description) && (
                  <p className="text-xs text-slate-600 italic bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "{item.testimonial || item.description}"
                  </p>
                )}
              </div>

              {/* Card Footer (Admin Actions) */}
              {isAdmin && (
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Result"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.achievementTitle)}
                      title="Delete Result"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingResult ? 'Edit Institution Result' : 'Publish New Institution Result'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g. 2025-26"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.examName}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    placeholder="e.g. UPSC CSE / UPPSC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Achievement Title *</label>
                <input
                  type="text"
                  required
                  value={formData.achievementTitle}
                  onChange={(e) => setFormData({ ...formData, achievementTitle: e.target.value })}
                  placeholder="e.g. All India Rank 42 / Deputy Collector"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Student Real Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Zeeshan Alam"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Student ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. DF-2026-00001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Privacy Display Name Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">
                  Public Name Privacy Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayNameType: 'FULL' })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                      formData.displayNameType === 'FULL'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    Full Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayNameType: 'INITIALS' })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                      formData.displayNameType === 'INITIALS'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    Initials (Zeeshan A.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayNameType: 'ANONYMOUS' })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                      formData.displayNameType === 'ANONYMOUS'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    Anonymous Aspirant
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rank</label>
                  <input
                    type="number"
                    value={formData.rank || ''}
                    onChange={(e) => setFormData({ ...formData, rank: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Percentile (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.percentile || ''}
                    onChange={(e) => setFormData({ ...formData, percentile: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks (Obtained)</label>
                  <input
                    type="number"
                    value={formData.marksObtained || ''}
                    onChange={(e) => setFormData({ ...formData, marksObtained: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scholar Testimonial</label>
                <textarea
                  rows={2}
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  placeholder="Reflection on DARULFAHAM study space and test engine..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.showMarks}
                    onChange={(e) => setFormData({ ...formData, showMarks: e.target.checked })}
                  />
                  <span>Show Marks in Public Card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Feature on Topper Banner</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
