import React from 'react';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Armchair,
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  Zap,
  Wifi,
  Lock,
} from 'lucide-react';
import { Student } from '../../types';

interface StudentMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | undefined;
  onRenew: () => void;
}

export const StudentMembershipModal: React.FC<StudentMembershipModalProps> = ({
  isOpen,
  onClose,
  student,
  onRenew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-purple-900">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-extrabold text-slate-900 text-lg">My Sanctum Membership</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Membership Tier Visual Badge */}
        <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-purple-300 uppercase">
              DARULFAHAM STUDY SANCTUM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          <div>
            <h4 className="text-xl font-extrabold tracking-tight">
              {student?.membershipType || 'Sanctum 24/7 Dedicated'}
            </h4>
            <p className="text-xs text-purple-200 mt-1">
              Personalized scholar workspace with uninterrupted study sanctuary privileges.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-purple-800/60 text-xs">
            <div>
              <span className="text-purple-300 text-[10px] block">Membership Validity</span>
              <span className="font-bold font-mono text-white text-sm">
                Until {student?.membershipExpiry || '31 Dec 2026'}
              </span>
            </div>
            <div>
              <span className="text-purple-300 text-[10px] block">Allocated Sanctuary Desk</span>
              <span className="font-bold text-white text-sm">
                Seat #{student?.seatNumber ?? 3} ({student?.roomName || 'Room 101'})
              </span>
            </div>
          </div>
        </div>

        {/* Tier Inclusions */}
        <div className="space-y-2.5">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Included Privileges
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>24/7 Unrestricted Hall Access</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <Wifi className="w-4 h-4 text-purple-700 shrink-0" />
              <span>1 Gbps Optical Fiber Wi-Fi</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Inverter & Diesel Power Backup</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Personal Storage Cabinet</span>
            </div>
          </div>
        </div>

        {/* Renewal CTA */}
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-purple-950">Subscription Extension</div>
            <div className="text-[11px] text-purple-700">₹1,500 / month standard sanctum fee</div>
          </div>
          <button
            id="btn-renew-membership-modal"
            type="button"
            onClick={() => {
              onClose();
              onRenew();
            }}
            className="px-4 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Renew Membership</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
