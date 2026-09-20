import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Armchair,
  CreditCard,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Student, UserProfile, Room, Seat } from '../../types';

interface AdminStudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentUser: UserProfile;
  rooms?: Room[];
  seats?: Seat[];
  onUpdateStudent: (updated: Student) => void;
  onOpenAadhaarVault?: (student: Student) => void;
}

export const AdminStudentProfileModal: React.FC<AdminStudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  rooms = [],
  seats = [],
  onUpdateStudent,
  onOpenAadhaarVault,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Student>({ ...student });
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const canEdit = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudent(formData);
    setIsEditing(false);
    setNotification('Student records updated successfully in institutional registry.');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />

        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-purple-900">
            <User className="w-5 h-5" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              Student Record Dossier • {student.studentId}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-purple-50 text-purple-900 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-purple-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal content body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          {/* Profile overview card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <img
              src={formData.profilePhotoUrl}
              alt={formData.name}
              className="w-18 h-18 rounded-2xl object-cover border-2 border-purple-200 shadow-xs shrink-0"
            />
            <div className="text-center sm:text-left space-y-1 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 className="text-lg font-extrabold text-slate-900">{formData.name}</h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    formData.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-purple-900">
                {formData.studentId}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {formData.course || 'Civil Services Foundation 2026'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.status}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked / Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Class / Enrolled Course
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.course || ''}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Membership Tier
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.membershipType || 'Sanctum 24/7 Dedicated'}
                  onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Sanctum 24/7 Dedicated">Sanctum 24/7 Dedicated</option>
                  <option value="Sanctum Day Shift (8am - 8pm)">Sanctum Day Shift (8am - 8pm)</option>
                  <option value="Sanctum Night Owl (8pm - 8am)">Sanctum Night Owl (8pm - 8am)</option>
                  <option value="Standard Flexi">Standard Flexi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Membership Expiry
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.membershipExpiry || '31 Dec 2026'}
                  onChange={(e) => setFormData({ ...formData, membershipExpiry: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assigned Seat Number
                </label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={formData.seatNumber ?? 3}
                  onChange={(e) => setFormData({ ...formData, seatNumber: parseInt(e.target.value, 10) || undefined })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Aadhaar Vault Action */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Aadhaar Document Status</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formData.aadhaarNumber || 'XXXX-XXXX-4819'} (Encrypted Vault)
                </span>
              </div>
              {onOpenAadhaarVault && (
                <button
                  type="button"
                  onClick={() => onOpenAadhaarVault(formData)}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Inspect Document</span>
                </button>
              )}
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...student });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record Updates</span>
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
