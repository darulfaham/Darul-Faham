import React from 'react';
import {
  User,
  ShieldCheck,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Armchair,
  CreditCard,
  BookOpen,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Student, UserProfile } from '../../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | undefined;
  currentUser: UserProfile;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-purple-900">
            <User className="w-5 h-5" />
            <h3 className="font-extrabold text-slate-900 text-lg">My Student Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
          <img
            src={student?.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
            alt={student?.name || currentUser.displayName}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-200 shadow-sm shrink-0"
          />
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="text-xl font-extrabold text-slate-900">
                {student?.name || currentUser.displayName}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {student?.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-purple-900">
              {student?.studentId || currentUser.studentId || 'DF-STU-2026-00001'}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {student?.course || 'UPSC Civil Services Foundation 2026'}
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Father's Name</span>
            <span className="font-bold text-slate-900 text-sm">{student?.fatherName || 'Noor Mohammad Alam'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Mother's Name</span>
            <span className="font-bold text-slate-900 text-sm">{student?.motherName || 'Razia Begum'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Date of Birth</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-purple-700" />
              <span>{student?.dob || '2001-08-14'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Contact Phone</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Phone className="w-3.5 h-3.5 text-purple-700" />
              <span>{student?.phone || '+91 98390 12345'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Registered Email</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Mail className="w-3.5 h-3.5 text-purple-700" />
              <span className="truncate">{student?.email || 'zeeshan.alam@student.darulfaham.in'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Permanent Address</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="truncate">{student?.address || '42/B, Cantonment Enclave, Lucknow, UP'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Assigned Study Space</span>
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Armchair className="w-3.5 h-3.5 text-purple-800" />
              <span>{student?.roomName || 'Silent Sanctum A (Room 101)'} • Seat #{student?.seatNumber ?? 3}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Aadhaar Document Status</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stored in Encrypted Vault ({student?.aadhaarNumber || 'XXXX-XXXX-4819'})</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            Personal credentials and confidential government documents are protected by DARULFAHAM database security rules.
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
