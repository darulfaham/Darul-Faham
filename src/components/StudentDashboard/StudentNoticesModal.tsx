import React from 'react';
import {
  Bell,
  X,
  Calendar,
  AlertCircle,
  Tag,
  ChevronRight,
  BookOpen,
  Armchair,
  Info,
} from 'lucide-react';
import { StudentNotice } from '../../types';
import { INITIAL_NOTICES } from '../../firebase/mockData';

interface StudentNoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notices?: StudentNotice[];
}

export const StudentNoticesModal: React.FC<StudentNoticesModalProps> = ({
  isOpen,
  onClose,
  notices = INITIAL_NOTICES,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-purple-900">
            <Bell className="w-5 h-5" />
            <h3 className="font-extrabold text-slate-900 text-lg">Institutional Notices & Circulars</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices list */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-4 rounded-2xl border transition-all ${
                notice.priority === 'HIGH'
                  ? 'bg-purple-50/40 border-purple-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      notice.category === 'STUDY_SPACE'
                        ? 'bg-purple-100 text-purple-800'
                        : notice.category === 'EXAM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {notice.category.replace('_', ' ')}
                  </span>
                  {notice.priority === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      High Priority
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{notice.date}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-1">{notice.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Close Notices
          </button>
        </div>
      </div>
    </div>
  );
};
